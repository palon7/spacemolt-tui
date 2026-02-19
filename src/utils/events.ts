import type { Filters } from '../state/types.js';

export const MAX_EVENTS = 200;

const eventTypeString: Record<string, string> = {
  // Connection & State
  welcome: 'Welcome',
  registered: 'Registered',
  logged_in: 'Login',
  reconnected: 'Reconnected',
  pilotless_ship: 'Pilotless',
  // Responses
  ok: 'Ok',
  error: 'Error',
  local: 'Local',
  local_error: 'Local Error',
  // ok subtypes (used as label)
  travel: 'Travel',
  auto_dock: 'Auto Dock',
  auto_undock: 'Auto Undock',
  forum: 'Forum',
  // Combat
  combat_update: 'Combat',
  player_died: 'Died',
  scan_result: 'Scan',
  scan_detected: 'Scanned',
  // Events
  chat_message: 'Chat',
  mining_yield: 'Mining',
  trade_offer_received: 'Trade',
  skill_level_up: 'Skill Lv.Up',
  poi_arrival: 'Arrival',
  poi_departure: 'Departure',
  // Me
  state_change: 'Travel',
  // External
  ext_action: 'Ext',
};

/** Colors accepted by the external event API (Ink/chalk color names). */
export const VALID_EVENT_COLORS = new Set([
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'gray',
  'grey',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
  'whiteBright',
]);

export function nowIso(): string {
  return new Date().toISOString();
}

export function isLoggableEvent(type: string): boolean {
  return type !== 'state_update' && type !== 'tick';
}

export function classifyEvent(type: string): keyof Filters {
  if (type === 'chat_message') return 'chat';
  if (
    type === 'combat_update' ||
    type === 'player_died' ||
    type === 'scan_result' ||
    type === 'scan_detected'
  )
    return 'combat';
  if (type === 'ok' || type === 'error' || type === 'local' || type === 'local_error')
    return 'system';
  if (type === 'state_change') return 'me';
  if (type === 'poi_arrival' || type === 'poi_departure') return 'other';
  if (type === 'ext_action') return 'me';
  return 'misc';
}

export function eventTypeToString(type: string): string {
  return eventTypeString[type] ?? type;
}
