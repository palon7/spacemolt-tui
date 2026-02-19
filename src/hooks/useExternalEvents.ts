import type React from 'react';
import { useEffect } from 'react';
import { subscribeExternalEvents } from '../io/externalEvents.js';
import type { SummaryContext } from '../state/summary.js';
import type { AppState } from '../state/types.js';
import { usePushEvent } from './usePushEvent.js';

type UseExternalEventsOpts = {
  summaryCtx: SummaryContext;
  eventLogDir: string | null;
  pausedRef: React.MutableRefObject<boolean>;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
};

export function useExternalEvents({
  summaryCtx,
  eventLogDir,
  pausedRef,
  setState,
}: UseExternalEventsOpts): void {
  const pushEvent = usePushEvent({ summaryCtx, eventLogDir, pausedRef, setState });

  useEffect(() => {
    return subscribeExternalEvents(pushEvent);
  }, [pushEvent]);
}
