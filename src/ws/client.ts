import WebSocket from 'ws';
import type { WsMessage } from '../state/types.js';

export type WsCallbacks = {
  onOpen: () => void;
  onClose: (code: number, reason: string) => void;
  onError: (err: Error) => void;
  onMessage: (msg: WsMessage) => void;
};

export type WsClient = {
  connect: () => void;
  close: () => void;
  send: (msg: WsMessage) => void;
  isOpen: () => boolean;
};

export function createWsClient(url: string, cb: WsCallbacks): WsClient {
  let ws: WebSocket | null = null;

  const connect = () => {
    ws = new WebSocket(url);

    ws.on('open', () => cb.onOpen());
    ws.on('close', (code, reasonBuf) => cb.onClose(code, reasonBuf?.toString?.() ?? ''));
    ws.on('error', (err) => cb.onError(err as Error));
    ws.on('message', (buf) => {
      try {
        const raw: unknown = JSON.parse(buf.toString('utf8'));
        if (
          typeof raw !== 'object' ||
          raw === null ||
          typeof (raw as WsMessage).type !== 'string'
        ) {
          cb.onMessage({
            type: 'local_error',
            payload: { message: 'invalid message: missing type', raw: String(buf) },
          });
          return;
        }
        cb.onMessage(raw as WsMessage);
      } catch (e) {
        cb.onMessage({
          type: 'local_error',
          payload: { message: 'json parse failed', error: String(e) },
        });
      }
    });
  };

  const close = () => {
    try {
      ws?.close();
    } catch {
      // ignore
    }
  };

  const send = (msg: WsMessage) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(msg));
  };

  const isOpen = () => ws?.readyState === WebSocket.OPEN;

  return { connect, close, send, isOpen };
}
