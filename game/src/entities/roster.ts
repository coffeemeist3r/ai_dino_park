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
}

export const ROSTER: ReadonlyArray<DinoSpawn> = [
  { name: 'Rex', species: 'triceratops', personality: 'curious, friendly, loves rocks', color: 0x8a4a3a, tileX: 10, tileY: 7 },
  { name: 'Mossback', species: 'stegosaurus', personality: 'slow to trust, fond of ferns', color: 0x4a7a4a, tileX: 5, tileY: 11 },
  { name: 'Sunny', species: 'brontosaurus', personality: 'sunny, gregarious, always humming', color: 0xd8b84a, tileX: 15, tileY: 4 },
  { name: 'Twitch', species: 'compsognathus', personality: 'jittery, watchful, quick to bolt', color: 0xc0683a, tileX: 16, tileY: 12 },
  { name: 'Glade', species: 'parasaurolophus', personality: 'calm, musical, a little aloof', color: 0x5a8ab0, tileX: 7, tileY: 2 },
];
