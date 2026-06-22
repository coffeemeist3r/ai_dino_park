import { describe, it, expect } from 'vitest';
import { serialize, deserialize, SAVE_VERSION, type SaveData } from '../../game/src/world/saveGame';

const sample: SaveData = {
  version: SAVE_VERSION,
  time: { day: 3, hour: 21, minute: 14 },
  player: { x: 123.5, y: 456 },
  friendship: { Rex: 30 },
  memory: { Rex: ['said hello'] },
  bonds: { 'Mossback|Rex': 12 },
  gratitude: { Sunny: ['Twitch'] },
  lastTone: { Rex: 'warm' },
  zoneId: 'bowl',
  roles: {},
  dinoZones: { Mossback: 'grove' },
  gathered: {},
  stockpile: {},
  cairns: [],
  plot: null,
  harvested: 0,
  eggs: [
    { id: 'Mossback|Rex@3', parentA: 'Rex', parentB: 'Mossback', layedDay: 3, hatchDay: 6, tileX: 11, tileY: 11 },
  ],
  born: [
    {
      name: 'Rexback',
      species: 'triceratops',
      personality: 'young, warm, child of Rex and Mossback',
      traits: { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5 },
      color: 0x6a6242,
      tileX: 11,
      tileY: 11,
      parents: ['Rex', 'Mossback'],
    },
  ],
  savedAt: 1_717_290_000_000,
  scale: 60,
};

describe('saveGame', () => {
  it('round-trips serialize → deserialize exactly', () => {
    expect(deserialize(serialize(sample))).toEqual(sample);
  });

  it('returns null for malformed JSON (no throw)', () => {
    expect(deserialize('not json {')).toBeNull();
  });

  it('returns null for a non-object payload', () => {
    expect(deserialize('123')).toBeNull();
    expect(deserialize('null')).toBeNull();
  });

  it('returns null on version mismatch', () => {
    const bad = JSON.stringify({ ...sample, version: 0 });
    expect(deserialize(bad)).toBeNull();
  });

  it('returns null when player is missing', () => {
    const bad = JSON.stringify({ version: SAVE_VERSION, time: sample.time });
    expect(deserialize(bad)).toBeNull();
  });

  it('returns null when time has a non-numeric field', () => {
    const bad = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: '8', minute: 0 },
      player: { x: 0, y: 0 },
    });
    expect(deserialize(bad)).toBeNull();
  });

  it('loads an older save lacking savedAt/scale, defaulting scale to 1', () => {
    const old = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 1, y: 2 },
    });
    const out = deserialize(old);
    expect(out).not.toBeNull();
    expect(out!.scale).toBe(1);
    expect(out!.savedAt).toBeUndefined();
  });

  it('returns null for a present-but-non-numeric scale', () => {
    const bad = JSON.stringify({ ...sample, scale: 'fast' });
    expect(deserialize(bad)).toBeNull();
  });

  it('round-trips a gratitude ledger (BACKLOG-132)', () => {
    const withDebt: SaveData = { ...sample, gratitude: { Sunny: ['Twitch'], Glade: ['Rex', 'Mossback'] } };
    expect(deserialize(serialize(withDebt))).toEqual(withDebt);
  });

  it('loads an older save lacking gratitude, defaulting it to {} (BACKLOG-132)', () => {
    const old = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 1, y: 2 },
    });
    const out = deserialize(old);
    expect(out).not.toBeNull();
    expect(out!.gratitude).toEqual({});
  });

  it('returns null for a malformed gratitude value (BACKLOG-132)', () => {
    expect(deserialize(JSON.stringify({ ...sample, gratitude: { Rex: 5 } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...sample, gratitude: { Rex: [1] } }))).toBeNull();
  });

  it('round-trips a dinoZones map (BACKLOG-274)', () => {
    const withZones: SaveData = { ...sample, dinoZones: { Rex: 'grove', Sunny: 'bowl' } };
    expect(deserialize(serialize(withZones))).toEqual(withZones);
  });

  it('loads an older save lacking dinoZones, defaulting it to {} (BACKLOG-274)', () => {
    const old = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 1, y: 2 },
    });
    const out = deserialize(old);
    expect(out).not.toBeNull();
    expect(out!.dinoZones).toEqual({});
  });

  it('returns null for a malformed dinoZones value (BACKLOG-274)', () => {
    expect(deserialize(JSON.stringify({ ...sample, dinoZones: { Rex: 5 } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...sample, dinoZones: 'grove' }))).toBeNull();
  });

  it('round-trips a lastTone map (BACKLOG-142)', () => {
    const withTones: SaveData = { ...sample, lastTone: { Rex: 'warm', Mossback: 'tease', Glade: 'honest' } };
    expect(deserialize(serialize(withTones))).toEqual(withTones);
  });

  it('loads an older save lacking lastTone, defaulting it to {} (BACKLOG-142)', () => {
    const old = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 1, y: 2 },
    });
    const out = deserialize(old);
    expect(out).not.toBeNull();
    expect(out!.lastTone).toEqual({});
  });

  it('returns null for a malformed lastTone value (BACKLOG-142)', () => {
    expect(deserialize(JSON.stringify({ ...sample, lastTone: { Rex: 5 } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...sample, lastTone: { Rex: ['warm'] } }))).toBeNull();
  });

  it('round-trips a keeperId (BACKLOG-155)', () => {
    const withKeeper: SaveData = { ...sample, keeperId: 'vanta' };
    expect(deserialize(serialize(withKeeper))).toEqual(withKeeper);
  });

  it('loads an older save lacking keeperId, leaving it undefined (BACKLOG-155)', () => {
    const old = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 1, y: 2 },
    });
    const out = deserialize(old);
    expect(out).not.toBeNull();
    expect(out!.keeperId).toBeUndefined();
  });

  it('returns null for a malformed keeperId value (BACKLOG-155)', () => {
    expect(deserialize(JSON.stringify({ ...sample, keeperId: 7 }))).toBeNull();
  });

  it('round-trips a park stockpile (BACKLOG-285)', () => {
    const withStock: SaveData = { ...sample, stockpile: { branch: 3, stone: 1 } };
    expect(deserialize(serialize(withStock))).toEqual(withStock);
  });

  it('loads an older save lacking stockpile, defaulting it to {} (BACKLOG-285)', () => {
    const old = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 1, y: 2 },
    });
    const out = deserialize(old);
    expect(out).not.toBeNull();
    expect(out!.stockpile).toEqual({});
  });

  it('returns null for a malformed stockpile value (BACKLOG-285)', () => {
    expect(deserialize(JSON.stringify({ ...sample, stockpile: { branch: 'lots' } }))).toBeNull();
  });

  it('round-trips crafted cairns (BACKLOG-286)', () => {
    const withCairns: SaveData = { ...sample, cairns: [{ tileX: 5, tileY: 7 }, { tileX: 12, tileY: 3 }] };
    expect(deserialize(serialize(withCairns))).toEqual(withCairns);
  });

  it('loads an older save lacking cairns, defaulting it to [] (BACKLOG-286)', () => {
    const old = JSON.stringify({
      version: SAVE_VERSION,
      time: sample.time,
      player: sample.player,
    });
    const out = deserialize(old);
    expect(out).not.toBeNull();
    expect(out!.cairns).toEqual([]);
  });

  it('returns null for a malformed cairn entry (BACKLOG-286)', () => {
    expect(deserialize(JSON.stringify({ ...sample, cairns: [{ tileX: 5 }] }))).toBeNull();
  });

  it('round-trips a cairn home zone, and rejects a non-string zone (BACKLOG-308)', () => {
    const zoned: SaveData = { ...sample, cairns: [{ tileX: 5, tileY: 7, zone: 'grove' }] };
    expect(deserialize(serialize(zoned))).toEqual(zoned);
    // a pre-308 cairn (no zone) still loads — the scene backfills it to the bowl on restore.
    expect(deserialize(JSON.stringify({ ...sample, cairns: [{ tileX: 5, tileY: 7 }] }))).not.toBeNull();
    expect(deserialize(JSON.stringify({ ...sample, cairns: [{ tileX: 5, tileY: 7, zone: 9 }] }))).toBeNull();
  });

  it('round-trips a planted plot + harvest tally (BACKLOG-145)', () => {
    const withPlot: SaveData = { ...sample, plot: { plantedDay: 4 }, harvested: 3 };
    expect(deserialize(serialize(withPlot))).toEqual(withPlot);
  });

  it('loads an older save lacking plot/harvested, defaulting to null/0 (BACKLOG-145)', () => {
    const old = JSON.stringify({ version: SAVE_VERSION, time: sample.time, player: sample.player });
    const out = deserialize(old);
    expect(out).not.toBeNull();
    expect(out!.plot).toBeNull();
    expect(out!.harvested).toBe(0);
  });

  it('returns null for a malformed plot or negative harvest (BACKLOG-145)', () => {
    expect(deserialize(JSON.stringify({ ...sample, plot: { plantedDay: 'x' } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...sample, harvested: -1 }))).toBeNull();
  });
});
