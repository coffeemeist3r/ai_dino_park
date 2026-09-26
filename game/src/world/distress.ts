/**
 * Distress call (BACKLOG-194) — the first time sound moves a dino. A shivering
 * (179) or startled (057) dino cries out in its own voice (191, distress
 * register) and its closest friend — chosen by the cycle-33/34 consolation
 * rules in `comfort.ts`, reused verbatim — turns toward the sound.
 *
 * Pure TypeScript (no Phaser, no WebAudio): Node-testable. This module owns
 * only the *who cries* pick and the responder's line/memory; who answers is
 * `comforter()`'s call, and the cry's sound is `distressParams()` in chirp.ts.
 */

/** How many world steps the responder spends walking toward the caller. */
export const DISTRESS_STEPS = 6;

/**
 * One cry per beat: among the candidates, the most distressed calls out —
 * lowest `level` wins (bravery for a startle, strongest-bond for a cold
 * morning), ties to the lexicographic-smallest name (the `topBy` convention).
 */
export function mostDistressed(cands: Array<{ name: string; level: number }>): string | null {
  let worst: { name: string; level: number } | null = null;
  for (const c of cands) {
    if (!worst || c.level < worst.level || (c.level === worst.level && c.name < worst.name)) {
      worst = c;
    }
  }
  return worst ? worst.name : null;
}

/** The responder's bubble — it heard the cry and knows the voice. */
export function hearLine(caller: string): string {
  return `👂 ${caller}?!`;
}

/** The memory the responder files; rides the existing store into its greetings. */
export function heardMemory(caller: string): string {
  return `heard ${caller} cry out and went to it`;
}

/**
 * The keeper hears trouble (BACKLOG-204).
 *
 * Every output of a distress call has been local to the two dinos involved — the cry, the bubble,
 * the walk. A keeper standing in another zone, or simply looking at another corner of this one,
 * learned nothing until the mood showed up later. This is the line that reaches them: the ticker
 * they are already reading names who called and the ground to find them on.
 *
 * The trigger picks the verb on purpose. "Startled" and "cold through the night" are different kinds
 * of trouble and want different things from the keeper, and the ticker is the only place in the park
 * where that difference reaches a player at all.
 */
export function distressEventLine(caller: string, trigger: 'startle' | 'cold', where: string): string {
  const what = trigger === 'cold' ? 'is calling, shivering, from' : 'is calling out from';
  return `📢 ${caller} ${what} ${where}`;
}

/** How long a barely-bonded friend takes to call back, ms. */
export const CALLBACK_SLOW_MS = 520;

/** How fast an inseparable one does, ms. Short, but never zero — an answer needs a gap to be one. */
export const CALLBACK_FAST_MS = 120;

/** The top of `bondPoints`' range; `strengthen` clamps there. */
const BOND_MAX = 100;

/**
 * Answered across the bowl (BACKLOG-202) — the pause between a cry and the friend calling back.
 *
 * `comforter()` has picked who turns toward a cry since cycle 33, and the strength of that bond has
 * only ever reached the player as *which* dino got up. This is the same number, made audible: a
 * close friend answers almost on top of the cry, a barely-bonded one takes a beat to decide. Same
 * shape as `answerDelayMs(hearts)` on the keeper's axis — monotone non-increasing, positive at the
 * top.
 */
export function callbackDelayMs(bondPts: number): number {
  const w = Math.min(BOND_MAX, Math.max(0, bondPts)) / BOND_MAX;
  return Math.round(CALLBACK_SLOW_MS - (CALLBACK_SLOW_MS - CALLBACK_FAST_MS) * w);
}
