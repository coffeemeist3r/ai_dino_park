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
