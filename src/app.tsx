import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, useApp } from 'ink';
import type { GameData } from './data/gameData.js';
import { createSummaryContext } from './state/summary.js';
import type { AppState, Filters } from './state/types.js';
import { Header } from './ui/Header.js';
import { EventsPanel } from './ui/EventsPanel.js';
import { Footer } from './ui/Footer.js';
import { Keybinds } from './ui/Keybinds.js';
import { HelpView } from './ui/HelpView.js';
import { ShipDetailView } from './ui/ShipDetailView.js';
import { ShipPanel } from './ui/ShipPanel.js';
import { StatusPanel } from './ui/StatusPanel.js';
import { TravelPanel } from './ui/TravelPanel.js';
import { useEventScroll } from './hooks/useEventScroll.js';
import { useExternalEvents } from './hooks/useExternalEvents.js';
import { useKeybindHandlers } from './hooks/useKeybindHandlers.js';
import { useLayout } from './hooks/useLayout.js';
import { useWsConnection } from './hooks/useWsConnection.js';
import { classifyEvent } from './utils/events.js';

const defaultFilters: Filters = {
  chat: true,
  combat: true,
  system: true,
  me: true,
  other: true,
  misc: true,
};

type AppProps = {
  wsUrl: string;
  username: string;
  password: string;
  gameData: GameData | null;
  version: string;
  eventLogDir: string | null;
};

export function App({
  wsUrl,
  username,
  password,
  gameData,
  version,
  eventLogDir,
}: AppProps): JSX.Element {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>({
    connected: false,
    loggedIn: false,
    welcome: null,
    lastTick: null,
    lastStateUpdate: null,
    lastMessageAt: null,
    events: [],
    filters: defaultFilters,
    paused: false,
    error: null,
    view: 'main',
  });

  // summaryCtx is a mutable object — summarizeMessage and updateCtxFromStateUpdate
  // write into it in-place for performance. Only recreated when gameData changes.
  const summaryCtx = useMemo(() => createSummaryContext(gameData), [gameData]);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = state.paused;
  }, [state.paused]);

  const wsRef = useWsConnection({
    wsUrl,
    username,
    password,
    summaryCtx,
    eventLogDir,
    pausedRef,
    setState,
  });

  useExternalEvents({ summaryCtx, eventLogDir, pausedRef, setState });

  const keybindHandlers = useKeybindHandlers({ setState, wsRef, exit });

  const {
    supportsRawMode,
    terminalRows,
    terminalCols,
    headerHeight,
    footerHeight,
    panelsHeight,
    compactRows,
    panelWidth,
    textWidth,
    eventHeight,
    eventRows,
  } = useLayout();

  const filteredEvents = state.events.filter((e) => state.filters[classifyEvent(e.type)]);

  const filterKey = Object.values(state.filters).join(',');
  const scroll = useEventScroll({
    totalEvents: filteredEvents.length,
    maxRows: eventRows,
    resetKey: filterKey,
  });

  const footerStatus = state.error
    ? `error: ${state.error}`
    : `events=${filteredEvents.length} paused=${state.paused ? 'yes' : 'no'}`;

  const keybindsProps = {
    enabled: supportsRawMode,
    view: state.view,
    ...keybindHandlers,
    onScrollUp: scroll.onScrollUp,
    onScrollDown: scroll.onScrollDown,
    onScrollToBottom: scroll.onScrollToBottom,
  };

  if (state.view === 'help') {
    return (
      <HelpView
        keybindsProps={keybindsProps}
        filters={state.filters}
        terminalRows={terminalRows}
        terminalCols={terminalCols}
      />
    );
  }

  if (state.view === 'detail') {
    return (
      <ShipDetailView
        stateUpdate={state.lastStateUpdate}
        keybindsProps={keybindsProps}
        terminalRows={terminalRows}
        terminalCols={terminalCols}
      />
    );
  }

  return (
    <Box flexDirection="column" height={terminalRows}>
      <Keybinds {...keybindsProps} />
      <Header
        version={version}
        connected={state.connected}
        loggedIn={state.loggedIn}
        welcome={state.welcome}
        lastTick={state.lastTick}
        lastMessageAt={state.lastMessageAt}
        compact={compactRows}
        maxWidth={textWidth}
        height={headerHeight}
      />
      <Box flexDirection="row" height={panelsHeight} width="100%">
        <Box width="33.33%" height={panelsHeight}>
          <StatusPanel
            stateUpdate={state.lastStateUpdate}
            gameData={gameData}
            maxWidth={panelWidth - 4}
            height={panelsHeight}
          />
        </Box>
        <Box width="33.34%" height={panelsHeight}>
          <ShipPanel
            ship={state.lastStateUpdate?.ship}
            compact={compactRows}
            maxWidth={panelWidth - 4}
            height={panelsHeight}
          />
        </Box>
        <Box width="33.33%" height={panelsHeight}>
          <TravelPanel
            stateUpdate={state.lastStateUpdate}
            compact={compactRows}
            maxWidth={panelWidth - 4}
            height={panelsHeight}
          />
        </Box>
      </Box>
      <EventsPanel
        events={filteredEvents}
        maxRows={eventRows}
        maxWidth={textWidth}
        height={eventHeight}
        scrollOffset={scroll.scrollOffset}
      />
      <Footer
        paused={state.paused}
        filters={state.filters}
        compact={compactRows}
        maxWidth={textWidth}
        height={footerHeight}
        statusLine={footerStatus}
        isScrolled={!scroll.isAtBottom}
      />
    </Box>
  );
}
