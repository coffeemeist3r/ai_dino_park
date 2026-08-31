/**
 * The quarry errand (BACKLOG-503) — the hard scarcity pull, and the first reason in this park's life to
 * climb the branch.
 *
 * 450 gave migration a *soft* pull: mouths move toward plenty, where plenty is a comparison of two
 * prosperity scores. Every ground scored the same kind of points off the same kind of gather, so the pull
 * only ever said "that one is doing better", never "that one has the thing". `ZONE_EXCLUSIVE` changes the
 * shape of the question: obsidian exists on the Ridge and on no other ground, so a ground without any
 * cannot trade, gather, wait or prosper its way into some. Somebody has to go.
 *
 * That is what this module decides. Pure TypeScript (no Phaser): the ground that holds the exclusive kind
 * is derived from `ZONE_EXCLUSIVE` rather than hard-coded a second time, so a later cycle that moves the
 * stake — or adds a second one — moves it in one place. WorldScene supplies the live pile and slots
 * `quarryDest` into the destination chain.
 *
 * Determinism: the routing is `hopToward` (475), which walks `zoneNeighbors` in `ZONE_LINKS` order and
 * returns the first neighbour that is genuinely one hop closer. No `Math.random()` anywhere near a
 * migration destination — BACKLOG-456 catalogues what that costs the e2e suite.
 */

import { ZONE_EXCLUSIVE, RESOURCE_GLYPH, recipeShortfall, type ResourceKind, type Stockpile } from './resource';
import { hopToward } from './distance';
import { zoneById } from './zones';

/**
 * The ground that holds the park's exclusive kind, and what that kind is. Derived, not declared: exactly
 * one ground is exclusive today, and a park that grew a second would want a per-kind read rather than this
 * one — so this returns the first entry and the callers below stay honest about being singular.
 */
export function quarryGround(): string | null {
  return Object.keys(ZONE_EXCLUSIVE)[0] ?? null;
}

/** The kind the quarry ground is the only source of. */
export function quarryKind(): ResourceKind | null {
  const ground = quarryGround();
  return ground ? ZONE_EXCLUSIVE[ground] : null;
}

/** Does this ground's pile hold none of the exclusive kind — i.e. is there an errand to run at all? */
export function needsQuarry(pile: Stockpile): boolean {
  const kind = quarryKind();
  if (!kind) return false;
  return (pile[kind] ?? 0) <= 0;
}

/**
 * The next hop a migrant leaving `home` takes on a quarry errand, or `null` when there is no errand: the
 * ground already holds some, or `home` **is** the quarry ground (you do not travel to where you are
 * standing), or the two are not connected at all.
 *
 * Multi-hop by construction — a dino in the Hollow is three grounds from the Ridge and gets the first step
 * of the walk, the same way 475 routes a yearning toward a ground it misses rather than only to a
 * neighbour.
 */
export function quarryDest(home: string, pile: Stockpile): string | null {
  const ground = quarryGround();
  if (!ground || home === ground) return null;
  if (!needsQuarry(pile)) return null;
  return hopToward(home, ground);
}

/** The ticker beat when a dino sets out for the stake. Names the ground it is going to, not the next hop —
 *  the 475 rule: the ticker says what it *wants*, which is no longer always where it steps this crossing. */
export function quarryEvent(name: string, groundName: string, glyph: string): string {
  return `${glyph} ${name} sets out for ${groundName} — the only ground the black glass falls on`;
}

/**
 * The trace the errand leaves, read back on the dino's next greeting through the existing
 * `recall → recentMemory → greet` path. `greenerGroundMemory`'s register — second person, no leading
 * article (two ground names carry their own, the `storesFedLine` trap).
 */
export function quarryMemory(groundName: string): string {
  return `nothing at home would do, so you went up to ${groundName} for the black glass`;
}

/**
 * What a ground's next landmark is still waiting on (BACKLOG-509) — the map-lens read, and the floor under
 * this item's reachability answer: on a fresh save every non-Ridge ground says it is waiting on black glass
 * from the Ridge, on frame one, with no walk and no wait.
 *
 * Reads `recipeShortfall` rather than a recipe of its own, and names the source ground off `quarryGround`
 * rather than a second `'ridge'` literal, so the whole line is derived. Empty string when the ground can
 * already afford what it wants to build next (the lens shows no row).
 */
export function shortfallLine(pile: Stockpile, zone?: string): string {
  const short = recipeShortfall(pile, zone);
  const kinds = Object.keys(short) as ResourceKind[];
  if (!kinds.length) return '';
  const from = quarryGround();
  const kind = quarryKind();
  const parts = kinds.map((k) =>
    k === kind && from && from !== zone
      ? `${RESOURCE_GLYPH[k]}${short[k]}◂${zoneById(from).name}`
      : `${RESOURCE_GLYPH[k]}${short[k]}`,
  );
  return `short ${parts.join(' ')}`;
}
