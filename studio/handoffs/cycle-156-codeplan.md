# Cycle 156 — Code Plan

Two tracks, both landing in `WorldScene.ts` in disjoint regions. **Build order: structure first, lore
second, one full suite run at the end** — the structure track touches `setupGovernor`/`plaqueStats`
(lines ~1290, ~6170) and the lore track touches the `forceStep` tail and the greet/feed sites (~2670,
~5200, ~7820), so a merge conflict between them is not possible, but a single suite run is.

---

## Prior art found — read this before writing anything

The survey turned up **three things the design assumed had to be built and that already exist**. Each
one shrinks the diff, and the third one changes a decision.

1. **`this.worldSteps`** (`WorldScene.ts:477`) is the monotonic ambient-step counter, incremented at the
   top of `forceStep`. `stungAt[name] = this.worldSteps` + `stingIsFresh(this.worldSteps - at)`
   (`tic.ts:105-110`) is the exact pattern the sulk clock wants. Copy the shape; do not invent a timer.
2. **`liftMood(d)`** (`WorldScene.ts:2672`) already does the whole recovery beat — `reliefFlourish`,
   `flashFeed`, and the BACKLOG-325 `liftedUntil` perk window. The unattended shake-off calls it. No new
   glyph, no new flourish path.
3. **`this.sessionStartedAt`** (`WorldScene.ts:689-690`) **already exists.** BACKLOG-119/541 added it as
   the input to `SESSION_MIN_MS` for the parting glance. So the structure track does **not** add a session
   start field — it adopts this one. See "The one real decision" below.

Also confirmed present and not to be duplicated: `SESSION_MIN_MS` (`departure.ts:60`), `shouldStamp`
(`departure.ts:81`), the single departure call site (`WorldScene.ts:6180`, whose comment already says
*do not add a second blur listener*), and the plaque's optional-line convention (`plaque.ts:44-80`).

---

## Structure track — BACKLOG-542

### The one real decision: `sessionStartedAt` is never reset

Today it is set once at field-initialisation and never touched again except by the `__ageSession` test
hook. So after an alt-tab and a return, it still holds **boot time**, and "this sitting" means "this page
load".

542 needs it to mean *this sitting*. Two options:

- **(a) Add a second field** for 542 and leave `sessionStartedAt` alone. Rejected: two fields both named
  for the start of a sitting, disagreeing after the first alt-tab, is a constant written down twice —
  BACKLOG-483's defect, and the one cycle 155 corrected one fire ago.
- **(b) Reset `sessionStartedAt` on the return to `here`.** Taken.

**(b) has a deliberate, in-scope side effect on BACKLOG-119 and the Coder must not hide it.** The parting
glance requires `Date.now() - sessionStartedAt >= SESSION_MIN_MS`. Today, a keeper who boots, sits five
minutes, alt-tabs, returns, and alt-tabs again ten seconds later gets a goodbye glance — because the
elapsed time is measured from boot. After (b) they do not, because that second sitting was ten seconds
long. **That is the correct reading of the constant's own doc comment** (`departure.ts:53-59`: *how long
a session must have run before leaving it counts as a goodbye*), and the current behavior is the
accidental one.

**If a BACKLOG-119 e2e spec reddens on this, it is a true behavior change and not a flake.** Do not loosen
the assertion. Update the spec to the new semantics and say so in the codeplan's shipped notes, so QA and
the Validator see the change was chosen rather than absorbed. If more than two specs redden, stop and write
it into the blocker section instead — that would mean the semantics are load-bearing somewhere this plan
did not look.

### Files

**NEW `game/src/world/session.ts`** — pure, no Phaser, no `Date.now()` inside (caller passes `now`).

```ts
export interface SessionRecord { startedAt: number; endedAt?: number }
export const SESSIONS_KEPT = 3;
export function openSession(now: number): SessionRecord
export function closeSession(rec: SessionRecord, now: number): SessionRecord   // idempotent
export function sessionMs(rec: SessionRecord, now?: number): number            // open → measures to now
export function pushSession(list: readonly SessionRecord[], rec: SessionRecord, keep = SESSIONS_KEPT): SessionRecord[]
export function sittingLine(ms: number): string                                // '40s' | '1m 40s' | '12m' | '1h 4m'
```

- `closeSession`: `rec.endedAt !== undefined ? rec : { ...rec, endedAt: now }`. Returns the **same object**
  when already closed, so the blur→visibilitychange double-fire cannot re-stamp.
- `sessionMs`: `Math.max(0, (rec.endedAt ?? now ?? rec.startedAt) - rec.startedAt)`. Never negative — a
  clock that jumps backwards reads 0, it does not read a negative sitting.
- `pushSession`: newest first, `[rec, ...list].slice(0, keep)`.
- `sittingLine`: under 60s → `${s}s`; under 60m → `${m}m` when seconds are 0 else `${m}m ${s}s`; else
  `${h}h ${m}m`. Import **nothing**; it is arithmetic.
- **Do not define `SESSION_MIN_MS` here.** The gate lives at the WorldScene call site, importing it from
  `departure.ts`, because that is where a session's start already lives.

**NEW `game/src/world/session.test.ts`** — covers every acceptance criterion for the module: open/close,
close idempotence (same reference back), `sessionMs` open vs closed vs backwards clock, `pushSession` cap
of 3 and newest-first ordering, and `sittingLine` at 0, 40_000, 100_000, 720_000, and 3_840_000.

**EDIT `game/src/ui/plaque.ts`** — add one optional field and one line, in the established style:

```ts
/** How long this sitting has run (BACKLOG-542), from `sittingLine`. Absent/empty → no line. Sits
 *  directly above the Keeper streak, which stays last on the brass (154). */
sitting?: string;
```
…and in `plaqueLines`, `if (s.sitting) lines.push(\`Sitting · ${s.sitting}\`);` **immediately before** the
`streak` push. The `Keeper ·` line does not move.

**EDIT `game/src/ui/` plaque tests** — one case asserting `Sitting · 4m` renders above `Keeper ·`, and one
asserting that a `PlaqueStats` with no `sitting` is byte-identical to today's output.

**EDIT `game/src/scenes/WorldScene.ts`** — five small edits:

1. Import `openSession, closeSession, pushSession, sessionMs, sittingLine, type SessionRecord` from
   `../world/session`, and `SESSION_MIN_MS` from `../world/departure` (already imported alongside
   `departureStage`/`shouldStamp` — extend the existing import, do not add a second).
2. Beside `sessionStartedAt` (~line 689), add `private sessions: SessionRecord[] = [];` with a doc line
   saying the last three closed sittings, newest first, and that the **open** one is `sessionStartedAt`.
3. In `applyDeparture` (~6180), after `this.onDeparture(next)` and **before** `void this.saveGame()`:
   close the sitting — build the record from `sessionStartedAt`, and push it only when
   `sessionMs(rec) >= SESSION_MIN_MS`. On the **return** branch (`next === 'here'`, which returns early
   today because `shouldStamp` is false) reset `this.sessionStartedAt = Date.now()`. That reset must sit
   *before* the `shouldStamp` early-return, so put it right after `this.departure = next`, guarded on
   `next === 'here' && prev !== 'here'`.
4. `plaqueStats()` (~1291): add `sitting: sittingLine(Date.now() - this.sessionStartedAt),`
   **above** the `streak` line.
5. Save: add `sessions` to `currentSaveData()` and read it back in the load path with `?? []`. Additive —
   an old save has no key and gets an empty list. Follow whatever the neighbouring optional fields do; do
   **not** bump a save version.
6. Dev hook beside `__departure`: `(window as any).__sessions = () => this.sessions;`

### Test plan (structure)

- Unit: `session.test.ts` as above. `plaque` tests for the new line and the byte-identical no-`sitting` case.
- e2e (`tests/e2e/`): a new spec — fresh save, read the plaque text, assert it matches `/Sitting · /` and
  that the value is not `0s` after the world has run; then drive a departure and a return via the existing
  visibility hooks the 541/119 specs already use, and assert `__sessions()` has gained one record and the
  plaque's sitting has reset. Use `__ageSession` to clear `SESSION_MIN_MS` rather than sleeping 20s.
- Declare the founding fixture explicitly with `foundingState(page, …)` (BACKLOG-495's seam) — 533 is in
  the queue precisely because specs get away with silence, and a spec written tonight should not add to that.

---

## Lore track — BACKLOG-123

### Files

**NEW `game/src/world/sulk.ts`** — pure.

```ts
export const SULK_FADES_AFTER_STEPS = 40;
export function sulkHasFaded(stepsSince: number): boolean
export function shookItOffMemory(name: string): string
export function shookItOffLine(name: string): string
```

- `sulkHasFaded`: `stepsSince >= SULK_FADES_AFTER_STEPS`. A negative input (a clock that went backwards,
  or a stamp from the future) is **not** faded — `stepsSince >= 0 &&` is not needed for that because a
  negative is already below the threshold, but the test pins it so a later sign change is caught.
- `shookItOffMemory(name)` → `` `${name} got over it without being asked` ``. Register note for the Coder:
  `repairMemory` is *the keeper noticed X after all* — the keeper is the subject. This one must not name
  the keeper at all, because the keeper did nothing; that absence **is** the beat.
- `shookItOffLine(name)` → `` `${name}: ...anyway.` `` — a trailing-off line, **no emoji**. The mark family
  is at six and cycle 155 refused a seventh; the visual beat is `liftMood`'s existing `reliefFlourish`,
  which fires separately. Do not put a glyph in this string.
- Both strings are exported builders and both call sites import them. BACKLOG-483's rule, applied at the
  moment the string is written rather than 120 cycles later.

**NEW `game/src/world/sulk.test.ts`** — `sulkHasFaded` at -1, 0, 1, 39, 40, 41; both builders contain the
name; `shookItOffMemory` does **not** contain the word "keeper" (that is the register assertion, and it is
the one a careless reword would break).

**EDIT `game/src/scenes/WorldScene.ts`** — four edits, all in the lore region:

1. Beside `pendingRepair` (~554): `private pendingRepairAt = 0;` — the `worldSteps` value the sulk began
   at. One field, not a map: `pendingRepair` is a single `string | null`, so there is only ever one sulker.
2. `playHomecoming` (~5963), at `this.pendingRepair = hc.jealous.name;` — add
   `this.pendingRepairAt = this.worldSteps;` on the next line.
3. **New private `checkSulk()`**, called from the `forceStep` tail beside `checkNeeds()`:
   ```
   if (!this.pendingRepair) return;
   if (!sulkHasFaded(this.worldSteps - this.pendingRepairAt)) return;
   const name = this.pendingRepair;
   this.pendingRepair = null;
   this.memory = remember(this.memory, name, shookItOffMemory(name));
   const dino = this.dinoByName(name);
   if (dino) { this.showBubble(dino, shookItOffLine(name)); this.liftMood(dino); }
   void this.saveGame();
   ```
   Place the call **after** `checkFeeding()` in the tail, so a dino that eats this very step takes the
   repair path (below) rather than the shake-off — attended endings outrank unattended ones.
4. Feeding as kindness: in the eat site `checkFeeding` routes to (the `this.lastMeal = …` block around
   line 2660 is the resolved-eat point), add the repair branch — if `this.pendingRepair === d.name`, clear
   it, file `repairMemory(d.name)`, `showBubble(d, repairLine(d.name))`, `liftMood(d)`. Reuse the exact
   three calls `recordGreet` already makes; do not re-implement them. No affinity change beyond the feed's
   own — the design says the bump belongs to the greet path.
5. Dev hook beside `__pendingRepair` (~8662):
   `(window as any).__sulkAge = () => (this.pendingRepair ? this.worldSteps - this.pendingRepairAt : null);`

### Test plan (lore)

- Unit: `sulk.test.ts` as above.
- e2e: a spec that reaches a jealous sulk (the existing BACKLOG-120/125 specs already know how — reuse
  their setup, do not reinvent it), asserts `__pendingRepair()` is the runner-up, drives 40 steps through
  the existing forced-step hook, then asserts `__pendingRepair()` is `null`, `__sulkAge()` is `null`, and
  the book carries the shake-off memory. **No `waitForTimeout` standing in for the window.**
- e2e regression: the same setup, but greet the sulker before the window elapses — assert the repair line
  and that the book carries `repairMemory`'s string and **not** the shake-off one.
- Declare the founding fixture with `foundingState(page, …)`, same reason as the structure spec.

---

## Reuse list (do not add a new module for any of these)

| Need | Already exists |
|---|---|
| monotonic step clock | `WorldScene.worldSteps` |
| "state has aged out" shape | `tic.ts` `stingIsFresh` / `STING_FADES_AFTER_STEPS` |
| recovery beat (flourish + perk window) | `WorldScene.liftMood` → `fidget.reliefFlourish` |
| repair bump / line / memory | `world/repair.ts` |
| memory append | `remember(...)` |
| floating line | `showBubble` |
| session start timestamp | `WorldScene.sessionStartedAt` |
| "long enough to be a sitting" | `departure.ts` `SESSION_MIN_MS` |
| departure transition | `departure.ts` `shouldStamp`, single call site at 6180 |
| optional plaque line convention | `plaque.ts` `stockpile`/`zoneTally`/`upkeep`/`streak` |
| e2e founding fixture | `foundingState(page, name)` (BACKLOG-495) |

## Boundary check

Neither track imports `@mlc-ai/web-llm`, and neither new module imports anything from `game/src/ai/`
except types. Verify before committing:
`grep -rn "@mlc-ai/web-llm" game/src --include=*.ts | grep -v "^game/src/ai/"` must be empty.

## Blockers

_(none at plan time — the Coder appends here if the build or suite will not go green.)_

---

## Shipped (Coder, cycle 156)

Both tracks landed as planned. Gates: `npm run build` clean, **2650 unit** across 251 files (2602 → 2650,
+48), **706/706 e2e**.

### Structure — BACKLOG-542
- NEW `game/src/world/session.ts` (pure) + `session.test.ts`.
- `plaque.ts` gains optional `sitting?`, rendered `Sitting · …` immediately above `Keeper ·`; the streak
  did not move. Doc comment updated from "four optional ones" to five.
- `saveGame.ts`: `sessions?: SessionRecord[]` on the type, a validating parse block in the `awayLog`/`streak`
  style, and the field on the returned object. Additive — no version bump.
- `WorldScene.ts`: `sessions` field, `closeSitting()`, the reset in `applyDeparture`, the plaque line, the
  save write/read, `__sessions()`.
- Three new plaque unit cases including the byte-identical no-`sitting` assertion.

### Lore — BACKLOG-123
- NEW `game/src/world/sulk.ts` (pure) + `sulk.test.ts`.
- `WorldScene.ts`: `pendingRepairAt`, the stamp in `playHomecoming`, `checkSulk()` called after
  `checkFeeding()` in the `forceStep` tail, the feed-as-kindness branch at the eat site, `__sulkAge()`.

### The predicted BACKLOG-119 breakage did not happen, and that is itself a finding

The plan warned that resetting `sessionStartedAt` changes 119's behavior and that a reddened glance spec
would be a true change, not a flake. **No glance spec reddened.** All six passed untouched — because not
one of them exercises a *second* sitting: each boots, ages the session once, blurs once, and asserts.

So the behavior change was real and **entirely uncovered**. Absorbing that silently was the available
move and it was the wrong one. A seventh spec was added to `cycle-155-glance.spec.ts` —
*the second sitting has to earn its own goodbye* — which fails on the pre-156 code (a ten-second second
sitting used to earn a glance, because elapsed was measured from boot) and passes on this one. It cost one
test and it is the difference between a documented semantics change and an undocumented one.

Its first draft failed for an unrelated reason worth recording: it waited 1200ms between the return and
the second blur, and `GLANCE_MS` is 2500 — so it was reading the *first* glance's mark still on screen and
calling it the second. The fix was the spec's timing, not its assertion; the sibling spec two tests down
already waits 3200 for exactly this reason and was the answer sitting in the same file.

### One known flake, recorded

The first run of the two new specs in parallel dropped `cycle-156-sitting`'s first two tests at `boot`
(`__ready` timeout, 30s). Re-run isolated: 5/5 in 4.7s. Both subsequent full-suite runs: green. This is the
cold Vite/Phaser start named in BACKLOG-538, which is in the Structure Track for precisely this reason.

## Blockers

_(none — all gates green.)_
