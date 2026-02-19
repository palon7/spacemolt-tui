import React from 'react';
import { Box, Text } from 'ink';
import type { GameData } from '../data/gameData.js';
import { lookupPoiDisplay, lookupStationName, lookupSystemName } from '../data/gameData.js';
import type { StateUpdate } from '../state/types.js';
import { truncateText } from './text.js';

type Props = {
  stateUpdate: StateUpdate | null;
  gameData: GameData | null;
  maxWidth?: number;
  height?: number;
};

const LABEL_W = 7; // length of "Credits" (longest label)

function Row({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  const paddedLabel = label.padEnd(LABEL_W);
  return (
    <Text>
      <Text dimColor>{paddedLabel}: </Text>
      {children}
    </Text>
  );
}

export function StatusPanel({ stateUpdate, gameData, maxWidth = 32, height }: Props): JSX.Element {
  const player = stateUpdate?.player;
  const inCombat = stateUpdate?.in_combat ?? false;
  const docked = player?.docked_at_base || null;
  const valueW = Math.max(0, maxWidth - LABEL_W - 2);

  const systemId = player?.current_system ?? null;
  const sysDisplay = systemId ? lookupSystemName(gameData, systemId) : '-';
  const poiDisplay = player?.current_poi
    ? lookupPoiDisplay(gameData, player.current_poi, systemId)
    : '-';
  const dockedDisplay = docked ? lookupStationName(gameData, docked) : '-';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      paddingX={1}
      paddingY={0}
      height={height}
      width="100%"
    >
      <Text bold>❯ Status</Text>
      <Row label="User">{truncateText(player?.username ?? '-', valueW)}</Row>
      <Row label="System">{truncateText(`${sysDisplay} / ${poiDisplay}`, valueW)}</Row>
      <Row label="Docked">
        <Text color={docked ? 'green' : undefined}>{truncateText(dockedDisplay, valueW)}</Text>
      </Row>
      <Row label="Credits">
        <Text color="yellow">
          {truncateText(player?.credits?.toLocaleString('en-US') ?? '-', valueW)}
        </Text>
      </Row>
      <Row label="Combat">
        <Text color={inCombat ? 'red' : 'green'} bold={inCombat}>
          {inCombat ? 'IN COMBAT' : 'safe'}
        </Text>
      </Row>
    </Box>
  );
}
