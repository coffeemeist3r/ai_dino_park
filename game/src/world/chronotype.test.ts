import { describe, it, expect } from 'vitest';
import { seededPersonality } from '../ai/personality';
import { ROSTER } from '../entities/roster';
import { SEASON_HUDDLE } from './huddle';
import type { Season } from './seasons';
import {
  owlishness,
  chronotypeOf,
  restWindow,
  atRest,
  awakeAtNight,
  chronotypeLine,
  OWL_BAR,
  OWL_SHIFT,
  wakingIn,
  watchersIn,
  dayStanding,
  type Resident,
} from './chronotype';
import { BOWL_ID } from './zones';

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
const typeOf = (name: string) => chronotypeOf(seededPersonality(name));

describe('BACKLOG-109 — the derivation', () => {
  it('splits the ten roster names 4 owls / 6 day-dinos', () => {
    const owls = ROSTER.filter((r) => typeOf(r.name) === 'owl').map((r) => r.name);
    expect(owls.sort()).toEqual(['Ember', 'Pip', 'Rex', 'Thornback']);
    expect(ROSTER.length - owls.length).toBe(6);
  });

  it('puts an owl in the founding park, on the ground a fresh save opens on', () => {
    // The reachability constraint, asserted over the live roster rather than over a literal: a fresh save
    // opens in the Bowl at 08:00, and if every Bowl dino were a day-dino the split would be invisible for
    // the first twelve real minutes — outside the ten-minute bar. CHARTER v7's corollary, pinned.
    const bowl = ROSTER.filter((r) => !r.zone);
    expect(bowl.length).toBeGreaterThan(0);
    expect(bowl.some((r) => typeOf(r.name) === 'owl')).toBe(true);
  });

  it('clears the bar with a real margin on both sides — no roster dino is a coin flip', () => {
    for (const r of ROSTER) {
      expect(Math.abs(owlishness(seededPersonality(r.name)) - OWL_BAR)).toBeGreaterThan(0.04);
    }
  });

  it('is deterministic and model-free — same name, same answer', () => {
    expect(typeOf('Rex')).toBe('owl');
    expect(typeOf('Sunny')).toBe('day');
    expect(typeOf('Rex')).toBe(typeOf('Rex'));
  });
});

describe('BACKLOG-109 — the windows', () => {
  it('leaves a day-dino on the season table exactly', () => {
    for (const s of SEASONS) {
      expect(restWindow('day', s)).toEqual({ start: SEASON_HUDDLE[s].start, end: SEASON_HUDDLE[s].end });
    }
  });

  it('shifts an owl by OWL_SHIFT hours, every season', () => {
    for (const s of SEASONS) {
      expect(restWindow('owl', s)).toEqual({
        start: (SEASON_HUDDLE[s].start + OWL_SHIFT) % 24,
        end: (SEASON_HUDDLE[s].end + OWL_SHIFT) % 24,
      });
    }
  });

  it('keeps the legacy night window when no season is given', () => {
    expect(restWindow('day')).toEqual({ start: 21, end: 5 });
  });

  it('has the owl down at the hour a fresh save opens, and the day-dino up', () => {
    expect(atRest(8, 'owl', 'spring')).toBe(true);
    expect(atRest(8, 'day', 'spring')).toBe(false);
  });

  it('has the day-dino down at night, and the owl up', () => {
    expect(atRest(23, 'day', 'spring')).toBe(true);
    expect(atRest(23, 'owl', 'spring')).toBe(false);
  });

  it('overlaps — the two halves of the cast are awake together for part of the day', () => {
    const both = [...Array(24).keys()].filter((h) => !atRest(h, 'day', 'spring') && !atRest(h, 'owl', 'spring'));
    expect(both.length).toBeGreaterThan(0);
  });

  it('only ever calls an owl awake at night', () => {
    for (let h = 0; h < 24; h++) expect(awakeAtNight(h, 'day', 'spring')).toBe(false);
    expect([...Array(24).keys()].some((h) => awakeAtNight(h, 'owl', 'spring'))).toBe(true);
  });
});

describe('BACKLOG-109 — the book standing', () => {
  it('names both hours', () => {
    expect(chronotypeLine('owl')).toBe('keeps late hours');
    expect(chronotypeLine('day')).toBe('up with the sun');
  });
});

/** The shipping cast, as the world hands it over — the source of truth for every roster assertion below. */
const rosterRows = (): Resident[] =>
  ROSTER.map((r) => ({ name: r.name, zone: r.zone ?? BOWL_ID, traits: seededPersonality(r.name) }));

describe('BACKLOG-524 — the night shift', () => {
  it('counts only the residents that are up, and keeps a sleeping ground at zero rather than absent', () => {
    const rows: Resident[] = [
      { name: 'Rex', zone: 'bowl', traits: seededPersonality('Rex') }, // owl
      { name: 'Sunny', zone: 'bowl', traits: seededPersonality('Sunny') }, // day
      { name: 'Ember', zone: 'ridge', traits: seededPersonality('Ember') }, // owl, alone
    ];
    const at8 = wakingIn(rows, 8, 'spring');
    expect(at8.bowl).toBe(1); // Sunny up, Rex down
    // The distinction the caller depends on: a ground whose cast is asleep must read 0, not undefined —
    // "its cast is asleep" and "nobody lives here" are different grounds with different reasons to be idle.
    expect(at8.ridge).toBe(0);
    expect('ridge' in at8).toBe(true);
  });

  it('the founding park has two grounds with a resident and nobody awake at the hour a save opens on', () => {
    // Derived from the live roster, not from a table: if the spawn zones or the trait seeds move, this
    // assertion moves with them and the reachability answer has to be re-earned rather than assumed.
    const at8 = wakingIn(rosterRows(), 8, 'spring');
    const asleep = Object.entries(at8)
      .filter(([, n]) => n === 0)
      .map(([z]) => z)
      .sort();
    expect(asleep).toEqual(['fernreach', 'ridge']);
    expect(at8.bowl).toBe(4);
    expect(at8.grove).toBe(1);
    expect(at8.hollow).toBe(1);
  });

  it('and both of them are working again by 13:00 — inside the ten-minute bar at ACTIVE_SCALE', () => {
    const at13 = wakingIn(rosterRows(), 13, 'spring');
    expect(at13.fernreach).toBe(1);
    expect(at13.ridge).toBe(1);
    expect(Object.values(at13).every((n) => n > 0)).toBe(true);
  });

  it('names the lone waker of a sleeping ground, and nobody otherwise', () => {
    const two = (aZone: string) => [
      { name: 'Bramble', zone: aZone, traits: seededPersonality('Bramble') }, // day
      { name: 'Pip', zone: aZone, traits: seededPersonality('Pip') }, // owl
    ];
    expect(watchersIn(two('grove'), 8, 'spring')).toEqual(['Bramble']); // Pip is down
    expect(watchersIn(two('grove'), 16, 'spring')).toEqual([]); // both up — nobody is keeping watch
    // ...and at three in the morning the pair has swapped: the owl is the one keeping the watch. This is
    // the beat being about the *hour* rather than about a trait — the same ground, both dinos, either role.
    expect(watchersIn(two('grove'), 3, 'spring')).toEqual(['Pip']);
  });

  it('a solo resident is never a watcher — there is nobody to keep watch over', () => {
    const solo: Resident[] = [{ name: 'Murk', zone: 'hollow', traits: seededPersonality('Murk') }];
    expect(watchersIn(solo, 12, 'spring')).toEqual([]);
    expect(watchersIn(solo, 2, 'spring')).toEqual([]);
  });

  it('the founding park has exactly one watcher on frame one, and it is the Grove', () => {
    expect(watchersIn(rosterRows(), 8, 'spring')).toEqual(['Bramble']);
  });
});

describe('BACKLOG-110/-279 — where a dino stands in its own day', () => {
  const day = chronotypeOf(seededPersonality('Sunny'));
  const owl = chronotypeOf(seededPersonality('Rex'));

  it('a dino greeted inside its own rest window is roused, whichever chronotype it keeps', () => {
    expect(dayStanding(2, day, 'spring')).toBe('roused');
    expect(dayStanding(8, owl, 'spring')).toBe('roused');
    for (const s of SEASONS) {
      const w = restWindow(day, s);
      expect(dayStanding(w.start, day, s)).toBe('roused');
    }
  });

  it('at the hour a save opens on, a day-dino is fresh and the owl is roused', () => {
    // Asserted through the window rather than against the literal 8: `fresh` covers the first quarter of
    // the waking span, and a spring day-dino wakes at SEASON_HUDDLE.spring.end. If that moves, so does this.
    const wake = SEASON_HUDDLE.spring.end;
    expect(wake).toBeLessThanOrEqual(8);
    expect(dayStanding(8, day, 'spring')).toBe('fresh');
    expect(dayStanding(8, owl, 'spring')).toBe('roused');
  });

  it('the quarters are derived from the rest window, not from an hour somebody picked', () => {
    // The owl's window is the day-dino's shifted by OWL_SHIFT, so its `fresh` stretch is too — exactly.
    const wake = SEASON_HUDDLE.spring.end;
    const owlWake = (wake + OWL_SHIFT) % 24;
    expect(dayStanding(wake, day, 'spring')).toBe('fresh');
    expect(dayStanding(owlWake, owl, 'spring')).toBe('fresh');
    // ...and the day-dino is emphatically not fresh at the owl's waking hour.
    expect(dayStanding(owlWake, day, 'spring')).not.toBe('fresh');
  });

  it('says nothing mid-span, so the hour is a tell and not a tic on every greeting', () => {
    expect(dayStanding(13, day, 'spring')).toBe(null);
    expect(dayStanding(17, owl, 'spring')).toBe(null);
  });

  it('winds down in the last quarter of the waking span', () => {
    expect(dayStanding(20, day, 'spring')).toBe('waning');
  });

  it('being up at midnight beats being late in your day — both hold, the more specific one wins', () => {
    // 03:00 is inside the owl's last quarter (it wakes at 13:00, sleeps at 05:00) *and* the park is dark.
    const w = restWindow(owl, 'spring');
    const span = (((w.start - w.end) % 24) + 24) % 24;
    const awakeFor = (((3 - w.end) % 24) + 24) % 24;
    expect(awakeFor).toBeGreaterThanOrEqual(span - span / 4); // it qualifies as waning
    expect(dayStanding(3, owl, 'spring')).toBe('nightlong'); // and reads as nightlong anyway
  });

  it('never contradicts atRest — a standing and a sleeping dino are the same read', () => {
    for (const s of SEASONS) {
      for (let h = 0; h < 24; h++) {
        for (const c of [day, owl]) {
          expect(dayStanding(h, c, s) === 'roused').toBe(atRest(h, c, s));
        }
      }
    }
  });
});
