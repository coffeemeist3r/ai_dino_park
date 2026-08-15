import { describe, it, expect } from 'vitest';
import { recordPioneer, pioneerOf, pioneerLine, pioneerEvent, foundedBy } from '../../game/src/world/pioneer';
import { BOWL_ID, GROVE_ID, HOLLOW_ID } from '../../game/src/world/zones';
import { bookLines, type BookRow } from '../../game/src/ui/lenses';

/**
 * First across (BACKLOG-343) — the single first name ever to set foot in each zone. 339 keeps the list of
 * everyone who has visited the grove; this is the scarcer fact under it, and the one that can only ever
 * happen once per ground.
 */

const row = (name: string, extra: Partial<BookRow> = {}): BookRow => ({
  name,
  species: 'triceratops',
  hearts: 3,
  topBond: 10,
  role: 'none',
  rumorsHeard: 0,
  ...extra,
});

describe('recordPioneer (BACKLOG-343)', () => {
  it('records the first arrival and reports that it founded the ground', () => {
    const map = {};
    expect(recordPioneer(map, GROVE_ID, 'Mossback')).toBe(true);
    expect(pioneerOf(map, GROVE_ID)).toBe('Mossback');
  });

  it('never overwrites: a later arrival does not take the founding, and a re-entry does not re-fire', () => {
    const map = {};
    recordPioneer(map, GROVE_ID, 'Mossback');
    expect(recordPioneer(map, GROVE_ID, 'Sunny')).toBe(false);
    expect(recordPioneer(map, GROVE_ID, 'Mossback')).toBe(false);
    expect(pioneerOf(map, GROVE_ID)).toBe('Mossback');
  });

  it('leaves a ground nobody has entered unfounded — including the bowl, where the cast began', () => {
    const map = {};
    recordPioneer(map, GROVE_ID, 'Mossback');
    expect(pioneerOf(map, BOWL_ID)).toBeUndefined();
    expect(pioneerOf(map, HOLLOW_ID)).toBeUndefined();
  });

  it('tracks each ground separately', () => {
    const map = {};
    recordPioneer(map, GROVE_ID, 'Mossback');
    recordPioneer(map, HOLLOW_ID, 'Twitch');
    expect(foundedBy(map, 'Mossback')).toBe(GROVE_ID);
    expect(foundedBy(map, 'Twitch')).toBe(HOLLOW_ID);
    expect(foundedBy(map, 'Sunny')).toBeUndefined();
  });
});

describe('the lines it reads as (BACKLOG-343)', () => {
  it('names the zone in the book line and the ticker beat', () => {
    expect(pioneerLine(GROVE_ID)).toBe('first across into The Grove');
    expect(pioneerEvent(GROVE_ID, 'Mossback')).toContain('🚩');
    expect(pioneerEvent(GROVE_ID, 'Mossback')).toContain('Mossback');
    expect(pioneerEvent(GROVE_ID, 'Mossback')).toContain('The Grove');
  });

  it('shows in the collection book on the pioneer’s block and on no other', () => {
    const lines = bookLines([row('Mossback', { standings: [pioneerLine(GROVE_ID)] }), row('Sunny')]).join('\n');
    expect(lines).toContain('first across into The Grove');
    expect(lines.match(/first across/g)).toHaveLength(1);
  });

  it('is absent from a row that never founded anything (an old BookRow literal stays valid)', () => {
    expect(bookLines([row('Sunny')]).join('\n')).not.toContain('first across');
  });
});

describe('the fourth ground is founded with no code written for it (BACKLOG-343 × 472)', () => {
  it('records and renders the Hollow through exactly the same path as the grove', () => {
    const map = {};
    expect(recordPioneer(map, HOLLOW_ID, 'Twitch')).toBe(true);
    expect(pioneerLine(HOLLOW_ID)).toBe('first across into The Hollow');
    expect(bookLines([row('Twitch', { standings: [pioneerLine(HOLLOW_ID)] })]).join('\n')).toContain(
      'first across into The Hollow',
    );
  });
});
