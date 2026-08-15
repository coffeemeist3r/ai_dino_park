import { describe, expect, it } from 'vitest';
import { lastHatchOutcome, mannerTallies, type HatchOutcome } from '../../game/src/world/manner';
import { cannedReply, mealtimeAside } from '../../game/src/ai/brain';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Mealtime mood in the voice (BACKLOG-404) — the contested-drop ledger read for *recency* instead of career.
 * The book (402) says what kind of eater a dino is; this says how its last meal went, and it goes quiet on
 * its own when that memory rolls off the 6-slot ring.
 */

const gobble = (other: string) => `you shouldered past ${other} and snatched the food first`;
const yielded = (other: string) => `you stepped back and let ${other} eat first`;
const stood = (other: string) => `you stood your ground and kept your food from ${other}`;
const slunk = (other: string) => `${other} wouldn't budge — you slunk off`;
const repaid = (other: string) => `you repaid ${other}'s kindness at the hatch`;

const traits = (agreeableness: number): Personality => ({
  bravery: 0.5,
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness,
});
const PRICKLY = traits(0.2);
const EVEN = traits(0.5);
const WARM = traits(0.9);

describe('lastHatchOutcome — the latest contested beat on the ring', () => {
  it('reads nothing off an empty ring', () => {
    expect(lastHatchOutcome([])).toBeNull();
  });

  it('recognises all four beats and names the other dino', () => {
    expect(lastHatchOutcome([gobble('Sunny')])).toEqual({ outcome: 'gobbled', other: 'Sunny' });
    expect(lastHatchOutcome([yielded('Rex')])).toEqual({ outcome: 'yielded', other: 'Rex' });
    expect(lastHatchOutcome([stood('Twitch')])).toEqual({ outcome: 'stood', other: 'Twitch' });
    expect(lastHatchOutcome([slunk('Mossback')])).toEqual({ outcome: 'slunk', other: 'Mossback' });
  });

  it('takes the newest beat, not the first — memories are appended oldest-first', () => {
    expect(lastHatchOutcome([yielded('Rex'), gobble('Sunny')])).toEqual({ outcome: 'gobbled', other: 'Sunny' });
    expect(lastHatchOutcome([gobble('Sunny'), yielded('Rex')])).toEqual({ outcome: 'yielded', other: 'Rex' });
  });

  it('ignores everything that is not a contested drop', () => {
    expect(lastHatchOutcome(['the keeper came back', 'you slept warm with Sunny'])).toBeNull();
    // A hatch beat buried under later chatter still speaks — the ring, not a time window, is the gate.
    expect(lastHatchOutcome([stood('Rex'), 'the keeper came back'])).toEqual({ outcome: 'stood', other: 'Rex' });
  });

  it('does not read the 385 repay as a contested outcome — generosity after the fact is not a drop', () => {
    expect(lastHatchOutcome([repaid('Sunny')])).toBeNull();
    // ...and it does not mask the real beat underneath it either.
    expect(lastHatchOutcome([gobble('Rex'), repaid('Sunny')])).toEqual({ outcome: 'gobbled', other: 'Rex' });
  });

  it('leaves the 402 tallies exactly as they were (the capture groups changed nothing)', () => {
    const ring = [yielded('A'), repaid('B'), gobble('C'), stood('D'), slunk('E')];
    expect(mannerTallies(ring)).toEqual({ generous: 2, greedy: 1, unbowed: 1, timid: 1 });
  });
});

describe('mealtimeAside — four outcomes, three temperament bands', () => {
  const OUTCOMES: HatchOutcome[] = ['gobbled', 'yielded', 'stood', 'slunk'];

  it('says something in every one of the twelve cells, and never the same thing twice', () => {
    const lines: string[] = [];
    for (const o of OUTCOMES) {
      for (const t of [PRICKLY, EVEN, WARM]) {
        const line = mealtimeAside(o, 'Sunny', t);
        expect(line.startsWith(' ')).toBe(true); // composes onto whatever register produced the base line
        expect(line).toContain('Sunny'); // the ledger always named who; so does the voice
        expect(line.trim().length).toBeGreaterThan(10);
        lines.push(line);
      }
    }
    expect(new Set(lines).size).toBe(12);
  });

  it('falls back to the even band with no traits, like every other aside', () => {
    for (const o of OUTCOMES) {
      expect(mealtimeAside(o, 'Rex')).toBe(mealtimeAside(o, 'Rex', EVEN));
    }
  });
});

describe('cannedReply composition', () => {
  const base = { name: 'Rex', species: 'raptor', personality: 'bold', traits: EVEN, affection: 9 };

  it('is untouched when the dino carries no hatch beat', () => {
    expect(cannedReply({ ...base }).text).toBe(cannedReply({ ...base, mealtime: undefined }).text);
    expect(cannedReply({ ...base }).text).not.toContain('the drop');
  });

  it('composes onto the register it found, rather than replacing it', () => {
    const text = cannedReply({ ...base, mealtime: { outcome: 'stood', other: 'Sunny' } }).text;
    expect(text).toContain('There you are'); // the fond register (272) survives
    expect(text).toContain('stood my ground against Sunny');
  });

  it('stacks with the hunger tell and still respects the cap', () => {
    const text = cannedReply({
      ...base,
      traits: WARM,
      hungry: true,
      mealtime: { outcome: 'slunk', other: 'Mossback' },
    }).text;
    expect(text).toMatch(/hungry/);
    expect(text).toContain('Mossback');
    expect(text.length).toBeLessThanOrEqual(460);
  });
});
