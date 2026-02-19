import React from 'react';
import { Box, Text } from 'ink';
import type { EventEntry } from '../state/types.js';
import { padEndColumns, truncateText } from './text.js';
import { eventTypeToString } from '../utils/events.js';

type Props = {
  events: EventEntry[];
  maxRows?: number;
  maxWidth?: number;
  height?: number;
  scrollOffset?: number;
};

const TYPE_W = 12;

function getEventColor(type: string): string {
  switch (type) {
    case 'chat_message':
      return 'cyan';
    case 'combat_update':
    case 'player_died':
      return 'red';
    case 'scan_result':
    case 'scan_detected':
      return 'magenta';
    case 'ok':
      return 'green';
    case 'error':
    case 'local_error':
      return 'red';
    case 'local':
      return 'gray';
    case 'welcome':
      return 'cyan';
    case 'logged_in':
      return 'green';
    case 'reconnected':
      return 'cyan';
    case 'poi_arrival':
    case 'poi_departure':
      return 'yellow';
    case 'mining_yield':
      return 'green';
    case 'trade_offer_received':
      return 'yellow';
    case 'skill_level_up':
      return 'cyan';
    case 'ext_action':
      return 'blueBright';
    default:
      return 'white';
  }
}

export function EventsPanel({
  events,
  maxRows = 18,
  maxWidth = 120,
  height,
  scrollOffset = 0,
}: Props): JSX.Element {
  const rows = events.slice(scrollOffset, scrollOffset + maxRows);
  // Layout: "[HH:MM:SS] "(11) + type(TYPE_W) + " | "(3) = 14 + TYPE_W fixed prefix
  const summaryMax = Math.max(0, maxWidth - 11 - TYPE_W - 3);
  const isScrolled = scrollOffset > 0;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} paddingY={0} height={height}>
      <Text>
        <Text bold>❯ Events</Text>
        {isScrolled ? <Text color="yellow">{` ↑ ${scrollOffset} newer`}</Text> : null}
      </Text>
      {rows.length === 0 ? (
        <Text dimColor>(none)</Text>
      ) : (
        rows.map((e, idx) => {
          const ts = e.ts.slice(11, 19); // HH:MM:SS
          const displayType = padEndColumns(eventTypeToString(e.label ?? e.type), TYPE_W);
          const summary = e.summary ? truncateText(e.summary, summaryMax) : '';
          const color = e.color ?? getEventColor(e.type);
          return (
            <Text key={`${e.ts}-${e.type}-${idx}`}>
              <Text dimColor>[{ts}] </Text>
              <Text color={color}>{displayType}</Text>
              {summary ? <Text dimColor> | </Text> : null}
              {summary ? <Text>{summary}</Text> : null}
            </Text>
          );
        })
      )}
    </Box>
  );
}
