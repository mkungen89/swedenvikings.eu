// ============================================
// SSH Executor - For running server on remote machine
// ============================================

import { Client, ClientChannel, SFTPWrapper } from 'ssh2';
import {
  ExecutorInterface,
  CommandResult,
  ExecOptions,
  ProcessInfo,
  SystemInfo,
  ServerConnection,
} from './types';
import { logger } from '../../utils/logger';

export class SSHExecutor implements ExecutorInterface {
  private client: Client;
  private sftp: SFTPWrapper | null = null;
  private connection: ServerConnection;
  private connected: boolean = false;

  constructor(connection: ServerConnection) {
    this.client = new Client();
    this.connection = connection;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.on('ready', async () => {
        this.connected = true;
        logger.info(`SSH connected to ${this.connection.host}`);
        
        // Initialize SFTP
        this.client.sftp((err, sftp) => {
          if (err) {
            logger.warn('Failed to initialize SFTP:', err.message);
          } else {
            this.sftp = sftp;
          }
          resolve();
        });
      });

      this.client.on('error', (err) => {
        this.connected = false;
        logger.error('SSH connection error:', err.message);
        reject(err);
      });

      this.client.on('close', () => {
        this.connected = false;
        this.sftp = null;
        logger.info('SSH connection closed');
      });

      const config: any = {
        host: this.connection.host,
        port: this.connection.port || 22,
        username: this.connection.username,
        readyTimeout: 30000,
      };

      if (this.connection.privateKey) {
        config.privateKey = this.connection.privateKey;
      } else if (this.connection.password) {
        config.password = this.connection.password;
      }

      this.client.connect(config);
    });
  }

  async disconnect(): Promise<void> {
    if (this.sftp) {
      this.sftp.end();
      this.sftp = null;
    }
    this.client.end();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async exec(command: string, options?: ExecOptions): Promise<CommandResult> {
    return new Promise((resolve) => {
      let fullCommand = command;
      if (options?.cwd) {
        fullCommand = `cd ${options.cwd} && ${command}`;
      }

      if (options?.env) {
        const envStr = Object.entries(options.env)
          .map(([k, v]) => `export ${k}="${v}"`)
          .join(' && ');
        fullCommand = `${envStr} && ${fullCommand}`;
      }

      this.client.exec(fullCommand, { pty: false }, (err, stream) => {
        if (err) {
          resolve({
            success: false,
            output: '',
            error: err.message,
            exitCode: 1,
          });
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code: number) => {
          resolve({
            success: code === 0,
            output,
            error: errorOutput || undefined,
            exitCode: code,
          });
        });
      });
    });
  }

  async execStream(
    command: string,
    onData: (data: string) => void,
    onError?: (error: string) => void
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      this.client.exec(command, { pty: true }, (err, stream) => {
        if (err) {
          resolve({
            success: false,
            output: '',
            error: err.message,
            exitCode: 1,
          });
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('data', (data: Buffer) => {
          const str = data.toString();
          output += str;
          onData(str);
        });

        stream.stderr.on('data', (data: Buffer) => {
          const str = data.toString();
          errorOutput += str;
          if (onError) onError(str);
        });

        stream.on('close', (code: number) => {
          resolve({
            success: code === 0,
            output,
            error: errorOutput || undefined,
            exitCode: code,
          });
        });
      });
    });
  }

  async readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.sftp) {
        reject(new Error('SFTP not initialized'));
        return;
      }

      this.sftp.readFile(path, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data.toString());
      });
    });
  }

  async writeFile(path: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sftp) {
        reject(new Error('SFTP not initialized'));
        return;
      }

      this.sftp.writeFile(path, content, { encoding: 'utf8' }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async fileExists(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.sftp) {
        resolve(false);
        return;
      }

      this.sftp.stat(path, (err) => {
        resolve(!err);
      });
    });
  }

  async mkdir(path: string): Promise<void> {
    // Use mkdir -p via exec for recursive creation
    await this.exec(`mkdir -p "${path}"`);
  }

  async rm(path: string, recursive?: boolean): Promise<void> {
    const flags = recursive ? '-rf' : '-f';
    await this.exec(`rm ${flags} "${path}"`);
  }

  async getProcessInfo(pid: number): Promise<ProcessInfo | null> {
    const result = await this.exec(
      `ps -p ${pid} -o pid,comm,%cpu,%mem,etimes,args --no-headers 2>/dev/null`
    );

    if (!result.success || !result.output.trim()) {
      return null;
    }

    const parts = result.output.trim().split(/\s+/);
    if (parts.length < 5) return null;

    return {
      pid: parseInt(parts[0]),
      name: parts[1],
      cpu: parseFloat(parts[2]),
      memory: parseFloat(parts[3]),
      uptime: parseInt(parts[4]),
      command: parts.slice(5).join(' '),
    };
  }

  async killProcess(pid: number, signal: string = 'SIGTERM'): Promise<boolean> {
    const sigMap: Record<string, number> = {
      SIGTERM: 15,
      SIGKILL: 9,
      SIGINT: 2,
    };
    const sigNum = sigMap[signal] || 15;
    const result = await this.exec(`kill -${sigNum} ${pid}`);
    return result.success;
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const commands = [
      'uname -s',
      'uname -m',
      'hostname',
      "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'",
      "free -b | awk 'NR==2{print $2,$3,$4}'",
      "df -B1 / | awk 'NR==2{print $2,$3,$4}'",
      'cat /proc/uptime | cut -d" " -f1',
    ];

    const result = await this.exec(commands.join(' && echo "---" && '));
    const parts = result.output.split('---').map((p) => p.trim());

    const memParts = (parts[4] || '0 0 0').split(' ').map(Number);
    const diskParts = (parts[5] || '0 0 0').split(' ').map(Number);

    return {
      platform: parts[0] || 'linux',
      arch: parts[1] || 'x64',
      hostname: parts[2] || 'unknown',
      cpuUsage: parseFloat(parts[3]) || 0,
      memoryTotal: memParts[0] || 0,
      memoryUsed: memParts[1] || 0,
      memoryFree: memParts[2] || 0,
      diskTotal: diskParts[0] || 0,
      diskUsed: diskParts[1] || 0,
      diskFree: diskParts[2] || 0,
      uptime: parseFloat(parts[6]) || 0,
    };
  }
}

