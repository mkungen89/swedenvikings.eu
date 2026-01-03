// ============================================
// Game Server Query Service - Get player info via A2S/Gamedig
// ============================================

import Gamedig from 'gamedig';
import { OnlinePlayer, ServerStatusInfo } from './types';
import { logger } from '../../utils/logger';

export class GameServerQuery {
  private host: string;
  private queryPort: number;
  private gamePort: number;

  constructor(host: string = '127.0.0.1', queryPort: number = 17777, gamePort: number = 2001) {
    this.host = host;
    this.queryPort = queryPort;
    this.gamePort = gamePort;
  }

  setHost(host: string): void {
    this.host = host;
  }

  setQueryPort(port: number): void {
    this.queryPort = port;
  }

  setGamePort(port: number): void {
    this.gamePort = port;
  }

  async query(): Promise<{
    online: boolean;
    players: OnlinePlayer[];
    info: Partial<ServerStatusInfo>;
  }> {
    try {
      const result = await Gamedig.query({
        type: 'arma3', // Arma Reforger uses similar protocol
        host: this.host,
        port: this.queryPort,
        socketTimeout: 5000,
        attemptTimeout: 10000,
        maxRetries: 2,
      });

      const players: OnlinePlayer[] = result.players.map((p: any) => ({
        name: p.name || 'Unknown',
        steamId: p.raw?.steam_id,
        joinedAt: new Date(),
        ping: p.ping || 0,
        score: p.score,
        team: p.team,
      }));

      return {
        online: true,
        players,
        info: {
          isOnline: true,
          players: result.numplayers || players.length,
          maxPlayers: result.maxplayers || 64,
          map: result.map || 'Unknown',
          mission: result.raw?.game || 'Unknown',
          ping: result.ping || 0,
          version: result.raw?.version,
        },
      };
    } catch (error: any) {
      logger.debug(`Query failed for ${this.host}:${this.queryPort}: ${error.message}`);
      return {
        online: false,
        players: [],
        info: {
          isOnline: false,
          players: 0,
        },
      };
    }
  }

  async getPlayers(): Promise<OnlinePlayer[]> {
    // Try to get players from query first
    const result = await this.query();

    // If we got players with data, return them
    if (result.players.length > 0 && result.players.some(p => p.steamId)) {
      return result.players;
    }

    // Otherwise return basic player list (names only from query)
    return result.players;
  }

  async isOnline(): Promise<boolean> {
    const result = await this.query();
    return result.online;
  }

  async getPlayerCount(): Promise<{ current: number; max: number }> {
    const result = await this.query();
    return {
      current: result.info.players || 0,
      max: result.info.maxPlayers || 64,
    };
  }
}

// Alternative direct A2S query implementation
export class A2SQuery {
  private host: string;
  private port: number;

  constructor(host: string = '127.0.0.1', port: number = 17777) {
    this.host = host;
    this.port = port;
  }

  // A2S_INFO query
  async getServerInfo(): Promise<any> {
    const dgram = await import('dgram');
    
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const timeout = setTimeout(() => {
        client.close();
        reject(new Error('Query timeout'));
      }, 5000);

      // A2S_INFO request
      const request = Buffer.from([
        0xFF, 0xFF, 0xFF, 0xFF, // Header
        0x54, // A2S_INFO
        ...Buffer.from('Source Engine Query\0'),
      ]);

      client.on('message', (msg) => {
        clearTimeout(timeout);
        client.close();
        
        try {
          const info = this.parseA2SInfoResponse(msg);
          resolve(info);
        } catch (e) {
          reject(e);
        }
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        client.close();
        reject(err);
      });

      client.send(request, this.port, this.host);
    });
  }

  private parseA2SInfoResponse(buffer: Buffer): any {
    let offset = 4; // Skip header
    const type = buffer[offset++];

    if (type === 0x49) {
      // S2A_INFO_SRC response
      const protocol = buffer[offset++];
      
      // Read null-terminated strings
      const readString = () => {
        const start = offset;
        while (buffer[offset] !== 0) offset++;
        const str = buffer.slice(start, offset).toString('utf8');
        offset++;
        return str;
      };

      const name = readString();
      const map = readString();
      const folder = readString();
      const game = readString();
      const steamAppId = buffer.readUInt16LE(offset);
      offset += 2;
      const players = buffer[offset++];
      const maxPlayers = buffer[offset++];
      const bots = buffer[offset++];
      const serverType = String.fromCharCode(buffer[offset++]);
      const environment = String.fromCharCode(buffer[offset++]);
      const visibility = buffer[offset++];
      const vac = buffer[offset++];

      return {
        name,
        map,
        folder,
        game,
        steamAppId,
        players,
        maxPlayers,
        bots,
        serverType,
        environment,
        visibility: visibility === 0 ? 'public' : 'private',
        vac: vac === 1,
      };
    }

    throw new Error('Unknown response type');
  }

  // A2S_PLAYER query
  async getPlayers(): Promise<OnlinePlayer[]> {
    const dgram = await import('dgram');
    
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const timeout = setTimeout(() => {
        client.close();
        reject(new Error('Query timeout'));
      }, 5000);

      // First, get challenge
      const challengeRequest = Buffer.from([
        0xFF, 0xFF, 0xFF, 0xFF,
        0x55, // A2S_PLAYER
        0xFF, 0xFF, 0xFF, 0xFF, // Challenge placeholder
      ]);

      let gotChallenge = false;

      client.on('message', (msg) => {
        if (!gotChallenge && msg[4] === 0x41) {
          // Challenge response
          gotChallenge = true;
          const challenge = msg.slice(5, 9);
          const playerRequest = Buffer.from([
            0xFF, 0xFF, 0xFF, 0xFF,
            0x55,
            ...challenge,
          ]);
          client.send(playerRequest, this.port, this.host);
        } else if (msg[4] === 0x44) {
          // Player response
          clearTimeout(timeout);
          client.close();
          
          try {
            const players = this.parseA2SPlayerResponse(msg);
            resolve(players);
          } catch (e) {
            reject(e);
          }
        }
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        client.close();
        reject(err);
      });

      client.send(challengeRequest, this.port, this.host);
    });
  }

  private parseA2SPlayerResponse(buffer: Buffer): OnlinePlayer[] {
    const players: OnlinePlayer[] = [];
    let offset = 5; // Skip header + type
    const count = buffer[offset++];

    for (let i = 0; i < count; i++) {
      offset++; // Index
      
      // Read name
      const nameStart = offset;
      while (buffer[offset] !== 0) offset++;
      const name = buffer.slice(nameStart, offset).toString('utf8');
      offset++;
      
      const score = buffer.readInt32LE(offset);
      offset += 4;
      
      const duration = buffer.readFloatLE(offset);
      offset += 4;

      players.push({
        name,
        score,
        joinedAt: new Date(Date.now() - duration * 1000),
        ping: 0,
      });
    }

    return players;
  }
}

