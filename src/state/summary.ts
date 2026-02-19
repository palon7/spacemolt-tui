import type { GameData } from '../data/gameData.js';
import { lookupPoiDisplay, lookupStationName, lookupSystemName } from '../data/gameData.js';
import type { EventEntry, PayloadMap, StateUpdate } from './types.js';

/**
 * Mutable context object that accumulates state across messages.
 *
 * This is intentionally mutated in-place (not replaced) for performance —
 * `summarizeMessage` and `updateCtxFromStateUpdate` write directly into it
 * rather than creating copies on every tick/state_update.
 */
export type SummaryContext = {
  serverVersion: string | null;
  tickRate: number | null;
  tick: number | null;
  gameData: GameData | null;
  me: {
    system: string | null;
    poi: string | null;
    docked: string | null;
    credits: number | null;
    inCombat: boolean | null;
    hull: number | null;
    maxHull: number | null;
    shield: number | null;
    maxShield: number | null;
    fuel: number | null;
    maxFuel: number | null;
  };
};

export function createSummaryContext(gameData?: GameData | null): SummaryContext {
  return {
    serverVersion: null,
    tickRate: null,
    tick: null,
    gameData: gameData ?? null,
    me: {
      system: null,
      poi: null,
      docked: null,
      credits: null,
      inCombat: null,
      hull: null,
      maxHull: null,
      shield: null,
      maxShield: null,
      fuel: null,
      maxFuel: null,
    },
  };
}

function fmtNum(n: number | null | undefined): string {
  return typeof n === 'number' ? n.toLocaleString('en-US') : '?';
}

function pct01(x: number | null | undefined): string {
  return typeof x === 'number' ? `${Math.round(x * 100)}%` : '?';
}

/** Updates context in-place from a state_update payload for performance (avoids copying on every tick). */
export function updateCtxFromStateUpdate(ctx: SummaryContext, stateUpdate?: StateUpdate): void {
  if (!stateUpdate) return;
  if (typeof stateUpdate.tick === 'number') ctx.tick = stateUpdate.tick;
  const player = stateUpdate.player ?? {};
  const ship = stateUpdate.ship ?? {};

  ctx.me.system = player.current_system ?? ctx.me.system;
  ctx.me.poi = player.current_poi ?? ctx.me.poi;
  ctx.me.docked = player.docked_at_base ?? ctx.me.docked;
  ctx.me.credits = player.credits ?? ctx.me.credits;
  ctx.me.inCombat = stateUpdate.in_combat ?? ctx.me.inCombat;

  ctx.me.hull = ship.hull ?? ctx.me.hull;
  ctx.me.maxHull = ship.max_hull ?? ctx.me.maxHull;
  ctx.me.shield = ship.shield ?? ctx.me.shield;
  ctx.me.maxShield = ship.max_shield ?? ctx.me.maxShield;
  ctx.me.fuel = ship.fuel ?? ctx.me.fuel;
  ctx.me.maxFuel = ship.max_fuel ?? ctx.me.maxFuel;
}

function asPayload<K extends keyof PayloadMap>(payload: unknown, _type: K): PayloadMap[K] {
  return (payload ?? {}) as PayloadMap[K];
}

export function summarizeMessage(ctx: SummaryContext, type: string, payload: unknown): string {
  switch (type) {
    case 'welcome': {
      const p = asPayload(payload, 'welcome');
      ctx.serverVersion = p.version ?? ctx.serverVersion;
      ctx.tickRate = p.tick_rate ?? ctx.tickRate;
      ctx.tick = p.current_tick ?? ctx.tick;
      return `server=v${p.version ?? '?'} tick_rate=${p.tick_rate ?? '?'}s tick=${p.current_tick ?? '?'}`;
    }
    case 'logged_in': {
      const p = asPayload(payload, 'logged_in');
      const player = p.player ?? {};
      updateCtxFromStateUpdate(ctx, p);
      const sysName = lookupSystemName(ctx.gameData, ctx.me.system ?? '?');
      const poiName = lookupPoiDisplay(ctx.gameData, ctx.me.poi ?? '?', ctx.me.system);
      return `Logged in as ${player.username ?? '?'} (System: ${sysName}, PoI: ${poiName}, Credits: ${fmtNum(ctx.me.credits)})`;
    }
    case 'tick': {
      const p = asPayload(payload, 'tick');
      const tickValue = p.tick ?? ctx.tick;
      ctx.tick = tickValue ?? ctx.tick;
      return `tick=${ctx.tick ?? '?'}`;
    }
    case 'state_update': {
      const p = asPayload(payload, 'state_update');
      updateCtxFromStateUpdate(ctx, p);
      const travel =
        p.travel_progress != null
          ? ` travel=${pct01(p.travel_progress)} -> ${p.travel_destination ?? '?'} (${p.travel_type ?? '?'}) arrival=${p.travel_arrival_tick ?? '?'}`
          : '';
      const sysName = lookupSystemName(ctx.gameData, ctx.me.system ?? '?');
      const poiName = lookupPoiDisplay(ctx.gameData, ctx.me.poi ?? '?', ctx.me.system);
      const dockedName = ctx.me.docked ? lookupStationName(ctx.gameData, ctx.me.docked) : '?';
      return `tick=${ctx.tick ?? '?'} ${sysName}/${poiName} docked=${dockedName} credits=${fmtNum(ctx.me.credits)} hull=${fmtNum(ctx.me.hull)}/${fmtNum(
        ctx.me.maxHull,
      )} shield=${fmtNum(ctx.me.shield)}/${fmtNum(ctx.me.maxShield)} fuel=${fmtNum(
        ctx.me.fuel,
      )}/${fmtNum(ctx.me.maxFuel)} in_combat=${ctx.me.inCombat ?? '?'}${travel}`;
    }
    case 'ok': {
      const p = asPayload(payload, 'ok');
      if (p.arrival_tick != null) {
        const action = p.action ?? p.message ?? 'ok';
        return `${action} arrival_tick=${p.arrival_tick} dest=${p.destination ?? '?'}`;
      }
      if (p.type === 'auto_dock' || p.type === 'auto_undock') {
        return p.message ?? '';
      }
      if (p.type === 'new_forum_post') {
        return `[${p.category ?? '?'}] ${p.title ?? '?'} (by ${p.author ?? '?'})`;
      }
      return shortJson(payload, 220);
    }
    case 'error': {
      const p = asPayload(payload, 'error');
      return `Error Code: ${p.code ?? '?'} Message: ${p.message ?? '?'} wait=${p.wait_seconds ?? '-'}`;
    }
    case 'combat_update': {
      const p = asPayload(payload, 'combat_update');
      if (p.destroyed) {
        return `${p.attacker ?? '?'} destroyed ${p.target ?? '?'}!`;
      }
      return `${p.attacker ?? '?'} attacked ${p.target ?? '?'}! ${p.damage ?? '?'} damages. (Shield:${p.shield_hit ?? '?'} Hull:${p.hull_hit ?? '?'}`;
    }
    case 'player_died': {
      const p = asPayload(payload, 'player_died');
      if (p.killer_name) {
        return `Killed by ${p.killer_name} Respawn: ${p.respawn_base ?? '?'} Cause: ${p.cause ?? '?'}`;
      }
      return `You died because ${p.cause ?? '?'} Respawn: ${p.respawn_base ?? '?'}`;
    }
    case 'scan_result': {
      const p = asPayload(payload, 'scan_result');
      const status = p.success ? 'successful' : 'failed';
      return `Scan ${status}! Target: ${p.target_id ?? '?'} Info Revealed: ${p.revealed_info?.join(',') ?? ''}`;
    }
    case 'scan_detected': {
      const p = asPayload(payload, 'scan_detected');
      return `Scanned by ${p.scanner_username ?? '?'} (Ship: ${p.scanner_ship_class ?? '?'}): ${p.message ?? ''}`;
    }
    case 'mining_yield': {
      const p = asPayload(payload, 'mining_yield');
      return `Resource: ${p.resource_id ?? '?'} Quantity: ${p.quantity ?? '?'} Remaining: ${p.remaining ?? '?'}`;
    }
    case 'chat_message': {
      const p = asPayload(payload, 'chat_message');
      return `#${p.channel ?? '?'} <${p.sender ?? '?'}> ${p.content ?? ''}`;
    }
    case 'trade_offer_received': {
      const p = asPayload(payload, 'trade_offer_received');
      return `Trade offer from ${p.from_name ?? '?'} Offer Credits: ${p.offer_credits ?? 0} Request Credits: ${p.request_credits ?? 0} Trade ID: ${p.trade_id ?? '?'}`;
    }
    case 'skill_level_up': {
      const p = asPayload(payload, 'skill_level_up');
      return `Skill ${p.skill_id ?? '?'} leveled up to ${p.new_level ?? '?'}!`;
    }
    case 'poi_arrival': {
      const p = asPayload(payload, 'poi_arrival');
      return `${p.username ?? '?'}(clan=${p.clan_tag ?? 'No clan'}) arrived at ${p.poi_name ?? '?'}`;
    }
    case 'poi_departure': {
      const p = asPayload(payload, 'poi_departure');
      return `${p.username ?? '?'}(clan=${p.clan_tag ?? 'No clan'}) departed to ${p.poi_name ?? '?'}`;
    }
    case 'local': {
      const p = asPayload(payload, 'local');
      return `${p.message ?? 'Unknown Message'}`;
    }
    case 'state_change': {
      const p = asPayload(payload, 'state_change');
      if (p.system && p.poi) {
        const sysName = lookupSystemName(ctx.gameData, p.system);
        const poiName = lookupPoiDisplay(ctx.gameData, p.poi, p.system);
        if (p.prev_system && p.prev_system !== p.system) {
          return `Traveled to ${sysName} / ${poiName}`;
        }
        return `Arrived at ${poiName}`;
      }
      return p.message ?? shortJson(payload, 220);
    }
    case 'reconnected': {
      const p = asPayload(payload, 'reconnected');
      return `${p.message ?? 'Reconnected'}${p.was_pilotless ? '(was pilotless)' : ''} Next tick: ${p.tick ?? '?'}`;
    }
    case 'ext_action': {
      const p = asPayload(payload, 'ext_action');
      return p.body ?? '';
    }
    default:
      return shortJson(payload, 240);
  }
}

function getDisplayLabel(type: string, payload: unknown): string | undefined {
  if (type !== 'ok') return undefined;
  const p = asPayload(payload, 'ok');
  if (p.arrival_tick != null) return 'travel';
  if (p.type === 'auto_dock' || p.type === 'auto_undock') return p.type;
  if (p.type === 'new_forum_post') return 'forum';
  return undefined;
}

export function withSummary(ctx: SummaryContext, entry: EventEntry): EventEntry {
  const summary = summarizeMessage(ctx, entry.type, entry.payload);
  const label = getDisplayLabel(entry.type, entry.payload);
  return { ...entry, summary, label: label ?? entry.label };
}

function shortJson(obj: unknown, max = 300): string {
  try {
    const s = JSON.stringify(obj);
    if (s.length <= max) return s;
    return s.slice(0, max) + '…';
  } catch {
    return String(obj);
  }
}
