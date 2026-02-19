import fs from 'node:fs';
import path from 'node:path';
import type { EventEntry } from '../state/types.js';

function todayFileName(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}.ndjson`;
}

export function appendEventLog(
  logDir: string,
  entry: EventEntry,
  onError: (err: Error) => void,
): void {
  const filePath = path.join(logDir, todayFileName());
  const line = JSON.stringify({
    ts: entry.ts,
    type: entry.type,
    payload: entry.payload,
  });
  fs.appendFile(filePath, line + '\n', 'utf8', (err) => {
    if (err) onError(err);
  });
}
