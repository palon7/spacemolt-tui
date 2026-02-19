import { useState, useCallback } from 'react';

type UseEventScrollOpts = {
  totalEvents: number;
  maxRows: number;
  /** Change this value to reset scroll to bottom (e.g. when filters change). */
  resetKey: string;
};

export type EventScrollState = {
  scrollOffset: number;
  isAtBottom: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
  onScrollToBottom: () => void;
};

type ScrollState = {
  offset: number;
  prevTotal: number;
  prevResetKey: string;
};

/**
 * Manage event log scroll offset.
 *
 * Uses the "store previous props in state" pattern recommended by React
 * to adjust the offset during render without refs or effects.
 * https://react.dev/reference/react/useState#storing-information-from-previous-renders
 */
export function useEventScroll({
  totalEvents,
  maxRows,
  resetKey,
}: UseEventScrollOpts): EventScrollState {
  const [state, setState] = useState<ScrollState>({
    offset: 0,
    prevTotal: totalEvents,
    prevResetKey: resetKey,
  });

  // Adjust scroll when props change during render.
  if (resetKey !== state.prevResetKey || totalEvents !== state.prevTotal) {
    let newOffset = state.offset;
    if (resetKey !== state.prevResetKey) {
      // Filter changed — reset scroll to bottom
      newOffset = 0;
    } else {
      // Event count changed — keep position stable while scrolled up
      const diff = totalEvents - state.prevTotal;
      if (diff > 0 && state.offset > 0) {
        newOffset = state.offset + diff;
      }
    }
    setState({ offset: newOffset, prevTotal: totalEvents, prevResetKey: resetKey });
  }

  const maxOffset = Math.max(0, totalEvents - maxRows);
  const clamped = Math.min(Math.max(state.offset, 0), maxOffset);

  const onScrollUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      offset: Math.max(prev.offset - 1, 0),
    }));
  }, []);

  const onScrollDown = useCallback(() => {
    setState((prev) => ({
      ...prev,
      offset: Math.min(prev.offset + 1, Math.max(0, totalEvents - maxRows)),
    }));
  }, [totalEvents, maxRows]);

  const onScrollToBottom = useCallback(() => {
    setState((prev) => ({ ...prev, offset: 0 }));
  }, []);

  return {
    scrollOffset: clamped,
    isAtBottom: clamped === 0,
    onScrollUp,
    onScrollDown,
    onScrollToBottom,
  };
}
