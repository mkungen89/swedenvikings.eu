// ============================================
// Arma Reforger Workshop Scraper
// ============================================

import { cache } from '../../utils/redis';
import { logger } from '../../utils/logger';

const WORKSHOP_BASE_URL = 'https://reforger.armaplatform.com/workshop';
const WORKSHOP_API_BASE = 'https://reforger.armaplatform.com';
const CACHE_TTL_SEARCH = 300; // 5 minutes
const CACHE_TTL_MOD = 600; // 10 minutes
const CACHE_TTL_BUILDID = 3600; // 1 hour for build ID

// Get the current Next.js build ID from the workshop page
async function getWorkshopBuildId(): Promise<string> {
  const cacheKey = 'workshop:buildId';
  const cached = await cache.get<string>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(WORKSHOP_BASE_URL, {
      headers: {
        'User-Agent': 'SwedenVikings-CMS/1.0',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract build ID from _next/data path or __NEXT_DATA__ script
    const buildIdMatch = html.match(/_next\/data\/([a-zA-Z0-9_-]+)\//);
    if (buildIdMatch) {
      const buildId = buildIdMatch[1];
      await cache.set(cacheKey, buildId, CACHE_TTL_BUILDID);
      logger.debug(`Workshop build ID: ${buildId}`);
      return buildId;
    }

    // Fallback: try to get from __NEXT_DATA__ script
    const nextDataMatch = html.match(/"buildId":"([a-zA-Z0-9_-]+)"/);
    if (nextDataMatch) {
      const buildId = nextDataMatch[1];
      await cache.set(cacheKey, buildId, CACHE_TTL_BUILDID);
      logger.debug(`Workshop build ID (from script): ${buildId}`);
      return buildId;
    }

    throw new Error('Could not find build ID');
  } catch (error) {
    logger.error('Failed to get workshop build ID:', error);
    // Return a fallback - this might fail but worth trying
    return 'assHkrVAwO2Vdhmca2oLQ';
  }
}

export interface WorkshopModData {
  modId: string;           // Hex ID (e.g. "5965550F24A0C152")
  name: string;
  description: string;
  author: string;
  version: string;
  gameVersion: string;     // Required game version (e.g. "1.2.1.202")
  size: number;            // bytes
  imageUrl: string;
  dependencies: string[];  // Array of workshop IDs
  rating: number;          // Rating percentage (0-100)
  subscribers: number;
}

export interface WorkshopSearchResult {
  mods: WorkshopModData[];
  total: number;
  page: number;
  totalPages: number;
}

// Extract JSON data embedded in the workshop HTML page
function extractJsonFromHtml(html: string): any {
  // The workshop embeds JSON data in a script tag
  // Look for patterns like: {"props":{"pageProps":{...}}}
  const scriptMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
  if (scriptMatch && scriptMatch[1]) {
    try {
      return JSON.parse(scriptMatch[1]);
    } catch (e) {
      logger.error('Failed to parse workshop JSON data', e);
    }
  }

  // Fallback: try to find embedded JSON in other script tags
  const jsonMatch = html.match(/\{"props":\{"pageProps":\{[^}]+"assets?":/);
  if (jsonMatch) {
    const startIndex = html.indexOf(jsonMatch[0]);
    let depth = 0;
    let endIndex = startIndex;
    for (let i = startIndex; i < html.length; i++) {
      if (html[i] === '{') depth++;
      if (html[i] === '}') depth--;
      if (depth === 0) {
        endIndex = i + 1;
        break;
      }
    }
    try {
      return JSON.parse(html.substring(startIndex, endIndex));
    } catch (e) {
      logger.error('Failed to parse workshop JSON data (fallback)', e);
    }
  }

  return null;
}

// Parse mod data from workshop JSON structure
function parseModFromJson(asset: any): WorkshopModData | null {
  try {
    const preview = asset.previews?.[0];

    // Build image URL from preview data - use thumbnails if available
    let imageUrl = '';
    if (preview?.thumbnails?.['image/jpeg']?.[0]?.url) {
      imageUrl = preview.thumbnails['image/jpeg'][0].url;
    } else if (preview?.url) {
      imageUrl = preview.url;
    }

    // Parse rating (averageRating is 0-1, convert to percentage)
    const rating = asset.averageRating
      ? Math.round(asset.averageRating * 100)
      : 0;

    // Parse dependencies - check both root level and dependencyTree
    const dependencies: string[] = [];
    const depsArray = asset.dependencies || asset.dependencyTree?.dependencies || [];
    if (Array.isArray(depsArray)) {
      for (const dep of depsArray) {
        // Handle different formats: string ID, object with assetId, or object with id
        if (typeof dep === 'string') {
          dependencies.push(dep);
        } else {
          const depId = dep.assetId || dep.asset?.id || dep.id;
          if (depId) {
            dependencies.push(depId);
          }
        }
      }
    }

    // Parse author - can be string or object with username
    let author = 'Unknown';
    if (typeof asset.creator === 'string') {
      author = asset.creator;
    } else if (asset.creator?.username) {
      author = asset.creator.username;
    } else if (typeof asset.author === 'string') {
      author = asset.author;
    } else if (asset.author?.username) {
      author = asset.author.username;
    }

    // Get version and game version - check multiple possible locations
    const version = asset.currentVersionNumber ||
                   asset.dependencyTree?.version ||
                   asset.currentVersion?.tag ||
                   '1.0.0';
    const gameVersion = asset.gameVersion ||
                       asset.dependencyTree?.gameVersion ||
                       asset.currentVersion?.gameVersionName ||
                       '';
    const size = asset.currentVersionSize ||
                asset.dependencyTree?.size ||
                asset.currentVersion?.size ||
                0;

    return {
      modId: asset.id || asset.modId,
      name: asset.name || 'Unknown',
      description: asset.summary || asset.description || '',
      author,
      version,
      gameVersion,
      size,
      imageUrl,
      dependencies,
      rating,
      subscribers: asset.subscriberCount || asset.subscribers || 0,
    };
  } catch (e) {
    logger.error('Failed to parse mod from JSON', { error: e, asset });
    return null;
  }
}

// Fetch a single mod by ID
export async function fetchModData(modId: string): Promise<WorkshopModData | null> {
  // Check cache first
  const cacheKey = `workshop:mod:${modId}`;
  const cached = await cache.get<WorkshopModData>(cacheKey);
  if (cached) {
    logger.debug(`Workshop cache hit for mod ${modId}`);
    return cached;
  }

  try {
    // Fetch the mod page
    const url = `${WORKSHOP_BASE_URL}/${modId}`;
    logger.info(`Fetching mod data from ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SwedenVikings-CMS/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn(`Mod not found: ${modId}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const jsonData = extractJsonFromHtml(html);

    if (!jsonData?.props?.pageProps?.asset) {
      logger.error('Could not find asset data in workshop page', { modId });
      return null;
    }

    const mod = parseModFromJson(jsonData.props.pageProps.asset);

    if (mod) {
      // Cache the result
      await cache.set(cacheKey, mod, CACHE_TTL_MOD);
    }

    return mod;
  } catch (error) {
    logger.error('Failed to fetch mod data', { modId, error });
    return null;
  }
}

// Search for mods
export async function searchMods(query: string, page = 1): Promise<WorkshopSearchResult> {
  // Check cache first
  const cacheKey = `workshop:search:${query}:${page}`;
  const cached = await cache.get<WorkshopSearchResult>(cacheKey);
  if (cached) {
    logger.debug(`Workshop search cache hit for "${query}" page ${page}`);
    return cached;
  }

  try {
    // Build search URL - use _next/data endpoint with 'search' parameter
    const buildId = await getWorkshopBuildId();
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (page > 1) params.set('page', page.toString());

    const url = `${WORKSHOP_BASE_URL.replace('/workshop', '')}/_next/data/${buildId}/workshop.json?${params.toString()}`;
    logger.info(`Searching workshop: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SwedenVikings-CMS/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const jsonData = await response.json();

    if (!jsonData?.pageProps?.assets) {
      logger.error('Could not find assets data in workshop search');
      return { mods: [], total: 0, page, totalPages: 0 };
    }

    const assetsData = jsonData.pageProps.assets;
    const rows = assetsData.rows || [];
    const total = assetsData.count || 0;
    const perPage = 16; // Workshop shows 16 per page
    const totalPages = Math.ceil(total / perPage);

    const mods: WorkshopModData[] = rows
      .map((asset: any) => parseModFromJson(asset))
      .filter((mod: WorkshopModData | null): mod is WorkshopModData => mod !== null);

    const result: WorkshopSearchResult = {
      mods,
      total,
      page,
      totalPages,
    };

    // Cache the result
    await cache.set(cacheKey, result, CACHE_TTL_SEARCH);

    return result;
  } catch (error) {
    logger.error('Failed to search workshop', { query, page, error });
    return { mods: [], total: 0, page, totalPages: 0 };
  }
}

// ============================================
// Scenario Data
// ============================================

export interface WorkshopScenarioData {
  scenarioId: string;    // Full scenario ID (e.g. "{C5EAD55037EB4751}Missions/RHS_CombatOps_MSV.conf")
  name: string;
  description?: string;
  playerCount: number;
  gameMode: string;      // Campaign, Sandbox, Game Master, etc.
}

// Parse scenario data from workshop JSON structure
function parseScenarioFromJson(scenario: any): WorkshopScenarioData | null {
  try {
    // The scenario ID is stored in the 'gameId' field (mission configuration path)
    // e.g., "{C5EAD55037EB4751}Missions/RHS_CombatOps_MSV.conf"
    const scenarioId = scenario.gameId || scenario.id || scenario.scenarioId;
    if (!scenarioId) {
      logger.debug('Scenario missing gameId', { scenario });
      return null;
    }

    // Clean up gameMode - remove localization keys like "#AR-ServerBrowser_ServerScenario"
    let gameMode = scenario.gameMode || scenario.type || 'Unknown';
    if (gameMode.startsWith('#AR-')) {
      // Extract readable part from localization key
      gameMode = gameMode.replace('#AR-', '').replace(/_/g, ' ');
    }

    return {
      scenarioId,
      name: scenario.name || 'Unknown',
      description: scenario.summary || scenario.description || '',
      playerCount: scenario.playerCount || scenario.maxPlayers || 0,
      gameMode,
    };
  } catch (e) {
    logger.error('Failed to parse scenario from JSON', { error: e, scenario });
    return null;
  }
}

// Fetch scenarios for a specific mod
export async function fetchModScenarios(modId: string): Promise<WorkshopScenarioData[]> {
  // Check cache first
  const cacheKey = `workshop:scenarios:${modId}`;
  const cached = await cache.get<WorkshopScenarioData[]>(cacheKey);
  if (cached) {
    logger.debug(`Workshop scenarios cache hit for mod ${modId}`);
    return cached;
  }

  try {
    // Fetch the mod's scenarios page using Next.js data endpoint
    let buildId = await getWorkshopBuildId();
    let url = `${WORKSHOP_API_BASE}/_next/data/${buildId}/workshop/${modId}/scenarios.json`;
    logger.info(`Fetching mod scenarios from ${url}`);

    let response = await fetch(url, {
      headers: {
        'User-Agent': 'SwedenVikings-CMS/1.0',
        'Accept': 'application/json',
      },
    });

    // If 404, the build ID might be stale - try to refresh it
    if (response.status === 404) {
      logger.debug(`Got 404 for scenarios, refreshing build ID for mod: ${modId}`);
      // Clear cached build ID and try again
      await cache.del('workshop:buildId');
      buildId = await getWorkshopBuildId();
      url = `${WORKSHOP_API_BASE}/_next/data/${buildId}/workshop/${modId}/scenarios.json`;
      logger.info(`Retrying with new build ID: ${url}`);

      response = await fetch(url, {
        headers: {
          'User-Agent': 'SwedenVikings-CMS/1.0',
          'Accept': 'application/json',
        },
      });

      if (response.status === 404) {
        // Still 404 - mod might just not have scenarios
        logger.debug(`No scenarios tab for mod: ${modId}`);
        return [];
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const jsonData = await response.json();

    // Look for scenarios in pageProps.asset.scenarios (correct path from Next.js data endpoint)
    const scenarios = jsonData?.pageProps?.asset?.scenarios ||
                     jsonData?.pageProps?.assetVersionDetail?.scenarios ||
                     jsonData?.pageProps?.scenarios ||
                     [];

    if (!Array.isArray(scenarios) || scenarios.length === 0) {
      logger.debug(`No scenarios array found for mod ${modId}`, {
        hasPageProps: !!jsonData?.pageProps,
        hasAsset: !!jsonData?.pageProps?.asset,
        scenarioCount: scenarios?.length
      });
      return [];
    }

    logger.debug(`Found ${scenarios.length} raw scenarios for mod ${modId}`);

    const parsedScenarios: WorkshopScenarioData[] = scenarios
      .map((s: any) => parseScenarioFromJson(s))
      .filter((s: WorkshopScenarioData | null): s is WorkshopScenarioData => s !== null);

    // Cache the result
    await cache.set(cacheKey, parsedScenarios, CACHE_TTL_MOD);

    logger.info(`Found ${parsedScenarios.length} scenarios for mod ${modId}`);
    return parsedScenarios;
  } catch (error) {
    logger.error('Failed to fetch mod scenarios', { modId, error });
    return [];
  }
}

// Compare version strings (returns: -1 if a < b, 0 if a == b, 1 if a > b)
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;

    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }

  return 0;
}

// Check if mod is compatible with server version
export function isModCompatible(modGameVersion: string, serverVersion: string): boolean {
  if (!modGameVersion || !serverVersion) {
    return true; // Assume compatible if we can't check
  }

  // Mod requires this version or older
  return compareVersions(modGameVersion, serverVersion) <= 0;
}
