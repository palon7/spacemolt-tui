import React from 'react';
import { Box, Text } from 'ink';
import type { Filters } from '../state/types.js';
import type { KeybindsProps } from './Keybinds.js';
import { Keybinds } from './Keybinds.js';

type Props = {
  keybindsProps: KeybindsProps;
  filters: Filters;
  terminalRows: number;
  terminalCols: number;
};

type HelpRow = { key: string; desc: string };

const NAVIGATION_ROWS: HelpRow[] = [
  { key: 'q / esc', desc: 'quit' },
  { key: 'p', desc: 'pause / resume UI updates' },
  { key: '↑ / ↓', desc: 'scroll event log' },
  { key: 'e', desc: 'jump to latest events' },
  { key: 'd', desc: 'ship detail screen (toggle)' },
  { key: '?', desc: 'this help screen (toggle)' },
];

const FILTER_ROWS: HelpRow[] = [
  { key: 'c', desc: 'chat events (chat_message)' },
  { key: 'b', desc: 'combat events (combat_update / player_died / scan*)' },
  { key: 's', desc: 'system events (ok / error / local*)' },
  { key: 'm', desc: 'me events (state_change)' },
  { key: 'o', desc: 'other events (poi_arrival / departure)' },
  { key: 'x', desc: 'misc events (everything else)' },
];

const KEY_W = 10;

type SectionProps = { title: string; rows: HelpRow[]; filters?: Filters };

function HelpSection({ title, rows, filters }: SectionProps): JSX.Element {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold dimColor>
        {`── ${title} `}
        {'─'.repeat(30)}
      </Text>
      {rows.map((r) => {
        const filterKey = r.key as keyof Filters;
        const isFilterRow = filters !== undefined && filterKey in filters;
        const active = isFilterRow ? filters[filterKey] : undefined;
        return (
          <Text key={r.key}>
            <Text color="cyan">{r.key.padEnd(KEY_W)}</Text>
            <Text dimColor> </Text>
            <Text>{r.desc}</Text>
            {active !== undefined ? (
              <Text>
                <Text dimColor> (</Text>
                <Text color={active ? 'green' : 'gray'}>{active ? 'on' : 'off'}</Text>
                <Text dimColor>)</Text>
              </Text>
            ) : null}
          </Text>
        );
      })}
    </Box>
  );
}

export function HelpView({
  keybindsProps,
  filters,
  terminalRows,
  terminalCols,
}: Props): JSX.Element {
  return (
    <Box flexDirection="column" height={terminalRows} width={terminalCols}>
      <Keybinds {...keybindsProps} />
      <Box flexDirection="column" borderStyle="round" paddingX={1} paddingY={0} flexGrow={1}>
        <Text bold>❯ Help</Text>
        <Box marginTop={1} flexDirection="column">
          <HelpSection title="Navigation" rows={NAVIGATION_ROWS} />
          <HelpSection title="Event Filters" rows={FILTER_ROWS} filters={filters} />
        </Box>
      </Box>
      <Box paddingX={1}>
        <Text dimColor>esc/?: back | q: quit</Text>
      </Box>
    </Box>
  );
}
