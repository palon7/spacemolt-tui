import React from 'react';
import { Box, Text } from 'ink';
import type { StateUpdate } from '../state/types.js';
import { inlineBar, truncateText } from './text.js';

type Props = {
  stateUpdate: StateUpdate | null;
  compact?: boolean;
  maxWidth?: number;
  height?: number;
};

const LABEL_W = 8; // length of "Progress" (longest label)
const BAR_W = 12;

export function TravelPanel({
  stateUpdate,
  compact = false,
  maxWidth = 30,
  height,
}: Props): JSX.Element {
  const prog = stateUpdate?.travel_progress;
  const traveling = typeof prog === 'number';
  const pct = traveling ? `${Math.round(prog * 100)}%` : '-';
  const percentValue = traveling ? Math.max(0, Math.min(100, Math.round(prog * 100))) : 0;
  const dest = stateUpdate?.travel_destination ?? '-';
  const travelType = stateUpdate?.travel_type ?? '-';
  const arrival = stateUpdate?.travel_arrival_tick ?? '-';
  const valueW = Math.max(0, maxWidth - LABEL_W - 2);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      paddingX={1}
      paddingY={0}
      height={height}
      width="100%"
    >
      <Text bold>❯ Travel</Text>
      <Text>
        <Text dimColor>{'Progress'.padEnd(LABEL_W)}: </Text>
        <Text color={traveling ? 'cyan' : undefined}>{pct}</Text>
        {traveling ? <Text color="cyan"> {inlineBar(percentValue, BAR_W)}</Text> : null}
      </Text>
      <Text>
        <Text dimColor>{'Dest'.padEnd(LABEL_W)}: </Text>
        {truncateText(dest, valueW)}
      </Text>
      <Text>
        <Text dimColor>{'Type'.padEnd(LABEL_W)}: </Text>
        {truncateText(travelType, valueW)}
      </Text>
      {!compact ? (
        <Text>
          <Text dimColor>{'Arrival'.padEnd(LABEL_W)}: </Text>
          {String(arrival)}
        </Text>
      ) : null}
    </Box>
  );
}
