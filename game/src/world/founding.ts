/**
 * The founding state of a brand-new park (CHARTER v7).
 *
 * The charter's corollary to the reachability bar: *constants are not tuned to be dormant.* `upkeep.ts`
 * describes its own founding calibration as a virtue — one landmark per ground, so a fresh park owes
 * nothing and nothing is ever derelict — which meant that in the entire life of a new save, the disrepair
 * system (480), its gathering lean (485) and now the mend job (488) could not be observed at all. The
 * founding park has to *exercise* the systems the park has built, so it now ships with a ruin on it.
 *
 * One fallen cairn in the Grove, and enough stone in the Grove's pile to put it back up. The Grove is one
 * edge from where the player spawns, Bramble and Pip live there (CHARTER v7's spread cast), and a derelict
 * landmark owes no upkeep — so the ruin costs the ground nothing and is purely an invitation. The first
 * structure a new player ever walks up to is a broken one, and within a minute somebody mends it.
 *
 * Pure data (no Phaser): the scene seeds this on the `!save` branch only. It writes ordinary `cairns` and
 * `stockpileByZone` entries, so it round-trips through the existing save fields with no version bump, and
 * a restored save seeds nothing.
 */

import { BOWL_ID, GROVE_ID, RIDGE_ID, zoneChain } from './zones';
import { bankStep } from './bank';
import type { Stockpile } from './resource';
import type { FoundingKind, Pioneers } from './pioneer';
import { ROSTER } from '../entities/roster';
import { COUNCIL_MIN_BANKS, COUNCIL_PER_HEADS, deriveRole, zoneCouncil, type ProviderCandidate } from '../ai/roles';

/**
 * The founding ruin: a toppled cairn on the Grove's west side. Grass by `groveTileAt` (the pond is the NE
 * block x∈[15,18] y∈[2,4]; the trail is the two middle rows), clear of both, and a few tiles from where
 * Bramble wakes up — so the nearest-resident pick has an obvious answer and a short walk.
 */
export const FOUNDING_RUIN = { zone: GROVE_ID, tileX: 4, tileY: 10 } as const;

/**
 * What the founding grounds start with in the pile (BACKLOG-488, widened by BACKLOG-495).
 *
 * The Grove's entry is the original and is unchanged: enough stone to cover `REPAIR_COST` with a unit to
 * spare, so the founding ruin is *mendable* rather than the Grove starting rich. `cycle-136-founding.test.ts`
 * pins that against the repair cost, and a tuning pass that drops it says so out loud.
 *
 * **The other two entries are cycle 151's, and they are a reachability repair.** BACKLOG-504 draws the
 * ground's banked heap in three steps (`PILE_STEPS = [1, 2, 4]`), and until now exactly one ground on a
 * fresh save had anything in its pile — so a new park exercised one of the three rigs, and `pile_3` had
 * never existed on a first frame in the park's history. That is CHARTER v7's corollary precisely: three
 * steps drawn, the founding state calibrated to sit under two of them. So the founding piles now reach
 * **each drawn step exactly once**, and `reachability.ts`'s `BACKLOG-495/504` entry holds them to it.
 *
 * The shape of each entry is not arbitrary either. The bowl gets a branch because the bowl is where the
 * player starts and one unit is the smallest thing that can be seen. The Ridge's is mostly obsidian
 * because obsidian is the Ridge's own exclusive kind (BACKLOG-503) — a ground's heap should be made of
 * the thing that ground is for.
 *
 * The frontier (`saltpan`) is deliberately **absent**: BACKLOG-505's unsettled read is a claim about
 * residents and founders rather than piles, but a stocked frontier would still read as lived on, and
 * the frontier badge is the one thing on a fresh save that has to mean nobody has been there.
 *
 * Every total stays under `STOCKPILE_SOFT_CAP`, and `__clearFounding` derives its clear from
 * `Object.keys` here, so widening this table needs no change on the clearing side.
 */
export const FOUNDING_PILES: Record<string, Stockpile> = {
  [BOWL_ID]: { branch: 1 },
  [GROVE_ID]: { stone: 2 },
  [RIDGE_ID]: { obsidian: 3, stone: 1 },
};

/**
 * Which drawn heap step each stocked ground boots at (BACKLOG-495/504).
 *
 * Derived, never typed. Three separate readers want this fact — the register entry that holds the founding
 * piles to covering every step, the unit spec that pins the coverage, and the e2e founding fixture that
 * asserts what the player sees on each ground — and this item exists because a founding-shaped claim
 * written down more than once goes stale in all but one of the places.
 */
export const FOUNDING_PILE_STEPS: Record<string, number> = Object.fromEntries(
  Object.entries(FOUNDING_PILES).map(([zone, pile]) => [zone, bankStep(pile)]),
);

/**
 * The founding council (CHARTER v7 / BACKLOG-492).
 *
 * Seven cycles of governance — two votes (481/487), a term (484), a turnover beat, a bill lean (485) and two
 * lens glyphs (477) — and **not one of them was reachable on a fresh save**, for a reason nobody had written
 * down: `zoneCouncil` seats a ground's food-bankers, the founding cast has banked nothing, so every ground
 * reads "seats nobody" from boot until the ambient sim gets around to a harvest haul. That is `TILES_PER_HEAD`
 * with a ballot box, and v7's corollary makes it a defect rather than a compatibility win.
 *
 * So the Grove starts with a bank ledger. Two residents means `councilSeats(2, 2) = 1` — **one seat and no
 * tie to break**, the simplest live council the park can hold. Both sit under `PROVIDER_BANKS = 3`, so no
 * provider exists to shadow the seat and the tie-break is `null`: the founding call is a genuine single
 * ballot rather than a monarchy wearing a council's badge.
 *
 * And the seat is Pip, deliberately. Pip's name-seeded agreeableness is **0.522** — twenty-two thousandths
 * over the pantry call's threshold — so its ballot is one a life can actually turn, in both directions,
 * inside a session. A founding state that seats an unturnable council would have satisfied the letter of the
 * reachability bar and none of it.
 *
 * Ordinary `foodBanked` entries, so this round-trips the existing additive save field with no version bump.
 * **And a second ground, from BACKLOG-497.** The Grove's ledger was the reachable half of 492 and the
 * *unreachable* half of everything built on top of it: two residents gives `councilSeats(2, 2) = 1`, and a
 * one-seat council is `zoneProvider` wearing a different glyph. Every beat that needs more than one ballot
 * — the majority arithmetic (487), the tie-break, a call that can actually split — was as far out of reach
 * on a fresh save as the whole system had been before 492. So the bowl gets a ledger too. Five residents and
 * two eligible gives `councilSeats(5, 2) = 2`; both tallies sit under `PROVIDER_BANKS = 3`, so no provider
 * shadows the seats and the tie-break stays `null`; and the two seats fall on **opposite sides of the pantry
 * threshold** (Sunny's name-seeded agreeableness is 0.622, Glade's 0.085), so the ground the player spawns on
 * holds the first vote in this park's life that has something to count.
 */
export const FOUNDING_BANKED: Record<string, number> = { Pip: 2, Bramble: 1, Sunny: 2, Glade: 1 };

/**
 * What population governance is *observable* at (BACKLOG-497).
 *
 * `zoneCouncil` and its three constants (`COUNCIL_MIN_BANKS`, `COUNCIL_PER_HEADS`, `COUNCIL_SEATS_MAX`) were
 * picked in cycle 119 against a single five-dino bowl, and are now read by two votes (481/487), a term and a
 * turnover beat (484), a bill lean (485), two lens glyphs (477) and a book standing (482) — with nothing
 * anywhere stating what population that stack is designed to be watchable at, and nothing asserting the
 * shipping park clears it. 492 found out by hand that it did not, and fixed it by hand, for one ground.
 *
 * This is the claim written down. **Derived from the constants, never restating their values**, so the
 * statement and the arithmetic cannot drift apart: `councilSeats` hands one seat to any ground with a single
 * banker, so the number that matters is the one that seats *two* — the point at which a ground's decision
 * stops being one dino's temperament and starts being a count.
 */
export const GOVERNANCE_OBSERVABLE_AT = {
  /** Residents one ground needs before it seats a council that can disagree. */
  residents: COUNCIL_PER_HEADS * 2,
  /** What each of those seats must have banked to be eligible for one. */
  banked: COUNCIL_MIN_BANKS,
} as const;

/**
 * The shipping roster and the founding ledger as the role layer sees them (BACKLOG-497) — so a test can ask
 * what the park *actually boots into* rather than re-deriving it from two files and hoping.
 */
export function foundingCandidates(): ProviderCandidate[] {
  return ROSTER.map((r) => {
    const foodBanked = FOUNDING_BANKED[r.name] ?? 0;
    return {
      name: r.name,
      zoneId: r.zone ?? BOWL_ID,
      role: deriveRole({ meetings: 0, rumorsHeard: 0, topBond: 0, foodBanked }),
      foodBanked,
    };
  });
}

/**
 * Who each ground seats at boot (BACKLOG-497). Every ground in the chain appears, including the ones that
 * seat nobody — an absent entry and an empty one are different claims, and the empty ones are the evidence
 * BACKLOG-500 was filed on. Goes through `zoneCouncil` itself: the seat arithmetic lives in `ai/roles.ts`
 * and there is exactly one copy of it.
 */
/**
 * Who wakes up on each ground in a brand-new park (BACKLOG-500). Every ground in `zoneChain()` is a key,
 * including any that seat nobody — present-and-empty and absent are different claims, and the empty ones
 * were the evidence this item was filed on. `foundingCouncils`'s sibling: same discipline, one layer down.
 */
export function foundingResidents(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const id of zoneChain()) out[id] = [];
  for (const r of ROSTER) (out[r.zone ?? BOWL_ID] ??= []).push(r.name);
  return out;
}

/**
 * Who founded each ground in a brand-new park (BACKLOG-512) — the first name the roster lists on it.
 *
 * 343 records a pioneer at *arrival*, which was the whole truth while the bowl was the only ground anybody
 * woke on. CHARTER v7's spread cast ended that: five grounds hold residents from the first frame and none
 * of them recorded a founder, so `isUnsettled` called every one of them virgin frontier the moment it
 * emptied. This is the record the park was missing — a founding written down as a founding, so the frontier
 * read is a claim about history rather than about which id the save calls home.
 *
 * Roster order decides: the first dino listed on a ground founded it. Grounds with nobody on them get no
 * entry, which is what keeps the Saltpan the park's one frontier.
 *
 * Walks `foundingResidents()`, so a seventh ground inherits this the day it is added — the same discipline
 * as `groundsWithoutResidents` below, for the same reason.
 */
export function foundingPioneers(): Pioneers {
  const out: Pioneers = {};
  for (const [id, names] of Object.entries(foundingResidents())) {
    if (names.length) out[id] = names[0];
  }
  return out;
}

/**
 * How a ground was founded (BACKLOG-516) — born on, or walked into.
 *
 * 512 gave every ground the roster wakes on a recorded founder and left `pioneerLine` rendering all of them
 * through the sentence 343 wrote for an arrival, so the book told five dinos they had crossed into somewhere
 * they had never left. The fact that tells the two apart already existed the moment 512 shipped: a founding
 * is `born` exactly when the recorded pioneer is the one `foundingPioneers()` names for that ground.
 *
 * **Derived, never stored** — `standings.ts`'s doctrine, and the reason this needs no save field and no
 * migration. An old save is reinterpreted correctly on load rather than carrying a flag written under the
 * old reading.
 *
 * A ground nobody has founded answers `crossed`, which is the honest default: the only way it can ever gain
 * a pioneer is for somebody to walk in.
 */
export function foundingKind(pioneers: Pioneers, zoneId: string): FoundingKind {
  const recorded = pioneers[zoneId];
  return recorded !== undefined && foundingPioneers()[zoneId] === recorded ? 'born' : 'crossed';
}

/**
 * The residency invariant (BACKLOG-500) — the grounds a fresh park boots with nobody on.
 *
 * CHARTER v7 says "every ground the player can walk to has life on it at boot." The roster that shipped
 * alongside that sentence spread eight dinos as 5 bowl / 2 grove / 1 fernreach / **0 hollow / 0 ridge**, so
 * two of five grounds were exactly as dead as all four had been before the amendment, and everything a
 * ground can hold — a plot, a landmark, a pile, an upkeep bill, a mend errand, a council seat — was inert on
 * them from boot to save-death. The Ridge was the sharper half: the park's only *branch*, the one ground
 * reached by a decision rather than by continuing east, with nobody on either arm of it.
 *
 * This is the claim as something that breaks. It walks `zoneChain()` rather than a list of five ids, so the
 * sixth ground inherits the invariant on the day it is added rather than the cycle somebody notices.
 */
export function groundsWithoutResidents(): string[] {
  return Object.entries(foundingResidents())
    .filter(([, names]) => names.length === 0)
    .map(([id]) => id);
}

export function foundingCouncils(): Record<string, string[]> {
  const candidates = foundingCandidates();
  const out: Record<string, string[]> = {};
  for (const id of zoneChain()) out[id] = zoneCouncil(candidates, id);
  return out;
}
