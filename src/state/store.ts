import type { StateUpdate } from './types.js';

export type WebState = {
  connected: boolean;
  loggedIn: boolean;
  current_system: string | null;
  travel_destination: string | null;
  travel_progress: number | null;
  travel_type: string | null;
  route: string[]; // visited system IDs in order (session only)
};

type Listener = (state: WebState) => void;

const listeners = new Set<Listener>();

let state: WebState = {
  connected: false,
  loggedIn: false,
  current_system: null,
  travel_destination: null,
  travel_progress: null,
  travel_type: null,
  route: [],
};

function emit(): void {
  for (const fn of listeners) fn(state);
}

export function subscribeWebState(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getWebState(): WebState {
  return state;
}

export function updateConnectionState(connected: boolean, loggedIn: boolean): void {
  state = { ...state, connected, loggedIn };
  emit();
}

export function updateFromStateUpdate(su: StateUpdate): void {
  const newSystem = su.player?.current_system ?? state.current_system;
  const systemChanged = newSystem !== null && newSystem !== state.current_system;
  state = {
    ...state,
    current_system: newSystem,
    travel_destination: su.travel_destination ?? null,
    travel_progress: su.travel_progress ?? null,
    travel_type: su.travel_type ?? null,
    route: systemChanged ? [...state.route, newSystem] : state.route,
  };
  emit();
}
