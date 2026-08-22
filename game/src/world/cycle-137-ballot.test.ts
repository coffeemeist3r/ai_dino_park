import { describe, it, expect } from 'vitest';
import { seededPersonality, type Personality } from '../ai/personality';
import { providerPriority, providerWorkPriority } from './governance';
import {
  livedShift,
  shadedTraits,
  votedSpend,
  votedWork,
  LIVED_NUDGE_CAP,
  type SeatExperience,
} from './ballot';
import { FOUNDING_BANKED } from './founding';

/** The real cast, not invented numbers — the calibration has to hold for the dinos that actually ship. */
const BRAMBLE = seededPersonality('Bramble'); // agreeableness 0.870 — decidedly warm
const REX = seededPersonality('Rex'); //         agreeableness 0.019 — decidedly prickly
const PIP = seededPersonality('Pip'); //         agreeableness 0.522 — twenty-two thousandths over the line

const UNLIVED: SeatExperience = { hunger: 0, heldShort: false, stake: 0 };
const STARVED: SeatExperience = { hunger: 1, heldShort: true, stake: 0 };
const BANKROLLER: SeatExperience = { hunger: 0, heldShort: false, stake: 1 };
/** A dino pulling exactly its weight on a ground where nobody else has banked — the ordinary case, and the
 *  one the absolute-share first draft got wrong by handing it the maximum nudge for free. */
const SOLE_FAIR: SeatExperience = { hunger: 0, heldShort: false, stake: 0 };

describe('BACKLOG-492 — the lived ballot', () => {
  it('an unlived seat votes exactly what it always did', () => {
    // Criterion 1: the compatibility seam. `undefined` and an all-zero experience are both shift 0.
    expect(livedShift(undefined, 'pantry')).toBe(0);
    expect(livedShift(undefined, 'labour')).toBe(0);
    expect(livedShift(UNLIVED, 'pantry')).toBe(0);
    expect(livedShift(UNLIVED, 'labour')).toBe(0);

    for (const t of [BRAMBLE, REX, PIP, seededPersonality('Twitch'), seededPersonality('Glade')]) {
      expect(votedSpend(t)).toBe(providerPriority(t));
      expect(votedWork(t)).toBe(providerWorkPriority(t));
      expect(votedSpend(t, UNLIVED)).toBe(providerPriority(t));
      expect(votedWork(t, UNLIVED)).toBe(providerWorkPriority(t));
    }
    // Absent traits keep reaching the threshold functions' own documented defaults, not a synthesised dino.
    expect(shadedTraits(undefined, STARVED, 'pantry')).toBeUndefined();
    expect(votedSpend(undefined, STARVED)).toBe(providerPriority(undefined));
  });

  it('no life moves a ballot further than the cap', () => {
    // Criterion 2: the bound is the design. Out-of-range inputs are clamped before they are weighted, so a
    // caller that hands over a hunger of 40 cannot buy a bigger vote than one that hands over 1.
    const extremes: SeatExperience[] = [
      STARVED,
      BANKROLLER,
      { hunger: 1, heldShort: true, stake: 1 },
      { hunger: 40, heldShort: true, stake: -12 },
    ];
    for (const e of extremes) {
      for (const call of ['pantry', 'labour'] as const) {
        expect(Math.abs(livedShift(e, call))).toBeLessThanOrEqual(LIVED_NUDGE_CAP + 1e-12);
        const shaded = shadedTraits(PIP, e, call) as Personality;
        const axis = call === 'pantry' ? 'agreeableness' : 'energy';
        expect(Math.abs(shaded[axis] - PIP[axis])).toBeLessThanOrEqual(LIVED_NUDGE_CAP + 1e-12);
      }
    }
  });

  it('a decided temperament is unturnable — the seat stays the floor', () => {
    // Criterion 3. This is what stops the feature becoming "experience decides everything".
    for (const e of [STARVED, BANKROLLER, { hunger: 1, heldShort: true, stake: 1 }]) {
      expect(votedSpend(BRAMBLE, e)).toBe('feed');
      expect(votedSpend(REX, e)).toBe('bank');
    }
  });

  it('a near-threshold seat turns, in both directions', () => {
    // Criterion 4: Pip is the whole reachability argument, so it is pinned here rather than only in the e2e.
    expect(votedSpend(PIP)).toBe('feed'); // 0.522, unlived
    expect(votedSpend(PIP, BANKROLLER)).toBe('bank'); // it filled the pile; it protects the pile
    expect(votedSpend(PIP, STARVED)).toBe('feed'); // it is hungry; it feeds the ground
    // ...and the founding state's actual numbers: Pip holds 2 of the Grove's 3 banked units, against an even
    // split of 1/2 between the Grove's two residents. A stake of +1/6 is all it takes, which is the margin
    // `founding.ts` was chosen for.
    const banked = FOUNDING_BANKED.Pip + FOUNDING_BANKED.Bramble;
    const stake = FOUNDING_BANKED.Pip / banked - 1 / 2;
    expect(stake).toBeCloseTo(1 / 6, 10);
    expect(votedSpend(PIP, { hunger: 0, heldShort: false, stake })).toBe('bank');
  });

  it('a refused ground alone leans its seat toward feeding', () => {
    // Criterion 5: `heldShort` is the only term a seat votes on somebody else's behalf, so it gets its own case.
    const bankLeaning: SeatExperience = { hunger: 0, heldShort: false, stake: 0.7 };
    expect(votedSpend(PIP, bankLeaning)).toBe('bank');
    expect(livedShift({ ...bankLeaning, heldShort: true }, 'pantry')).toBeGreaterThan(
      livedShift(bankLeaning, 'pantry'),
    );
  });

  it('the labour ballot is the mirror', () => {
    // Criterion 6. Pip's energy is 0.320 — gather by birth, and far enough from the line that share alone
    // cannot turn it, which is the cap doing its job on the other axis.
    expect(livedShift(STARVED, 'labour')).toBeLessThan(0); // hungry -> gather
    expect(livedShift(BANKROLLER, 'labour')).toBeGreaterThan(0); // banked -> build
    // A seat sitting near the energy line does turn: Rex is 0.541.
    expect(votedWork(REX)).toBe('build');
    expect(votedWork(REX, STARVED)).toBe('gather');
    expect(votedWork(REX, BANKROLLER)).toBe('build');
  });

  it('a seat pulling exactly its weight is not shaded by its stake', () => {
    // The correction the e2e found: the ordinary ground has one banker, whose *absolute* share is 1.0. Read
    // absolutely, every such seat got the maximum nudge on every ground forever — a constant wearing a
    // history's clothes. Measured against an even split, pulling your weight says nothing.
    expect(livedShift(SOLE_FAIR, 'pantry')).toBe(0);
    expect(livedShift(SOLE_FAIR, 'labour')).toBe(0);
    expect(votedWork(seededPersonality('Twitch'), SOLE_FAIR)).toBe(
      providerWorkPriority(seededPersonality('Twitch')),
    );
  });

  it('the founding ledger seats exactly one Grove dino, and it is Pip', () => {
    // Criterion 7's pure half — `zoneCouncil` orders most-banked first, so the founding tallies decide the
    // seat here rather than in the scene. If a later tuning pass levels these two, the founding council
    // becomes a coin-flip on a name comparator and this says so.
    expect(FOUNDING_BANKED.Pip).toBeGreaterThan(FOUNDING_BANKED.Bramble);
    expect(FOUNDING_BANKED.Bramble).toBeGreaterThanOrEqual(1); // COUNCIL_MIN_BANKS — both are eligible
  });
});
