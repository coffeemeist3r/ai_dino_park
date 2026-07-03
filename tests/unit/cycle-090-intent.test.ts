/**
 * Brain-biased intent (BACKLOG-393) — the pure choosing layer.
 *
 * Pins: the procedural author is deterministic and closed-set; trait weighting leans the pick;
 * every weight nudge is clamped so no intent can freeze or peg a behavior; a garbage brain draft
 * falls back to the deterministic floor; the model-reply parser only accepts the closed set.
 */
import { describe, expect, it } from 'vitest';
import {
  INTENT_KINDS,
  INTENT_NOTES,
  NOTE_MAX,
  SOCIALIZE_BASE,
  forageCuriosity,
  fromDraft,
  proceduralIntent,
  rerollStay,
  socializeChanceFor,
  ticAfterFor,
  type DinoIntent,
} from '../../game/src/ai/intent';
import { parseIntentDraft } from '../../game/src/ai/webllmBrain';
import { seededPersonality } from '../../game/src/ai/personality';

const t = seededPersonality('TestDino');
const intentOf = (kind: DinoIntent['kind']): DinoIntent => ({ kind, note: INTENT_NOTES[kind], until: 1 });

describe('proceduralIntent (the deterministic floor)', () => {
  it('is deterministic: same (name, day) → same intent', () => {
    expect(proceduralIntent('Rex', 3, t)).toEqual(proceduralIntent('Rex', 3, t));
  });

  it('varies by day and by name (the seed carries both)', () => {
    const days = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => proceduralIntent('Rex', d, t).kind));
    expect(days.size).toBeGreaterThan(1);
  });

  it('only ever emits the closed kind set, with the kind-matched note and until=day', () => {
    for (const name of ['Rex', 'Sunny', 'Twitch', 'Mossback', 'Glade']) {
      for (let day = 1; day <= 40; day++) {
        const i = proceduralIntent(name, day, seededPersonality(name));
        expect(INTENT_KINDS).toContain(i.kind);
        expect(i.note).toBe(INTENT_NOTES[i.kind]);
        expect(i.until).toBe(day);
      }
    }
  });

  it('traits lean the pick: a very social dino draws social more than a very solitary one', () => {
    const social = { ...t, sociability: 0.95 };
    const lone = { ...t, sociability: 0.05 };
    let socialHits = 0;
    let loneHits = 0;
    for (let day = 1; day <= 200; day++) {
      if (proceduralIntent('Rex', day, social).kind === 'social') socialHits++;
      if (proceduralIntent('Rex', day, lone).kind === 'social') loneHits++;
    }
    expect(socialHits).toBeGreaterThan(loneHits);
  });
});

describe('weight nudges (pure, clamped)', () => {
  it('pins the socialize chances', () => {
    expect(socializeChanceFor(intentOf('social'))).toBe(0.65);
    expect(socializeChanceFor(intentOf('solitary'))).toBe(0.25);
    expect(socializeChanceFor(intentOf('forage'))).toBe(SOCIALIZE_BASE);
    expect(socializeChanceFor(intentOf('restless'))).toBe(SOCIALIZE_BASE);
    expect(socializeChanceFor(undefined)).toBe(SOCIALIZE_BASE);
  });

  it('socialize chance stays inside [0.05, 0.95] for every kind', () => {
    for (const k of INTENT_KINDS) {
      const c = socializeChanceFor(intentOf(k));
      expect(c).toBeGreaterThanOrEqual(0.05);
      expect(c).toBeLessThanOrEqual(0.95);
    }
  });

  it('a solitary day halves tic onset, floored — never below half the base', () => {
    expect(ticAfterFor(intentOf('solitary'), 20)).toBe(10);
    expect(ticAfterFor(intentOf('solitary'), 5)).toBe(3); // ceil(5/2)
    expect(ticAfterFor(intentOf('social'), 20)).toBe(20);
    expect(ticAfterFor(undefined, 20)).toBe(20);
  });

  it('a forage day widens curiosity, capped at 1', () => {
    expect(forageCuriosity(0.4, intentOf('forage'))).toBeCloseTo(0.65);
    expect(forageCuriosity(0.9, intentOf('forage'))).toBe(1);
    expect(forageCuriosity(0.4, intentOf('social'))).toBe(0.4);
    expect(forageCuriosity(0.4, undefined)).toBe(0.4);
  });

  it('restless re-rolls only a "stay" pick, and only under restless', () => {
    expect(rerollStay(intentOf('restless'), 0, () => 3)).toBe(3);
    expect(rerollStay(intentOf('restless'), 2, () => 3)).toBe(2);
    expect(rerollStay(intentOf('social'), 0, () => 3)).toBe(0);
    expect(rerollStay(undefined, 0, () => 3)).toBe(0);
    // the re-roll may legitimately land on stay again — rest is never forbidden
    expect(rerollStay(intentOf('restless'), 0, () => 0)).toBe(0);
  });
});

describe('fromDraft (untrusted brain output onto the deterministic floor)', () => {
  const fallback = proceduralIntent('Rex', 7, t);

  it('null / unknown kind / junk keeps the fallback whole', () => {
    expect(fromDraft(null, fallback)).toEqual(fallback);
    expect(fromDraft({ kind: 'rampage', note: 'no' }, fallback)).toEqual(fallback);
    expect(fromDraft({ kind: '', note: '' }, fallback)).toEqual(fallback);
  });

  it('a valid draft keeps its kind + note, trimmed to the cap, until from the fallback', () => {
    const merged = fromDraft({ kind: 'forage', note: '  wants the good ferns  ' }, fallback);
    expect(merged).toEqual({ kind: 'forage', note: 'wants the good ferns', until: 7 });
    const long = fromDraft({ kind: 'social', note: 'x'.repeat(200) }, fallback);
    expect(long.note.length).toBe(NOTE_MAX);
  });

  it('a valid kind with an empty note takes the fallback note', () => {
    const merged = fromDraft({ kind: 'solitary', note: '   ' }, fallback);
    expect(merged.kind).toBe('solitary');
    expect(merged.note).toBe(fallback.note);
  });
});

describe('parseIntentDraft (strict model-reply parse)', () => {
  it('finds the kind and carries the note', () => {
    expect(parseIntentDraft('solitary — wants the fern corner')).toEqual({
      kind: 'solitary',
      note: 'wants the fern corner',
    });
    expect(parseIntentDraft('I feel SOCIAL today, going to see Twitch!')?.kind).toBe('social');
  });

  it('first kind word wins when the model rambles', () => {
    expect(parseIntentDraft('restless, maybe forage later')?.kind).toBe('restless');
  });

  it('garbage → null (the caller keeps the procedural intent)', () => {
    expect(parseIntentDraft('')).toBeNull();
    expect(parseIntentDraft('as an AI language model I cannot')).toBeNull();
    expect(parseIntentDraft('rampage — smash the glass')).toBeNull();
  });
});
