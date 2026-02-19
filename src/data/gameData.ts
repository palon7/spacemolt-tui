import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type Empire = {
  id: string;
  name: string;
};

export type StationServices = {
  refuel: boolean;
  repair: boolean;
  shipyard: boolean;
  market: boolean;
  cloning: boolean;
  insurance: boolean;
  crafting: boolean;
  missions: boolean;
  storage: boolean;
};

export type StationCondition = 'operational' | 'struggling' | 'critical';

export type Station = {
  id: string;
  name: string;
  description: string;
  empire: string;
  empire_name: string;
  system_id: string;
  system_name: string;
  services: StationServices;
  condition: StationCondition;
  condition_text: string;
  satisfaction_pct: number;
  facility_count: number;
  defense_level: number;
};

export type StationsJson = {
  empires?: Empire[];
  stations?: Station[];
};

export type GameData = {
  systems: Map<string, string>; // id -> name
  systemsByName: Map<string, string>; // name -> id
  stations: Map<string, string>; // id -> name
  stationsBySystem: Map<string, Station[]>; // system_id -> stations
};

const MAP_URL = 'https://game.spacemolt.com/api/map';
const STATIONS_URL = 'https://game.spacemolt.com/api/stations';

export function getDefaultDataDir(): string {
  return path.join(os.homedir(), '.spacemolt-tui', 'data');
}

function buildGameData(
  mapJson: { systems?: Array<{ id: string; name: string }> },
  stationsJson: StationsJson,
): GameData {
  const systems = new Map<string, string>();
  const systemsByName = new Map<string, string>();
  for (const s of mapJson.systems ?? []) {
    if (s.id && s.name) {
      systems.set(s.id, s.name);
      systemsByName.set(s.name, s.id);
    }
  }
  const stations = new Map<string, string>();
  const stationsBySystem = new Map<string, Station[]>();
  for (const st of stationsJson.stations ?? []) {
    if (st.id && st.name) stations.set(st.id, st.name);
    if (st.system_id) {
      const list = stationsBySystem.get(st.system_id);
      if (list) list.push(st);
      else stationsBySystem.set(st.system_id, [st]);
    }
  }
  return { systems, systemsByName, stations, stationsBySystem };
}

export async function loadGameData(dir: string): Promise<GameData | null> {
  const mapPath = path.join(dir, 'map.json');
  const stationsPath = path.join(dir, 'stations.json');
  if (!fs.existsSync(mapPath) || !fs.existsSync(stationsPath)) return null;
  try {
    const mapJson = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as {
      systems?: Array<{ id: string; name: string }>;
    };
    const stationsJson = JSON.parse(fs.readFileSync(stationsPath, 'utf8')) as StationsJson;
    return buildGameData(mapJson, stationsJson);
  } catch {
    return null;
  }
}

export async function fetchAndSaveGameData(dir: string): Promise<GameData> {
  const [mapRes, stationsRes] = await Promise.all([fetch(MAP_URL), fetch(STATIONS_URL)]);
  if (!mapRes.ok) throw new Error(`Failed to fetch map: ${mapRes.status}`);
  if (!stationsRes.ok) throw new Error(`Failed to fetch stations: ${stationsRes.status}`);

  const mapJson = (await mapRes.json()) as { systems?: Array<{ id: string; name: string }> };
  const stationsJson = (await stationsRes.json()) as StationsJson;

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'map.json'), JSON.stringify(mapJson, null, 2));
  fs.writeFileSync(path.join(dir, 'stations.json'), JSON.stringify(stationsJson, null, 2));

  return buildGameData(mapJson, stationsJson);
}

export function lookupSystemName(data: GameData | null, id: string): string {
  if (!data || !id) return id;
  return data.systems.get(id) ?? id;
}

/** Resolve a system name to its ID. Returns the input unchanged if already an ID or not found. */
export function resolveSystemId(data: GameData | null, nameOrId: string): string {
  if (!data || !nameOrId) return nameOrId;
  // Already an ID
  if (data.systems.has(nameOrId)) return nameOrId;
  // Resolve name -> id
  return data.systemsByName.get(nameOrId) ?? nameOrId;
}

export function lookupStationName(data: GameData | null, id: string): string {
  if (!data || !id) return id;
  return data.stations.get(id) ?? id;
}

export function lookupPoiDisplay(
  data: GameData | null,
  poiId: string,
  systemId?: string | null,
): string {
  if (!data || !poiId) return poiId;
  // 1. Station lookup
  const station = data.stations.get(poiId);
  if (station) return station;
  // 2. Strip system ID prefix (e.g. "sys_0326_belt_1" -> "belt_1")
  if (systemId && poiId.startsWith(systemId + '_')) {
    return poiId.slice(systemId.length + 1);
  }
  return poiId;
}
