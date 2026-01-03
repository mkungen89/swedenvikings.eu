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
      progress: 5,
      message: 'Laddar ner SteamCMD...',
    });

    try {
      // Create directory
      await this.executor.mkdir(this.steamCmdPath);
      
      this.emitProgress({
        status: 'downloading',
        progress: 10,
        message: 'Skapar mappar...',
      });

      if (this.platform === 'linux') {
        // Download and extract SteamCMD for Linux
        this.emitProgress({
          status: 'downloading',
          progress: 15,
          message: 'Laddar ner SteamCMD för Linux...',
        });
        
        const result = await this.executor.exec(
          `cd ${this.steamCmdPath} && curl -sqL "${STEAMCMD_DOWNLOAD_URL_LINUX}" | tar zxvf -`
        );

        if (!result.success) {
          throw new Error(`Kunde inte ladda ner SteamCMD: ${result.error}`);
        }

        // Make executable
        await this.executor.exec(`chmod +x ${this.steamCmdPath}/steamcmd.sh`);

        // Run once to update
        this.emitProgress({
          status: 'extracting',
          progress: 30,
          message: 'Initialiserar SteamCMD (första körningen)...',
        });

        await this.executor.exec(
          `${this.steamCmdPath}/steamcmd.sh +quit`,
          { timeout: 120000 }
        );
      } else {
        // Windows - use PowerShell for reliable download and extraction
        this.emitProgress({
          status: 'downloading',
          progress: 15,
          message: 'Laddar ner SteamCMD för Windows...',
        });
        
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
          throw new Error(`Kunde inte ladda ner SteamCMD: ${result.error}`);
        }

        // Run once to update
        this.emitProgress({
          status: 'extracting',
          progress: 30,
          message: 'Initialiserar SteamCMD (första körningen - kan ta några minuter)...',
        });

        await this.executor.exec(
          `"${this.steamCmdPath}\\steamcmd.exe" +quit`,
          { timeout: 300000 } // 5 minutes for initial update
        );
      }

      this.emitProgress({
        status: 'configuring',
        progress: 40,
        message: 'SteamCMD installerat! Fortsätter med serverinstallation...',
      });

      logger.info('SteamCMD installed successfully');
      return true;
    } catch (error: any) {
      logger.error('Failed to install SteamCMD:', error.message);
      this.emitProgress({
        status: 'error',
        progress: 0,
        message: `Kunde inte installera SteamCMD: ${error.message}`,
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
    this.emitProgress({
      status: 'downloading',
      progress: 2,
      message: 'Kontrollerar SteamCMD installation...',
    });
    
    if (!(await this.isSteamCMDInstalled())) {
      logger.info('SteamCMD not found, installing...');
      this.emitProgress({
        status: 'downloading',
        progress: 5,
        message: 'SteamCMD saknas, installerar...',
      });
      const steamCmdInstalled = await this.installSteamCMD();
      if (!steamCmdInstalled) {
        return false;
      }
    } else {
      this.emitProgress({
        status: 'downloading',
        progress: 40,
        message: 'SteamCMD finns redan installerat',
      });
    }

    this.emitProgress({
      status: 'downloading',
      progress: 42,
      message: 'Förbereder Arma Reforger nedladdning...',
    });

    try {
      // Create server directory
      await this.executor.mkdir(this.serverPath);
      
      this.emitProgress({
        status: 'downloading',
        progress: 45,
        message: 'Skapar servermapp...',
      });

      // Build SteamCMD command
      const steamCmd = this.platform === 'windows'
        ? `${this.steamCmdPath}\\steamcmd.exe`
        : `${this.steamCmdPath}/steamcmd.sh`;

      let loginCmd = '+login anonymous';
      if (steamUsername && steamPassword) {
        loginCmd = `+login ${steamUsername} ${steamPassword}`;
      }

      const validateFlag = validate ? 'validate' : '';
      
      // For Windows, we need to handle the command differently
      let command: string;
      if (this.platform === 'windows') {
        // Use PowerShell to run SteamCMD with proper handling
        command = `"${steamCmd}" ${loginCmd} +force_install_dir "${this.serverPath}" +app_update ${ARMA_REFORGER_APP_ID} ${validateFlag} +quit`;
      } else {
        command = `${steamCmd} ${loginCmd} +force_install_dir "${this.serverPath}" +app_update ${ARMA_REFORGER_APP_ID} ${validateFlag} +quit`;
      }
      
      logger.info(`Running SteamCMD command: ${command}`);

      this.emitProgress({
        status: 'downloading',
        progress: 48,
        message: 'Startar nedladdning av Arma Reforger Server (detta kan ta lång tid)...',
      });

      // Run with streaming output to track progress
      let lastProgress = 0;
      let downloadStarted = false;
      let lastOutput = '';
      
      const result = await this.executor.execStream(
        command,
        (data) => {
          lastOutput += data;
          logger.debug(`SteamCMD output: ${data}`);
          
          // Parse progress from SteamCMD output
          const progressMatch = data.match(/Update state \(0x\d+\) (\w+), progress: ([\d.]+)/);
          if (progressMatch) {
            downloadStarted = true;
            const steamProgress = parseFloat(progressMatch[2]);
            // Map steam progress (0-100) to our range (50-95)
            const mappedProgress = 50 + (steamProgress * 0.45);
            if (steamProgress > lastProgress) {
              lastProgress = steamProgress;
              this.emitProgress({
                status: 'downloading',
                progress: Math.min(mappedProgress, 95),
                message: `Laddar ner serverfiler: ${steamProgress.toFixed(1)}%`,
              });
            }
          }
          
          // Check for downloading state
          if ((data.includes('downloading') || data.includes('Downloading')) && !downloadStarted) {
            downloadStarted = true;
            this.emitProgress({
              status: 'downloading',
              progress: 50,
              message: 'Nedladdning påbörjad...',
            });
          }
          
          // Check for preallocating (common on first install)
          if (data.includes('preallocating') || data.includes('Preallocating')) {
            this.emitProgress({
              status: 'downloading',
              progress: 49,
              message: 'Förbereder diskutrymme...',
            });
          }

          // Check for validation
          if (data.includes('Validating') || data.includes('validating')) {
            this.emitProgress({
              status: 'configuring',
              progress: 96,
              message: 'Validerar installation...',
            });
          }
          
          // Check for completion
          if (data.includes('Success!') || data.includes('fully installed')) {
            this.emitProgress({
              status: 'configuring',
              progress: 98,
              message: 'Nedladdning klar! Verifierar filer...',
            });
          }
          
          // Check for errors
          if (data.includes('ERROR!') || data.includes('FAILED')) {
            logger.error(`SteamCMD error: ${data}`);
          }
        },
        (errorData) => {
          logger.error(`SteamCMD stderr: ${errorData}`);
        }
      );
      
      logger.info(`SteamCMD finished with success: ${result.success}, exit code: ${result.exitCode}`);

      if (!result.success) {
        // Try to extract a meaningful error message
        let errorMsg = result.error || '';
        if (result.output) {
          // Check for common error patterns
          if (result.output.includes('Disk write failure')) {
            errorMsg = 'Kunde inte skriva till disk. Kontrollera diskutrymme och behörigheter.';
          } else if (result.output.includes('Invalid platform')) {
            errorMsg = 'Fel plattform vald. Arma Reforger Server stöder endast Windows.';
          } else if (result.output.includes('rate limit')) {
            errorMsg = 'Steam rate limit nådd. Vänta några minuter och försök igen.';
          } else if (result.output.includes('Login Failure')) {
            errorMsg = 'Inloggningsfel. Anonymous login misslyckades.';
          } else {
            errorMsg = result.error || 'Okänt fel under nedladdning';
          }
        }
        logger.error(`SteamCMD failed. Error: ${errorMsg}, Output: ${result.output?.substring(0, 500)}`);
        throw new Error(`SteamCMD misslyckades: ${errorMsg}`);
      }

      // Verify installation
      this.emitProgress({
        status: 'configuring',
        progress: 99,
        message: 'Kontrollerar installation...',
      });
      
      if (await this.isServerInstalled()) {
        this.emitProgress({
          status: 'complete',
          progress: 100,
          message: 'Arma Reforger Server installerad! Servern är redo att startas.',
        });
        logger.info('Arma Reforger server installed successfully');
        return true;
      } else {
        // Check if SteamCMD output contains clues
        logger.error(`Server not found after install. SteamCMD exit code: ${result.exitCode}`);
        throw new Error('Serverfiler hittades inte efter installation. Kontrollera att sökvägen är korrekt och att du har tillräckligt diskutrymme.');
      }
    } catch (error: any) {
      logger.error('Failed to install server:', error.message);
      this.emitProgress({
        status: 'error',
        progress: 0,
        message: `Installation misslyckades: ${error.message}`,
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

