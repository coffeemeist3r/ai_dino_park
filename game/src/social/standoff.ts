/**
 * Rivals square off (BACKLOG-024). Pure (no Phaser).
 *
 * Two dinos the grudge graph calls rivals (574) who bump into each other on one ground do not meet: they
 * bristle, and the less bold one backs away. Non-lethal and costless — no hearts, no bond — it is a read on
 * the graph the player can watch, not a mechanic that moves it.
 */

export const STANDOFF_COOLDOWN_STEPS = 20; // ~60 s of ambient steps between two standoffs of one pair
export const STANDOFF_BACKOFF = 2; // tiles the yielder gives up
export const STANDOFF_ART_KEY = 'standoff';
export const STANDOFF_GLYPH = '💢';

type Tile = { tileX: number; tileY: number };

/** Who holds and who backs down: the bolder holds; a tie goes to the name that sorts first. */
export function squareOff(
  a: { name: string; bravery: number },
  b: { name: string; bravery: number },
): { holder: string; yielder: string } {
  const aHolds = a.bravery > b.bravery || (a.bravery === b.bravery && a.name < b.name);
  return aHolds ? { holder: a.name, yielder: b.name } : { holder: b.name, yielder: a.name };
}

/** Where the yielder ends up: `STANDOFF_BACKOFF` tiles directly away from the holder, clamped to the ground. */
export function backOffTile(yielder: Tile, holder: Tile, cols: number, rows: number): Tile {
  let dx = Math.sign(yielder.tileX - holder.tileX);
  const dy = Math.sign(yielder.tileY - holder.tileY);
  if (dx === 0 && dy === 0) dx = 1;
  const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v));
  return {
    tileX: clamp(yielder.tileX + dx * STANDOFF_BACKOFF, cols - 1),
    tileY: clamp(yielder.tileY + dy * STANDOFF_BACKOFF, rows - 1),
  };
}

/** Is this pair off its cooldown? `lastAt` is the world step of its last standoff, if any. */
export function standoffDue(lastAt: number | undefined, step: number): boolean {
  return lastAt === undefined || step - lastAt >= STANDOFF_COOLDOWN_STEPS;
}

export function standoffLine(holder: string, yielder: string): string {
  return `💢 ${holder} and ${yielder} squared off — ${yielder} backed down`;
}

export function heldMemory(yielder: string): string {
  return `you stared down ${yielder}`;
}

export function backedMemory(holder: string): string {
  return `${holder} stared you down — you backed off`;
}
