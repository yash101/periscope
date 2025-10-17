import { createServer, Server } from 'net';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { Logger } from './Logger';

export interface UnixSocketAPI {
  search: (query: string) => Promise<any[]>;
  getStats: () => Promise<any>;
  ping: () => Promise<string>;
}

export class UnixSocketServer {
  private server: Server | null = null;
  private socketPath: string;
  private logger: Logger;
  private api: UnixSocketAPI;

  constructor(socketPath: string, api: UnixSocketAPI, logger: Logger) {
    this.socketPath = socketPath;
    this.api = api;
    this.logger = logger;
  }

  async start(): Promise<void> {
    // Remove existing socket file if it exists
    if (existsSync(this.socketPath)) {
      unlinkSync(this.socketPath);
    }

    this.server = createServer();

    this.server.on('connection', (socket) => {
      this.logger.info('Unix socket client connected');
      
      socket.on('data', async (data) => {
        try {
          const request = JSON.parse(data.toString());
          const response = await this.handleRequest(request);
          socket.write(JSON.stringify(response) + '\n');
        } catch (error) {
          const errorResponse = {
            error: 'Invalid request',
            message: error instanceof Error ? error.message : 'Unknown error',
          };
          socket.write(JSON.stringify(errorResponse) + '\n');
        }
      });

      socket.on('error', (error) => {
        this.logger.error('Unix socket client error', error);
      });

      socket.on('close', () => {
        this.logger.info('Unix socket client disconnected');
      });
    });

    this.server.on('error', (error) => {
      this.logger.error('Unix socket server error', error);
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(this.socketPath, () => {
        this.logger.info(`Unix socket server listening on ${this.socketPath}`);
        resolve();
      });

      this.server!.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          if (existsSync(this.socketPath)) {
            unlinkSync(this.socketPath);
          }
          this.logger.info('Unix socket server stopped');
          resolve();
        });
      });
    }
  }

  private async handleRequest(request: any): Promise<any> {
    const { method, params = {} } = request;

    switch (method) {
      case 'search':
        if (!params.query) {
          throw new Error('Query parameter is required');
        }
        return {
          result: await this.api.search(params.query),
        };

      case 'stats':
        return {
          result: await this.api.getStats(),
        };

      case 'ping':
        return {
          result: await this.api.ping(),
        };

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }
}