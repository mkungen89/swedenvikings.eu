import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// ============================================
// Stats Tracker Service
// ============================================
// Hanterar uppdatering av spelarstatistik från match-data
// Beräknar XP, nivåer, K/D ratio, win rate etc.

interface MatchData {
  userId: string;
  map: string;
  gameMode: string;
  duration: number; // seconds
  result: 'win' | 'loss' | 'draw';
  kills?: number;
  deaths?: number;
  assists?: number;
  headshots?: number;
  score?: number;
  pointsCaptured?: number;
  pointsDefended?: number;
  suppliesDelivered?: number;
  vehiclesDestroyed?: number;
  revives?: number;
  teamKills?: number;
  distanceTraveled?: number;
}

/**
 * Beräkna XP som krävs för en viss nivå
 */
export function calculateXPForLevel(level: number): number {
  // Kvadratisk progression: Level 1 = 1000 XP, Level 2 = 4000 XP, Level 3 = 9000 XP osv
  return Math.pow(level, 2) * 1000;
}

/**
 * Beräkna nivå baserat på totalt XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  // Omvänd formel: level = sqrt(totalXP / 1000)
  return Math.floor(Math.sqrt(totalXP / 1000)) + 1;
}

/**
 * Beräkna XP för en match baserat på prestanda
 */
export function calculateMatchXP(matchData: MatchData): number {
  let xp = 0;

  // Bas XP för att spela
  xp += 100;

  // XP för resultat
  if (matchData.result === 'win') {
    xp += 200;
  } else if (matchData.result === 'draw') {
    xp += 100;
  }

  // XP för kills (10 XP per kill)
  xp += (matchData.kills || 0) * 10;

  // XP för assists (5 XP per assist)
  xp += (matchData.assists || 0) * 5;

  // Bonus XP för headshots (5 XP per headshot)
  xp += (matchData.headshots || 0) * 5;

  // XP för objektiv (15 XP per punkt)
  xp += (matchData.pointsCaptured || 0) * 15;
  xp += (matchData.pointsDefended || 0) * 10;

  // XP för support (10 XP per revive)
  xp += (matchData.revives || 0) * 10;

  // XP för supplies (5 XP per delivery)
  xp += (matchData.suppliesDelivered || 0) * 5;

  // XP för fordon (25 XP per förstört fordon)
  xp += (matchData.vehiclesDestroyed || 0) * 25;

  // Straff för team kills (-50 XP per TK)
  xp -= (matchData.teamKills || 0) * 50;

  // Bonus XP för längre matcher (1 XP per minut)
  xp += Math.floor((matchData.duration || 0) / 60);

  // Säkerställ minst 50 XP per match
  return Math.max(xp, 50);
}

/**
 * Spara en match och uppdatera spelarstatistik
 */
export async function recordMatch(matchData: MatchData) {
  try {
    const { userId, ...data } = matchData;

    // Hitta eller skapa PlayerStats
    let playerStats = await prisma.playerStats.findUnique({
      where: { userId },
    });

    if (!playerStats) {
      playerStats = await prisma.playerStats.create({
        data: { userId },
      });
    }

    // Beräkna XP för denna match
    const xpEarned = calculateMatchXP(matchData);

    // Skapa match record
    const match = await prisma.match.create({
      data: {
        playerStatsId: playerStats.id,
        map: data.map,
        gameMode: data.gameMode,
        duration: data.duration,
        result: data.result,
        kills: data.kills || 0,
        deaths: data.deaths || 0,
        assists: data.assists || 0,
        score: data.score || 0,
        pointsCaptured: data.pointsCaptured || 0,
        pointsDefended: data.pointsDefended || 0,
        suppliesDelivered: data.suppliesDelivered || 0,
        revives: data.revives || 0,
        xpEarned,
      },
    });

    // Beräkna nya värden
    const newGamesPlayed = playerStats.gamesPlayed + 1;
    const newGamesWon = playerStats.gamesWon + (data.result === 'win' ? 1 : 0);
    const newGamesLost = playerStats.gamesLost + (data.result === 'loss' ? 1 : 0);
    const newKills = playerStats.kills + (data.kills || 0);
    const newDeaths = playerStats.deaths + (data.deaths || 0);
    const newAssists = playerStats.assists + (data.assists || 0);
    const newHeadshots = playerStats.headshots + (data.headshots || 0);
    const newPointsCaptured = playerStats.pointsCaptured + (data.pointsCaptured || 0);
    const newPointsDefended = playerStats.pointsDefended + (data.pointsDefended || 0);
    const newSuppliesDelivered = playerStats.suppliesDelivered + (data.suppliesDelivered || 0);
    const newVehiclesDestroyed = playerStats.vehiclesDestroyed + (data.vehiclesDestroyed || 0);
    const newRevives = playerStats.revives + (data.revives || 0);
    const newTeamKills = playerStats.teamKills + (data.teamKills || 0);
    const newDistanceTraveled = playerStats.distanceTraveled + (data.distanceTraveled || 0);
    const newTotalPlaytime = playerStats.totalPlaytime + data.duration;
    const newExperiencePoints = playerStats.experiencePoints + xpEarned;

    // Beräkna K/D ratio
    const newKdr = newDeaths > 0 ? parseFloat((newKills / newDeaths).toFixed(2)) : newKills;

    // Beräkna win rate
    const newWinRate = newGamesPlayed > 0 ? parseFloat(((newGamesWon / newGamesPlayed) * 100).toFixed(2)) : 0;

    // Beräkna accuracy (om headshots och kills finns)
    const newAccuracy = newKills > 0 ? parseFloat(((newHeadshots / newKills) * 100).toFixed(2)) : 0;

    // Beräkna ny nivå
    const newLevel = calculateLevelFromXP(newExperiencePoints);
    const leveledUp = newLevel > playerStats.level;

    // Uppdatera PlayerStats
    const updatedStats = await prisma.playerStats.update({
      where: { userId },
      data: {
        gamesPlayed: newGamesPlayed,
        gamesWon: newGamesWon,
        gamesLost: newGamesLost,
        winRate: newWinRate,
        kills: newKills,
        deaths: newDeaths,
        assists: newAssists,
        headshots: newHeadshots,
        kdr: newKdr,
        accuracy: newAccuracy,
        pointsCaptured: newPointsCaptured,
        pointsDefended: newPointsDefended,
        suppliesDelivered: newSuppliesDelivered,
        vehiclesDestroyed: newVehiclesDestroyed,
        revives: newRevives,
        teamKills: newTeamKills,
        distanceTraveled: newDistanceTraveled,
        totalPlaytime: newTotalPlaytime,
        experiencePoints: newExperiencePoints,
        level: newLevel,
        // Uppdatera best records
        mostKillsInGame: Math.max(playerStats.mostKillsInGame, data.kills || 0),
        bestScore: Math.max(playerStats.bestScore, data.score || 0),
        longestKillStreak: playerStats.longestKillStreak, // Detta skulle behöva trackas live
      },
    });

    logger.info('Match recorded successfully', {
      userId,
      matchId: match.id,
      xpEarned,
      newLevel,
      leveledUp,
    });

    return {
      match,
      stats: updatedStats,
      xpEarned,
      leveledUp,
      oldLevel: playerStats.level,
      newLevel,
    };
  } catch (error) {
    logger.error('Failed to record match', { error, matchData });
    throw error;
  }
}

/**
 * Initiera PlayerStats för en användare om den inte finns
 */
export async function initializePlayerStats(userId: string) {
  try {
    const existing = await prisma.playerStats.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const stats = await prisma.playerStats.create({
      data: { userId },
    });

    logger.info('Initialized player stats', { userId });
    return stats;
  } catch (error) {
    logger.error('Failed to initialize player stats', { error, userId });
    throw error;
  }
}

/**
 * Hämta top spelare för leaderboards
 */
export async function getLeaderboard(
  type: 'level' | 'kills' | 'kdr' | 'winrate' | 'xp',
  limit = 50
) {
  try {
    let orderBy: any = {};

    switch (type) {
      case 'level':
        orderBy = [{ level: 'desc' }, { experiencePoints: 'desc' }];
        break;
      case 'kills':
        orderBy = { kills: 'desc' };
        break;
      case 'kdr':
        orderBy = [{ kdr: 'desc' }, { kills: 'desc' }];
        break;
      case 'winrate':
        orderBy = [{ winRate: 'desc' }, { gamesPlayed: 'desc' }];
        break;
      case 'xp':
        orderBy = { experiencePoints: 'desc' };
        break;
      default:
        orderBy = { experiencePoints: 'desc' };
    }

    const leaderboard = await prisma.playerStats.findMany({
      where: {
        gamesPlayed: { gte: 5 }, // Minst 5 matcher för att vara med på leaderboard
      },
      orderBy,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return leaderboard;
  } catch (error) {
    logger.error('Failed to fetch leaderboard', { error, type, limit });
    throw error;
  }
}

/**
 * Uppdatera global och country ranks för alla spelare
 */
export async function updateRankings() {
  try {
    // Hämta alla spelare sorterade efter XP
    const allPlayers = await prisma.playerStats.findMany({
      where: {
        gamesPlayed: { gte: 5 },
      },
      orderBy: [{ experiencePoints: 'desc' }, { level: 'desc' }],
      select: {
        id: true,
        userId: true,
      },
    });

    // Uppdatera global rank
    const updatePromises = allPlayers.map((player, index) =>
      prisma.playerStats.update({
        where: { id: player.id },
        data: { globalRank: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    logger.info('Updated player rankings', { totalPlayers: allPlayers.length });
    return allPlayers.length;
  } catch (error) {
    logger.error('Failed to update rankings', { error });
    throw error;
  }
}
