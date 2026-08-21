# Cycle 136 — Design

Milestone 15 ("Somebody does it"), arc 1 on both tracks. Two independent items; the only shared file is
`WorldScene.ts`, in regions that do not touch.

---

## Lore track — BACKLOG-420

### Item
**BACKLOG-420 [social] Caught again** — greet a fond dino mid-tic a second time in the same solitary
stretch and its pleasure turns to playful teasing, so a repeat catch reads different from the first warm
one. Builds on 413 / 408.

### Why this cycle
The catch has forked exactly two ways since cycle 89: bashful (`bashfulOpener`) if the dino barely knows
you, pleased (`fondOpener`) if it loves you. Both are constant strings. A player who walks up to Sunny
mid-ritual and presses Z five times in the same unbroken stretch of solitude gets the identical opener
five times, and the memory is filed once and then never again (`ticCaughtFiled`). That is a lookup table,
not a mind, and it is the most-repeated interaction the tic family has — the ritual is the one behaviour
in this park a player is *invited* to interrupt. Giving the catch a register that climbs inside one
stretch is the smallest change that turns a repeated event into a relationship, and it is reachable in
the first minute of a fresh save.

Distinctness is the second half and is not optional here: a single new "you again?" string would make all
eight dinos tease you the same way. The tease is worded from the dino's **signature axis** — the same
`signatureAxis` read that already decides which ritual it invented — so a jittery Twitch and an aloof
Glade object to being spied on in their own registers.

### What ships
A per-stretch **catch count**. In one unbroken solitary stretch (the stretch `resetTic` clears — broken by
company or a pressing need, *not* by the keeper walking up, since `companyNear` counts only dinos):

| catch # | a dino that is **fond** (hearts >= `FOND_MIN`) | a dino that is **not fond** |
|---|---|---|
| 1st | pleased — `fondOpener()`, unchanged from 413 | bashful — `bashfulOpener()`, unchanged from 408 |
| 2nd | **teasing** — a new opener drawn from its signature axis | bashful, unchanged |
| 3rd and after | **fondly resigned** — a new opener, also axis-drawn | bashful, unchanged |

Only the fond branch escalates, exactly as the item states — teasing the keeper is a thing warmth earns.
A dino you barely know stays bashful however many times you catch it, and that flatness is now a *read*
rather than an oversight: the escalation is the tell that this dino likes you.

Each new register files its own memory the first time it is reached in a stretch (so a stretch can leave
at most one pleased, one teasing and one resigned note), and the ticker/book are untouched. `resetTic`
clears the count and the filed set, so a later stretch starts warm again — being caught twice today does
not make a dino permanently sardonic.

### Acceptance criteria
- [ ] With hearts >= `FOND_MIN` and a tic invented, the **first** greet returns the 413 fond opener (spec `cycle-089-fond-caught` still passes unchanged).
- [ ] A **second** greet in the same stretch returns a line that is neither `fondOpener()` nor `bashfulOpener()` and reads as teasing.
- [ ] A **third** and a **fourth** greet in the same stretch both return the same resigned opener (the register floors at 3+; it does not keep inventing).
- [ ] Two dinos with **different signature axes**, both fond, both caught twice, return **different** tease text.
- [ ] A dino with hearts < `FOND_MIN` returns `bashfulOpener()` on the 1st, 2nd and 3rd catch — no escalation without warmth.
- [ ] After `resetTic` (company arrives / a need bites), the next catch in a **new** stretch is the 1st-catch fond opener again.
- [ ] Each register files at most one memory per stretch: after catches 1–4 the dino's recall ring contains exactly one pleased-, one tease- and one resigned-flavoured note (no duplicate on catch 4).
- [ ] The greet path still returns within the existing dialog flow (no new await), and a cancelled greet does not leak a register into the next dino (the 408 `caughtTic = null` guard still holds).
- [ ] Unit tests cover the register table (pure, Node-testable, no Phaser) across all five axes.
- [ ] E2E `tests/e2e/cycle-136-caught-again.spec.ts` drives the real `__pickTone` greet path with zero console errors.

### Out of scope
- BACKLOG-422 (a lasting affinity bump for being caught fond) — a separate queued item; this cycle changes **words and memory only**, no bond/affinity numbers move.
- BACKLOG-423 (brain-prompt nudge from the ritual) — the openers stay deterministic frames prefixed to whatever the brain/stub returned; the model is never asked to be teasing. The `NPCBrain` boundary is untouched.
- The collection book (`ticBookLine`) and the ticker — no new lines.
- Any change to tic onset, anchor, echo, grief or kinship.

### Constraints
- The escalation must be **pure** in `world/tic.ts` (`caughtRegister` + the opener/memory builders); `WorldScene` holds only the counter and the filed set.
- Additive save only. The per-stretch counter is transient state that `resetTic` already clears — it is **not** persisted (a save/restore mid-stretch legitimately starts the stretch's register over; nothing in the park has ever persisted `soloSteps` either).
- Do not touch `fondOpener` / `bashfulOpener` — existing e2e specs match their text.
- `fondOfBeingCaught` stays the fond gate; do not invent a second warmth bar.

---

## Structure track — BACKLOG-488

### Item
**BACKLOG-488 [core] Hands on the derelict** — make repair a *job* a resident does: a dino walks to the
fallen landmark and the patch-up resolves on arrival rather than on the day tick.

### Why this cycle
480 gave a landmark a running cost and disrepair a reversible cure, and the cure is arithmetic —
`runUpkeep` flips the oldest derelict flag the instant the pile can spare `REPAIR_COST`, with nobody
anywhere near it. Every other economy in this park is *performed*: the resident nearest the plot hauls
the share (448), a courier crosses an edge and keeps the pride of having carried it (451), a landmark is
raised where a dino stood. Repair happens *to* a ground rather than *in* it.

And it now clears the CHARTER v7 reachability bar for the first time. Two things changed last cycle: the
day boundary costs 24 real minutes instead of 24 real hours, and every ground has residents standing on
it. What is still in the way is `upkeep.ts`'s own founding calibration — one landmark per ground, no bill,
nothing derelict — which its header currently describes as a virtue ("a fresh park is inert"). Under v7's
corollary that is the defect, so the founding change ships **in this cycle**, not behind it.

### What ships
**1 — The founding park has a ruin to mend.** A fresh save (and only a fresh save — the `!save` branch of
`setupSave`) seeds the **Grove** with a fallen cairn and two stone in its pile. Bramble and Pip live
there, it is one edge from the player's spawn, and it draws immediately at `DERELICT_ALPHA`: the first
structure a new player ever walks up to is a broken one. Restores are untouched — an existing save
restores exactly what it wrote.

**2 — Somebody mends it.** Once per world step, in the zone the player is **looking at**, if that ground
carries a derelict landmark, its pile can afford `REPAIR_COST`, and a real-time cooldown has elapsed
(`cooldownReady`, the 333 gate — so it is a beat, not a stampede), the ground dispatches its **nearest
resident** to the oldest ruin (`pickNearest`, the 448 tie-break). That dino walks — visibly, overriding
its ordinary wander the way an escort does (381) — and **on arrival**:
- the pile pays `REPAIR_COST`,
- `derelict` clears and the landmark redraws at full alpha,
- the fixer floats the mend glyph and a bubble, files a memory naming the ground and the structure ("put
  the Grove's cairn back up"), and the ticker gets 480's own `patchedLine`.

The errand carries a step budget; if it runs out, or the fixer leaves the zone, the mend is abandoned with
**nothing spent** — the pile is debited on arrival, never on dispatch, so a failed errand costs the ground
nothing and the next pass simply tries again.

**3 — The day tick stops doing it by hand.** The **live** upkeep pass (`runUpkeepPass(1)`) now asks
`runUpkeep` for the bill only (it passes `derelict = 0`), so lapsing is unchanged and repairing is the
mend job's business. The **away catch-up** (`runUpkeepPass(days)`) keeps the full `runUpkeepOverDays`
arithmetic — nobody is watching an unattended park, and 480's convergence over an absence must not change
meaning. `world/upkeep.ts` itself is not edited.

### Acceptance criteria
- [ ] A brand-new save shows exactly one derelict landmark, in the Grove, drawn at `DERELICT_ALPHA`; `__landmarks('grove')` reports 1 record with `derelict: true` and `__standing('grove') === 0`.
- [ ] A restored save seeds **nothing** — after a `__saveNow` / reload round-trip the Grove still has exactly one landmark (no second founding cairn, ever).
- [ ] The founding ruin costs the Grove no upkeep: `__runUpkeep(1)` on a fresh park returns `[]` (a derelict landmark owes nothing — 480's rule, unchanged).
- [ ] Standing in the Grove, within the mend step budget a resident reaches the ruin, the ticker shows 480's `patchedLine`, `__landmarks('grove')` reports `derelict: false`, and the Grove's pile has fallen by `REPAIR_COST`.
- [ ] The fixer's recall ring contains a memory naming the Grove and the structure it put back up.
- [ ] `__mend()` reports the live errand (fixer, zone, target tile, steps) while it is running and `null` before dispatch and after it resolves — one mend at a time.
- [ ] A ground whose pile cannot afford `REPAIR_COST` dispatches nobody (`__mend()` stays `null`) and its ruin stays derelict.
- [ ] A ground with a derelict landmark and **no residents** dispatches nobody — the ruin waits (it does not silently self-patch on the live tick).
- [ ] A live `__runUpkeep(1)` on a ground with a stocked pile and a ruin **does not** patch it — only the mend errand does.
- [ ] `__runUpkeep(7)` (the away form) still patches arithmetically, and the existing 7-day lapse assertions in `cycle-128-upkeep.spec.ts` still hold.
- [ ] The mend errand does not fire in a zone the player is not in.
- [ ] Unit tests cover the pure mend module (dispatch decision, affordability, budget, line/memory builders); e2e `tests/e2e/cycle-136-mending.spec.ts` walks the player to the Grove and watches the repair happen, zero console errors.

### Out of scope
- 485's gathering lean, the council, and the upkeep bill itself — untouched.
- Ruin **art** (BACKLOG-494, seeded this cycle for the Artist); disrepair keeps drawing at `DERELICT_ALPHA`.
- Multiple simultaneous mends, cross-zone fetching of materials, or a durable "fixer" role. One errand, one ground, the resident already standing there.
- Editing `world/upkeep.ts`. The arithmetic is unchanged; only its *caller* changes.

### Constraints
- New module name must **not** be `repair.ts` — that is taken (BACKLOG-125, repairing a jealous slight). Use `world/mending.ts`.
- Additive save only. The founding seed writes ordinary `cairns` / `stockpileByZone` entries, so it round-trips through the existing fields with no version bump and no new save key.
- The founding seed must live behind the `!save` branch, and the pile/landmark it writes must be reachable through the existing `__setZonePile` / `__landmarks` hooks so QA drives production paths.
- `cycle-128-upkeep.spec.ts` assumes a fresh park has nothing derelict and that a live pass patches. Both assumptions are the ones this item changes — update that spec deliberately (CHARTER v7: specs whose subject is the founding state assert the new one) and say so in the codeplan; do not weaken any assertion that is not about those two facts.
- The mend must not pre-empt sleep, a hunt, a migration crossing or the 381 escort — slot it at the same rank as gathering, below huddling.
- **File overlap with the lore track:** both edit `WorldScene.ts`. The lore track touches `replyFor` (~line 6090) and `resetTic` (~3710); the structure track touches `setupSave`, `runUpkeepPass` (~6550), the world-step movement branch (~4190) and the dev-hook block. Build the structure track first (larger), then the lore track.
