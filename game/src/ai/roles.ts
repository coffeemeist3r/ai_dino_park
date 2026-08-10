/**
 * Role emergence (BACKLOG-020) — a dino's "role" is NOT assigned; it falls out
 * of how the dino has actually behaved (how much it meets others, how much
 * gossip it carries, how deeply it's bonded). Pure (no Phaser): derived on the
 * fly from tallies the sim already keeps, so it's a readout, not a script.
 */

export type Role = 'provider' | 'gossip' | 'homebody' | 'socialite' | 'wanderer';

export interface BehaviorStats {
  meetings: number; // total meetings this dino has been part of
  rumorsHeard: number; // second-hand memories it carries
  topBond: number; // strongest bond it has with anyone (0–100)
  /** Units of food this dino has banked into a zone's store (BACKLOG-448). Optional — pre-448 callers read 0. */
  foodBanked?: number;
}

export const ROLE_ICON: Record<Role, string> = {
  provider: '🧺',
  gossip: '🗣️',
  homebody: '🏠',
  socialite: '🎉',
  wanderer: '🧭',
};

/** Food banked into a zone's store before a dino reads as the one keeping the pantry full (BACKLOG-448). */
export const PROVIDER_BANKS = 3;

/**
 * Map behavior to a role. Checked most-distinctive first: the dino filling its zone's
 * pantry is the provider; a heavy rumor-carrier is the gossip; a deeply-bonded nester
 * is the homebody; a high-meeting mingler is the socialite; everyone else is still
 * wandering and finding their place.
 *
 * Provider leads because it's the only read that comes from the *economy* rather than
 * the social graph — every other role says who a dino talks to, this one says what it
 * does for the ground it lives on.
 */
export function deriveRole(s: BehaviorStats): Role {
  if ((s.foodBanked ?? 0) >= PROVIDER_BANKS) return 'provider';
  if (s.rumorsHeard >= 3) return 'gossip';
  if (s.topBond >= 60) return 'homebody';
  if (s.meetings >= 8) return 'socialite';
  return 'wanderer';
}

/**
 * Make an emerged role durable (BACKLOG-032). A dino that has found a non-wanderer role keeps it even
 * if the behavior that earned it fades — it only changes when a *different* non-wanderer role emerges,
 * and never falls back to 'wanderer'. While still a wanderer, it tracks the live derivation. So a role,
 * once found, is a job that sticks rather than a readout that evaporates.
 */
export function settleRole(prev: Role | undefined, derived: Role): Role {
  if (!prev || prev === 'wanderer') return derived;
  return derived === 'wanderer' ? prev : derived;
}

/** A dino as the provider read sees it: where it lives, what it settled into, how much it has banked. */
export interface ProviderCandidate {
  name: string;
  zoneId: string;
  role: Role;
  foodBanked: number;
}

/**
 * Word of the provider (BACKLOG-453) — of the dinos *living in* `zoneId`, the one keeping its pantry full:
 * the settled `provider` with the highest banked tally. 448 made the role park-wide and per-dino on purpose;
 * naming it aloud ("The Fernreach eats because of Sunny") needs the per-zone read it deferred.
 *
 * Ties resolve alphabetically so the park doesn't credit a different dino on a reload. Null when nobody
 * here has the role — which is the normal state of a young park, and everything downstream stays inert.
 */
export function zoneProvider(residents: readonly ProviderCandidate[], zoneId: string): string | null {
  return (
    residents
      .filter((r) => r.zoneId === zoneId && r.role === 'provider')
      .sort((a, b) => b.foodBanked - a.foodBanked || a.name.localeCompare(b.name))[0]?.name ?? null
  );
}

/**
 * More than one voice on the call (BACKLOG-479) — governance in this park has been one dino setting two
 * enums (463/473), handed over whole when the provider changes (467). That is a monarchy, and BACKLOG-031
 * ("at threshold population, NPCs vote on a simple rule") has been deferred since cycle 1 for one reason:
 * there has never been a *set of deciders*. This derives one — a per-zone **council** of the ground's top
 * food-bankers, a standing beside `provider` rather than a replacement for it.
 *
 * Deliberately broader than the role: `zoneProvider` filters on the settled `provider` role, this does
 * **not**. A seat is earned by banking (`COUNCIL_MIN_BANKS`, one unit), not by holding the role, which
 * needs `PROVIDER_BANKS` (three) — that gap is the whole content of the item. The comparator is byte-
 * identical to `zoneProvider`'s, which is what makes "the provider is always seat 1" a guarantee and not
 * a coincidence, and what stops a reload from reseating the council.
 *
 * Derived, never stored — no save field, the way the provider role and the hop table (475) are derived.
 * Empty for a ground nobody lives on (474), for a ground whose one remaining resident (the 460 floor) has
 * banked nothing, and park-wide on a fresh save: the whole feature is inert until somebody fills a pantry.
 */
export const COUNCIL_MIN_BANKS = 1; // banked at least this much to have a claim on the ground's say
export const COUNCIL_PER_HEADS = 2; // one voice per this many residents...
export const COUNCIL_SEATS_MAX = 3; // ...capped here, so a crowded ground still speaks with a few voices

/** How many seats a ground of `residents` fills, given `eligible` dinos have banked anything at all. */
export function councilSeats(residents: number, eligible: number): number {
  if (eligible <= 0) return 0;
  return Math.min(COUNCIL_SEATS_MAX, Math.max(1, Math.floor(residents / COUNCIL_PER_HEADS)));
}

/** The dinos seated on `zoneId`'s council, most-banked first; `[]` when the ground seats nobody. */
export function zoneCouncil(residents: readonly ProviderCandidate[], zoneId: string): string[] {
  const here = residents.filter((r) => r.zoneId === zoneId);
  const eligible = here
    .filter((r) => r.foodBanked >= COUNCIL_MIN_BANKS)
    .sort((a, b) => b.foodBanked - a.foodBanked || a.name.localeCompare(b.name));
  return eligible.slice(0, councilSeats(here.length, eligible.length)).map((r) => r.name);
}
