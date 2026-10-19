import { describe, expect, it } from 'vitest';
import {
  CREEDS,
  HEED_BOND,
  SERVICE_HOUR,
  creedFor,
  faithBeat,
  faithBookLine,
  hearSermon,
  heardTicker,
  pickPreacher,
  serviceAttendees,
  serviceDue,
  type Faith,
} from './faith';
import { foundingBonds, foundingGrudges } from './founding';
import { ROSTER } from '../entities/roster';
import { seededPersonality } from '../ai/personality';
import { chronotypeOf, atRest } from './chronotype';
import { SAVE_VERSION, deserialize } from './saveGame';

const persona = (name: string) => ROSTER.find((r) => r.name === name)!.personality;

describe('the creed comes from the preacher’s persona (BACKLOG-030)', () => {
  it('matches keywords in table order, and falls back to the sky', () => {
    expect(creedFor(persona('Glade')).id).toBe('song');
    expect(creedFor(persona('Rex')).id).toBe('stones');
    expect(creedFor(persona('Ember')).id).toBe('sun');
    expect(creedFor(persona('Murk')).id).toBe('water');
    expect(creedFor(persona('Thornback')).id).toBe('old');
    expect(creedFor(persona('Twitch')).id).toBe('sky');
    expect(CREEDS[CREEDS.length - 1].match).toBeUndefined();
  });
});

describe('the first sermon on a fresh save (BACKLOG-030)', () => {
  const guests: Record<string, string> = { Bramble: 'grove', Pip: 'grove', Thornback: 'fernreach', Murk: 'hollow', Ember: 'ridge' };
  const names = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade', ...Object.keys(guests)];
  // The festival closes at noon in spring on day one.
  const awake = (n: string) => !atRest(12, chronotypeOf(seededPersonality(n)), 'spring');

  it('Glade preaches: the more curious owls are asleep at noon, and guests are not the host', () => {
    const cands = names.map((n) => ({ name: n, curiosity: seededPersonality(n).curiosity, awake: awake(n), home: guests[n] ?? 'bowl' }));
    expect(pickPreacher(cands, 'bowl')).toBe('Glade');
    expect(pickPreacher(cands.map((c) => ({ ...c, awake: false })), 'bowl')).toBeNull();
  });

  it('love believes, a grudge against a believer scoffs, the rest are unmoved', () => {
    const hearers = names.filter(awake);
    expect(hearers.sort()).toEqual(['Bramble', 'Glade', 'Mossback', 'Murk', 'Sunny', 'Twitch']);
    const h = hearSermon('Glade', hearers, foundingBonds(), foundingGrudges());
    expect(h.believers.sort()).toEqual(['Mossback', 'Murk', 'Sunny']);
    expect(h.scoffers).toEqual({ Twitch: 'Mossback' });
    expect(h.unmoved).toEqual(['Bramble']);
    expect(heardTicker('Glade', creedFor(persona('Glade')), h)).toContain('believe Glade. Twitch scoffs.');
  });

  it('the bond bar is the friend line, not a coin', () => {
    expect(HEED_BOND).toBe(10);
    const h = hearSermon('A', ['B', 'C'], { 'A|B': 10, 'A|C': 9.9 }, {});
    expect(h.believers).toEqual(['B']);
    expect(h.unmoved).toEqual(['C']);
  });
});

const faith: Faith = { creed: 'song', preacher: 'Glade', zone: 'bowl', tileX: 6, tileY: 4, day: 1, believers: ['Mossback', 'Sunny'], scoffers: { Twitch: 'Mossback', Rex: 'Glade' } };

describe('the faith in the book (BACKLOG-030)', () => {
  it('preacher, believer, scoffer — and nothing for anyone else', () => {
    expect(faithBookLine(faith, 'Glade')).toBe('🎶 preaches the song under the grass (since day 1)');
    expect(faithBookLine(faith, 'Sunny')).toBe("🎶 follows Glade's word: the song under the grass");
    expect(faithBookLine(faith, 'Twitch')).toBe("🙄 won't hear Glade's song — not where Mossback goes");
    expect(faithBookLine(faith, 'Rex')).toBe("🙄 won't hear Glade's song");
    expect(faithBookLine(faith, 'Bramble')).toBeUndefined();
    expect(faithBookLine(null, 'Glade')).toBeUndefined();
  });

  it('the creed glyph shows one idle beat in five', () => {
    expect([0, 1, 2, 3, 4, 7, 12].map(faithBeat)).toEqual([false, false, true, false, false, true, true]);
  });
});

describe('the faithful keep an hour (BACKLOG-613)', () => {
  it('due once a day in the service hour, never before the sermon day', () => {
    expect(SERVICE_HOUR).toBe(16);
    expect(serviceDue({ day: 1, hour: 16, minute: 5 }, faith)).toBe(true);
    expect(serviceDue({ day: 1, hour: 15, minute: 59 }, faith)).toBe(false);
    expect(serviceDue({ day: 1, hour: 16, minute: 5 }, { ...faith, lastServiceDay: 1 })).toBe(false);
    expect(serviceDue({ day: 2, hour: 16, minute: 0 }, { ...faith, lastServiceDay: 1 })).toBe(true);
    expect(serviceDue({ day: 1, hour: 16, minute: 0 }, { ...faith, day: 2 })).toBe(false);
    expect(serviceDue({ day: 1, hour: 16, minute: 0 }, null)).toBe(false);
  });

  it('the flock on the faith’s ground, awake and settled — nobody else', () => {
    const p = (name: string, zone = 'bowl', awake = true, migrating = false) => ({ name, zone, awake, migrating });
    expect(serviceAttendees(faith, [p('Glade'), p('Mossback'), p('Sunny', 'grove'), p('Twitch'), p('Rex')])).toEqual(['Glade', 'Mossback']);
    expect(serviceAttendees(faith, [p('Glade', 'bowl', false), p('Mossback', 'bowl', true, true), p('Sunny')])).toEqual(['Sunny']);
  });

  it('round-trips in the save; a malformed faith is a corrupt save; none is fine', () => {
    const base = { version: SAVE_VERSION, time: { day: 1, hour: 8, minute: 0 }, player: { x: 10, y: 10 }, friendship: {}, memory: {} };
    expect(deserialize(JSON.stringify({ ...base, faith: { ...faith, lastServiceDay: 1 } }))?.faith).toEqual({ ...faith, lastServiceDay: 1 });
    expect(deserialize(JSON.stringify({ ...base, faith: { ...faith, creed: 'moon' } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, faith: { ...faith, believers: [3] } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, faith: { ...faith, scoffers: { Twitch: 1 } } }))).toBeNull();
    const none = deserialize(JSON.stringify(base));
    expect(none).not.toBeNull();
    expect(none!.faith).toBeUndefined();
  });
});
