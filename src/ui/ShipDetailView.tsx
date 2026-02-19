import React from 'react';
import { Box, Text } from 'ink';
import type { CargoItem, ShipModule, StateUpdate } from '../state/types.js';
import type { KeybindsProps } from './Keybinds.js';
import { Keybinds } from './Keybinds.js';
import { MetricRow } from './MetricRow.js';
import { clampPercent, metricStr } from './text.js';

type Props = {
  stateUpdate: StateUpdate | null;
  keybindsProps: KeybindsProps;
  terminalRows: number;
  terminalCols: number;
};

const BAR_W = 14;
const LABEL_W = 6; // "Shield" = longest label

type ShipStatsSectionProps = {
  ship: StateUpdate['ship'];
};

function ShipStatsSection({ ship }: ShipStatsSectionProps): JSX.Element {
  const hullPct = clampPercent(ship?.hull, ship?.max_hull);
  const shieldPct = clampPercent(ship?.shield, ship?.max_shield);
  const fuelPct = clampPercent(ship?.fuel, ship?.max_fuel);
  const cargoPct = clampPercent(ship?.cargo_used, ship?.cargo_capacity);

  const rawVals = [
    metricStr(ship?.hull, ship?.max_hull),
    metricStr(ship?.shield, ship?.max_shield),
    metricStr(ship?.fuel, ship?.max_fuel),
    metricStr(ship?.cargo_used, ship?.cargo_capacity),
  ];
  const vsW = Math.max(7, ...rawVals.map((s) => s.length));
  const [hullStr, shieldStr, fuelStr, cargoStr] = rawVals.map((s) => s.padStart(vsW));

  return (
    <Box flexDirection="column" marginBottom={1}>
      <MetricRow
        label="Hull"
        labelWidth={LABEL_W}
        valStr={hullStr}
        pct={hullPct}
        barWidth={BAR_W}
      />
      <MetricRow
        label="Shield"
        labelWidth={LABEL_W}
        valStr={shieldStr}
        pct={shieldPct}
        barWidth={BAR_W}
      />
      <MetricRow
        label="Fuel"
        labelWidth={LABEL_W}
        valStr={fuelStr}
        pct={fuelPct}
        barWidth={BAR_W}
      />
      <MetricRow
        label="Cargo"
        labelWidth={LABEL_W}
        valStr={cargoStr}
        pct={cargoPct}
        barWidth={BAR_W}
      />
      <Text>
        <Text dimColor>{'Armor'.padEnd(LABEL_W)}: </Text>
        <Text>{ship?.armor ?? '?'}</Text>
        <Text dimColor> Speed: </Text>
        <Text>{ship?.speed ?? '?'}</Text>
        <Text dimColor> Recharge: </Text>
        <Text>{ship?.shield_recharge ?? '?'}/tick</Text>
      </Text>
      <Text>
        <Text dimColor>{'CPU'.padEnd(LABEL_W)}: </Text>
        <Text>
          {ship?.cpu_used ?? '?'}/{ship?.cpu_capacity ?? '?'}
        </Text>
        <Text dimColor> Power: </Text>
        <Text>
          {ship?.power_used ?? '?'}/{ship?.power_capacity ?? '?'}
        </Text>
      </Text>
      <Text>
        <Text dimColor>{'Slots'.padEnd(LABEL_W)}: </Text>
        <Text dimColor>Weapon:</Text>
        <Text> {ship?.weapon_slots ?? '?'}</Text>
        <Text dimColor> Defense:</Text>
        <Text> {ship?.defense_slots ?? '?'}</Text>
        <Text dimColor> Utility:</Text>
        <Text> {ship?.utility_slots ?? '?'}</Text>
      </Text>
    </Box>
  );
}

const KNOWN_MODULE_FIELDS = new Set([
  'id',
  'name',
  'type',
  'type_id',
  'quality',
  'quality_grade',
  'cpu_usage',
  'power_usage',
  'wear',
  'wear_status',
]);

type ModuleCardProps = {
  module: ShipModule;
  index: number;
};

function ModuleCard({ module, index }: ModuleCardProps): JSX.Element {
  const wearColor = module.wear === 0 ? 'green' : module.wear < 50 ? 'yellow' : 'red';
  const typeSpecific = Object.entries(module).filter(
    ([k, v]) => !KNOWN_MODULE_FIELDS.has(k) && v !== undefined && v !== null,
  );

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text dimColor>[{index + 1}] </Text>
        <Text bold>{module.name}</Text>
        <Text dimColor> type: </Text>
        <Text>{module.type}</Text>
        <Text dimColor> quality: </Text>
        <Text>
          {module.quality} ({module.quality_grade})
        </Text>
      </Text>
      <Text>
        <Text>{'     '}</Text>
        <Text dimColor>cpu: </Text>
        <Text>{module.cpu_usage}</Text>
        <Text dimColor> power: </Text>
        <Text>{module.power_usage}</Text>
        <Text dimColor> wear: </Text>
        <Text color={wearColor}>
          {module.wear} ({module.wear_status})
        </Text>
      </Text>
      {typeSpecific.length > 0 ? (
        <Text>
          <Text>{'     '}</Text>
          <Text dimColor>{typeSpecific.map(([k, v]) => `${k}: ${String(v)}`).join('  ')}</Text>
        </Text>
      ) : null}
    </Box>
  );
}

type ModuleListSectionProps = {
  modules: ShipModule[];
};

function ModuleListSection({ modules }: ModuleListSectionProps): JSX.Element {
  return (
    <Box flexDirection="column">
      <Text bold dimColor>
        {`── Modules (${modules.length}) `}
        {'─'.repeat(20)}
      </Text>
      {modules.length === 0 ? (
        <Text dimColor> (no modules installed)</Text>
      ) : (
        modules.map((m, i) => <ModuleCard key={m.id} module={m} index={i} />)
      )}
    </Box>
  );
}

type CargoDetailSectionProps = {
  cargo?: CargoItem[];
};

function CargoDetailSection({ cargo }: CargoDetailSectionProps): JSX.Element {
  return (
    <Box flexDirection="column">
      <Text bold dimColor>
        {`── Cargo (${cargo?.length ?? 0}) `}
        {'─'.repeat(20)}
      </Text>
      {!cargo || cargo.length === 0 ? (
        <Text dimColor> (empty)</Text>
      ) : (
        cargo.map((item) => (
          <Text key={item.item_id}>
            <Text dimColor> {item.item_id} </Text>
            <Text>x{item.quantity}</Text>
          </Text>
        ))
      )}
    </Box>
  );
}

export function ShipDetailView({
  stateUpdate,
  keybindsProps,
  terminalRows,
  terminalCols,
}: Props): JSX.Element {
  const ship = stateUpdate?.ship;
  const modules = stateUpdate?.modules ?? [];

  const titleName = ship?.name ?? '(unknown)';
  const titleClass = ship?.class_id ? ` (${ship.class_id})` : '';

  return (
    <Box flexDirection="column" height={terminalRows} width={terminalCols}>
      <Keybinds {...keybindsProps} />
      <Box flexDirection="column" borderStyle="round" paddingX={1} paddingY={0} flexGrow={1}>
        <Text bold>
          {'❯ Ship Detail: '}
          {titleName}
          {titleClass}
        </Text>
        <Box marginTop={1} flexDirection="column">
          <ShipStatsSection ship={ship} />
          <ModuleListSection modules={modules} />
          <CargoDetailSection cargo={ship?.cargo} />
        </Box>
      </Box>
      <Box paddingX={1}>
        <Text dimColor>esc/d: back | q: quit</Text>
      </Box>
    </Box>
  );
}
