import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pushExternalEvent } from '../io/externalEvents.js';
import { getWebState, subscribeWebState } from '../state/store.js';
import { VALID_EVENT_COLORS, nowIso } from '../utils/events.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../../public');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const MAX_BODY_SIZE = 64 * 1024; // 64KB

function serveStatic(filePath: string, res: http.ServerResponse): void {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export type WebServerOptions = {
  enableMap: boolean;
  enableListenEvent: boolean;
};

export function startWebServer(
  host: string,
  port: number,
  options: WebServerOptions,
  onListening: (url: string) => void,
  dataDir: string,
): void {
  const server = http.createServer(async (req, res) => {
    const url = new URL(
      req.url ?? '/',
      `http://${host.includes(':') ? `[${host}]` : host}:${port}`,
    );

    // POST /api/events — external event receiver
    if (options.enableListenEvent && req.method === 'POST' && url.pathname === '/api/events') {
      try {
        const body = await readBody(req);
        const data = JSON.parse(body) as { title?: unknown; body?: unknown; color?: unknown };
        if (typeof data.title !== 'string' || data.title.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'title is required and must be a non-empty string' }));
          return;
        }
        if (
          data.color !== undefined &&
          (typeof data.color !== 'string' || !VALID_EVENT_COLORS.has(data.color))
        ) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: `invalid color. Valid colors: ${[...VALID_EVENT_COLORS].join(', ')}`,
            }),
          );
          return;
        }
        const eventBody = typeof data.body === 'string' ? data.body : '';
        const eventColor = typeof data.color === 'string' ? data.color : undefined;
        pushExternalEvent({
          ts: nowIso(),
          type: 'ext_action',
          label: data.title,
          color: eventColor,
          payload: { body: eventBody },
        });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid JSON' }));
      }
      return;
    }

    if (options.enableMap) {
      if (url.pathname === '/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write(': ok\n\n');
        res.write(`data: ${JSON.stringify(getWebState())}\n\n`);

        const unsub = subscribeWebState((state) => {
          res.write(`data: ${JSON.stringify(state)}\n\n`);
        });
        req.on('close', unsub);
        return;
      }

      if (url.pathname === '/api/map') {
        const mapPath = path.join(dataDir, 'map.json');
        if (!fs.existsSync(mapPath)) {
          res.writeHead(404);
          res.end('map.json not found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'application/json',
        });
        fs.createReadStream(mapPath).pipe(res);
        return;
      }

      // serve static files from public/
      if (url.pathname.startsWith('/assets/')) {
        const resolved = path.resolve(publicDir, '.' + url.pathname);
        if (!resolved.startsWith(publicDir + path.sep)) {
          res.writeHead(403);
          res.end('forbidden');
          return;
        }
        serveStatic(resolved, res);
        return;
      }

      // fallback: serve map.html
      serveStatic(path.join(publicDir, 'map.html'), res);
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  server.listen(port, host, () => {
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    const url = `http://${displayHost.includes(':') ? `[${displayHost}]` : displayHost}:${port}`;
    onListening(url);
  });
}
