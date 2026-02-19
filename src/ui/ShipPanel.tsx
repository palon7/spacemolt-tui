import React from 'react';
import { Box, Text } from 'ink';
import type { Ship } from '../state/types.js';
import { MetricRow } from './MetricRow.js';
import { clampPercent, metricStr } from './text.js';

type Props = {
  ship: Ship | null | undefined;
  compact?: boolean;
  maxWidth?: number;
  height?: number;
};

const LABEL_W = 6; // length of "Shield" (longest label)
const BAR_W = 12;
const FIXED_ROWS = 7; // border(2) + title(1) + MetricRow x4

export function ShipPanel({ ship, height }: Props): JSX.Element {
  const hull = clampPercent(ship?.hull, ship?.max_hull);
  const shield = clampPercent(ship?.shield, ship?.max_shield);
  const fuel = clampPercent(ship?.fuel, ship?.max_fuel);
  const cargo = clampPercent(ship?.cargo_used, ship?.cargo_capacity);

  // Build value strings first, then pad all to the same width so bars align.
  const rawVals = [
    metricStr(ship?.hull, ship?.max_hull),
    metricStr(ship?.shield, ship?.max_shield),
    metricStr(ship?.fuel, ship?.max_fuel),
    metricStr(ship?.cargo_used, ship?.cargo_capacity),
  ];
  const valW = Math.max(...rawVals.map((s) => s.length));
  const [hullStr, shieldStr, fuelStr, cargoStr] = rawVals.map((s) => s.padStart(valW));

  const spareRows = (height ?? 0) - FIXED_ROWS;
  const cargoItems = ship?.cargo;

  let cargoDetail: JSX.Element | null = null;
  if (spareRows > 0) {
    if (!cargoItems || cargoItems.length === 0) {
      cargoDetail = <Text dimColor> (empty)</Text>;
    } else if (cargoItems.length <= spareRows) {
      cargoDetail = (
        <>
          {cargoItems.map((item) => (
            <Text key={item.item_id}>
              <Text dimColor> {item.item_id} </Text>
              <Text>x{item.quantity}</Text>
            </Text>
          ))}
        </>
      );
    } else {
      const showCount = Math.max(0, spareRows - 1);
      const hiddenCount = cargoItems.length - showCount;
      const visibleItems = cargoItems.slice(0, showCount);
      cargoDetail = (
        <>
          {visibleItems.map((item) => (
            <Text key={item.item_id}>
              <Text dimColor> {item.item_id} </Text>
              <Text>x{item.quantity}</Text>
            </Text>
          ))}
          <Text dimColor> ...+{hiddenCount} more</Text>
        </>
      );
    }
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      paddingX={1}
      paddingY={0}
      height={height}
      width="100%"
    >
      <Text bold>❯ Ship</Text>
      <MetricRow label="Hull" labelWidth={LABEL_W} valStr={hullStr} pct={hull} barWidth={BAR_W} />
      <MetricRow
        label="Shield"
        labelWidth={LABEL_W}
        valStr={shieldStr}
        pct={shield}
        barWidth={BAR_W}
      />
      <MetricRow label="Fuel" labelWidth={LABEL_W} valStr={fuelStr} pct={fuel} barWidth={BAR_W} />
      <MetricRow
        label="Cargo"
        labelWidth={LABEL_W}
        valStr={cargoStr}
        pct={cargo}
        barWidth={BAR_W}
      />
      {cargoDetail}
    </Box>
  );
}
