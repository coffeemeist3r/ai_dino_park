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
