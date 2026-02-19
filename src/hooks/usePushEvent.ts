import type React from 'react';
import { useCallback } from 'react';
import { appendEventLog } from '../io/eventLog.js';
import { withSummary } from '../state/summary.js';
import type { SummaryContext } from '../state/summary.js';
import type { AppState, EventEntry } from '../state/types.js';
import { MAX_EVENTS, isLoggableEvent, nowIso } from '../utils/events.js';

type UsePushEventOpts = {
  summaryCtx: SummaryContext;
  eventLogDir: string | null;
  pausedRef: React.MutableRefObject<boolean>;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
};

export function usePushEvent({
  summaryCtx,
  eventLogDir,
  pausedRef,
  setState,
}: UsePushEventOpts): (entry: EventEntry) => void {
  return useCallback(
    (entry: EventEntry) => {
      const summarized = withSummary(summaryCtx, entry);
      if (!pausedRef.current) {
        setState((prev) => ({
          ...prev,
          events: [summarized, ...prev.events].slice(0, MAX_EVENTS),
        }));
      }
      if (eventLogDir && isLoggableEvent(entry.type)) {
        appendEventLog(eventLogDir, summarized, (err) => {
          setState((prev) => ({
            ...prev,
            events: [
              withSummary(summaryCtx, {
                ts: nowIso(),
                type: 'local_error',
                payload: { message: 'failed to write event log', error: String(err) },
              }),
              ...prev.events,
            ].slice(0, MAX_EVENTS),
          }));
        });
      }
    },
    [summaryCtx, eventLogDir, pausedRef, setState],
  );
}
