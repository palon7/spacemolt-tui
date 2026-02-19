import React from 'react';
import { Text } from 'ink';
import { inlineBar, metricColor } from './text.js';

type MetricRowProps = {
  label: string;
  labelWidth: number;
  valStr: string;
  pct: number;
  barWidth: number;
};

export function MetricRow({
  label,
  labelWidth,
  valStr,
  pct,
  barWidth,
}: MetricRowProps): JSX.Element {
  const color = metricColor(pct);
  return (
    <Text>
      <Text dimColor>{label.padEnd(labelWidth)}: </Text>
      <Text color={color}>{valStr}</Text>
      <Text color={color}> {inlineBar(pct, barWidth)}</Text>
    </Text>
  );
}
