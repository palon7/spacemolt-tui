import type React from 'react';
import { useEffect, useRef } from 'react';
import { resolveSystemId } from '../data/gameData.js';
import { updateCtxFromStateUpdate } from '../state/summary.js';
import type { SummaryContext } from '../state/summary.js';
import {
  updateConnectionState,
  updateFromStateUpdate as storeUpdateFromStateUpdate,
} from '../state/store.js';
import type { AppState, StateUpdate, WelcomePayload, WsMessage } from '../state/types.js';
import { createWsClient } from '../ws/client.js';
import type { WsClient } from '../ws/client.js';
import { nowIso } from '../utils/events.js';
import { usePushEvent } from './usePushEvent.js';

type UseWsConnectionOpts = {
  wsUrl: string;
  username: string;
  password: string;
  summaryCtx: SummaryContext;
  eventLogDir: string | null;
  pausedRef: React.MutableRefObject<boolean>;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
};

export function useWsConnection({
  wsUrl,
  username,
  password,
  summaryCtx,
  eventLogDir,
  pausedRef,
  setState,
}: UseWsConnectionOpts): React.MutableRefObject<WsClient | null> {
  const backoffAttempt = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WsClient | null>(null);
  const prevLocationRef = useRef<{ system: string | null; poi: string | null }>({
    system: null,
    poi: null,
  });

  const pushEvent = usePushEvent({ summaryCtx, eventLogDir, pausedRef, setState });

  useEffect(() => {
    let manualClose = false;

    const scheduleReconnect = () => {
      backoffAttempt.current += 1;
      const base = Math.min(30000, 500 * 2 ** Math.min(10, backoffAttempt.current));
      const jitter = Math.floor(Math.random() * 500);
      const waitMs = base + jitter;
      pushEvent({
        ts: nowIso(),
        type: 'local',
        payload: {
          message: 'reconnect scheduled',
          attempt: backoffAttempt.current,
          wait_ms: waitMs,
        },
      });

      reconnectTimer.current = setTimeout(() => {
        if (!manualClose) wsRef.current?.connect();
      }, waitMs);
    };

    wsRef.current = createWsClient(wsUrl, {
      onOpen: () => {
        backoffAttempt.current = 0;
        setState((prev) => ({ ...prev, connected: true, loggedIn: false, error: null }));
        updateConnectionState(true, false);
        pushEvent({ ts: nowIso(), type: 'local', payload: { message: 'socket open' } });
      },
      onClose: (code, reason) => {
        setState((prev) => ({ ...prev, connected: false, loggedIn: false }));
        updateConnectionState(false, false);
        pushEvent({
          ts: nowIso(),
          type: 'local',
          payload: { message: 'socket closed', code, reason },
        });
        if (!manualClose) scheduleReconnect();
      },
      onError: (err) => {
        setState((prev) => ({ ...prev, error: String(err) }));
        pushEvent({ ts: nowIso(), type: 'local_error', payload: { error: String(err) } });
      },
      onMessage: (msg: WsMessage) => {
        setState((prev) => ({ ...prev, lastMessageAt: nowIso() }));
        const type = msg.type;
        const payload = msg.payload;

        if (type === 'welcome') {
          const wp = (payload || {}) as WelcomePayload;
          setState((prev) => ({
            ...prev,
            welcome: wp,
            lastTick: wp.current_tick ?? prev.lastTick,
          }));
          pushEvent({ ts: nowIso(), type, payload });
          wsRef.current?.send({ type: 'login', payload: { username, password } });
          pushEvent({
            ts: nowIso(),
            type: 'local',
            payload: { message: `sent login for ${username}` },
          });
          return;
        }

        if (type === 'logged_in') {
          setState((prev) => ({ ...prev, loggedIn: true }));
          updateConnectionState(true, true);
          pushEvent({ ts: nowIso(), type, payload });
          // Initialize location tracking so the first state_update doesn't fire false positives
          prevLocationRef.current = { system: summaryCtx.me.system, poi: summaryCtx.me.poi };
          return;
        }

        if (type === 'state_update') {
          const su = (payload || {}) as StateUpdate;
          const player = su.player ?? {};

          // Detect location changes before updating context
          const newSystem = player.current_system ?? prevLocationRef.current.system;
          const newPoi = player.current_poi ?? prevLocationRef.current.poi;
          const systemChanged =
            prevLocationRef.current.system !== null &&
            newSystem !== null &&
            newSystem !== prevLocationRef.current.system;
          const poiChanged =
            prevLocationRef.current.poi !== null &&
            newPoi !== null &&
            newPoi !== prevLocationRef.current.poi;

          if (systemChanged || poiChanged) {
            const message = systemChanged
              ? `Traveled to ${newSystem} / ${newPoi ?? '?'}`
              : `Arrived at ${newPoi}`;
            pushEvent({
              ts: nowIso(),
              type: 'state_change',
              payload: {
                message,
                prev_system: prevLocationRef.current.system,
                prev_poi: prevLocationRef.current.poi,
                system: newSystem,
                poi: newPoi,
              },
            });
          }
          prevLocationRef.current = { system: newSystem, poi: newPoi };

          updateCtxFromStateUpdate(summaryCtx, su);
          // Resolve travel_destination name to system ID for the map client
          const webSu = su.travel_destination
            ? {
                ...su,
                travel_destination: resolveSystemId(summaryCtx.gameData, su.travel_destination),
              }
            : su;
          storeUpdateFromStateUpdate(webSu);
          if (!pausedRef.current) {
            setState((prev) => ({
              ...prev,
              lastStateUpdate: su,
              lastTick: su.tick ?? prev.lastTick,
            }));
          }
          return;
        }

        if (type === 'tick') {
          const tick = (payload as { tick?: number } | undefined)?.tick;
          if (!pausedRef.current) {
            setState((prev) => ({ ...prev, lastTick: tick ?? prev.lastTick }));
          }
          return;
        }

        pushEvent({ ts: nowIso(), type, payload });
      },
    });

    wsRef.current.connect();

    return () => {
      manualClose = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [eventLogDir, password, pushEvent, summaryCtx, username, wsUrl, pausedRef, setState]);

  return wsRef;
}
