/**
 * The starting cast. Pure data (no Phaser) so it's Node-testable.
 *
 * Personalities are NOT listed here — each dino's traits are seeded from its
 * name (see ai/personality.ts), so the roster only needs identity, a spawn
 * tile, and a distinguishing color. Rex stays first as the anchor that the
 * save (cycle 3) and personality (cycle 4) e2e hooks reference as dinos[0].
 * Colors are flat rectangle fills for distinction only — real sprites are
 * the Artist's job (BACKLOG-033–036).
 */

export interface DinoSpawn {
  name: string;
  species: string;
  personality: string;
  color: number;
  tileX: number;
  tileY: number;
  /**
   * The ground this dino wakes up on (CHARTER v7). Absent → the bowl, which is every pre-v7 entry, so the
   * founding five are untouched and every spec written against a bowl-resident cast still holds.
   *
   * The park has had five grounds since cycle 119 and has spawned its whole cast into one of them, at
   * exactly that ground's capacity, for the entire time. Four grounds with plots, landmarks, providers and
   * councils built for them sat empty from boot to save-death, and the ambient migration that was supposed
   * to populate them needed ~25 real minutes to move one body one edge. A world you have to be told is
   * there is not a world. The cast ships across it now.
   */
  zone?: string;
}

export const ROSTER: ReadonlyArray<DinoSpawn> = [
  { name: 'Rex', species: 'triceratops', personality: 'curious, friendly, loves rocks', color: 0x8a4a3a, tileX: 10, tileY: 7 },
  { name: 'Mossback', species: 'stegosaurus', personality: 'slow to trust, fond of ferns', color: 0x4a7a4a, tileX: 5, tileY: 11 },
  { name: 'Sunny', species: 'brontosaurus', personality: 'sunny, gregarious, always humming', color: 0xd8b84a, tileX: 15, tileY: 4 },
  { name: 'Twitch', species: 'compsognathus', personality: 'jittery, watchful, quick to bolt', color: 0xc0683a, tileX: 16, tileY: 12 },
  { name: 'Glade', species: 'parasaurolophus', personality: 'calm, musical, a little aloof', color: 0x5a8ab0, tileX: 7, tileY: 2 },
  // CHARTER v7 — the grounds past the bowl get residents. Species are reused deliberately rather than
  // invented: the pixel rigs are colour-keyed (`rig.palette(baseColor)`, and the anim key carries the
  // colour), so a second triceratops in a different ramp bakes its own texture and reads as its own animal
  // — while traits stay name-seeded, so these are genuinely distinct minds and not reskins. No new art
  // needed, and the rectangle fallback control is untouched (it still rides on an undrawn species).
  { name: 'Bramble', species: 'stegosaurus', personality: 'territorial, tends the grove like a garden', color: 0x6f9a3c, tileX: 6, tileY: 8, zone: 'grove' },
  { name: 'Pip', species: 'compsognathus', personality: 'small, loud, certain it is in charge', color: 0xe0a23a, tileX: 13, tileY: 5, zone: 'grove' },
  { name: 'Thornback', species: 'triceratops', personality: 'old, slow, remembers the fern flats before the rest', color: 0x9a5f7a, tileX: 9, tileY: 9, zone: 'fernreach' },
];
