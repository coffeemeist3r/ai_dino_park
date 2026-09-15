# Cycle 161 — Code Plan

**Cross-track collision check:** none. The lore track lives in `game/src/` plus one e2e spec; the
structure track lives in `tests/e2e/helpers.ts`, `scripts/`, `package.json`, `.gitignore` plus one
unit test. No file appears in both lists. Build the structure track **first** — it only adds files and
one always-on write inside `boot()`, so if it destabilizes anything the lore track's e2e will say so
immediately rather than at the end.

---

## Lore track

**Item:** BACKLOG-068 — acquired taste.

### Files to create

- `game/src/world/palate.ts` — the pure warming record and its rules.
  - `export const WARM_AT = 3`
  - `export type PalateRecord = Readonly<Record<string, Readonly<Record<string, number>>>>`
  - `mealCount(rec, name, foodId): number`
  - `isWarm(rec, name, foodId): boolean` — `mealCount >= WARM_AT`
  - `noteMeal(rec, name, foodId): PalateRecord` — increments; **returns the same object once the count
    is already at `WARM_AT`**, so the steady state is a no-op and the scene's save-on-change check
    (`next === this.palate`) stops the churn. Same identity contract `noteTaste` already uses; copy it,
    don't invent a second one.
  - `justWarmed(before, after, name, foodId): boolean` — true only on the transition. One place decides
    "this meal was the beat", so the scene cannot drift from the module.
  - `warmedTo(rec, name, exceptFoodId?): string[]` — the warmed ids in `FOODS` order, minus the
    currently-favorite id. `FOODS` order because every other read of a food set in this repo is stable
    in `FOODS` order (`stockedIds`, `menuLine` cells); a new ordering here would be the only one.
  - `warmedMemory(label): string` and `warmedLine(name, label): string` — **builders**, per
    BACKLOG-483. `warmedMemory` is the string the dino files; `warmedLine` is the event-log line.
- `game/src/world/palate.test.ts` — colocated, per the cycle-99+ convention (`vitest.config.ts`
  includes `game/src/**/*.test.ts`).
- `tests/e2e/cycle-161-acquired-taste.spec.ts`

### Files to modify

- `game/src/world/foods.ts`
  - `foodReaction(food, traits?, season?, warmed = false)` — a fourth optional parameter. Favorite
    wins over warmed (a favorite is 9/😋 even if it also happens to be counted warm). Warmed and not
    favorite is `FEED_GAIN_WARM`/😌. Neither is the existing 5/🙂. Default `false` so every existing
    call site and test is unchanged.
- `game/src/world/feeding.ts`
  - `export const FEED_GAIN_WARM = 7` — beside `FEED_GAIN` / `FEED_GAIN_FAV`, because that is where the
    other two live and a third gain declared elsewhere is how a table drifts.
  - `refusesFood(agreeableness, isFavorite, hunger, warmed = false)` — `if (isFavorite || warmed) return false`.
    Default `false`, so `cycle-159-refusal.test.ts`'s ~12 three-argument calls need no edit.
- `game/src/world/menu.ts`
  - `menuLine(tasted, favorite, warmed: readonly Food[] = [])` — appends
    ` · warmed to <emoji> <label>` per warmed food (there is normally at most one; the signature takes
    a list because nothing stops a long game having two, and joining is one line). `export const
    WARMED_CLAUSE = 'warmed to'` for the spec to match against rather than a literal.
    Default `[]`, so `menu.test.ts`'s existing two-argument calls are untouched.
- `game/src/world/saveGame.ts`
  - Add `palate?: Record<string, Record<string, number>>` to the save interface, beside `tasted`.
  - Validate it in the same shape-only style as the `tasted` block directly above: reject a non-object,
    reject a non-finite or negative count, **keep** an unknown dino name or food id (a save from a
    future roster is a save). Floor the count, as the `satchel` block does.
  - Add `palate` to the returned object.
- `game/src/scenes/WorldScene.ts`
  - `private palate: PalateRecord = {}` beside `private tasted`.
  - `private noteWarming(d: Dino, foodId: string, label: string): boolean` beside `noteMenu` — calls
    `noteMeal`, returns early when the record is unchanged, assigns, and returns whether `justWarmed`.
    It does **not** save: both call sites already `saveGame()` on their own tail, and a second save in
    the same frame is the churn `noteTaste`'s identity contract exists to avoid.
  - `eatFood` — call `noteWarming` **before** `foodReaction`, so the meal that crosses the line is the
    meal that pays the lifted gain and flashes 😌. Pass `isWarm(this.palate, d.name, kind.id)` into
    `foodReaction`. On a `justWarmed` true: `remember(…, warmedMemory(kind.label))` and
    `logEvent(warmedLine(d.name, kind.label))`. The existing `flashFeed(d, r.emoji)` already carries
    the 😌 because it reads `r.emoji` — no second flash.
  - The stores-feed site (~4339, beside its `noteMenu`) — same `noteWarming` call. A meal from the
    ground's pantry is a meal.
  - The scan site (~8197) — **unchanged**. It calls `noteMenu` only; that is the whole point of the
    second record.
  - `refuseFood` — pass `isWarm(this.palate, d.name, kind.id)` as `refusesFood`'s fourth argument.
  - `bookRows()` — pass the warmed foods into `menuLine`:
    `warmedTo(this.palate, d.name, fav.id).map(id => FOODS.find(f => f.id === id)!)`, with `fav` the
    already-computed season-aware favorite (hoist it to a local; it is currently computed inline).
  - Save/load: serialize `palate` in the save body (deep-copy the inner maps, the `tasted` line's
    shape) and `this.palate = save.palate ?? {}` on load, beside the `tasted` line.
  - Hook: `(window as any).__palate = (name: string) => ({ ...(this.palate[name] ?? {}) })`, beside
    `__tasted`.

### Reuse list

The Coder MUST use these rather than reinvent:

- `noteTaste`'s **same-object-on-no-change** contract (`game/src/world/menu.ts`) — copy the idiom into
  `noteMeal`; the scene's save-on-change check depends on it.
- `remember` / `recall` (`game/src/world/memory.ts` via `WorldScene`) — the memory ring, unchanged.
- `logEvent` and `flashFeed` (`WorldScene`) — the existing ticker and the existing per-dino flash. No
  new UI object; the design's 😌 rides `foodReaction`'s `emoji` field, which `flashFeed` already draws.
- `FEED_GAIN` / `FEED_GAIN_FAV` (`game/src/world/feeding.ts`) — `FEED_GAIN_WARM` joins them there.
- `favoriteFood(traits, season)` and `FOODS` (`game/src/world/foods.ts`) — the favorite is read live,
  never stored (069's rule).
- The `tasted` save block (`game/src/world/saveGame.ts`) — `palate`'s validation is that block's shape
  with a number check; do not write a new validation style.
- `foundingState(page, 'as-shipped')`, `boot`, and `cycle-160-menu.spec.ts`'s `feed()` /
  `blockOf()` helpers — the new e2e copies that spec's shape (it is the same subject one cycle on).

### New dependencies

`none`.

### Test plan

**Unit — `game/src/world/palate.test.ts`:**
- two meals of the same food is not warm; the third is.
- three different foods, once each, warms nothing.
- `justWarmed` is true on exactly the crossing call and false on the one before and the one after.
- `noteMeal` returns the **same object** once at `WARM_AT` (the identity contract).
- `noteMeal` never mutates its input.
- `warmedTo` omits the id passed as the favorite, and returns `FOODS` order.
- an unknown dino reads count 0 and warms to nothing.

**Unit — `game/src/world/cycle-161-taste.test.ts`** (the cross-module properties, beside cycle 159's):
- `foodReaction` table: favorite → `FEED_GAIN_FAV`/😋; warmed non-favorite → `FEED_GAIN_WARM`/😌;
  neither → `FEED_GAIN`/🙂; favorite **and** warmed → still `FEED_GAIN_FAV`/😋.
- `FEED_GAIN < FEED_GAIN_WARM < FEED_GAIN_FAV` — the ordering as a property, so a later tune of any one
  of them cannot silently invert the table.
- `refusesFood(a, false, h, true)` is false across the whole prickly/not-hungry grid that
  `cycle-159-refusal.test.ts` sweeps for the favorite — the same sweep, the new exemption.
- `menuLine` carries the warmed clause when given a warmed food and omits it when given none.

**Unit — `game/src/world/saveGame.test.ts` (extend):** a save with `palate` round-trips; a save without
it loads with `palate` undefined; a negative or non-numeric count rejects the save.

**E2E — `tests/e2e/cycle-161-acquired-taste.spec.ts`:**
1. *three of the same wrong dinner and the dino comes round* — `as-shipped`, feed one dino a
   non-favorite three times via the `feed()` helper, assert `__palate` reads 3, the event log carries
   the warmed line exactly once, and the book block carries `warmed to`.
2. *two is not enough* — the same, stopped at two: no warmed line, no book clause.
3. *the scan is a read, not a dinner* — LUMEN-3 scans the same dino three times; `__tasted` fills as it
   does today and `__palate` stays empty.
4. *a warmed food is not refused* — a prickly, sated dino refuses greens (070's existing path, proven
   by `__refused`), is then fed greens to warm (hungry, so the refusal cannot fire), and thereafter
   does not refuse greens while sated.
5. *it survives a reload* — save, re-boot, `__palate` and the book clause are still there.

### Risks

- **The `feed()` helper in `cycle-160-menu.spec.ts` sets hunger to 1 before eating.** That is correct
  for warming (a hungry dino never refuses, so the count is never confounded by 070), but it means
  spec 4 must warm the dino *hungry* and then test the refusal *sated*. Sequence it that way
  deliberately, and say so in a comment.
- **The favorite may itself be the food fed.** The e2e must pick a non-favorite explicitly via
  `__favoriteFood`, exactly as `cycle-160-menu.spec.ts` already does.
- **Seasonal favorites.** `warmedTo` is passed the *current* favorite id, so a warmed food that becomes
  the favorite later drops its clause and regains it. That is the design's intent; the unit test pins
  it at the `warmedTo` level rather than trying to turn the season in an e2e.
- Two `flashFeed` calls in one frame would queue; there is only one, by construction (the 😌 rides
  `r.emoji`). Do not add a second.

### Estimated touch count

`~9 files` — 3 created (module, its test, the e2e), 1 more test file, 5 modified. Arc-sized.

---

## Structure track

**Item:** BACKLOG-538 — the boot-flake instrument.

### Files to create

- `scripts/bootstats.mjs` — the pure arithmetic, so the summary cannot be quietly wrong.
  - `percentile(sorted, p)` — nearest-rank on an already-sorted array. Empty array → `null`.
  - `summarize(samples)` where a sample is `{ ms, label }` → `{ count, min, median, p95, max, worst }`
    (`worst` is the label of the max), or `null` for an empty input.
  - `formatSummary(summary, ceilingMs)` → the printable block, including headroom
    (`ceilingMs - max`) and the headroom as a percentage of the ceiling.
  - `parseArgs(argv)` → `{ rounds, parallel, ceiling, report }` with the documented defaults, so the
    flag parsing is testable without spawning anything.
- `scripts/boot-flake.mjs` — the harness. Node, ESM, no new dependency.
  - **Harness mode (default).** For each round: `spawn('npm', ['--prefix','game','run','dev'])` with
    the port free, wait for `http://127.0.0.1:5173/` to answer — **and do not warm it further**, which
    is the whole point (`globalSetup.ts` deliberately does the opposite for the suite). Then launch one
    `chromium` browser, open `parallel` pages **simultaneously** (`Promise.all`), each doing
    `goto('/')` → wait for canvas → wait for `__ready`, timing both phases. Tear the server down, kill
    the port, next round.
  - Each boot appends to the same `.e2e-boot-times.jsonl` with `source: 'harness'`, so the harness's
    boots and the suite's boots live in one place and `--report` reads both.
  - Prints a per-boot table (round, index, ms-to-canvas, ms-to-ready, OK/BREACH) and then
    `formatSummary`. Exits `1` if any boot exceeded `--ceiling`, else `0`.
  - **Teardown is a `finally`**, and also on `SIGINT`: the server is killed and the port freed whatever
    happens. A stranded 5173 is how the next run fails for an unrelated reason.
  - Defaults: `--rounds 3 --parallel 6 --ceiling 30000`. `parallel 6` is deliberate — it is the worker
    count `playwright.config.ts`'s own comment says this box took *before* BACKLOG-486 capped it at 2,
    i.e. the load under which the flake was first catalogued.
  - **Report mode (`--report`).** Read the JSONL, drop unparseable lines (a partially-written last line
    is expected from a killed run and is not an error), summarize `ready` ms, print.
- `tests/unit/bootstats.test.ts` — imports the `.mjs` directly (vitest resolves it; the root config
  already includes `tests/unit/**/*.test.ts`).

### Files to modify

- `tests/e2e/helpers.ts`
  - Import `appendFileSync` from `node:fs` and `test` from `@playwright/test` (for `test.info()`, which
    supplies the spec title without the caller passing anything).
  - In `boot()`: take `Date.now()` before `page.goto`, again after the canvas wait, again after the
    `__ready` wait. After the `__ready` wait — **off the measured path** — append one JSON line.
  - `recordBoot(canvasMs, readyMs)` wrapped in `try {} catch {}` with a comment saying why: a boot clock
    that can fail a spec is a worse instrument than no boot clock, and this is the same fail-open
    discipline `globalSetup.ts`'s `warm()` already documents.
  - Export `BOOT_TIMEOUT` (currently module-private) so the harness and the report share the one number
    rather than restating 30000 in three files.
  - `BOOT_LOG` path from `process.env.E2E_BOOT_LOG ?? '.e2e-boot-times.jsonl'`, resolved from the repo
    root — the env override is what makes the fail-open test able to point it at an unwritable path.
- `package.json` — one script: `"flake:boot": "node scripts/boot-flake.mjs"`.
- `.gitignore` — `.e2e-boot-times.jsonl`.

### Reuse list

- `@playwright/test`'s `chromium` export — already a root devDependency; **no new package**.
- `npx --yes kill-port 5173` — the port-freeing incantation the daily-cycle routine and
  `package.json`'s `kill` script already use. The harness shells the same one rather than writing a
  socket-killer.
- `globalSetup.ts`'s `warm()` **as the negative example**: the harness must *not* warm. Cite it in a
  comment so a future reader does not "fix" the harness by warming it.
- `playwright.config.ts`'s `webServer.command` (`npm --prefix game run dev`) — the harness spawns the
  identical command, so it is measuring the same server the suite measures.
- `BOOT_TIMEOUT` from `helpers.ts` — one number, one home.

### New dependencies

`none`.

### Test plan

**Unit — `tests/unit/bootstats.test.ts`:**
- `percentile` on an empty array → `null`; on a single sample → that sample; on `[1..10]` at p95 → 10
  and at p50 → 5 (nearest-rank, pinned so the definition cannot drift).
- `summarize([])` → `null`.
- `summarize` picks `worst` as the label of the **max**, not of the last sample.
- `formatSummary` contains the ceiling, the max, and a headroom that is `ceiling - max`.
- `parseArgs` defaults; `parseArgs` overrides; `--report` flips the mode.

**Unit — the fail-open proof (in the same file, or beside it):** the design requires this be proven,
not claimed. `recordBoot`'s writer is exported from `helpers.ts` as `recordBootLine(path, obj)`; the
test points it at a path inside a file (`<a real file>/nope.jsonl`, which cannot be a directory) and
asserts it **returns** rather than throws.

**E2E:** none new. The instrument's own correctness is unit-tested, and the acceptance criterion that
the suite is unchanged is the existing 759 specs staying green — which is a stronger statement than a
new spec asserting the log file exists.

**Demonstration (the reachability condition):** `npm run flake:boot` is **run** in this cycle, twice —
once by the Coder to prove it works, once by QA for the record — and its real output goes into
`cycle-161-qa.md` and the verdict.

### Risks

- **The harness kills port 5173.** If a dev server is already up when it runs, that server dies. It is
  a deliberate part of "cold", and the routine already frees the port before e2e; document it in the
  script header so nobody is surprised.
- **`test.info()` throws outside a test.** `boot()` is only ever called from inside a spec, but the
  `try/catch` covers it anyway, and the harness does not import `helpers.ts` — it times its own boots.
- **Windows process trees.** `spawn` with `shell: true` on Windows leaves the Vite child alive when the
  parent is killed. That is exactly why teardown shells `kill-port` in addition to killing the child,
  rather than trusting `child.kill()`.
- **A round that cannot start its server** must fail loudly, not silently record zero boots. Time out
  the server wait and exit non-zero with the reason.
- **The JSONL grows.** It is gitignored and append-only; a future cycle can rotate it. Not tonight.

### Estimated touch count

`~6 files` — 3 created, 3 modified.

---

# Shipped

## Lore track — BACKLOG-068

**Files touched (9):**
- created `game/src/world/palate.ts`, `game/src/world/palate.test.ts`,
  `game/src/world/cycle-161-taste.test.ts`, `tests/unit/cycle-161-palate-save.test.ts`,
  `tests/e2e/cycle-161-acquired-taste.spec.ts`
- modified `game/src/world/foods.ts`, `game/src/world/feeding.ts`, `game/src/world/menu.ts`,
  `game/src/world/saveGame.ts`, `game/src/scenes/WorldScene.ts`

**Deviations from the plan:**
- The book line was extracted into a private `WorldScene.menuFor(d)` rather than being widened inline in
  `bookRows()`. The plan wanted the season-aware favorite hoisted to a local so `warmedTo` could be
  handed the same value `menuLine` gets; a named method says why, and `bookRows` is already long.
- `noteWarming` takes `(name, foodId)` rather than the planned `(d, foodId, label)`. The label is only
  needed by the two callers that build a memory, and both already hold `kind`.

**Two things the e2e found that the plan did not anticipate** (both spec bugs, no production change):
- `favoriteFood` is `giftScore` over the live traits, so `__setTrait('agreeableness', 0)` *moves the
  favorite* — it zeroes the two foods whose appeal reads agreeableness. A spec that reads the favorite
  before flattening the trait can pick, as its "wrong" dinner, the food that flattening just promoted
  to favorite. The trait is now set first, with a comment.
- The event log rolls. Three feeds is enough to push an earlier refusal line off the end of it, so the
  "no longer refused" assertion reads the **dish** (`__food` is null because it was eaten) rather than
  counting ticker lines. That is also the better assertion: it is the design's own sentence.

**Build:** ✅ clean. **Unit:** ✅ 2806 passed / 3 skipped, 265 files (+38 tests this cycle).

## Structure track — BACKLOG-538

**Files touched (6):**
- created `scripts/bootstats.mjs`, `scripts/boot-flake.mjs`, `tests/unit/bootstats.test.ts`
- modified `tests/e2e/helpers.ts`, `package.json`, `.gitignore`

**Deviations from the plan:** none. `BOOT_TIMEOUT` and `BOOT_LOG` are exported, `recordBootLine` is
exported so the fail-open behavior is a test rather than a comment, and `bootLabel()` wraps
`test.info()` because it throws off a worker.

**Build:** ✅ clean. **Unit:** ✅ 13 new tests in `bootstats.test.ts`, including the fail-open proof.

### Demonstrated, in-cycle — and the result is not the one the item expected

`npm run flake:boot -- --rounds 2 --parallel 4` — 8 simultaneous cold boots over 2 cold servers:

```
min 1147ms · median 1150ms · p95 1197ms · max 1197ms · ceiling 30000ms · headroom 28803ms (96.0%)
```

`npm run flake:boot -- --report` over a full 763-spec suite run (780 boots recorded):

```
boots 780 · min 330ms · median 642ms · p95 740ms · max 878ms
ceiling 30000ms · headroom 29122ms (97.1% of the ceiling still unused)
```

**The leading hypothesis in BACKLOG-538's own text is now measurably false at normal load.** The item
proposed that "515 bought *headroom* rather than a floor and the suite has grown back into the seam" —
i.e. that boots had crept up toward the 30s ceiling. They have not. The slowest boot in an entire
763-spec run is **878ms**, and the slowest under a deliberately hostile cold-parallel load is
**1197ms**. Both are ~3% of the budget.

So a boot that times out at 30,000ms is not a boot that was slow. It is a boot that **hung** — ~34x its
own p95 — and the next cycle should be looking for a stall, not for a budget. That is a different
investigation from the one four previous cycles were running, and it is the first time this project has
had a number to say so with.

(Recorded honestly: this run did not catch a victim. The suite came up 763/763 green on its only full
run tonight. A bound is not a proof of absence, and the harness says so in its own output.)
