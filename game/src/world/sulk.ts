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

// ── The other door into a sulk (BACKLOG-544) ──────────────────────────────────────────────────────
//
// Everything above is the *jealous* sulk: the keeper came home to somebody else. The park has a second
// way to end up feeling like that, and until this cycle it lasted one frame. A dino that loses a scramble
// at the hatch — it slunk off from a winner that wouldn't budge (394), or it was the winner that ceded to
// a gobbler (387) — got a 😖 or a 😤 for a single flash and was then, from the player's side, identical to
// a dino that had never been at the hatch at all. It now carries a `shoulder` funk on the 544 seam for a
// minute, and gets the same two endings its jealous sibling got last cycle.
//
// These live here rather than in a module of their own because they are the same feeling. A second file
// for the standoff sulk would be a second idiom for one job, which is the debt 544 exists to stop.

/**
 * The memory a dino files when it gets over a bad turn at the hatch by itself.
 *
 * Twin of `shookItOffMemory`, and under the same rule: **it must not name the keeper**, because the keeper
 * did nothing. That the book reads differently depending on whether you turned up is the whole beat.
 */
export function shookOffShoulderMemory(name: string): string {
  return `${name} stopped chewing over the hatch and let it go`;
}

/** The float over a dino that has shaken off a lost scramble. No glyph — `liftMood`'s flourish fires beside it. */
export function shookOffShoulderLine(name: string): string {
  return `${name}: ...it's only food.`;
}

/**
 * The memory a dino files when the keeper turned up while it was still sore about the hatch — by feeding
 * it, by greeting it, either door. Names the keeper, because this time the keeper is why.
 */
export function shoulderMendedMemory(name: string): string {
  return `the keeper came over while ${name} was still sore about the hatch`;
}

/** The float over a dino the keeper cheered up after a lost scramble. */
export function shoulderMendedLine(name: string): string {
  return `${name}: ...alright. alright.`;
}
