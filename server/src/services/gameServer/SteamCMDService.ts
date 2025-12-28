// ============================================
// SteamCMD Service - Download and update game servers
// ============================================

import { ExecutorInterface, InstallProgress, CommandResult } from './types';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

export const ARMA_REFORGER_APP_ID = '1874900'; // Arma Reforger Dedicated Server
export const STEAMCMD_DOWNLOAD_URL_LINUX = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz';
export const STEAMCMD_DOWNLOAD_URL_WINDOWS = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip';

export class SteamCMDService extends EventEmitter {
  private executor: ExecutorInterface;
  private steamCmdPath: string;
  private serverPath: string;
  private platform: 'linux' | 'windows';

  constructor(
    executor: ExecutorInterface,
    steamCmdPath: string,
    serverPath: string,
    platform: 'linux' | 'windows' = 'linux'
  ) {
    super();
    this.executor = executor;
    this.steamCmdPath = steamCmdPath;
    this.serverPath = serverPath;
    this.platform = platform;
  }

  private emitProgress(progress: InstallProgress): void {
    this.emit('progress', progress);
  }

  async isSteamCMDInstalled(): Promise<boolean> {
    const executable = this.platform === 'windows' ? 'steamcmd.exe' : 'steamcmd.sh';
    return this.executor.fileExists(`${this.steamCmdPath}/${executable}`);
  }

  async installSteamCMD(): Promise<boolean> {
    logger.info('Installing SteamCMD...');
    this.emitProgress({
      status: 'downloading',
      progress: 0,
      message: 'Downloading SteamCMD...',
    });

    try {
      // Create directory
      await this.executor.mkdir(this.steamCmdPath);

      if (this.platform === 'linux') {
        // Download and extract SteamCMD for Linux
        const result = await this.executor.exec(
          `cd ${this.steamCmdPath} && curl -sqL "${STEAMCMD_DOWNLOAD_URL_LINUX}" | tar zxvf -`
        );

        if (!result.success) {
          throw new Error(`Failed to download SteamCMD: ${result.error}`);
        }

        // Make executable
        await this.executor.exec(`chmod +x ${this.steamCmdPath}/steamcmd.sh`);

        // Run once to update
        this.emitProgress({
          status: 'extracting',
          progress: 50,
          message: 'Initializing SteamCMD...',
        });

        await this.executor.exec(
          `${this.steamCmdPath}/steamcmd.sh +quit`,
          { timeout: 120000 }
        );
      } else {
        // Windows - use PowerShell for reliable download and extraction
        const psCommand = `
          $ProgressPreference = 'SilentlyContinue';
          New-Item -ItemType Directory -Force -Path '${this.steamCmdPath.replace(/\\/g, '\\\\')}' | Out-Null;
          Invoke-WebRequest -Uri '${STEAMCMD_DOWNLOAD_URL_WINDOWS}' -OutFile '${this.steamCmdPath.replace(/\\/g, '\\\\')}\\steamcmd.zip';
          Expand-Archive -Path '${this.steamCmdPath.replace(/\\/g, '\\\\')}\\steamcmd.zip' -DestinationPath '${this.steamCmdPath.replace(/\\/g, '\\\\')}' -Force;
          Remove-Item '${this.steamCmdPath.replace(/\\/g, '\\\\')}\\steamcmd.zip' -Force;
        `.replace(/\n/g, ' ');

        const result = await this.executor.exec(
          `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`
        );

        if (!result.success) {
          throw new Error(`Failed to download SteamCMD: ${result.error}`);
        }

        // Run once to update
        this.emitProgress({
          status: 'extracting',
          progress: 50,
          message: 'Initializing SteamCMD...',
        });

        await this.executor.exec(
          `"${this.steamCmdPath}\\steamcmd.exe" +quit`,
          { timeout: 300000 } // 5 minutes for initial update
        );
      }

      this.emitProgress({
        status: 'complete',
        progress: 100,
        message: 'SteamCMD installed successfully',
      });

      logger.info('SteamCMD installed successfully');
      return true;
    } catch (error: any) {
      logger.error('Failed to install SteamCMD:', error.message);
      this.emitProgress({
        status: 'error',
        progress: 0,
        message: `Failed to install SteamCMD: ${error.message}`,
      });
      return false;
    }
  }

  async isServerInstalled(): Promise<boolean> {
    // Check for Arma Reforger server executable
    const executable = this.platform === 'windows' 
      ? 'ArmaReforgerServer.exe'
      : 'ArmaReforgerServer';
    return this.executor.fileExists(`${this.serverPath}/${executable}`);
  }

  async installOrUpdateServer(
    steamUsername?: string,
    steamPassword?: string,
    validate: boolean = true
  ): Promise<boolean> {
    logger.info('Installing/Updating Arma Reforger server...');
    
    // Ensure SteamCMD is installed
    if (!(await this.isSteamCMDInstalled())) {
      logger.info('SteamCMD not found, installing...');
      const steamCmdInstalled = await this.installSteamCMD();
      if (!steamCmdInstalled) {
        return false;
      }
    }

    this.emitProgress({
      status: 'downloading',
      progress: 0,
      message: 'Starting Arma Reforger server download...',
    });

    try {
      // Create server directory
      await this.executor.mkdir(this.serverPath);

      // Build SteamCMD command
      const steamCmd = this.platform === 'windows'
        ? `${this.steamCmdPath}\\steamcmd.exe`
        : `${this.steamCmdPath}/steamcmd.sh`;

      let loginCmd = '+login anonymous';
      if (steamUsername && steamPassword) {
        loginCmd = `+login ${steamUsername} ${steamPassword}`;
      }

      const validateFlag = validate ? 'validate' : '';
      const command = `${steamCmd} ${loginCmd} +force_install_dir "${this.serverPath}" +app_update ${ARMA_REFORGER_APP_ID} ${validateFlag} +quit`;

      // Run with streaming output to track progress
      let lastProgress = 0;
      const result = await this.executor.execStream(
        command,
        (data) => {
          // Parse progress from SteamCMD output
          const progressMatch = data.match(/Update state \(0x\d+\) (\w+), progress: ([\d.]+)/);
          if (progressMatch) {
            const progress = parseFloat(progressMatch[2]);
            if (progress > lastProgress) {
              lastProgress = progress;
              this.emitProgress({
                status: 'downloading',
                progress: Math.min(progress, 99),
                message: `Downloading: ${progress.toFixed(1)}%`,
              });
            }
          }

          // Check for validation
          if (data.includes('Validating')) {
            this.emitProgress({
              status: 'configuring',
              progress: 99,
              message: 'Validating installation...',
            });
          }
        }
      );

      if (!result.success) {
        throw new Error(`SteamCMD failed: ${result.error}`);
      }

      // Verify installation
      if (await this.isServerInstalled()) {
        this.emitProgress({
          status: 'complete',
          progress: 100,
          message: 'Arma Reforger server installed successfully',
        });
        logger.info('Arma Reforger server installed successfully');
        return true;
      } else {
        throw new Error('Server files not found after installation');
      }
    } catch (error: any) {
      logger.error('Failed to install server:', error.message);
      this.emitProgress({
        status: 'error',
        progress: 0,
        message: `Failed to install server: ${error.message}`,
      });
      return false;
    }
  }

  async getServerVersion(): Promise<string | null> {
    try {
      // Try to get version from appmanifest
      const manifestPath = this.platform === 'windows'
        ? `${this.steamCmdPath}\\steamapps\\appmanifest_${ARMA_REFORGER_APP_ID}.acf`
        : `${this.steamCmdPath}/steamapps/appmanifest_${ARMA_REFORGER_APP_ID}.acf`;

      if (await this.executor.fileExists(manifestPath)) {
        const content = await this.executor.readFile(manifestPath);
        const match = content.match(/"buildid"\s+"(\d+)"/);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async checkForUpdate(): Promise<{ available: boolean; currentVersion?: string; latestVersion?: string }> {
    // This would require querying Steam API for latest version
    // For now, return unknown
    const currentVersion = await this.getServerVersion();
    return {
      available: false,
      currentVersion: currentVersion || undefined,
    };
  }
}

