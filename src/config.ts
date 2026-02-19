import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type AppConfig = {
  username: string;
  password: string;
  wsUrl: string;
  host: string;
  port: number;
  dataDir: string;
  eventLog: boolean;
  eventLogDir: string;
};

type ConfigFile = {
  username?: string;
  password?: string;
  ws_url?: string;
  host?: string;
  port?: number;
  data_dir?: string;
  event_log?: boolean;
  event_log_dir?: string;
};

const CONFIG_DIR = path.join(os.homedir(), '.spacemolt-tui');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function readConfigFile(): ConfigFile {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as ConfigFile;
  } catch {
    process.stderr.write(`Warning: failed to parse ${CONFIG_PATH}\n`);
    return {};
  }
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(argv: string[]): AppConfig {
  const file = readConfigFile();

  const username = argv.find((a) => a.startsWith('--username='))?.split('=')[1] ?? file.username;
  const password = argv.find((a) => a.startsWith('--password='))?.split('=')[1] ?? file.password;

  if (!username || !password) {
    process.stderr.write(
      `Missing credentials. Set username and password in ${CONFIG_PATH} or pass --username= --password=\n`,
    );
    process.exit(1);
  }

  const wsUrl =
    argv.find((a) => a.startsWith('--ws='))?.split('=')[1] ??
    file.ws_url ??
    'wss://game.spacemolt.com/ws';

  const host = argv.find((a) => a.startsWith('--host='))?.split('=')[1] ?? file.host ?? '127.0.0.1';

  const port = parseInt(
    argv.find((a) => a.startsWith('--port='))?.split('=')[1] ?? String(file.port ?? 3001),
    10,
  );

  const dataDir = file.data_dir ?? path.join(CONFIG_DIR, 'data');

  const eventLog = argv.includes('--log') || file.event_log === true;

  const eventLogDir =
    argv.find((a) => a.startsWith('--log-dir='))?.split('=')[1] ??
    file.event_log_dir ??
    path.join(CONFIG_DIR, 'logs');

  return { username, password, wsUrl, host, port, dataDir, eventLog, eventLogDir };
}
