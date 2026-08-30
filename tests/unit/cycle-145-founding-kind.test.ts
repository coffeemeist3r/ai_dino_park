/**
 * BACKLOG-516 — a place you were born and a place you walked to.
 *
 * 512 gave five grounds a recorded founder overnight and rendered every one of them with the sentence 343
 * wrote for an arrival, so on the first frame of every save the book said "first across into the Grove"
 * under a dino that has never crossed anything. These tests pin the distinction rather than the wording:
 * that the *kind* is derived from the founding roster, that both kinds are reachable in the shipping park,
 * and that the fold in `standings.ts` is the only place either sentence is chosen.
 */

import { describe, it, expect } from 'vitest';
import { foundingKind, foundingPioneers, foundingResidents } from '../../game/src/world/founding';
import { pioneerLine, recordPioneer, type Pioneers } from '../../game/src/world/pioneer';
import { zoneStandings, standingLine, standingLines } from '../../game/src/world/standings';
import { BOWL_ID, GROVE_ID, SALTPAN_ID, zoneChain } from '../../game/src/world/zones';

describe('foundingKind (BACKLOG-516)', () => {
  const founding = foundingPioneers();

  it('calls every founding the roster wakes into `born`', () => {
    for (const zone of Object.keys(founding)) {
      expect(foundingKind(founding, zone), zone).toBe('born');
    }
  });

  it('calls a dino that walked in `crossed`, on the one ground where that can still happen', () => {
    const map: Pioneers = { ...founding };
    expect(map[SALTPAN_ID]).toBeUndefined(); // the park's one frontier — 505
    recordPioneer(map, SALTPAN_ID, 'Twitch');
    expect(foundingKind(map, SALTPAN_ID)).toBe('crossed');
  });

  it('calls it `crossed` when somebody other than the roster founder holds the record', () => {
    // A pre-512 save that recorded a real arrival keeps that name (first-write-wins), and it was a crossing.
    const map: Pioneers = { [GROVE_ID]: 'Mossback' };
    expect(founding[GROVE_ID]).not.toBe('Mossback');
    expect(foundingKind(map, GROVE_ID)).toBe('crossed');
  });

  it('answers `crossed` for a ground nobody has founded — the only way it can ever gain one', () => {
    expect(foundingKind({}, SALTPAN_ID)).toBe('crossed');
  });
});

describe('the two sentences', () => {
  it('says the ground has always been theirs, and routes the name through theZone (499)', () => {
    expect(pioneerLine(GROVE_ID, 'born')).toBe('has been in the Grove since the first morning');
    expect(pioneerLine(GROVE_ID, 'born')).not.toContain('The Grove');
    expect(pioneerLine(SALTPAN_ID, 'crossed')).toContain('first across into');
  });

  it('never says a crossing happened where none did', () => {
    expect(pioneerLine(BOWL_ID, 'born')).not.toContain('first across');
  });
});

describe('the book on a brand-new save', () => {
  const founding = foundingPioneers();
  const standings = zoneStandings([], founding);

  it('carries the kind on the standing, so no consumer re-derives it', () => {
    const pioneers = standings.filter((s) => s.kind === 'pioneer');
    expect(pioneers.length).toBeGreaterThan(0);
    for (const s of pioneers) expect(s.via, s.zone).toBe('born');
  });

  it('renders a founding line for every ground the roster wakes on, and says none of them crossed', () => {
    const inhabited = Object.entries(foundingResidents()).filter(([, n]) => n.length);
    const lines = standings.filter((s) => s.kind === 'pioneer').map((s) => standingLine(s));
    expect(lines).toHaveLength(inhabited.length);
    for (const l of lines) {
      expect(l).toContain('since the first morning');
      expect(l).not.toContain('first across');
    }
  });

  it("puts the line on the founder's own block and nobody else's", () => {
    const founder = founding[GROVE_ID];
    expect(standingLines(standings, founder).join('\n')).toContain('since the first morning');
    const stranger = zoneChain().length ? 'NotADino' : 'NotADino';
    expect(standingLines(standings, stranger)).toEqual([]);
  });

  it('turns to the crossing wording the moment somebody founds the frontier', () => {
    const map: Pioneers = { ...founding };
    recordPioneer(map, SALTPAN_ID, 'Twitch');
    const after = zoneStandings([], map);
    const line = standingLine(after.find((s) => s.zone === SALTPAN_ID && s.kind === 'pioneer')!);
    expect(line).toBe('first across into the Saltpan');
    // and it is the only such line in the park — the distinction is earned, not decorative.
    const all = after.filter((s) => s.kind === 'pioneer').map((s) => standingLine(s)!);
    expect(all.filter((l) => l.includes('first across'))).toHaveLength(1);
  });
});
