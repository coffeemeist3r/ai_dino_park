# Cycle 161 — Design

Two tracks. No rework carried in — cycle 160 closed both tracks APPROVED.

---

## Lore track — BACKLOG-068

**Item:** BACKLOG-068 `[emergent]` Acquired taste — a dino fed the same non-favorite food many times
slowly warms to it; palates aren't fixed forever.

### Why this cycle

Milestone 20's fifth arc, and the one that turns the keeper's repeated verb into a cause. Four cycles
have taught the park to have an opinion about the drop: it can refuse it (070), it records what went
down (069), it spends from a stock (546), the phone can aim it (547). Every one of those treats a
dino's taste as a **constant the keeper is slowly discovering**. A dino born liking fish likes fish in
cycle 1 and in cycle 500, and nothing the keeper does over a hundred meals has ever changed a single
thing about what that dino wants.

This is also the arc that makes the *rest* of the menu line mean something. Since 069 the book prints
one cell per food and names the favorite once found — a discovery checklist. After tonight one of
those cells can carry a food the dino has **come round to**, which is a fact about the keeper's habits
rather than about the dino's birth. That is the substrate 126 (the watcher's envy) wants underneath it
next cycle.

### What ships

A dino that **eats** the same non-favorite food `WARM_AT = 3` times has warmed to it, permanently.

**The count is meals, not discoveries.** The existing `tasted` record (069) is a *set* of what the
keeper has learned, and it is written from three sites — the hatch meal, the stores feed, and
**LUMEN-3's scan**. The scan is a read, not a dinner: a Scholar pressing `B` three times must not warm
a dino to anything. So warming gets its own record, written only from the two sites where food
actually goes down a throat.

What the player sees, in order:

1. **The third meal of the same wrong food is a beat.** Instead of the plain 🙂, the dino flashes 😌,
   a line lands in the event log — `😌 Mossback has come round to the leafy greens` — and it files a
   memory it can say out loud through the existing taste-talk route (066).
2. **Every meal after that is worth more.** A warmed food pays `FEED_GAIN_WARM = 7` friendship rather
   than plain feed's 5 (a favorite's 9 is untouched — a warmed food is liked, not loved), and flashes
   😌 rather than 🙂. The keeper who kept dropping greens made that dino gladder to see greens.
3. **A warmed food is never refused.** 070's prickly dino that walked away from greens on meal one
   stops walking away once it has warmed. This is the sharpest read in the item: the same dino, the
   same food, the same keeper, opposite behavior, and the only variable is what the keeper has been
   doing. It is deliberately *not* a new rule — it is the existing `refusesFood` gaining the same
   exemption the favorite already has, because a warmed food is a food this dino now wants.
4. **The book says so.** The menu line carries a tail clause naming the warmed food:
   `🍽 menu: 🌿····🐟·  loves 🐟 silver fish · warmed to 🌿 leafy greens`. If the favorite is still
   unknown, the warmed clause stands beside `(favorite unknown)` — which is a *better* early book line
   than the one 069 ships, because it is the first thing the menu can say about a dino the keeper has
   not cracked yet.
5. **It survives a reload.** Lifetime, persisted, additive.

**Reachability (CHARTER v7).** `WARM_AT = 3`, and the founding satchel ships `greens: 4`. A keeper on
a fresh save can drop greens three times into the same mouth with the stock the game hands them at
boot — no refill, no day boundary, no population floor. The founding state already exercises this
system; no founding constant moves.

**The favorite never warms.** A dino's favorite is already its favorite; the record may count it, but
the warmed clause excludes whatever the favorite currently is when the line is drawn — the favorite is
season-aware and answered fresh on every open (069's rule), so a food that was warmed in spring and
becomes the favorite in summer reads as `loves`, not as `warmed to`, and goes back to `warmed to` in
the fall. One food, one clause, never both at once.

### Acceptance criteria

- [ ] The warming record is a pure Node-testable module with unit tests; nothing in it imports Phaser.
- [ ] A dino that has eaten the same non-favorite food twice is **not** warm; on the third it **is**.
- [ ] Eating three *different* foods once each warms the dino to nothing.
- [ ] The meal that crosses the threshold flashes 😌 and writes one event-log line naming the dino and
      the food's label; the two meals before it do not.
- [ ] After warming, `foodReaction` for that food returns `gain === 7` and emoji `😌`; a favorite still
      returns `9`/`😋` and an unwarmed non-favorite still returns `5`/`🙂`.
- [ ] A prickly, non-hungry dino (`agreeableness <= 0.4`, `hunger < 0.5`) refuses a non-favorite it has
      not warmed to, and does **not** refuse the same food once warmed.
- [ ] A refused dish increments nothing — the count is what went down, not what was offered.
- [ ] **LUMEN-3's scan increments nothing.** Scanning the same dino three times warms it to nothing,
      while still filling the 069 menu slot exactly as it does today.
- [ ] The book's menu line contains `warmed to <emoji> <label>` for a warmed non-favorite, and does not
      contain that clause for a dino that has warmed to nothing.
- [ ] A food that is *both* warmed and currently the favorite reads `loves …` and never `warmed to …`.
- [ ] The record round-trips a save/reload; a pre-161 save loads with nobody warm (additive).
- [ ] E2E: a fresh `as-shipped` save, three greens into one dino, and the book line, the 😌 and the
      lifted gain are all observable through existing hooks.

### Out of scope

- Any *decay* of a warming. A palate that moves should stay moved; un-learning is a second item.
- The favorite itself changing. `favoriteFood` is untouched — warming adds a second, lesser affection,
  it does not re-rank the personality fit. (That is the genuinely bigger version of this item and it
  would re-open 061/170/432/472/478's "flips no roster dino's favorite in any season" invariants.)
- Dino-to-dino transmission of a taste, the watcher's envy (126), any dialogue rewrite beyond the one
  memory builder.

### Constraints

- **Additive save only.** New top-level save key, absent-tolerant on load, validated in `saveGame.ts`
  with the same shape-only discipline the `tasted` block one above it uses.
- The memory and the log line go through **exported builders**, per BACKLOG-483's standing rule — the
  reader is written with the writer.
- `refusesFood` gains a parameter; every existing call site must be updated, and `feeding.test.ts`'s
  gobbler/refuser disjointness property must still hold.
- **No file overlap with the structure track.** The lore track is `game/src/` plus one e2e spec; the
  structure track is `tests/e2e/helpers.ts`, `scripts/`, `package.json`, `.gitignore`. The one shared
  surface is the e2e directory, and they touch different files in it.

---

## Structure track — BACKLOG-538

**Item:** BACKLOG-538 `[infra]` The victim moves again — the parallel-load boot flake. **This cycle
ships the instrument, not the fix**, which is what the item's own text asks for.

### Why this cycle

Top of the Structure Track since cycle 157; four consecutive instances; the same signature every time
(`boot()` times out on a parallel cold start, never an assertion, green isolated, green on a re-run).
Five routines have now diagnosed it from the outside with ten minutes each and no instrument, and the
one time this class of bug was actually killed in this repo — cycle 148's 515 — it died when somebody
could reproduce it on demand and watch the victim move.

The gap is specific: **nobody knows how long a boot takes.** `BOOT_TIMEOUT` is 30,000ms,
`playwright.config.ts`'s per-test budget is 60,000ms, and both numbers were chosen by argument. The
honest competing hypotheses in the item's own text — *515 bought headroom rather than a floor and the
suite has grown back into the seam* versus *something still races* — are distinguished by exactly one
measurement that has never been taken.

### What ships

**1. A boot clock on every ordinary run.** `boot()` times two phases — time-to-canvas-visible and
time-to-`__ready` — and appends one JSON line per boot to a gitignored `.e2e-boot-times.jsonl`. Free,
always on, fails open (a harness that cannot write a log file must never fail a run). After tonight,
every full suite this studio runs leaves a boot-time distribution behind it.

**2. A standalone reproduction harness**, `npm run flake:boot`. It puts N cold Chromium contexts on a
**cold** Vite dev server simultaneously — the exact condition `globalSetup.ts` deliberately warms away
for the suite — times every boot, and repeats for R rounds with the server torn down and restarted
cold each round. It prints a per-boot table and a summary, and exits non-zero when any boot breaches
the ceiling. This reproduces the seam in minutes instead of by running 759 specs and hoping.

**3. `npm run flake:boot -- --report`** summarizes the JSONL an ordinary suite run left behind: count,
median, p95, max, worst spec, and the headroom left against `BOOT_TIMEOUT`.

The percentile/summary arithmetic is a **pure module with unit tests** — CHARTER's rule applies to
test infra too, and a summary that quietly computes the wrong p95 is worse than no summary.

### The reachability bar (the cycle-159 `[infra]` reading)

*What can the next cycle do that it could not do before?* Read a boot-time distribution off any run,
and reproduce the cold-parallel boot seam on demand.

*What is the evidence, produced inside this cycle, that it works?* **The harness is run in this cycle
and QA and the verdict carry its actual numbers** — boots observed, the worst boot, the headroom
against 30s, and whether any boot breached. This is the hard condition from the 159 ruling: the
deliverable is demonstrated, not described. A null result (no breach at the loads this box can
produce) is a legitimate and publishable outcome; it is the first real bound this project has ever had
on the number, and the verdict must report it as a bound rather than as a fix.

### Acceptance criteria

- [ ] `npm run flake:boot` runs end to end and prints a per-boot table plus a summary naming the max
      boot and the headroom against `BOOT_TIMEOUT`.
- [ ] The harness starts its dev server **cold** (not `reuseExistingServer`) and tears it down on exit,
      including on failure and on a breach.
- [ ] Rounds and parallelism are configurable (`--rounds`, `--parallel`, `--ceiling`) with documented
      defaults that finish in a few minutes on this box.
- [ ] The harness exits non-zero if any boot exceeds the ceiling and zero otherwise, so it is usable
      from CI later without being wired into CI tonight.
- [ ] `boot()` appends one line per boot to `.e2e-boot-times.jsonl` carrying: ISO timestamp, spec
      title, ms-to-canvas, ms-to-ready, and the source (`suite` or `harness`).
- [ ] The boot clock **fails open**: an unwritable log path does not fail a spec. Proven by a test, not
      by a claim.
- [ ] `.e2e-boot-times.jsonl` is gitignored — the tree stays clean after a run.
- [ ] `--report` reads the JSONL and prints count / median / p95 / max / worst spec / headroom.
- [ ] The summary arithmetic is a pure module with unit tests covering an empty sample, a single
      sample, and a known percentile.
- [ ] The existing suite is unchanged in behavior: full `vitest` and full `playwright` green, and no
      spec's timing assumptions move.
- [ ] **Demonstrated in-cycle:** QA's report and the verdict both carry the harness's real output.

### Out of scope

- **The fix.** Whatever the numbers say, this cycle does not move `BOOT_TIMEOUT`, the per-test
  `timeout`, the worker count, or `globalSetup`. Changing the thing you are about to measure, in the
  cycle you first measure it, is how four previous diagnoses were made.
- Wiring the harness into GitHub Actions. It is built to be CI-usable (an exit code) and is not wired
  tonight; that is a follow-up with the numbers in hand.
- Any retry, `test.slow()` or skip. `playwright.config.ts` says why, and it is right.

### Constraints

- **No new npm dependency.** `@playwright/test` is already a root devDependency and exports `chromium`;
  everything else is Node built-ins.
- Plain `.mjs` under `scripts/` — no new build step, no `tsx`, no toolchain.
- The boot clock must not add a round-trip to `boot()`. Timestamps come from clocks the harness already
  crosses; the write is a synchronous append after `__ready`, off the measured path.
- Never leave the dev server running: a stranded 5173 is how the next run fails for an unrelated reason.
