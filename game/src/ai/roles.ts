/**
 * Role emergence (BACKLOG-020) — a dino's "role" is NOT assigned; it falls out
 * of how the dino has actually behaved (how much it meets others, how much
 * gossip it carries, how deeply it's bonded). Pure (no Phaser): derived on the
 * fly from tallies the sim already keeps, so it's a readout, not a script.
 */

export type Role = 'gossip' | 'homebody' | 'socialite' | 'wanderer';

export interface BehaviorStats {
  meetings: number; // total meetings this dino has been part of
  rumorsHeard: number; // second-hand memories it carries
  topBond: number; // strongest bond it has with anyone (0–100)
}

export const ROLE_ICON: Record<Role, string> = {
  gossip: '🗣️',
  homebody: '🏠',
  socialite: '🎉',
  wanderer: '🧭',
};

/**
 * Map behavior to a role. Checked most-distinctive first: a heavy rumor-carrier
 * is the gossip; a deeply-bonded nester is the homebody; a high-meeting mingler
 * is the socialite; everyone else is still wandering and finding their place.
 */
export function deriveRole(s: BehaviorStats): Role {
  if (s.rumorsHeard >= 3) return 'gossip';
  if (s.topBond >= 60) return 'homebody';
  if (s.meetings >= 8) return 'socialite';
  return 'wanderer';
}
