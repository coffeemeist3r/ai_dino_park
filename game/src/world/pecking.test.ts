import { describe, it, expect } from 'vitest';
import {
  peckingScore,
  dispositionToward,
  holdsAgainst,
  peckingLine,
  givesBerthTo,
  becauseOf,
  showsMercyTo,
  mercyMemory,
  sparedMemory,
  mercyLine,
  peckingRead,
  MERCY_AGREE,
  PECKING_BAR,
  PECKING_MIN_BEATS,
} from './pecking';
import { standsGround, slunkOffMemory, WELL_FED, GOBBLE_HUNGER } from './feeding';

// The memory strings are built the way WorldScene builds them, never re-typed (the cycle-127 finding:
// a spec that re-types the string it matches lets a reword silently empty the read).
const stood = (n: string) => `you stood your ground and kept your food from ${n}`;
const snatched = (n: string) => `you shouldered past ${n} and snatched the food first`;
const steppedBack = (n: string) => `you stepped back and let ${n} eat first`;
const slunk = (n: string) => slunkOffMemory(n);

describe('peckingScore', () => {
  it('is zero for an empty ring and for a dino that never appears', () => {
    expect(peckingScore([], 'Rex')).toBe(0);
    expect(peckingScore([stood('Sunny')], 'Rex')).toBe(0);
  });

  it('weighs a stand above a snatch, and a slink below a step-back', () => {
    expect(peckingScore([stood('Rex')], 'Rex')).toBe(2);
    expect(peckingScore([snatched('Rex')], 'Rex')).toBe(1);
    expect(peckingScore([steppedBack('Rex')], 'Rex')).toBe(-1);
    expect(peckingScore([slunk('Rex')], 'Rex')).toBe(-2);
  });

  it('keeps opponents apart', () => {
    const ring = [stood('Rex'), stood('Rex'), slunk('Sunny')];
    expect(peckingScore(ring, 'Rex')).toBe(4);
    expect(peckingScore(ring, 'Sunny')).toBe(-2);
  });
});

describe('dispositionToward', () => {
  it('is null on an empty ring and on a single beat of any kind', () => {
    expect(dispositionToward([], 'Rex')).toBeNull();
    expect(dispositionToward([snatched('Rex')], 'Rex')).toBeNull();
    expect(dispositionToward([steppedBack('Rex')], 'Rex')).toBeNull();
  });

  it('turns confident on two stands and wary on two slinks', () => {
    expect(dispositionToward([stood('Rex'), stood('Rex')], 'Rex')).toBe('confident');
    expect(dispositionToward([slunk('Rex'), slunk('Rex')], 'Rex')).toBe('wary');
  });

  it('reads per opponent, not per dino', () => {
    const ring = [stood('Rex'), stood('Rex'), slunk('Sunny'), slunk('Sunny')];
    expect(dispositionToward(ring, 'Rex')).toBe('confident');
    expect(dispositionToward(ring, 'Sunny')).toBe('wary');
    expect(dispositionToward(ring, 'Mossback')).toBeNull();
  });

  it('lets a yield tilt but never decide: it takes slinks to make a dino wary of one it also faced down', () => {
    expect(dispositionToward([steppedBack('Rex'), stood('Rex')], 'Rex')).toBeNull();
    expect(dispositionToward([slunk('Rex'), stood('Rex')], 'Rex')).toBeNull();
    expect(dispositionToward([slunk('Rex'), slunk('Rex'), stood('Rex')], 'Rex')).toBe('wary');
  });

  it('holds one beat back by beat count, not by weight — a lone stand already weighs the bar', () => {
    expect(PECKING_BAR).toBe(2);
    expect(peckingScore([stood('Rex')], 'Rex')).toBeGreaterThanOrEqual(PECKING_BAR);
    expect(dispositionToward([stood('Rex')], 'Rex')).toBeNull();
    expect(PECKING_MIN_BEATS).toBe(2);
  });
});

describe('holdsAgainst', () => {
  it('with no disposition is exactly the pre-401 bravery rule, across the range', () => {
    for (let b = 0; b <= 1.0001; b += 0.05) {
      expect(holdsAgainst(b, null)).toBe(standsGround(b));
    }
  });

  it('history outranks temperament in both directions', () => {
    const timid = 0;
    const bold = 1;
    expect(standsGround(timid)).toBe(false);
    expect(standsGround(bold)).toBe(true);
    expect(holdsAgainst(timid, 'confident')).toBe(true);
    expect(holdsAgainst(bold, 'wary')).toBe(false);
  });
});

describe('peckingLine', () => {
  const roster = ['Rex', 'Sunny', 'Mossback', 'Twitch'];

  it('is null when no disposition clears the bar', () => {
    expect(peckingLine([], roster)).toBeNull();
    expect(peckingLine([stood('Rex')], roster)).toBeNull();
  });

  it('names both sides when both exist', () => {
    const ring = [stood('Rex'), stood('Rex'), slunk('Sunny'), slunk('Sunny')];
    expect(peckingLine(ring, roster)).toBe('👊 pecking order: faced down Rex · wary of Sunny');
  });

  it('caps each side at two names, strongest first', () => {
    const ring = [
      stood('Rex'),
      stood('Rex'),
      stood('Rex'),
      stood('Sunny'),
      stood('Sunny'),
      stood('Mossback'),
      stood('Mossback'),
    ];
    const line = peckingLine(ring, roster)!;
    expect(line).toContain('faced down Rex & ');
    expect(line.split('&').length).toBe(2); // exactly two names, so exactly one ampersand
  });

  it('only ever names dinos on the live roster', () => {
    expect(peckingLine([slunk('Ghost'), slunk('Ghost')], roster)).toBeNull();
  });
});

describe('becauseOf', () => {
  it('says which history decided it', () => {
    expect(becauseOf('confident', 'Rex')).toBe(' — it has faced Rex down before');
    expect(becauseOf('wary', 'Rex')).toBe(' — Rex has beaten it here before');
  });
});

describe('givesBerthTo (BACKLOG-389)', () => {
  const wary = [slunk('Rex'), slunk('Rex')]; // two lost contests with Rex → wary of Rex

  it('yields no berth on an empty history — a fresh park is inert', () => {
    expect(givesBerthTo([], ['Rex', 'Sunny'])).toBeNull();
  });

  it('names the rival it is wary of when that rival is already nearer the food', () => {
    expect(givesBerthTo(wary, ['Rex'])).toBe('Rex');
  });

  it('gives no berth when the feared rival is not among the nearer dinos', () => {
    expect(givesBerthTo(wary, ['Sunny', 'Mossback'])).toBeNull();
  });

  it('never gives a berth to a dino it is confident against', () => {
    const bold = [stood('Rex'), stood('Rex')];
    expect(dispositionToward(bold, 'Rex')).toBe('confident');
    expect(givesBerthTo(bold, ['Rex'])).toBeNull();
  });

  it('keeps clear of the most feared of several nearer rivals', () => {
    const ring = [slunk('Rex'), slunk('Rex'), steppedBack('Sunny'), steppedBack('Sunny')];
    expect(dispositionToward(ring, 'Sunny')).toBe('wary'); // both qualify...
    expect(givesBerthTo(ring, ['Sunny', 'Rex'])).toBe('Rex'); // ...Rex reads worse (-4 vs -2)
  });

  it('breaks an exact tie lexicographically, like every other deterministic pick here', () => {
    const ring = [slunk('Rex'), slunk('Rex'), slunk('Ash'), slunk('Ash')];
    expect(peckingScore(ring, 'Rex')).toBe(peckingScore(ring, 'Ash'));
    expect(givesBerthTo(ring, ['Rex', 'Ash'])).toBe('Ash');
  });

  it('is filtered through the disposition, not the raw score: one bad drop is not a berth', () => {
    const once = [slunk('Rex')]; // score -2 clears PECKING_BAR, but it is one beat
    expect(peckingScore(once, 'Rex')).toBe(-PECKING_BAR);
    expect(dispositionToward(once, 'Rex')).toBeNull(); // PECKING_MIN_BEATS
    expect(givesBerthTo(once, ['Rex'])).toBeNull();
  });

  it('gives no berth when a snatch is answered by a stand — a mixed history is not fear', () => {
    const even = [slunk('Rex'), stood('Rex')];
    expect(dispositionToward(even, 'Rex')).toBeNull();
    expect(givesBerthTo(even, ['Rex'])).toBeNull();
  });
});

/**
 * Victor's mercy (BACKLOG-403) — the confident end of the same history, spent at the drop. Every gate gets
 * its own case: the whole feature is a conjunction, and a conjunction is only pinned one term at a time.
 */
describe('showsMercyTo', () => {
  const faced = [stood('Rex'), stood('Rex')]; // a history, not one good day
  const hungryRex = [{ name: 'Rex', hunger: GOBBLE_HUNGER }];

  it('lets a rival it has faced down have the scrap', () => {
    expect(dispositionToward(faced, 'Rex')).toBe('confident');
    expect(showsMercyTo(faced, 0, MERCY_AGREE, hungryRex, 'Moss')).toBe('Rex');
  });

  it('keeps the meal when the victor is hungry itself', () => {
    expect(showsMercyTo(faced, WELL_FED + 0.01, 1, hungryRex, 'Moss')).toBeNull();
    expect(showsMercyTo(faced, WELL_FED, 1, hungryRex, 'Moss')).toBe('Rex'); // the bar itself is generous
  });

  it('keeps the meal when the victor is petty — the same history, the other temperament', () => {
    expect(showsMercyTo(faced, 0, MERCY_AGREE - 0.01, hungryRex, 'Moss')).toBeNull();
  });

  it('offers nothing to a rival that is not still hungry', () => {
    expect(showsMercyTo(faced, 0, 1, [{ name: 'Rex', hunger: GOBBLE_HUNGER - 0.01 }], 'Moss')).toBeNull();
  });

  it('offers nothing to a dino it is wary of, or holds no disposition toward', () => {
    const wary = [slunk('Rex'), slunk('Rex')];
    expect(showsMercyTo(wary, 0, 1, hungryRex, 'Moss')).toBeNull();
    expect(showsMercyTo([], 0, 1, hungryRex, 'Moss')).toBeNull();
  });

  it('is filtered through the disposition, not the raw score: one won drop is not a history', () => {
    const once = [stood('Rex')]; // score 2 clears PECKING_BAR, but it is one beat
    expect(peckingScore(once, 'Rex')).toBe(PECKING_BAR);
    expect(dispositionToward(once, 'Rex')).toBeNull(); // PECKING_MIN_BEATS
    expect(showsMercyTo(once, 0, 1, hungryRex, 'Moss')).toBeNull();
  });

  it('never yields the scrap to itself', () => {
    const self = [stood('Moss'), stood('Moss')];
    expect(showsMercyTo(self, 0, 1, [{ name: 'Moss', hunger: 1 }], 'Moss')).toBeNull();
  });

  it('picks the most thoroughly beaten rival, then the hungriest, then lexicographically', () => {
    const many = [stood('Rex'), stood('Rex'), stood('Ash'), snatched('Ash')];
    expect(peckingScore(many, 'Rex')).toBeGreaterThan(peckingScore(many, 'Ash'));
    expect(showsMercyTo(many, 0, 1, [{ name: 'Ash', hunger: 1 }, { name: 'Rex', hunger: 0.6 }], 'Moss')).toBe('Rex');

    const even = [stood('Rex'), stood('Rex'), stood('Ash'), stood('Ash')];
    expect(peckingScore(even, 'Rex')).toBe(peckingScore(even, 'Ash'));
    expect(showsMercyTo(even, 0, 1, [{ name: 'Rex', hunger: 0.9 }, { name: 'Ash', hunger: 0.7 }], 'Moss')).toBe('Rex');
    expect(showsMercyTo(even, 0, 1, [{ name: 'Rex', hunger: 0.9 }, { name: 'Ash', hunger: 0.9 }], 'Moss')).toBe('Ash');
  });

  it('leaves both dispositions exactly as it found them — a gift is not a defeat', () => {
    const victorBefore = peckingRead(faced, 'Rex');
    const victorAfter = peckingRead([...faced, mercyMemory('Rex')], 'Rex');
    expect(victorAfter).toEqual(victorBefore);

    const rivalRing = [slunk('Moss'), slunk('Moss')];
    const rivalBefore = peckingRead(rivalRing, 'Moss');
    expect(peckingRead([...rivalRing, sparedMemory('Moss')], 'Moss')).toEqual(rivalBefore);
    // ...so a second mercy is still reachable from the same ring.
    expect(showsMercyTo([...faced, mercyMemory('Rex')], 0, 1, hungryRex, 'Moss')).toBe('Rex');
  });

  it('says why on the ticker, in the same words the contest uses', () => {
    const line = mercyLine('Moss', 'Rex');
    expect(line).toContain('Moss');
    expect(line).toContain('Rex');
    expect(line).toContain(becauseOf('confident', 'Rex'));
  });
});
