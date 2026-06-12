/**
 * Keeper avatars (BACKLOG-158, CHARTER v4) — the player is one of a roster of time-traveling
 * robot observers (BACKLOG-155); this gives them faces. Pixel-grid rigs in the Gen3 style, the
 * same medium as the dinos, but a deliberately *mechanical* read: front-facing, geometric,
 * cooler/brass tones, an optical visor instead of an animal eye — a machine watching the bowl,
 * not a creature in it.
 *
 * Pure TypeScript (no Phaser): every frame is Node-testable. bake.ts rasterizes these keyed by
 * keeper id; an observer with no rig falls back to the original flat amber square, so the build
 * never breaks while the roster is drawn one at a time (foundation + proof here = AETHER-1).
 *
 * Grid is 16×20 (taller than wide, a standing figure), baked ×2 → 32×40. Frames follow the dino
 * convention — stand / step-left / step-right, amble sequence [0,1,0,2] — but only the legs move;
 * the body rows are shared via slice(0,16) so a pose edit can never desync the torso.
 */

export interface KeeperRig {
  id: string; // keeper id — the anim/texture key root (e.g. 'aether')
  width: number;
  height: number;
  /** Unique frames: stand, step-left, step-right. */
  frames: ReadonlyArray<ReadonlyArray<string>>;
  /** Anim order into `frames` — the classic 4-beat amble. */
  sequence: ReadonlyArray<number>;
  /** Char → color. Fixed per observer (robots aren't a colour-keyed species family). ≤ 15 + transparency. */
  palette: Record<string, number>;
}

// ── AETHER-1 "Aki" — the default observer, first through the keeper pipeline ─────────────────
// A diplomacy unit (Empath Protocol): rounded brass chassis, a wide calm cyan optic visor, a
// single antenna with a warm tip light, a glowing chest core, stub arms, and two short legs that
// step. Front-facing so the watcher reads as facing *you*, distinct from the side-on cast.

const AKI_BODY: ReadonlyArray<string> = [
  '........g.......',
  '........o.......',
  '....oooooooo....',
  '...obbbbbbbbo...',
  '...ovvvvvvvvo...',
  '...ovveeeevvo...',
  '...obbbbbbbbo...',
  '...obbbbbbbbo...',
  '..oobbbbbbbboo..',
  '.obbbbbbbbbbbbo.',
  '.obblbbggbblbbo.',
  '.obbbbbggbbbbbo.',
  '.obbbbbbbbbbbbo.',
  '..obbbbbbbbbbo..',
  '..obbbbbbbbbbo..',
  '..oobbbbbbbboo..',
];

const AKI_STAND: ReadonlyArray<string> = [
  ...AKI_BODY,
  '....dd....dd....',
  '....dd....dd....',
  '...odd....ddo...',
  '...ooo....ooo...',
];

const AKI_STEP_L: ReadonlyArray<string> = [
  ...AKI_BODY,
  '...dd......dd...',
  '...dd......dd...',
  '..odd......ddo..',
  '..ooo......ooo..',
];

const AKI_STEP_R: ReadonlyArray<string> = [
  ...AKI_BODY,
  '.....dd..dd.....',
  '.....dd..dd.....',
  '....odd..ddo....',
  '....ooo..ooo....',
];

export const AKI_RIG: KeeperRig = {
  id: 'aether',
  width: 16,
  height: 20,
  frames: [AKI_STAND, AKI_STEP_L, AKI_STEP_R],
  sequence: [0, 1, 0, 2],
  palette: {
    o: 0x20202e, // cool near-black outline (never pure black)
    b: 0xc8a85a, // brass chassis base
    l: 0xe8d088, // brass highlight (light upper-left)
    d: 0x8a6e38, // brass shadow / legs
    v: 0x70d0d8, // visor glass — calm cyan, the empath's optic
    e: 0x12303a, // optic interior (dark)
    g: 0xffe27a, // warm glow — antenna tip + chest core
  },
};

/** Observers drawn in pixel; bake.ts renders these, others fall back to the amber square. */
export const KEEPER_RIGS: Record<string, KeeperRig> = {
  aether: AKI_RIG,
};
