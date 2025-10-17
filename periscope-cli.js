#!/usr/bin/env node

const { createConnection } = require('net');
const { join } = require('path');
const { homedir } = require('os');

class PeriscopeCLI {
  constructor() {
    this.socketPath = join(homedir(), '.periscope', 'api.sock');
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const client = createConnection(this.socketPath);
      
      client.on('connect', () => {
        const request = JSON.stringify({ method, params });
        client.write(request);
      });

      client.on('data', (data) => {
        try {
          const response = JSON.parse(data.toString());
          client.end();
          if (response.error) {
            reject(new Error(response.message || response.error));
          } else {
            resolve(response.result);
          }
        } catch (error) {
          reject(error);
        }
      });

      client.on('error', (error) => {
        reject(error);
      });
    });
  }

  async search(query) {
    try {
      const results = await this.sendRequest('search', { query });
      
      if (results.length === 0) {
        console.log('No results found.');
        return;
      }

      console.log(`Found ${results.length} result(s):\n`);
      
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   Path: ${result.path}`);
        console.log(`   Type: ${result.contentType}`);
        console.log(`   Score: ${result.score.toFixed(2)}`);
        if (result.snippet) {
          console.log(`   Snippet: ${result.snippet.replace(/<[^>]*>/g, '')}`);
        }
        console.log('');
      });
    } catch (error) {
      console.error('Search failed:', error.message);
      process.exit(1);
    }
  }

  async stats() {
    try {
      const stats = await this.sendRequest('stats');
      console.log('Periscope Index Statistics:');
      console.log(`  Documents: ${stats.totalDocuments}`);
      console.log(`  Total Size: ${this.formatBytes(stats.totalSize)}`);
      console.log(`  Last Indexed: ${new Date(stats.lastIndexed).toLocaleString()}`);
    } catch (error) {
      console.error('Failed to get stats:', error.message);
      process.exit(1);
    }
  }

  async ping() {
    try {
      const result = await this.sendRequest('ping');
      console.log(`Periscope is running: ${result}`);
    } catch (error) {
      console.error('Periscope is not running or not accessible:', error.message);
      process.exit(1);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  showHelp() {
    console.log(`
Periscope CLI - Command line interface for Periscope search

Usage:
  periscope-cli search <query>    Search for documents
  periscope-cli stats             Show index statistics
  periscope-cli ping              Check if Periscope is running
  periscope-cli help              Show this help message

Examples:
  periscope-cli search "machine learning"
  periscope-cli search "TODO"
  periscope-cli stats
  periscope-cli ping

Note: Periscope must be running for the CLI to work.
    `);
  }
}

async function main() {
  const cli = new PeriscopeCLI();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    cli.showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'search':
      if (args.length < 2) {
        console.error('Error: Search query is required');
        process.exit(1);
      }
      const query = args.slice(1).join(' ');
      await cli.search(query);
      break;

    case 'stats':
      await cli.stats();
      break;

    case 'ping':
      await cli.ping();
      break;

    case 'help':
    case '--help':
    case '-h':
      cli.showHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      cli.showHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = PeriscopeCLI;