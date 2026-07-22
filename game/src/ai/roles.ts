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
