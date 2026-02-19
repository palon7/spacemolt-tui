#!/usr/bin/env node
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };
const appVersion = pkg.version;
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { loadConfig } from './config.js';
import { fetchAndSaveGameData, loadGameData, type GameData } from './data/gameData.js';

const config = loadConfig(process.argv);

const refreshData = process.argv.includes('--refresh-data');
const withMap = process.argv.includes('--map');
const withListenEvent = process.argv.includes('--listen-event');
const eventLogDir = config.eventLog ? config.eventLogDir : null;
if (eventLogDir) {
  fs.mkdirSync(eventLogDir, { recursive: true });
}
const dataDir = config.dataDir;

async function resolveGameData(): Promise<GameData | null> {
  const mapPath = path.join(dataDir, 'map.json');
  const stationsPath = path.join(dataDir, 'stations.json');
  const cacheExists = fs.existsSync(mapPath) && fs.existsSync(stationsPath);

  if (!cacheExists || refreshData) {
    const action = refreshData ? 'Refreshing' : 'Downloading';
    process.stderr.write(`${action} game data from API...\n`);
    try {
      const data = await fetchAndSaveGameData(dataDir);
      process.stderr.write(`Game data saved to ${dataDir}/\n`);
      return data;
    } catch (err) {
      process.stderr.write(`Warning: failed to fetch game data: ${String(err)}\n`);
      if (cacheExists) {
        process.stderr.write('Falling back to cached data.\n');
        return loadGameData(dataDir);
      }
      return null;
    }
  }

  return loadGameData(dataDir);
}

resolveGameData().then(async (gameData) => {
  if (withMap || withListenEvent) {
    const { startWebServer } = await import('./web/server.js');
    const childProcess = withMap ? await import('node:child_process') : null;
    startWebServer(
      config.host,
      config.port,
      { enableMap: withMap, enableListenEvent: withListenEvent },
      (url) => {
        process.stderr.write(`Web server: ${url}\n`);
        if (withMap && childProcess) {
          const args =
            process.platform === 'win32'
              ? { cmd: 'cmd', argv: ['/c', 'start', '', url] }
              : process.platform === 'darwin'
                ? { cmd: 'open', argv: [url] }
                : { cmd: 'xdg-open', argv: [url] };
          childProcess.execFile(args.cmd, args.argv, (err) => {
            if (err) process.stderr.write(`Failed to open browser: ${String(err)}\n`);
          });
        }
      },
      dataDir,
    );
  }

  render(
    <App
      wsUrl={config.wsUrl}
      username={config.username}
      password={config.password}
      gameData={gameData}
      version={appVersion}
      eventLogDir={eventLogDir}
    />,
  );
});
