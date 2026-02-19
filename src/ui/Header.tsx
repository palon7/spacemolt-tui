import React from 'react';
import { Box, Text } from 'ink';
import type { WelcomePayload } from '../state/types.js';
import { truncateText } from './text.js';

type Props = {
  version: string;
  connected: boolean;
  loggedIn: boolean;
  welcome: WelcomePayload | null;
  lastTick: number | null;
  lastMessageAt: string | null;
  compact?: boolean;
  maxWidth?: number;
  height?: number;
};

export function Header(props: Props): JSX.Element {
  const server = props.welcome?.version ?? '?';
  const tickRate = props.welcome?.tick_rate ?? '?';
  const tick = props.lastTick ?? props.welcome?.current_tick ?? '?';
  const maxWidth = props.maxWidth ?? 120;

  const line1 = truncateText(`SpaceMolt TUI v${props.version}`, maxWidth);
  const line3 = truncateText(`Last message: ${props.lastMessageAt ?? '-'}`, maxWidth);
  const serverInfo = truncateText(`Server v${server}  |  Tick ${tick} @ ${tickRate}s`, maxWidth);

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} height={props.height}>
      <Text bold>{line1}</Text>
      <Text>
        <Text color={props.connected ? 'green' : 'red'}>
          {props.connected ? '[CONNECTED]' : '[DISCONNECTED]'}
        </Text>
        {'  '}
        <Text color={props.loggedIn ? 'green' : 'yellow'}>
          {props.loggedIn ? '[LOGGED IN]' : '[NOT LOGGED IN]'}
        </Text>
        {'  |  '}
        {serverInfo}
      </Text>
      {!props.compact ? <Text dimColor>{line3}</Text> : null}
    </Box>
  );
}
