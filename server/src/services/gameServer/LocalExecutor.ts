// ============================================
// Local Executor - For running server on same machine
// ============================================

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as si from 'systeminformation';
import {
  ExecutorInterface,
  CommandResult,
  ExecOptions,
  ProcessInfo,
  SystemInfo,
} from './types';
import { logger } from '../../utils/logger';

const execAsync = promisify(exec);

export class LocalExecutor implements ExecutorInterface {
  private connected: boolean = false;

  async connect(): Promise<void> {
    this.connected = true;
    logger.info('Local executor connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('Local executor disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async exec(command: string, options?: ExecOptions): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: options?.cwd,
        env: { ...process.env, ...options?.env },
        timeout: options?.timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  async execStream(
    command: string,
    onData: (data: string) => void,
    onError?: (error: string) => void
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      // Use shell: true and pass the entire command as a string
      // This properly handles paths with spaces and quoted arguments
      const child = spawn(command, [], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        const str = data.toString();
        output += str;
        onData(str);
      });

      child.stderr?.on('data', (data) => {
        const str = data.toString();
        errorOutput += str;
        // Also send stderr to onData so we can see all output
        onData(str);
        if (onError) onError(str);
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          output,
          error: errorOutput || undefined,
          exitCode: code || 0,
        });
      });

      child.on('error', (err) => {
        logger.error(`execStream error: ${err.message}`);
        resolve({
          success: false,
          output,
          error: err.message,
          exitCode: 1,
        });
      });
    });
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async rm(filePath: string, recursive?: boolean): Promise<void> {
    await fs.rm(filePath, { recursive: recursive || false, force: true });
  }

  async getProcessInfo(pid: number): Promise<ProcessInfo | null> {
    try {
      const processes = await si.processes();
      const proc = processes.list.find((p) => p.pid === pid);

      if (!proc) return null;

      return {
        pid: proc.pid,
        name: proc.name,
        cpu: proc.cpu,
        memory: proc.mem,
        uptime: proc.started ? (Date.now() - new Date(proc.started).getTime()) / 1000 : 0,
        command: proc.command,
      };
    } catch {
      return null;
    }
  }

  async killProcess(pid: number, signal: string = 'SIGTERM'): Promise<boolean> {
    try {
      // On Windows, use taskkill for more reliable process termination
      if (process.platform === 'win32') {
        const force = signal === 'SIGKILL' ? '/F' : '';
        await execAsync(`taskkill ${force} /PID ${pid}`);
        return true;
      } else {
        process.kill(pid, signal as NodeJS.Signals);
        return true;
      }
    } catch {
      return false;
    }
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const [cpu, mem, disk, osInfo, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.osInfo(),
      si.time(),
    ]);

    const mainDisk = disk[0] || { size: 0, used: 0, available: 0 };

    return {
      platform: osInfo.platform,
      arch: osInfo.arch,
      hostname: osInfo.hostname,
      cpuUsage: cpu.currentLoad,
      memoryTotal: mem.total,
      memoryUsed: mem.used,
      memoryFree: mem.free,
      diskTotal: mainDisk.size,
      diskUsed: mainDisk.used,
      diskFree: mainDisk.available,
      uptime: time.uptime,
    };
  }
}

