# Cycle 166 — Design

Two tracks. Not a solo cycle (`state.soloCycle` is false; the Structure-smith declined to declare one
and wrote its reasoning into `cycle-166-structure.md`).

---

## Lore track — BACKLOG-162

**Item:** BACKLOG-162 [emergent] — The bowl remembers its watchers.

### Why this cycle

This is **Milestone 21's last unchecked arc**, and three cycles have been building its inputs without
it being the pick. BACKLOG-555 gave the record a `switches` count and a `previousId` and — crucially —
decided that a cached persona belongs to an *observer*, not to a seat, so a switch already has a clean
before/after on disk. BACKLOG-156 gave the watcher an authored self worth missing. BACKLOG-160 made
the *first* impression per-watcher, which means the park already has a vocabulary for "what a dino can
see when it looks at you" — four notes keyed by roster id, temperament-shaded.

What is missing is the other side of that: **what a dino has to say when the thing it was looking at
is gone.** Today, swapping chassis mid-save changes the avatar, the affinity arithmetic, and the
plaque's tenure line, and the cast does not react at all.

### What ships

**1. The switch is filed, by every dino, in the memory they already have.**

On a *real* switch (`changed === true` in `pickKeeperIndex` — a re-pick is not a switch, per 555), each
dino in `this.dinos` files one memory line through the existing `remember()` ring naming the watcher
that left. One line per dino per switch. It rolls off the ring like everything else, which is the
freshness gate the `mealtime`/`tasted` asides already use — the park does not mourn forever.

**2. A dino that preferred the old watcher says so, and says which one.**

New pure module `game/src/keeper/succession.ts`:

- `missesWatcher(prev, next, traits, hearts): boolean` — does this dino miss the observer that left?
  **Two independent doors, and the first is the reachable one:**
  - **Fit.** `keeperFit(prev, traits) - keeperFit(next, traits) >= MISS_MARGIN`. The old chassis suited
    this animal better than the new one does. This needs **zero friendship** and is true on day 1.
  - **Fondness.** `hearts >= MISS_HEARTS` — a dino that was close to you under the old chassis misses
    it regardless of fit. This is the item's own wording and it is the *unreachable* door on a fresh
    save; it ships beside the fit door, not instead of it.
- `missAside(prevId, traits): string` — the wistful clause. A `MISSES: Record<string, Note>` table in
  the `voice.ts` shape (prickly / warm / plain), keyed by the **departed** watcher's id.

  **This is the part that decides whether the item is any good.** The line must be about *that
  watcher*, not about change. The register already established by `voice.ts` is the material: the dino
  saw the hum, the red eye, the round writing eye, the family smell. The miss is the absence of that
  specific thing. `there was a humming one before you. it isn't humming now.` — not `something is
  different about you.` A generic line here is a REWORK.

- `MISS_MARGIN`, `MISS_HEARTS` exported so the specs assert against the constants, not against magic
  numbers. **Per CHARTER v7's corollary, `MISS_MARGIN` must be set so the founding roster actually
  crosses it** — pick a value and then prove it against the founding cast in a unit test, rather than
  picking a value that reads well. A margin no founding dino can clear is the dormant-constant defect.

**3. It reaches the player's ear through the greet path, once per dino per switch.**

`GreetContext` gains `missed?: string` (the departed watcher's id), set in `pickTone` exactly the way
`watcher` is: hoisted above `recordTone` for the same save-ordering reason 160 documents. `cannedReply`
composes `missAside` immediately after `firstLook`, with its own headroom added to the cap chain —
mirror 160's `headroom` discipline exactly, so a reply with no miss is **byte-identical** to today.

**Precedence:** when a dino would say both its first-look aside (160) and its miss aside, the **miss
wins** and the first look is suppressed for that one greet. Two watcher clauses in one sentence is a
paragraph, not a beat, and the more interesting of the two is the one about the watcher who left.
The first look is not lost — `metWatcher` is unchanged, so it still fires on the *next* greet.

The "once per dino per switch" bookkeeping reuses `voice.ts`'s exact idiom: a `Record<dinoName,
keeperId>` of who has already been told, persisted additively in the save. It is a second map, not a
reuse of `metWatcher` — `metWatcher` is what makes the first look fire, and overloading it would make
one beat silence the other.

**4. The switch is audible at park level, immediately.**

`pickKeeperIndex` logs one ticker line on a real switch naming how many of the cast noticed —
so a player who switches on day 1 sees a consequence before they have walked anywhere.

### Acceptance criteria

- [ ] `missesWatcher` returns true for a founding dino when the departed watcher's `keeperFit` beats the incoming one's by at least `MISS_MARGIN`, with `hearts = 0`
- [ ] `missesWatcher` returns true at `hearts >= MISS_HEARTS` even when the fit difference is zero or favours the new watcher
- [ ] `missesWatcher` returns false when neither door opens
- [ ] A unit test proves at least one dino of the **founding roster** clears `MISS_MARGIN` for at least one ordered pair of watchers, at zero friendship (the v7 corollary — the constant is not dormant)
- [ ] `missAside` returns a non-empty, distinct string for every id in `KEEPERS` (the mute-fifth-watcher guard `voice.ts` already carries), in all three temperament shades
- [ ] No two watchers' `missAside` plain lines are equal, and each names something concrete about that specific watcher
- [ ] `missAside` with an empty or undefined id returns the empty string
- [ ] `cannedReply` output is **byte-identical** to the pre-change build for any context with `missed` unset (assert against a pinned string)
- [ ] When both `watcher` and `missed` are set, the reply contains the miss clause and does **not** contain the first-look clause
- [ ] e2e: on a fresh save, press `K`, pick observer 1, then press `K` and pick a different observer — `__keeperRecord().switches === 1` and `__keeperRecord().previousId` is the first id
- [ ] e2e: after that switch, `__ticker()` contains a line naming the change
- [ ] e2e: after that switch, every dino's memory carries a line naming the watcher that left
- [ ] e2e: after that switch, greeting a dino that `missesWatcher` selects produces a reply containing that watcher's miss clause, on **day 1 with zero friendship** — the reachability proof
- [ ] e2e: greeting the same dino a second time does not repeat the miss clause
- [ ] e2e: pressing `K` and re-picking the observer already worn files **no** memory, **no** ticker line, and produces no miss clause (a re-pick is not a switch)
- [ ] A save written before this cycle loads without throwing and without a miss clause (additive)

### Out of scope

- Any LLM-authored miss line. This is deterministic canned prose, the way `voice.ts` is — it must ship
  to a device that never loads a model.
- Changing `switchTo`, `KeeperRecord`, or the persona-drop rule. 555 decided those and was right.
- A dino *seeking out* the old watcher, wandering to where it stood, or any pathing beat.
- Any change to `metWatcher` semantics or to the first-look aside's own content.

### Constraints

- Pure TypeScript in `keeper/` and `ai/`; no Phaser imports in the new module. Node-testable.
- `@mlc-ai/web-llm` stays out of everything touched here.
- Save changes additive only: a new optional map, no migration, no renamed field.
- The miss map must be **hoisted above `recordTone`** in `pickTone`, for the reason 160's comment gives.
- **File overlap with the structure track: `WorldScene.ts`.** Different regions — this track touches
  `pickTone` (~8226) and `pickKeeperIndex` (~8430); the structure track touches `create()`'s opening
  guard and the dev-hook block. The Coder should land the structure track's guard first, since it wraps
  `create()` and a later edit inside it would otherwise need re-indenting.

---

## Structure track — BACKLOG-553

**Item:** BACKLOG-553 [infra] — The boot that hangs, not the boot that is slow.

### Why this cycle

538 shipped the boot clock and the clock immediately retired 538's own hypothesis: across 1560 boots
the median is 643ms, the p95 735ms, the worst 881ms — against a 30,000ms ceiling. A boot that dies at
the ceiling is ~34x its own p95. **It is not slow; it hangs.** And the instrument that proved this has
a hole exactly where it matters: `boot()` in `tests/e2e/helpers.ts` calls `recordBootLine` only after
both waits succeed, so the one boot per run that is worth studying is the only one that writes nothing.
Four cycles of this flake have produced four re-runs and zero victims.

553's own text names the first step — *"Start by making the harness catch one"* — and names its third
and most honest candidate cause: a `WorldScene.create()` that throws partway never reaches the line
that sets `__ready`, and the thrown error goes to a console nobody reads.

**A console nobody reads is also a player-facing defect**, and the CHARTER's quality bar forbids it in
as many words: *"No silent failures — errors must reach `chronicle.md`."* A player whose `create()`
throws is looking at a blank canvas that never becomes a game, and the park says nothing. So the two
halves are one mechanism.

### What ships

**1. The scene's boot is guarded, and a failure is said out loud.**

`WorldScene.create()`'s body is wrapped so a throw is caught rather than lost:

- The error is recorded on the scene and exposed as `window.__bootError` — `{ message, stack, phase }`
  or `null` — beside the existing `__ready` hook.
- A legible notice is drawn **in the park's own chrome** (the monospace-on-dark register
  `showKeeperInvite` uses), centred, saying the bowl failed to open and naming the error's message.
  Not `alert()`, not a raw stack trace at the player.
- `__ready` is **not** set on the failure path — the flag keeps its exact current meaning ("hooks
  attached, scene built"), because every spec in the suite depends on it.
- The notice's own draw is itself guarded. A notice that throws while reporting a throw would turn one
  silent failure into two.

**2. The harness writes the failure, with a victim attached.**

`boot()` in `tests/e2e/helpers.ts`:

- Drains `page.on('pageerror')` into an array for the life of the boot.
- Wraps both waits. On either failing, `recordBootLine` writes a line with `readyMs: null`,
  `canvasMs` (the real number if the canvas came up, null if it did not), `label` (the spec, via the
  existing `bootLabel()`), a new `failedAt` of `'canvas'` or `'ready'`, the drained `pageerror`
  messages, and the page's `__bootError` if one is set — **then rethrows**, so the spec still fails
  exactly as today.
- The drain and the write are inside the same fail-open try/catch discipline `recordBootLine`
  already documents. A boot clock that can fail a spec is a worse instrument than no boot clock, and
  that rule now has to cover the *failure* path too, where it matters more.

**3. The report can see failures.**

`scripts/bootstats.mjs --report` already ignores a null `ms` rather than counting it as zero (proven by
an existing test). It now also **counts and names** them: how many boots never came up, which specs,
and whether each had an exception behind it. A hang with an exception and a hang without one are
different bugs and are indistinguishable today; after this they are different lines.

### Acceptance criteria

- [ ] `npm run build` clean and the full unit + e2e suites green
- [ ] A spec forces `create()` to throw (via a hook / query flag) and the game shows an on-screen failure notice containing the error's message
- [ ] On that forced failure, `window.__ready` is **not** true and `window.__bootError` is non-null with a `message`
- [ ] On a normal boot, `window.__bootError` is null and `__ready` is true — the success path is unchanged
- [ ] Unit: the failure-path `recordBootLine` entry carries `readyMs: null`, a non-empty `label`, and a `failedAt` of `'canvas'` or `'ready'`
- [ ] Unit: `boot()`'s failure write never throws when the log path is unwritable (extend the existing fail-open proof to the failure path)
- [ ] Unit: `boot()` rethrows the original wait error after writing — a failure must not be swallowed into a pass
- [ ] Unit: `bootstats.mjs` summary reports the count of failed boots and names them, and reports zero cleanly when there are none
- [ ] Unit: a failed entry with a drained `pageerror` is reported as distinct from a failed entry without one
- [ ] `.e2e-boot-times.jsonl` stays gitignored and no log file is committed

### Out of scope

- **Fixing the stall.** This cycle builds the instrument that catches one. Chasing the three candidate
  mechanisms (a `page.goto` against a restarting dev server; a worker with no socket; a throwing
  `create()`) is the follow-up, and it now has evidence to start from instead of a re-run.
- Changing `BOOT_TIMEOUT`, the per-test timeout, the worker count, or `globalSetup`'s warm-up.
- Any retry-on-timeout. A harness that retries a hang hides the hang.

### Constraints

- `tests/` must not import Phaser or game runtime code beyond the pure modules it already imports.
- The on-screen notice must not capture input or set a modal flag — a failed boot must not also
  break `Escape`.
- `create()`'s existing body must keep its exact ordering; this is a wrapper, not a reshuffle.
- **File overlap with the lore track: `WorldScene.ts`.** Land this track's `create()` guard **first**
  (see the lore track's note).
