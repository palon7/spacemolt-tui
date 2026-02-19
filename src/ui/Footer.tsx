import React from 'react';
import { Box, Text } from 'ink';
import type { Filters } from '../state/types.js';

type Props = {
  paused: boolean;
  filters: Filters;
  compact?: boolean;
  maxWidth?: number;
  height?: number;
  statusLine?: string;
  isScrolled?: boolean;
};

type FilterDef = { key: string; label: string; state: boolean };

function keyLabel(key: string, label: string): string {
  if (label.startsWith(key)) {
    return `(${key})${label.slice(key.length)}`;
  }
  return `(${key})${label}`;
}

export function Footer({ paused, filters, height, isScrolled = false }: Props): JSX.Element {
  const filterDefs: FilterDef[] = [
    { key: 'c', label: 'chat', state: filters.chat },
    { key: 'b', label: 'combat', state: filters.combat },
    { key: 's', label: 'system', state: filters.system },
    { key: 'm', label: 'me', state: filters.me },
    { key: 'o', label: 'other', state: filters.other },
    { key: 'x', label: 'misc', state: filters.misc },
  ];

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} paddingY={0} height={height}>
      <Text>
        <Text dimColor>q/esc quit | </Text>
        <Text color={paused ? 'yellow' : 'green'}>{keyLabel('p', 'pause')}</Text>
        {filterDefs.map((f) => (
          <Text key={f.key}>
            <Text dimColor> | </Text>
            <Text color={f.state ? 'green' : 'gray'}>{keyLabel(f.key, f.label)}</Text>
          </Text>
        ))}
        <Text dimColor> | </Text>
        <Text dimColor>↑↓ scroll</Text>
        {isScrolled ? (
          <>
            <Text dimColor> | </Text>
            <Text color="yellow">(e)nd</Text>
          </>
        ) : null}
        <Text dimColor> | ? help</Text>
      </Text>
    </Box>
  );
}
