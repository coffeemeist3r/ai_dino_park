/**
 * The sulk shakeoff (BACKLOG-123) — a funk that ends without being attended to.
 *
 * Since cycle 31 a near-tied runner-up has sulked when the keeper comes home to somebody else
 * (`homecoming.ts` → `jealous`), and since cycle 33 a make-up greet has repaired it (`repair.ts`).
 * What has never existed is the other exit. `pendingRepair` is a flag with exactly one way out, so a
 * dino the keeper never walks back to sulks for as long as the tab is open — a permanent negative state
 * in a park whose charter calls permanent states a defect.
 *
 * The window is named in **ambient steps**, not in game-days, and that is the whole point. At the
 * shipping clock an in-game day costs twenty-four real hours, so a mood timed off the day boundary is a
 * mood that never turns; CHARTER v7 measures a feature over ten minutes of a fresh save, and this has to
 * clear inside that. The sibling that already made this decision is `tic.ts`'s
 * `STING_FADES_AFTER_STEPS = 24` (72s), whose comment reasons that a fed or accompanied dino should be
 * over it *well within a play session*. A slight outlasts a bad moment at the hatch, so this is longer —
 * but not so long that the keeper cannot beat it on foot, which is the constraint that fixes the number.
 *
 * Pure: no Phaser, no WebLLM, no clock. The caller owns the step counter.
 */

/**
 * How many `WANDER_STEP_MS` (3s) ambient steps a sulk lasts unattended: forty steps, **two minutes**.
 *
 * Long enough that crossing the bowl to make it right is still a race the keeper wins — roughly forty
 * tiles of walking — and short enough that a player who causes a sulk two minutes into a fresh save
 * watches it end inside the ten CHARTER v7 measures over.
 */
export const SULK_FADES_AFTER_STEPS = 40;

/** Has a sulk aged out, given how many ambient steps have passed since it began (BACKLOG-123)? */
export function sulkHasFaded(stepsSince: number): boolean {
  return stepsSince >= SULK_FADES_AFTER_STEPS;
}

/**
 * The memory a dino files when it gets over a slight by itself.
 *
 * Its twin is `repairMemory` — *the keeper noticed X after all* — where the keeper is the subject. This
 * one must not name the keeper at all, because the keeper did nothing. That absence **is** the beat: the
 * book should read differently depending on whether you turned up, and the only way it can is if the
 * unattended ending refuses to take credit for itself.
 *
 * Exported as a builder rather than written at the call site, so a reword cannot silently empty a read —
 * BACKLOG-483's rule, applied at the moment the string is written instead of a hundred cycles later.
 */
export function shookItOffMemory(name: string): string {
  return `${name} got over it without being asked`;
}

/**
 * The floating line over a dino that has shaken it off — deliberately **without a glyph**.
 *
 * The mark family stands at six and cycle 155 refused a seventh for a beat with a better claim than this
 * one. The visual half of this moment is `liftMood`'s existing `reliefFlourish`, which fires beside this
 * line; putting an emoji in here too would be two marks for one recovery.
 */
export function shookItOffLine(name: string): string {
  return `${name}: ...anyway.`;
}
