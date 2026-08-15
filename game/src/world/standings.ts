/**
 * One place the standings are derived (BACKLOG-482).
 *
 * Three per-zone standings exist and no two were built the same way. `pioneer` (343) is a persisted map in
 * `world/pioneer.ts` with its own book-line builder. `provider` (448/453) is derived in `ai/roles.ts` off a
 * candidate roster and surfaced through the *role* system. The council (479) is derived in `ai/roles.ts` too,
 * but through a different function with a different eligibility bar — and its book line lived in an inline
 * closure inside `WorldScene.bookRows()`, in no module and no test of its own.
 *
 * `ZONE_TERRAIN` (449) wrote the lesson into its own header: *a fourth zone is a row, not three branches.*
 * This is that promise applied to roles. One shape, one derivation, one book-line builder, so the fourth
 * standing — and 484's termed seat and 487's second call are both queued behind this — is a row.
 *
 * **Composes, never re-implements.** `zoneProvider` / `zoneCouncil` / `pioneerOf` stay where they are and
 * stay exported; duplicating their comparators here is the exact failure this module exists to prevent, and
 * the unit spec pins the two answers together for the same input.
 *
 * **Derived, never stored.** All three were derived (or, for the pioneer, read off an existing save field)
 * before this cycle and all three still are. No save field is added.
 *
 * **No `since`.** The item's sketched shape carried one; it is deliberately absent. The council is
 * re-derived from live banked tallies on every read, so a date computed here would say "now" on every read —
 * a field that looks like history and means nothing. Giving a seat a real date is BACKLOG-484, which is
 * queued directly behind this and is where the field belongs.
 *
 * Pure TypeScript (no Phaser): Node-testable.
 */

import { zoneCouncil, zoneProvider, type ProviderCandidate } from '../ai/roles';
import { pioneerLine, pioneerOf, type Pioneers } from './pioneer';
import { zoneById, zoneChain } from './zones';

export type StandingKind = 'pioneer' | 'provider' | 'council';

/** One ground's one standing. `holders` is a list for all three kinds: the council's plurality is the general
 *  case and pioneer/provider are its one-element instances, rather than two shapes with a union between. */
export interface Standing {
  zone: string;
  kind: StandingKind;
  holders: readonly string[];
}

/**
 * Every standing on every ground, in one pass. Emission order per zone is **council, pioneer, provider** —
 * the order the collection book already rendered them in, so the fold cannot move a line.
 *
 * A ground contributes nothing it hasn't earned: no pioneer until somebody founds it (343), no provider until
 * somebody settles the role (448), no council until somebody banks (479). A fresh save yields `[]` and every
 * consumer stays inert, exactly as it did before this module existed.
 */
export function zoneStandings(candidates: readonly ProviderCandidate[], pioneers: Pioneers): Standing[] {
  const out: Standing[] = [];
  for (const zone of zoneChain()) {
    const council = zoneCouncil(candidates, zone);
    if (council.length) out.push({ zone, kind: 'council', holders: council });
    const pioneer = pioneerOf(pioneers, zone);
    if (pioneer) out.push({ zone, kind: 'pioneer', holders: [pioneer] });
    const provider = zoneProvider(candidates, zone);
    if (provider) out.push({ zone, kind: 'provider', holders: [provider] });
  }
  return out;
}

/** Who keeps `zone`'s pantry full (448/453), or null — the folded read of `zoneProvider`. */
export function providerOf(all: readonly Standing[], zone: string): string | null {
  return all.find((s) => s.zone === zone && s.kind === 'provider')?.holders[0] ?? null;
}

/** `zone`'s seated council (479), most-banked first; `[]` when the ground seats nobody. */
export function councilOf(all: readonly Standing[], zone: string): string[] {
  return [...(all.find((s) => s.zone === zone && s.kind === 'council')?.holders ?? [])];
}

/** Every standing this dino holds, on any ground — a dino can be one ground's pioneer and another's seat. */
export function standingsOf(all: readonly Standing[], name: string): Standing[] {
  return all.filter((s) => s.holders.includes(name));
}

/**
 * How one standing reads in the collection book, or **null** when it has no book line.
 *
 * `provider` returns null on purpose: the provider's presence in the book is the 🧺 *role* (020/448), a
 * park-wide fact about a dino rather than a line about a ground, and it is rendered by the role system. A
 * second line saying the same thing would be a behaviour change, and this fold is meant to have none.
 */
export function standingLine(s: Standing): string | null {
  switch (s.kind) {
    case 'council': {
      const n = s.holders.length;
      return `👥 one of ${zoneById(s.zone).name}'s ${n} voice${n === 1 ? '' : 's'}`;
    }
    case 'pioneer':
      return pioneerLine(s.zone);
    case 'provider':
      return null;
  }
}

/** This dino's standings as the book prints them, in derivation order. */
export function standingLines(all: readonly Standing[], name: string): string[] {
  return standingsOf(all, name)
    .map(standingLine)
    .filter((l): l is string => l !== null);
}
