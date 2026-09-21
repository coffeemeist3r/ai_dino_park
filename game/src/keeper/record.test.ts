import { describe, it, expect } from 'vitest';
import { newRecord, switchTo, recordFrom, tenureLine, type KeeperRecord } from './record';
import { KEEPERS, DEFAULT_KEEPER_ID, keeperById } from './keepers';

// BACKLOG-555 — the watcher's record. Pure, so the whole contract is testable in Node.

describe('newRecord', () => {
  it('is this observer, chosen today, never switched', () => {
    const rec = newRecord('aether', 1);
    expect(rec).toEqual({ id: 'aether', sinceDay: 1, switches: 0 });
    expect(rec.previousId).toBeUndefined();
  });
});

describe('switchTo', () => {
  it('bumps the count, files the outgoing id, and restarts the tenure', () => {
    const rec = switchTo(newRecord('aether', 1), 'vanta', 3);
    expect(rec).toEqual({ id: 'vanta', sinceDay: 3, switches: 1, previousId: 'aether' });
  });

  it('files the *immediately* previous id, not the original one', () => {
    const rec = switchTo(switchTo(newRecord('aether', 1), 'vanta', 3), 'lumen', 6);
    expect(rec.switches).toBe(2);
    expect(rec.previousId).toBe('vanta');
    expect(rec.sinceDay).toBe(6);
  });

  // The BACKLOG-156 trap: a cached persona belongs to the observer it was authored for, not to the
  // seat. Carrying it across a switch would show you Aki's authored self while wearing Vix.
  it('drops the persona cache', () => {
    const worn: KeeperRecord = {
      ...newRecord('aether', 1),
      persona: { text: 'a diplomat retired after the Quiet Accord', source: 'llm' },
    };
    expect(switchTo(worn, 'vanta', 2).persona).toBeUndefined();
  });

  it('does not mutate its input', () => {
    const before = newRecord('aether', 1);
    const copy = { ...before };
    switchTo(before, 'vanta', 3);
    expect(before).toEqual(copy);
  });
});

describe('recordFrom — the additive load seed', () => {
  it('seeds from a bare keeperId when no record was saved', () => {
    expect(recordFrom(undefined, 'lumen', 5)).toEqual({ id: 'lumen', sinceDay: 5, switches: 0 });
  });

  it('seeds from the default observer when neither was saved', () => {
    expect(recordFrom(undefined, undefined, 5).id).toBe(DEFAULT_KEEPER_ID);
  });

  it('returns a saved record untouched — the record wins over the bare id', () => {
    const saved = switchTo(newRecord('aether', 1), 'kestrel', 4);
    expect(recordFrom(saved, 'aether', 99)).toBe(saved);
  });
});

describe('tenureLine', () => {
  it('names the observer and the day it was chosen, and says nothing about a count', () => {
    const line = tenureLine(newRecord('aether', 1), keeperById('aether'));
    expect(line).toContain('AETHER-1');
    expect(line).toContain('since day 1');
    expect(line).not.toContain('watcher');
  });

  it('counts the watchers once one has actually changed', () => {
    let rec = switchTo(newRecord('aether', 1), 'vanta', 3);
    expect(tenureLine(rec, keeperById('vanta'))).toContain('2nd watcher');
    rec = switchTo(rec, 'lumen', 4);
    expect(tenureLine(rec, keeperById('lumen'))).toContain('3rd watcher');
    rec = switchTo(rec, 'kestrel', 5);
    expect(tenureLine(rec, keeperById('kestrel'))).toContain('4th watcher');
  });

  it('keeps the teens on "th" rather than the naive suffix', () => {
    let rec = newRecord('aether', 1);
    for (let i = 0; i < 11; i++) rec = switchTo(rec, 'aether', 1); // switches = 11 → "12th"
    expect(tenureLine(rec, keeperById('aether'))).toContain('12th watcher');
    rec = { ...rec, switches: 12 }; // → "13th"
    expect(tenureLine(rec, keeperById('aether'))).toContain('13th watcher');
    rec = { ...rec, switches: 20 }; // → "21st"
    expect(tenureLine(rec, keeperById('aether'))).toContain('21st watcher');
  });

  it('produces a non-empty line for every observer on the roster', () => {
    for (const k of KEEPERS) {
      expect(tenureLine(newRecord(k.id, 1), k)).toContain(k.name);
    }
  });
});
