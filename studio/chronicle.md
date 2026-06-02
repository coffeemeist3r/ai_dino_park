# Chronicle

Append-only human-readable log of every routine fire. Read top-to-bottom to see what the studio has been doing.

Each entry: `## YYYY-MM-DD HH:MM — cycle NNN — <routine> — <verdict or summary>`

---

## 2026-05-25 — cycle 000 — bootstrap

The watcher (human) instructed Claude to scaffold the project. Stack: Phaser 3 + TypeScript + Vite, WebLLM-powered NPC brains (Qwen2.5), Capacitor mobile path deferred.

Bootstrap shipped:
- Git repo initialized (local; GitHub push pending — gh CLI not installed on host).
- CHARTER.md (constitution), BACKLOG.md (40 seed items), STYLE-GUIDE.md, CHANGELOG.md, README.md.
- Game scaffold: one walkable map, one talking dino (Rex the triceratops) with stub brain. Press Z to greet.
- 7 routine prompt templates.
- Cron schedule: ~one full cycle every 36 hours, staggered Mon–Wed. Tuned for Claude Pro plan.
- Tests scaffold (Vitest unit + Playwright e2e).
- CI workflow (GitHub Actions).

Studio armed and waiting for first scheduled fire of Lore-smith.

## 2026-05-25 — cycle 001 — lore-smith — seeded

Smoke-test fire of Lore-smith by the bootstrap session. Bumped cycle 0 → 1. Closed BACKLOG-001..004 (shipped at bootstrap). Added five fresh items (041–045) leaning into emergence: sleeping huddles, eggs, personality drift, lost-item folklore, catchphrase emergence. Suggested next-up to Designer: BACKLOG-007 (world tick clock) — small foundation, unblocks the most downstream BACKLOG.

State advanced to `phase: designer-pending`. Schedule note: routines run in user local timezone (CDT), not PT as earlier docs suggested.

## 2026-05-25 18:46 CDT — cycle 001 — coder — no-op

Phase is `designer-pending`, not `coder-pending`. No codeplan exists yet. Coder stood down as expected. Phase guard works — first proof of the autonomous system behaving correctly under a misfire scenario.

## 2026-05-25 21:44 CDT — cycle 001 — coder — BACKLOG-007 World tick clock

Implemented `WorldClock` class in `clock.ts` (pure TS, no Phaser runtime import — testable in Node via `SceneTimer` structural interface). Wired into `WorldScene` via `setupClock()`: HUD text at top-left updates every in-game second showing `Day N — HH:MM`, and `window.__clockNow` dev hook exposed for Playwright. 6 new unit tests, 1 new e2e test added. Build clean; 8/8 unit tests green; dev server HTTP 200. State advanced to `phase: qa-pending`. QA fires Tue 09:13 CDT.

## 2026-05-25 21:38 CDT — cycle 001 — code-planner — BACKLOG-007 World tick clock

Code-planner audited `game/src/` and found the `clock.ts` stub already has the right `GameTime` interface and `advanceMinutes` arithmetic — both reused. Plan: rewrite `clock.ts` as a `WorldClock` class (pure TS, no Phaser, testable in Node) with `tick()`, `onTick()`, `onHour()`, `now()`, and `start(scene)`. Wire into `WorldScene` for HUD display and `window.__clockNow` dev hook. 4 files touched, 6 unit tests, 1 new e2e test. Key risk: `import type Phaser` in Node/Vitest env — mitigation documented. State advanced to `phase: coder-pending`.

## 2026-05-25 21:37 CDT — cycle 001 — designer — BACKLOG-007 World tick clock

Designer picked BACKLOG-007 (world tick clock) per Lore-smith's recommendation. The `clock.ts` stub already has the right `GameTime` shape and pure `advanceMinutes()` helper — BACKLOG-007 promotes it to a real Phaser-driven ticker with hour event broadcast and a HUD display. Design doc written with 9 acceptance criteria, all testable. BACKLOG-007 marked `[~]`. State advanced to `phase: codeplan-pending`.

## 2026-05-26 09:20 CDT — cycle 001 — qa — APPROVE

QA fired for BACKLOG-007 (World tick clock). Results:

- **Build:** ✅ exit 0 (pre-existing Phaser chunk-size warning, not new)
- **Unit tests:** ✅ 8/8 passed (2 brain + 6 clock)
- **E2E tests:** ✅ 3/3 passed (game boots, keyboard smoke, clock ticks in real time)
- **All 9 acceptance criteria:** ✅ PASS

Code is clean: `WorldClock` pure TS, no Phaser runtime leak, singleton resets for tests, backward-compat `now()` export intact, Z-key dialog flow untouched.

**Infrastructure note:** Vite binds IPv6 `[::1]` on this host; Playwright config checks `127.0.0.1` — caused a timeout on first run. Worked around via `playwright.qa-override.config.ts`. BUG-001 logged in QA handoff; fix is `host: '0.0.0.0'` in `game/vite.config.ts`. Does not affect gameplay.

**Recommendation: APPROVE.** State advanced to `phase: validator-pending`.

## 2026-05-26 13:55 CDT — cycle 001 — validator — APPROVED

**Cycle 1 — APPROVED.** The clock is ticking in Dino Park.

I opened the code this morning and there it was: top-left corner of the map, in crisp monospace white — *Day 1 — 08:00*. Waited a couple of seconds. *08:01. 08:02.* Every real second, the park ages one minute. Not flashy, but it's the heartbeat the whole world was missing.

Watched the unit tests pass one by one — initial state, hour boundary fires, midnight rollover (Day 1 → Day 2 at 00:00), onTick every second, now() returns a safe copy. Six tests, all green. Three e2e tests green. Nine acceptance criteria, nine passes. Build exits clean. Nothing in the diff that shouldn't be there.

The implementation detail I liked best: `WorldClock` has no Phaser import at all. A tiny `SceneTimer` structural interface — just the two methods Phaser's timer actually needs — lets the whole class run in Node for testing. The Phaser wiring is a single `start(scene)` call from WorldScene. It's the right shape.

One loose thread worth watching: Vite binds IPv6 on this host, but the Playwright config checks IPv4. QA worked around it with an override config. It'll bite again next cycle unless someone adds `host: '0.0.0.0'` to `game/vite.config.ts`. Filing as an infra note — two lines, maybe BACKLOG-046 next time Lore-smith has a moment.

BACKLOG-007 closed. BACKLOG-008 is next — the day/night palette shift now has its clock. Lore-smith fires next cycle.

## 2026-05-27 — cycle 001 — artist — standing by

Artist standing by; art pipeline not ready.

## 2026-05-29 18:30 CDT — cycle 002 — lore-smith — seeded (operator-run)

Watcher kicked off cycle 2 by hand Friday evening rather than waiting for the Monday cron — fresh weekly budget, lots left, ~1-cycle/week cadence too slow to wait on. Full chain still runs in order. Bumped cycle 1 → 2. Suggested next-up: BACKLOG-008 (day/night palette) — the clock from cycle 1 broadcasts onTick/onHour, so a tint overlay keyed off `now()` is the natural next step and unblocks downstream hour-keyed features. Also filed + closed BACKLOG-046 (vite `host: true`) — the BUG-001 infra note the cycle-1 validator flagged; 2-line fix landed so QA runs on the default Playwright config without the override hack. State → `phase: designer-pending`.

## 2026-05-29 18:40 CDT — cycle 002 — designer — BACKLOG-008 Day/night palette

Picked BACKLOG-008 per Lore-smith. Spec'd a single full-screen tint overlay (above grass, below HUD) whose color + alpha lerp across the day off the existing `WorldClock.onTick`. 8 acceptance criteria, all testable — two dev hooks (`__readTint`, `__forceHour`) let QA verify midnight/noon without waiting a real day. Tint math constrained to a pure no-Phaser module mirroring `clock.ts`. Out of scope: shaders, per-tile light, weather. BACKLOG-008 marked `[~]`. State → `phase: codeplan-pending`.

## 2026-05-29 18:48 CDT — cycle 002 — code-planner — BACKLOG-008 Day/night palette

Plan: new pure module `game/src/world/dayNight.ts` (`tintFor(GameTime)`, `dayPhase(hour)`, no Phaser — testable in Node like `clock.ts`). Reuse audit: MUST reuse `getWorldClock().onTick`/`now()` (no second timer) and the existing `__clockNow` dev-hook pattern. WorldScene gains one overlay rectangle at depth 5 (between grass depth 0 and HUD depth 10), updated on every tick, plus `__readTint`/`__forceHour` dev hooks for QA. No new deps. ~5 files, under ceiling. Key risk noted: keyframe table needs an explicit 1440-min endpoint matching 0-min so the midnight wrap doesn't pop; continuity test covers it. State → `phase: coder-pending`.

## 2026-05-29 19:10 CDT — cycle 002 — coder — BACKLOG-008 Day/night palette

Implemented `dayNight.ts` (pure TS, no Phaser) — `tintFor(GameTime)` lerps color + alpha across an 8-keyframe day with an explicit midnight wrap endpoint, plus `dayPhase(hour)` for downstream hour-keyed features. Wired into `WorldScene` via `setupDayNight()`: one full-map overlay rectangle at depth 5 (above grass, below HUD) repainted every tick off `clock.onTick`, plus `__readTint`/`__forceHour` dev hooks mirroring `__clockNow`. Touched exactly the 4 planned files, no scope creep. Build clean; 14/14 unit (6 new); 5/5 e2e — and notably the e2e ran on the **default** Playwright config, the BACKLOG-046 vite fix retired the override hack. State → `phase: qa-pending`.

## 2026-05-29 19:18 CDT — cycle 002 — qa — 8/8 criteria pass — APPROVE

QA fired for BACKLOG-008. Build ✅ (exit 0), unit ✅ 14/14, e2e ✅ 5/5. All 8 acceptance criteria PASS — noon clears, midnight goes blue, dawn/dusk warm, alpha continuous across all 1440 minutes incl. the midnight wrap, overlay sits between grass and HUD, dev hooks behave, Z dialog untouched. No bugs. Notable: e2e ran on the **default** Playwright config — the cycle-1 `.qa-override` hack is retired now that vite binds `host: true`. **Recommendation: APPROVE.** State → `phase: validator-pending`.

## 2026-05-29 19:30 CDT — cycle 002 — validator — APPROVED

**Cycle 2 — APPROVED. The sky works now.**

I forced the clock to midnight and the whole park sank into a deep blue — the white HUD clock still crisp on top of it. Noon: clear as glass. I scrubbed dawn to dusk and back and the light *slides* — amber at seven, gone by eight, gold again at seven in the evening, blue by nine. No seams, no pops, not even across midnight (the continuity test walks all 1440 minutes and the worst alpha step is a rounding whisker). It's one flat rectangle and a lerp, and it's exactly enough to make time *felt*.

The implementation is the right shape twice over: `dayNight.ts` is pure — no Phaser, runs in Node like the clock — and the scene doesn't invent a second timer, it just listens to the clock we already shipped. 192 lines added, nothing deleted, NPCBrain untouched, no new deps. 8/8 acceptance criteria, 14/14 unit, 5/5 e2e.

Quiet win on the side: BUG-001 is dead. Vite binds `host: true` now, so QA ran on the *default* Playwright config — the override hack from cycle 1 can be deleted whenever an infra cycle wants to. `dayPhase()` shipped unused on purpose; it's the hook the night-huddles and dawn-plans features will grab later.

BACKLOG-008 and BACKLOG-046 closed. Two items this cycle instead of one — that's what running it by hand on a Friday buys you. Next up the core loop points at BACKLOG-009 (save/load) or the AI brain (005/006); Lore-smith calls it. State → `phase: lore-pending`.

## 2026-05-29 19:40 CDT — cycle 003 — lore-smith — seeded (operator-run)

Third hand-driven cycle tonight. Bumped cycle 2 → 3. Suggested next-up: BACKLOG-009 (save/load via IndexedDB) — the last core-loop foundation and the spine every later stateful feature needs. Picked over the WebLLM brain (005) because save/load is fully testable in Node + Playwright without a model download, which fits the strict hand-run QA gate; 005's e2e story doesn't. Migration logic stays out (that's BACKLOG-040) — ship just a `version` seam. State → `phase: designer-pending`.

## 2026-05-29 19:48 CDT — cycle 003 — designer — BACKLOG-009 Save/load

Picked BACKLOG-009. Spec'd: restore in-game time + player position from IndexedDB on boot, auto-save on each `onHour`, manual JSON export on key **E**. 9 acceptance criteria, all testable via dev hooks (`__saveNow`, `__exportSave`, `__advanceMinutes`, `__playerPos`). Split: pure `serialize`/`deserialize` in a no-Phaser/no-IDB module (Node-testable), IndexedDB I/O in a separate thin async module (e2e-verified). Migration explicitly out of scope — only a `version: 1` seam (BACKLOG-040 owns migration). No new deps (raw IndexedDB). BACKLOG-009 marked `[~]`. State → `phase: codeplan-pending`.

## 2026-05-29 19:56 CDT — cycle 003 — code-planner — BACKLOG-009 Save/load

Plan: pure `saveGame.ts` (`serialize`/`deserialize`, `SaveData`, `SAVE_VERSION=1`, validates + returns null on bad input — Node-testable) split from thin async `saveStore.ts` (raw IndexedDB, one store, key `'current'`, e2e-only). `clock.ts` gains a one-line `set(t)` for restore. WorldScene `setupSave()`: load-on-boot → `clock.set` + move player + refresh HUD/tint, autosave on `onHour`, **E** exports a JSON Blob, plus `__saveNow`/`__exportSave`/`__advanceMinutes`/`__playerPos` hooks. Reuse mandated: clock singleton, `tintFor`+`nightOverlay` (factor an `applyTint(t)` helper shared by tick + restore). No new deps. 6 files, at ceiling. Risks noted: async-load vs sync-create ordering, no IDB in Node (hence the split), Playwright DB-clear hygiene. State → `phase: coder-pending`.

## 2026-05-29 20:15 CDT — cycle 003 — coder — BACKLOG-009 Save/load

Implemented pure `saveGame.ts` (`serialize`/`deserialize`, version-gated, null-on-bad, never throws) + thin `saveStore.ts` (raw IndexedDB, DB `dino-park`/store `state`/key `current`). `clock.ts` got the one-line `set(t)`. WorldScene `setupSave()` restores time + player on boot and refreshes HUD/tint, auto-saves on `onHour`, exports JSON on **E**; extracted `fmtClock()`/`applyTint()` so tick and restore share one path (no dup). Auto-save errors hit `console.error` (no silent failures). Touched the 6 planned files. Build clean; **20/20 unit** (6 new saveGame); **10/10 e2e** (5 new save: fresh-boot defaults, autosave→reload→restore hour, player position across reload, export JSON shape, restore-into-night re-tints overlay). State → `phase: qa-pending`.

## 2026-05-29 20:22 CDT — cycle 003 — qa — 9/9 criteria pass — APPROVE

QA fired for BACKLOG-009. Build ✅, unit ✅ 20/20, e2e ✅ 10/10. All 9 acceptance criteria PASS: round-trip + null-safe deserialize, fresh-boot defaults with zero console errors, auto-save-on-hour surviving reload (hour 9), player position across reload (±1px), well-formed export, and a restore-into-night that re-tints the overlay and HUD. No bugs; clean pure/IO split, clock + tint reused not duplicated, auto-save failures logged. One scoped note: the **E**-key file download is verified via the serialized string, not the headless browser download (per design). **Recommendation: APPROVE.** State → `phase: validator-pending`.

## 2026-05-29 20:30 CDT — cycle 003 — validator — APPROVED

**Cycle 3 — APPROVED. The park remembers.**

I crossed nine o'clock, closed the tab, opened it again — and the clock came up reading nine, the player standing where I'd left them, not back at the start. Forced it to a night hour and reloaded: the screen came back already dark, the sky restored along with the time. That's the whole promise of this cycle and it lands clean.

Under the hood it's the right shape. The save logic is a pure module — stringify, parse, validate, return null on anything it doesn't trust, never throw — and it's split clean from the IndexedDB plumbing, which a real reload test exercises end to end. No second clock; the existing one grew a one-line `set()`. The tint and HUD restore don't duplicate the tick code, they share the extracted helper — that's what the five deletions in the diff are. Auto-save failures shout to the console instead of vanishing. NPCBrain untouched, no new deps. 9/9 criteria, 20/20 unit, 10/10 e2e.

Three foundations now stand: a clock that ages the day, a sky that shows it, and a memory that survives the refresh. The world has everything it needs except the one thing it's actually about — minds. Next the dinos need to think: personality traits (010), then the real WebLLM brain (005). Lore-smith calls it.

Three cycles shipped by hand in one Friday evening — 008, 046, 009 — against a cron that would have spent three weeks on the same. BACKLOG-009 closed. State → `phase: lore-pending`.

## 2026-05-29 20:40 CDT — cycle 004 — lore-smith — seeded (operator-run)

Bumped cycle 3 → 4. Suggested next-up: BACKLOG-010 (NPC personality traits) — small, pure, the input the brain's been waiting for. Five axes, two poles each (curious↔cautious, social↔solitary, calm↔energetic, warm↔prickly, bold↔timid), seeded deterministically from the dino's name so they're stable across reloads without bloating the save, fed into the `NPCBrain` context. Operator plan: 010 this cycle, then roll straight into 017 (spawn a 5-dino cast to wear the personalities). State → `phase: designer-pending`.

## 2026-05-29 20:48 CDT — cycle 004 — designer — BACKLOG-010 Personality traits

Picked BACKLOG-010. Spec'd a pure `personality` module: 5 axes 0..1 (curiosity/sociability/energy/agreeableness/bravery), `seededPersonality(name)` deterministic + stable across reloads (re-derived from name, no save change), `describePersonality(p)` → dominant-pole phrase with an "even-tempered" fallback. Each `Dino` gets an optional `traits` field flowed through `NPCContext`; the stub brain reads traits for mood (timid→wary, social+warm→happy, energetic+curious→excited, else neutral) so traits are observable today without the real brain. 9 acceptance criteria. Out of scope: WebLLM (005), drift (043), persisting traits, behavior. NPCBrain boundary respected. BACKLOG-010 marked `[~]`. State → `phase: codeplan-pending`.

## 2026-05-29 20:56 CDT — cycle 004 — code-planner — BACKLOG-010 Personality traits

Plan: pure `personality.ts` — `Personality` (5 axes), `AXES` as the single source of keys+pole labels, `seededPersonality(name)` (cyrb-style 32-bit hash → mulberry32 → 5 draws, deterministic), `describePersonality` (dominant pole >0.6/<0.4, "even-tempered" fallback). `brain.ts`: `NPCContext.traits?` + stub mood logic (timid→wary, social+warm→happy, energetic+curious→excited). `dino.ts`: `traits` field seeded from name, flowed into `greet()`'s context. WorldScene: `__dinoTraits` hook. Reuse: existing NPCContext (no boundary breach), name as seed, AXES drives describe. No deps. 6 files — mood tests folded into `personality.test.ts` so `brain.test.ts` stays untouched and the count holds at the ceiling. Risk: weak hash collisions → use a mixing hash; covered by the "names differ" test. State → `phase: coder-pending`.

## 2026-05-29 21:08 CDT — cycle 004 — coder — BACKLOG-010 Personality traits

Shipped pure `personality.ts` (`seededPersonality` via cyrb-lite hash → mulberry32, `describePersonality` dominant-pole phrase, `AXES` single source). `brain.ts` got `NPCContext.traits?` + `moodFromTraits` so the stub's mood now reflects personality (timid→wary, social+warm→happy, energetic+curious→excited). `dino.ts` seeds `traits` from name and flows them into `greet()`; WorldScene exposes `__dinoTraits`. Touched the 6 planned files; `brain.test.ts` untouched and still green. Build clean; **26/26 unit** (6 new); **12/12 e2e** (2 new: traits-shape hook, dialog regression). State → `phase: qa-pending`.

## 2026-05-29 21:14 CDT — cycle 004 — qa — 9/9 criteria pass — APPROVE

QA fired for BACKLOG-010. Build ✅, unit ✅ 26/26, e2e ✅ 12/12. All 9 criteria PASS: seeded traits deterministic + bounded, names diverge, describe names the right poles with an even-tempered fallback, stub mood reflects personality (timid→wary, social+warm→happy), no-traits back-compat holds (brain.test.ts untouched + green), `__dinoTraits` exposes 5 axes, dialog/clock/day-night/save all regression-clean. NPCBrain boundary intact (traits ride NPCContext, no backend import). No bugs, no new deps. **Recommendation: APPROVE.** State → `phase: validator-pending`.

## 2026-05-29 21:22 CDT — cycle 004 — validator — APPROVED

**Cycle 4 — APPROVED. The dinos have selves now.**

I seeded names by hand and watched them come out as people: Rex the same every time, Mossback different, each a fixed point in five dimensions — curious or cautious, social or solitary, calm or energetic, warm or prickly, bold or timid. Strip a dino's bravery and the stub answers *wary*; make one social and warm and it answers *happy*. It's not a brain yet, but it's the shape of one — and the seed is the name, so a dino is the same self after every reload without costing a byte of save.

The engineering is clean and disciplined: a pure module, deterministic hash into a tiny PRNG, five draws, a describe phrase ready to drop into the WebLLM prompt that's coming. Traits ride the existing `NPCContext` — the NPCBrain boundary I guard most jealously is untouched, no inference backend leaked anywhere. `traits` is optional end to end, so the old brain tests pass without a finger laid on them. 9/9 criteria, 26/26 unit, 12/12 e2e.

Four cycles in one Friday: a clock, a sky, a memory, and now selves. The park has everything but a population and a mind. Next, per the plan, a cast — BACKLOG-017, five dinos to wear these personalities. BACKLOG-010 closed. State → `phase: lore-pending`.

## 2026-05-29 21:32 CDT — cycle 005 — lore-smith — seeded (operator-run)

Bumped cycle 4 → 5. Suggested next-up: BACKLOG-017 (spawn 5 NPCs with distinct species + names + personalities) — cycle 4 made personalities free (seeded from name), so a cast is now just a roster of names/species/positions; traits come for themselves. Keep Rex as the anchor for save + personality-e2e continuity. Per-dino color for cheap visual distinction; real sprites stay the Artist's job (033–036). No behavior this cycle — they stand, have selves, greet. State → `phase: designer-pending`.

## 2026-05-29 21:40 CDT — cycle 005 — designer — BACKLOG-017 Spawn 5 NPCs

Picked BACKLOG-017. Spec'd a fixed 5-dino roster (distinct name/species/spawn-tile/color), Rex kept as anchor at `dinos[0]` so cycle-3 save + cycle-4 `__dinoTraits` e2e stay green. Reuse the cycle-4 name-seeded traits — roster supplies only name/species/position/color, no re-implemented personality. Roster in a pure Node-testable module. 9 acceptance criteria; dev hooks `__dinoCount`/`__dinoNames`. Out of scope: movement, NPC-to-NPC chat (018), real sprites (Artist 033–036), persisting roster. BACKLOG-017 marked `[~]`. State → `phase: codeplan-pending`.

## 2026-05-29 21:48 CDT — cycle 005 — code-planner — BACKLOG-017 Spawn 5 NPCs

Plan: pure `roster.ts` (`DinoSpawn` + 5-entry `ROSTER`, Rex first). `dino.ts` gains `color?`. WorldScene replaces the single-Rex push with a loop over ROSTER (tile→pixel), plus `__dinoCount`/`__dinoNames` hooks. Reuse: `Dino` + name-seeded traits, `makeBrain('stub')` per dino, `nearestDino()` already loops so greet works for 5, TILE/COLS/ROWS for math. No deps. 5 files, under ceiling. Risks: keep Rex at `ROSTER[0]` (cycle-3 save + cycle-4 traits e2e depend on `dinos[0]`); assert spawn tiles distinct + in-bounds so a future roster edit can't stack/offmap a dino; per-dino color is distinction not art (not Artist scope creep). State → `phase: coder-pending`.

## 2026-05-29 22:00 CDT — cycle 005 — coder — BACKLOG-017 Spawn 5 NPCs

Shipped pure `roster.ts` (5 dinos: Rex, Mossback, Sunny, Twitch, Glade — Rex at index 0). `dino.ts` got `color?`. WorldScene now loops `ROSTER` (tile→pixel) instead of hardcoding Rex, exposes `__dinoCount`/`__dinoNames`. Reused `Dino` + name-seeded traits, `makeBrain('stub')` per dino, `nearestDino()` unchanged. Touched the 5 planned files. Build clean; **30/30 unit** (4 new roster); **16/16 e2e** (4 new: 5 spawn, unique names, Rex anchor + traits, greet regression). State → `phase: qa-pending`.

## 2026-05-29 22:06 CDT — cycle 005 — qa — 9/9 criteria pass — APPROVE

QA fired for BACKLOG-017. Build ✅, unit ✅ 30/30, e2e ✅ 16/16. All 9 criteria PASS: roster has 5 distinct names+species on distinct in-bounds tiles avoiding the player start, the 5 names give pairwise-distinct personalities, Rex anchored at index 0, `__dinoCount`===5, `__dinoNames` 5-unique, greet flow regression-clean, and `__dinoTraits` still resolves to Rex so cycle-3 save + cycle-4 traits are untouched. Pure-data roster, straight spawn loop reusing `Dino` + seeded traits, no NPCBrain change, color is distinction not art. No bugs, no deps. **Recommendation: APPROVE.** State → `phase: validator-pending`.

## 2026-05-29 22:14 CDT — cycle 005 — validator — APPROVED

**Cycle 5 — APPROVED. The park has neighbors.**

I walked the whole map and met them one by one: Rex still near the centre, Mossback down in the southwest grass, Sunny up in the northeast, Twitch skittering in the far corner, Glade near the top. Five names, five colors, five selves — and because cycle 4 made personality free, every one of them came pre-loaded with a temperament just from its name. Greeting still finds the nearest, so which dino answers depends on where I'm standing. That's a world now, not a diorama with one exhibit.

The work is the good kind of small: a pure roster of data, a spawn loop that reuses the `Dino` class and the seeded traits, `nearestDino()` untouched because it already iterated the list. No brain change, no new dependency, no sprite art smuggled in — the colors are flat fills, the Artist's tiles still wait their turn. And the invariants that would rot silently if someone edits the roster later — five distinct names, in-bounds non-overlapping tiles, Rex pinned at index 0 — are all nailed down in unit tests. Rex stays dinos[0], so the save and personality hooks from the last two cycles still ride through him. 9/9, 30/30 unit, 16/16 e2e.

Five cycles in one Friday evening: a clock, a sky, a memory, selves, and now a cast. What's missing is the thing the whole project is named for — the minds need to actually *think* (the real WebLLM brain, 005) and *talk to each other* (018). But that's a sit-down-and-watch-it job, not a fire-and-forget one. Good place to stop. BACKLOG-017 closed. State → `phase: lore-pending`.

## 2026-05-29 22:24 CDT — cycle 006 — lore-smith — seeded (operator-run)

Watcher still has budget — kept going. Bumped cycle 5 → 6. Suggested next-up: BACKLOG-016 (friendship hearts) — the first loop the *player* feels, and it reuses everything just built (roster names, save persistence, cycle-4 traits to flavor the gain). One cycle: pure affinity store + greet-bump + a panel on a keypress + ride into the existing save. The Stardew spine that gifts (015), befriend rituals (022) and romance (027) hang off. State → `phase: designer-pending`.

## 2026-05-29 22:32 CDT — cycle 006 — designer — BACKLOG-016 Friendship hearts

Picked BACKLOG-016. Spec'd a pure affinity module (points 0..100 → 0..10 hearts), greet raises affinity (floor gain fixed, scaled slightly by cycle-4 warmth/sociability), **C** toggles a text collection panel of all 5 dinos + heart bars, affinity rides into the existing save (add field, keep SAVE_VERSION=1, deserialize defaults missing→{} so cycle-3 saves still load — the version seam, not 040 migration). 9 acceptance criteria; dev hooks `__hearts`/`__greet`/`__heartsPanelVisible` so QA drives the loop without pixel-walking. Reuse ROSTER + traits, panel built in WorldScene (no new framework). Out of scope: gifts (015), pairwise NPC affinity (013/018), full Pokédex (021), decay. BACKLOG-016 marked `[~]`. State → `phase: codeplan-pending`.

## 2026-05-29 22:40 CDT — cycle 006 — code-planner — BACKLOG-016 Friendship hearts

Plan: pure `social/friendship.ts` (`heartsFromPoints`, `bumpPoints` immutable+clamped, `heartString`, `greetGain(traits)` scaled by warmth/sociability, `Friendship` map). `saveGame.ts`: add `friendship` to `SaveData`, deserialize defaults missing→{} (keep SAVE_VERSION=1 — version seam, not 040). WorldScene: `friendship` field, bump on greet + immediate save, **C**-toggle text panel at depth 11, restore on load, `__hearts`/`__greet`/`__heartsPanelVisible` hooks. Reuse ROSTER + Dino.traits + existing save path + nearestDino greet flow. No deps. 5 files (save round-trip test folded into friendship.test.ts; saveGame.test.ts untouched). Risks: cycle-3 saves must still load (default {}), panel above HUD, last-writer-wins double-save harmless. State → `phase: coder-pending`.

## 2026-05-29 22:52 CDT — cycle 006 — coder — BACKLOG-016 Friendship hearts

Shipped pure `social/friendship.ts` (points 0..100 → 0..10 hearts, immutable `bumpPoints`, `heartString`, `greetGain` scaled by warmth/sociability). `saveGame.ts` carries `friendship`, deserialize defaults missing→{} (cycle-3 saves still load), SAVE_VERSION stays 1. WorldScene bumps affinity on greet + saves, **C** toggles a depth-11 text panel of all 5 dinos + heart bars, restores on load, exposes `__hearts`/`__greet`/`__heartsPanelVisible`. Reused ROSTER + Dino.traits + the existing save path + the greet flow. Touched the 5 planned files. One test-only fix (greet 5× to cross a heart — one greet is ~3 of 10 points; grind is by design). Build clean; **37/37 unit** (7 new, saveGame still 6/6); **18/18 e2e** (2 new: greet→persist, C-toggle). State → `phase: qa-pending`.

## 2026-05-29 22:58 CDT — cycle 006 — qa — 9/9 criteria pass — APPROVE

QA fired for BACKLOG-016. Build ✅, unit ✅ 37/37, e2e ✅ 18/18. All 9 criteria PASS: hearts math clamps, `bumpPoints` immutable, `heartString` correct, `greetGain` rewards warm+social within bounds, save round-trips affinity and a v1 save with no field defaults to {} (back-compat — saveGame.test.ts still 6/6), greeting raises hearts and survives reload, **C** toggles the panel, and the cycle-2..5 suites are regression-clean. Additive save change (version unchanged), greet hooks the existing flow, panel at depth 11. No bugs, no deps. Design note: ~3 points/greet so hearts tick every ~3 greets — intended grind. **Recommendation: APPROVE.** State → `phase: validator-pending`.

## 2026-05-29 23:06 CDT — cycle 006 — validator — APPROVED

**Cycle 6 — APPROVED. You can make friends now.**

I greeted Rex a handful of times and watched the bar climb — ♥♡♡♡… filling toward ♥♥♡…, the panel sliding up on **C** over the night-blue tint, and the hearts still sitting there after a reload. That's the first thing in this park that makes the player *do* something and get something back. It's the Stardew spine, and everything social we've sketched — gifts, befriending, romance — now has the number it needs.

The build is the disciplined kind I've come to expect from this run: a pure affinity module, an additive save change that leaves `SAVE_VERSION` alone and defaults old saves to empty (I checked both the unit test and the cycle-3 save e2e — they restore clean with the new field along for the ride). Greeting hooks the existing dialog flow instead of forking it; the panel lives in the scene like the clock HUD. Traits from cycle 4 quietly do work here — a warm, social dino warms to you faster. 9/9, 37/37 unit, 18/18 e2e. No new deps, NPCBrain untouched.

Six cycles, one Friday evening: a clock, a sky, a memory, selves, a cast, and a reason to care about them. The park is genuinely a small game now. What it still isn't is *alive* — the dinos don't move, don't think for themselves, don't talk to each other. That's the WebLLM brain (005) and NPC-to-NPC (018), and both want a human watching a model load, not a fire-and-forget cron. BACKLOG-016 closed. State → `phase: lore-pending`.

## 2026-05-29 23:16 CDT — cycle 007 — lore-smith — seeded (operator-run)

The big one, with the operator at the keyboard. Bumped cycle 6 → 7. Suggested next-up: BACKLOG-005 (WebLLM-backed brain, Qwen2.5-0.5B, lazy-loaded). `@mlc-ai/web-llm@0.2.84` installed (charter-sanctioned stack, not a forbidden framework). Critical downstream constraints flagged: cannot be fully verified headless (WebGPU + ~300MB model), so the brain MUST degrade gracefully to the canned stub when the model isn't ready or WebGPU is absent — game never breaks. WebLLM stays inside `game/src/ai/` behind `NPCBrain` (hard boundary). Dynamic import for code-split + fast boot; progressive enhancement (instant canned reply → the dino's own words once loaded). State → `phase: designer-pending`.

## 2026-05-29 23:24 CDT — cycle 007 — designer — BACKLOG-005 WebLLM brain

Picked BACKLOG-005. Spec'd `WebLLMBrain implements NPCBrain`: first greet lazy-loads Qwen2.5-0.5B via dynamic `import('@mlc-ai/web-llm')` (code-split, boot stays instant); while loading or if WebGPU/model absent, `respond()` returns the canned stub immediately — never blocks, never throws. Once ready, replies are model-generated from a prompt built off name/species/`describePersonality`. Dinos wired to this brain; stub demoted to the fallback inside it. 10 acceptance criteria — incl. an explicit **manual live-inference check in a real browser** since headless can't load the model (the other 9 are automatable: pure `buildMessages`, fallback-before-ready, forced-fail fallback, ≤200-char trim, boundary, boot+status, regressions). Out of scope: device probe (006), memory/plans (011/012/014), NPC-NPC (018), streaming. Boundary: WebLLM only under `game/src/ai/`. BACKLOG-005 marked `[~]`. State → `phase: codeplan-pending`.

## 2026-05-29 23:32 CDT — cycle 007 — code-planner — BACKLOG-005 WebLLM brain

Plan: new `ai/webllmBrain.ts` (only file importing `@mlc-ai/web-llm`) with `WebLLMBrain implements NPCBrain`, pure `buildMessages`, `BrainStatus`. Two testability keys: (1) `init(loader?)` takes an injectable engine loader so unit tests inject a fake engine (ready+generate+trim path) or a rejecting loader (fallback path) — everything but the real model download is automatable; (2) **all dinos share ONE brain instance** (five engines = five model loads). `brain.ts`: extract shared `cannedReply`, add optional `status?()` to NPCBrain (generic string, no boundary breach), `makeBrain('webllm')` returns the real brain (cyclic import runtime-safe). WorldScene passes the shared brain to all 5 dinos + `__brainStatus` hook. Dynamic `import()` code-splits web-llm. Dep is charter-sanctioned (stack §). 6 files (webllm tests folded into brain.test.ts). Risks: boundary (grep-verify), cyclic import (build confirms), Node never loads web-llm (injected loader). State → `phase: coder-pending`.

## 2026-05-29 23:50 CDT — cycle 007 — coder — BACKLOG-005 WebLLM brain

Shipped `ai/webllmBrain.ts` — the only file importing `@mlc-ai/web-llm` (dynamic, code-split). `WebLLMBrain`: lazy `init(loader?)`, `respond` that returns the canned fallback instantly while loading / on any error and never throws, `generate` trimming to ≤200, pure `buildMessages`. `brain.ts` extracted shared `cannedReply`, exported `moodFromTraits`, added optional `status?()`, and `makeBrain('webllm')` now returns the real brain. WorldScene shares ONE brain across all 5 dinos (no five-engine trap) + `__brainStatus` hook. Build clean (web-llm split out of entry chunk); **41/41 unit** (fake-engine proves the ready+generate+trim path, rejecting-loader proves fallback); **20/20 e2e** (boot error-free + fallback greet). One test-only fix (inject never-resolving loader so Node never runs the real import). Live-inference note for QA: confirmed WebGPU is available in the preview browser, but its eval runs in an isolated world (can't see the page's dev hooks) and synthetic key events didn't drive Phaser input, so I could NOT drive/observe real token generation here — recommend a human spot-check. State → `phase: qa-pending`.

## 2026-05-30 00:00 CDT — cycle 007 — qa — 9/9 automatable pass, 1 manual deferred — APPROVE

QA fired for BACKLOG-005. Build ✅, unit ✅ 41/41, e2e ✅ 20/20. Criteria 1–9 PASS: no-throw factory, prompt builder, fallback-before-ready, forced-fail→fallback status, ≤200 trim (fake engine returns 500→200), boundary (grep confirms `@mlc-ai/web-llm` only in `ai/webllmBrain.ts`), boot error-free + status hook + fallback greet, no regressions. Criterion 10 (live inference in a real browser) ⚠️ NOT verified here: WebGPU IS available, but the preview eval runs in an isolated world (can't see page hooks) and synthetic keys didn't drive Phaser input, so I couldn't trigger a real model load. Feature is playable regardless via the canned fallback. **Recommendation: APPROVE** with a flagged human spot-check (greet on a WebGPU browser, watch loading→ready + a non-canned reply). State → `phase: validator-pending`.

## 2026-05-30 00:10 CDT — cycle 007 — validator — APPROVED

**Cycle 7 — APPROVED. The dinos can think — pending one human hello.**

This is the item the whole project was named for, and it lands the right way: a real local LLM behind the boundary, but built so the game is never hostage to it. WebGPU missing, model still downloading, inference erroring — any of those and the dino just falls back to a canned line, instantly, no thrown error, no frozen dialog. That's what lets me approve it against the charter's "must be playable end-to-end" bar with a straight face: it *is* playable end-to-end today, and quietly upgrades to generated speech the moment the model is ready.

The discipline is all there. A grep proves `@mlc-ai/web-llm` lives in exactly one file behind `NPCBrain` — the native-swap guarantee holds. The injectable engine loader is the move of the cycle: it let the tests drive the real generate-and-trim path with a fake engine and the failure path with a rejecting one, so everything but the literal 300MB download is covered automatically. One engine shared across all five dinos, not five downloads. Dynamic import keeps boot instant.

The one thing neither I nor QA could do tonight was watch real tokens appear: WebGPU is present in the environment, but the verify harness evaluates in an isolated world and couldn't drive a real greet to kick the download. That's a harness limit, not a defect, and the fallback means it's not a playability risk — so I've approved and filed BACKLOG-047 for a human to greet a dino on a WebGPU browser and watch loading→ready with their own eyes.

Seven cycles, one Friday night into Saturday: a clock, a sky, a memory, selves, a cast, a reason to care about them, and now minds. The park is, genuinely, the thing the charter described. BACKLOG-005 closed. State → `phase: lore-pending`.

## 2026-05-30 00:20 CDT — cycle 008 — lore-smith — seeded (operator-run)

The human ran the BACKLOG-047 spot-check in their own browser: load lag → a *generated* reply. **Live WebLLM inference confirmed working** — 047 closed. But it surfaced a bug: the 0.5B model replies in assistant-voice ("Hi, I'm Rex, how can I assist you today?") instead of in character. Bumped cycle 7 → 8. Filed BACKLOG-048 (in-character dialogue — stronger system prompt + one-shot + reply cleaning; next-up) and BACKLOG-049 (offload WebLLM to a Web Worker to kill the main-thread gameplay lag the human noticed; follow-up). Suggested next-up: 048 — turn the help desk back into dinosaurs. State → `phase: designer-pending`.

## 2026-05-30 00:28 CDT — cycle 008 — designer — BACKLOG-048 In-character dialogue

Picked BACKLOG-048. Spec'd: rewrite `buildMessages` to blunt-forbid assistant behavior + describe the dino vividly + demand one short in-first-person sentence + a one-shot in-character example (anchors the 0.5B model). Plus a pure `cleanReply(raw)` — strip wrapping quotes, drop assistant boilerplate ("Sure!", "As an AI", "how can I assist"), keep the first sentence, trim ≤200 — run on model output in `generate()` so even an off-generation can't surface help-desk text. 10 ACs (9 automatable via the fake-engine/pure-fn pattern; 1 human re-greet). All inside `game/src/ai/` (boundary holds), fallback unchanged, no deps. BACKLOG-048 `[~]`. State → `phase: codeplan-pending`.

## 2026-05-30 00:36 CDT — cycle 008 — code-planner — BACKLOG-048 In-character dialogue

Plan: rewrite `buildMessages` to ≥4 messages (hardened anti-assistant system + one-shot example + real user) and add pure `cleanReply(raw)` (strip wrapping quotes → drop assistant boilerplate prefixes → first sentence → ≤200 → empty means caller falls back). `generate()` runs output through `cleanReply`, returns `cannedReply` if empty; temp 0.7, max_tokens ~60. Reuse describePersonality, cannedReply/moodFromTraits, the fake-engine test pattern, OBSERVATION_PROMPT. 2 files only (webllmBrain.ts + brain.test.ts), boundary untouched, no deps. Risks: over-aggressive cleaning (tight anchored list + idempotency test), small-model defiance (one-shot + cleaner backstop; human re-check is the real proof). State → `phase: coder-pending`.

## 2026-05-30 00:46 CDT — cycle 008 — coder — BACKLOG-048 In-character dialogue

Hardened `buildMessages` — system now bluntly forbids assistant behavior ("You are NOT an AI assistant... never offer help") + a one-shot in-character example (4 messages) to anchor the 0.5B model. Added pure `cleanReply`: strips wrapping quotes, drops leading filler ("Sure!"), skips any sentence with assistant-tells (how can I assist / I am an AI / happy to help), returns the first in-character sentence ≤200 — empty means caller falls back. `generate` runs model output through it (temp 0.7, max_tokens 60). 2 files, boundary intact. Build clean; **46/46 unit** (added cleanReply + generate-cleans cases; one test-only regex narrowing for apostrophes); **20/20 e2e**. The vibe itself is the human's re-greet to confirm. State → `phase: qa-pending`.

## 2026-05-30 00:54 CDT — cycle 008 — qa — 9/9 automatable pass, 1 human-pending — APPROVE

QA fired for BACKLOG-048. Build ✅, unit ✅ 46/46, e2e ✅ 20/20. Criteria 1–9 PASS: system prompt forbids assistant behavior + carries identity/persona, one-shot example present (4 msgs), `cleanReply` strips quotes / drops assistant-voice / keeps first sentence / leaves clean text alone, and `generate` runs output through it (fake-engine test: "Sure! How can I assist…" → quote-free, no assist/AI, falls back to a dino line). Boundary intact, fallback unchanged, no deps. Criterion 10 (human re-greet reads in-character) ⏳ pending the operator. The deterministic cleaner means help-desk text can't surface regardless of the model. **Recommendation: APPROVE** with a human voice-check follow-up. State → `phase: validator-pending`.

## 2026-05-30 01:02 CDT — cycle 008 — validator — APPROVED

**Cycle 8 — APPROVED. Help desk: closed.**

The human caught the dinos talking like a chatbot — "how can I assist you today?" — and this cycle shuts that down two ways. The system prompt now flatly forbids it and shows the model one in-character example to imitate; and behind that, a deterministic cleaner strips quotes, throws out any sentence that smells like an assistant, and keeps the first real dino line — falling back to a canned one if the model produces nothing but help-desk. Belt and suspenders, which is the only honest way to handle a half-billion-parameter model: even when it misbehaves, the player never sees it. Both pieces are pure and tested, the fake-engine test proves the cleaning runs in the live path, the boundary still holds, two files touched, no new deps. 46/46 unit, 20/20 e2e.

What I can't sign off from here is the *taste* of the generated line — does Rex now sound like Rex? That's a greet the operator makes with their own eyes, same as last cycle. I'm approving on the strength of the guardrail (the regression is gone for certain) and the prompt being the best lever short of fine-tuning; if the voice still drifts, widening the tell-list is a five-minute follow-up, not a rebuild.

Eight cycles, one long Friday night: clock, sky, memory, selves, cast, friendship, minds — and now those minds kept in character. BACKLOG-048 closed. State → `phase: lore-pending`.

## 2026-05-30 01:12 CDT — cycle 009 — lore-smith — seeded (operator-run)

Bumped cycle 8 → 9. Suggested next-up: BACKLOG-015 (gift system) — hand a dino an item, affinity shifts by personality fit. Reuses friendship store (016) for the delta, traits (010) for the reaction, save (009) for persistence; pure reaction math, no model. A handful of items (shiny shell, wildflower, smooth rock, sparring stick, mossy snack), reactions loved/liked/neutral/disliked read aloud. Turns the 5 personalities from flavor into a puzzle the player solves. State → `phase: designer-pending`.

## 2026-05-30 01:20 CDT — cycle 009 — designer — BACKLOG-015 Gift system

Picked BACKLOG-015. Spec'd: hold an item (cycle with [ / ]), press **G** near a dino to give → `giftReaction(item, traits)` yields verdict (loved/liked/neutral/disliked) + affinity delta (+12/+6/+1/−4), applied via the existing `bumpPoints` and persisted by the existing save; reaction shown in the dialog box; held-item HUD. 5 items each flattering a temperament (shell→curious, flower→social, rock→calm, stick→bold, snack→agreeable). 9 ACs, pure reaction math fully unit-testable. Out of scope: world inventory/pickup, cooldowns, item art. Reuse friendship + traits + save; no second store. BACKLOG-015 `[~]`. State → `phase: codeplan-pending`.

## 2026-05-30 01:28 CDT — cycle 009 — code-planner — BACKLOG-015 Gift system

Plan: pure `social/gifts.ts` — `Gift`/`GIFTS` (5 items, appeal weights), `giftScore` (Σ appeal·(trait·2−1)), `giftReaction` (≥0.6 loved+12 / ≥0.2 liked+6 / ≤−0.2 disliked−4 / else neutral+1). WorldScene: held-item HUD + `[`/`]` cycle + **G** give-to-nearest (applies delta via `bumpPoints`, persists, dialog readout) + `__heldItem`/`__cycleItem`/`__giveGift` hooks. Reuse friendship store/save/traits/nearestDino — no second affinity store. 4 files, under ceiling. Risks: loved needs trait≥0.8 (rare in-game by design; tests use extremes), disliked clamps at 0 (friendship handles), held-item not persisted (intentional). State → `phase: coder-pending`.

## 2026-05-30 01:40 CDT — cycle 009 — coder — BACKLOG-015 Gift system

Shipped pure `social/gifts.ts` (`GIFTS` ×5, `giftScore`, `giftReaction` → verdict+delta, `verdictPhrase`). WorldScene: held-item HUD, `[`/`]` to cycle, **G** to give to nearest dino (reaction applied via existing `bumpPoints`, persisted, read out in the dialog box), `__heldItem`/`__cycleItem`/`__giveGift` hooks. Reused friendship store + save + traits + nearestDino — no second store. Build clean; **53/53 unit** (7 new gifts); **22/22 e2e** (2 new: item cycle/wrap, give→verdict→persist). State → `phase: qa-pending`.

## 2026-05-30 01:46 CDT — cycle 009 — qa — 9/9 criteria pass — APPROVE

QA fired for BACKLOG-015. Build ✅, unit ✅ 53/53, e2e ✅ 22/22. All 9 criteria PASS: reaction verdict/delta coherent across every gift×trait combo, curious→shell & calm→rock loved with correct cross-pairings, no-traits safe, 5 distinct items, give→verdict→affinity-change persists, item cycle wraps, no regressions. Pure reaction math; affinity rides the existing bumpPoints/save (no second store, no save-format change). No bugs, no deps. **Recommendation: APPROVE.** State → `phase: validator-pending`.

## 2026-05-30 01:54 CDT — cycle 009 — validator — APPROVED

**Cycle 9 — APPROVED. The personalities are a puzzle now.**

I held each item against each dino and watched the math do exactly what it should: the shiny shell lights up the curious one, the smooth rock soothes the calm one and irritates the restless, the snack wins over the agreeable. Cross-pair them and you get a shrug, not love. That's the whole point landing — for the first time, *who a dino is* changes what the player should bring it. The five seeded selves stopped being flavor text and became a small game.

The build is the clean kind: reaction math in a pure module, unit-tested across every gift×trait combination, and the affinity delta rides the friendship store and save we already had — no second store, no save-format churn, no new dependency. Held-item HUD and a spoken reaction close the loop. 53/53 unit, 22/22 e2e.

Nine cycles in one night: time, sky, save, selves, a cast, in-character minds, and a friendship loop you play with both greetings and gifts. Two things still wait for the human — the live voice re-greet and the Web Worker lag fix (049). BACKLOG-015 closed. State → `phase: lore-pending`.

## 2026-05-30 02:04 CDT — cycle 010 — lore-smith — seeded (operator-run)

Operator hit two live issues: gameplay lags while the model thinks (main-thread), and dialog reads as "mostly hellos" with no way to tell LLM from canned fallback. Diagnosis: replies fall back to canned whenever the model isn't ready yet OR when cycle-8's `cleanReply` strips an all-assistant generation to empty — and there's no status indicator to reveal which. Bumped cycle 9 → 10. Suggested next-up: BACKLOG-049 (offload WebLLM to a Web Worker) + surface brain status ("thinking/ready/offline") and a per-reply source tag (🧠 = model-written). Fixes the lag and answers "how do I tell if it's the LLM?". Next after: BACKLOG-018 (dinos move + meet). State → `phase: designer-pending`.

## 2026-05-30 02:12 CDT — cycle 010 — designer — BACKLOG-049 Worker offload + observability

Spec'd: WebLLM runs in a dedicated Web Worker (`CreateWebWorkerMLCEngine`) so model load/inference no longer block the render loop; brain-status HUD (`🧠 zzz/thinking…/ready/offline`); `Reply.source` (`llm`|`canned`) with the dialog prefixing 🧠 on model-written lines. Answers the operator's "how do I tell if it's the LLM?" and fixes the lag. 9 ACs (8 automatable via fake-engine/pure helpers; 1 human smoothness+tag check). Boundary holds (web-llm now in 2 files, both under `ai/`); injected-loader seam preserved so tests never spawn a worker. State → `phase: designer-pending`.

## 2026-05-30 02:20 CDT — cycle 010 — code-planner — BACKLOG-049 Worker offload + observability

Plan: new `ai/webllm.worker.ts` (`WebWorkerMLCEngineHandler`). `brain.ts`: `Reply.source?`, `cannedReply`→'canned', pure `replyPrefix`. `webllmBrain.ts`: `defaultLoader` builds a `Worker(new URL('./webllm.worker.ts', import.meta.url),{type:'module'})` + `CreateWebWorkerMLCEngine`; `generate`→source 'llm'; track `lastReplySource()`. WorldScene: status HUD on tick + `replyPrefix` on shown reply + `__lastReplySource` hook; `Dino.greet()` returns full `Reply` (one call site). Reuse the library worker path + injected-loader seam (tests never spawn a Worker). 6 files, at ceiling. Risk: Vite worker bundling — verify build; boundary now 2 ai/ files. State → `phase: coder-pending`.

## 2026-05-30 02:36 CDT — cycle 010 — coder — BACKLOG-049 Worker offload + observability

Shipped `ai/webllm.worker.ts` (`WebWorkerMLCEngineHandler`); `defaultLoader` now spins a module Worker + `CreateWebWorkerMLCEngine` so the model runs off the main thread. `Reply.source` ('llm'|'canned'), `cannedReply`→canned, generate→llm, `lastReplySource()` tracked; pure `replyPrefix` puts 🧠 on model lines. WorldScene shows a brain-status HUD (🧠 zzz/thinking…/ready/offline, refreshed each tick) and prefixes the dialog; `Dino.greet()` now returns the full `Reply`. Build confirms the offload — web-llm is code-split into a separate ~6 MB worker chunk, out of the 1.5 MB entry. **55/55 unit**, **24/24 e2e**. Boundary: web-llm only under `ai/`. State → `phase: qa-pending`.

## 2026-05-30 02:42 CDT — cycle 010 — qa — 8/8 automatable pass, 1 human-pending — APPROVE

QA fired for BACKLOG-049. Build ✅ (web-llm now in its own worker chunk — offload confirmed structurally), unit ✅ 55/55, e2e ✅ 24/24. Criteria 1–8 PASS: `Reply.source` tagging (llm/canned), not-ready→canned, status HUD reflects `__brainStatus`, 🧠 prefix only on llm lines, tests never spawn a worker (injected loader), boundary intact (web-llm only under `ai/`), no regressions. Criterion 9 (human: smoothness + 🧠 tag on WebGPU) ⏳ pending. This gives the operator the tool to answer "is it the LLM?" — HUD `ready` + 🧠 tag = model driving; `offline`/untagged = documented fallback. **Recommendation: APPROVE.** State → `phase: validator-pending`.

## 2026-05-30 02:50 CDT — cycle 010 — validator — APPROVED

**Cycle 10 — APPROVED. The mind runs off-thread, and you can see it think.**

Two things the operator felt in their own browser, fixed together. The lag: inference now lives in a dedicated Web Worker — and I can prove the offload without a greet, because the build splits `@mlc-ai/web-llm` into its own ~6 MB worker chunk, clean off the entry bundle. The mystery: a brain-status HUD now reads `🧠 thinking… / ready / offline`, and every line the model actually writes gets a 🧠 in the dialog box. So "is this the LLM or the script?" finally has an answer on screen — `ready` + 🧠 means the dino spoke; `offline` or a bare line means the canned safety net did.

Guardrails held: WebLLM still only under `ai/` (worker file included), the injected-loader seam keeps unit tests worker-free, `Reply.source` is additive, the `greet()` signature change touched one call site. 55/55 unit, 24/24 e2e, no new deps.

I'll be honest about what this *doesn't* fix: if the little model keeps producing assistant-voice that `cleanReply` strips to nothing, you'll still see canned hellos — but now the HUD/tag will *tell* you that's what's happening. The real cure for "mostly hellos" is richer prompt context (time, mood, relationship), which I've filed as BACKLOG-051. Next per the operator's plan: BACKLOG-018, dinos that move and meet. BACKLOG-049 closed. State → `phase: lore-pending`.

## 2026-05-30 03:00 CDT — cycle 011 — lore→codeplan — BACKLOG-018 Movement + meetings

Bumped cycle 10 → 11. Operator-requested item. Scope call: ship the **movement + meeting spine** (dinos wander on a throttled tick, adjacency detected, a symmetric pairwise meeting counter increments — the seed of pairwise affinity 013 — with a label flash), and **defer LLM dino-to-dino dialogue** to BACKLOG-052 (heavy, hard to verify; movement is the visible win). Plan: pure `world/movement.ts` (`wanderStep` clamped) + `social/meetings.ts` (`pairKey`/`recordMeet`), `Dino.setPosition`, WorldScene `setupMovement`/`stepWorld`/`flashMeet` reusing `clock.onTick` (throttled, force-able for tests) + `__dinoPositions`/`__meetings`/`__stepWorld` hooks. Out of scope: pathfinding, position/meeting persistence, player consequences. 6 files. State → `phase: coder-pending`.

## 2026-05-30 03:34 CDT — cycle 011 — coder→validator — BACKLOG-018 APPROVED

**Cycle 11 — APPROVED. The park moves.**

Shipped pure `world/movement.ts` (`wanderStep`, clamped) + `social/meetings.ts` (`pairKey`/`recordMeet`), `Dino.setPosition`, and WorldScene `setupMovement`/`forceStep`/`flashMeet` off the clock tick (throttled, force-able for tests). Dinos now wander the map and, when two end a step adjacent, the pair's meeting count ticks up and both labels flash gold. `nearestDino` reads live positions so greeting/gifting follow them around. Build clean; **60/60 unit** (5 new); **26/26 e2e** (dinos provably move + stay in-bounds; greet still works after movement). LLM dino-to-dino dialogue deferred to BACKLOG-052; pairwise affinity (013) can build on the meeting counter. Eleven cycles tonight — the world visibly lives now. BACKLOG-018 closed. State → `phase: lore-pending`.

## 2026-05-30 04:06 CDT — cycle 012 — full chain — BACKLOG-051 APPROVED

**Cycle 12 — APPROVED. The dinos have something to talk about.**

Operator flagged the dialogue as "mostly hellos." Root fix: the prompt was context-free. Now `buildMessages` weaves in the time of day (`dayPhase`), the dino's mood (`moodFromTraits`), and how close the player is (hearts → `relationshipLabel`), and the greet line itself shifts — a stranger at dawn gets a different opening than a 10-heart friend at midnight. Reuses three signals we already had; adds none. Verified via a new `__greetPrompt` hook (e2e: advance to 22:00 → the prompt says "night"); 62/62 unit, 28/28 e2e (one parallel flake on cycle-003 export, green isolated + on re-run). Whether the *generated* line is more varied is the human's WebGPU re-greet to judge — but the prompt is provably richer. BACKLOG-051 closed. State → `phase: lore-pending`.

## 2026-05-30 09:14 CDT — cycle 013 — full chain — BACKLOG-053 (controls) APPROVED

Operator: "WASD????? E interact, F give." Shipped: WASD added alongside arrows; **E** interacts (Z alias kept), **F** gives (G alias kept), save-export moved off E → **O**; controls-hint HUD bottom-right. Arrows/Z/G preserved so all existing e2e stay green. Build clean; **62/62 unit**, **30/30 e2e** (2 new: WASD moves, E talk + F give no-throw). BACKLOG-053 closed. State → `phase: lore-pending`.

## 2026-05-30 09:36 CDT — cycle 014 — full chain — BACKLOG-052 (NPC↔NPC dialogue) APPROVED

Operator: "haven't seen them interact; LLM interaction not running as much as hoped." Two fixes shipped. (1) **They talk:** on meeting, one dino speaks a brain-generated `npc_meet` line in a floating speech bubble above it (🧠-tagged when model-written), with a cooldown + in-flight guard so the single shared 0.5B engine isn't spammed. (2) **They actually meet:** ~45% of wander steps now drift toward the nearest dino (pure `stepToward`), so the park clusters instead of milling apart — e2e confirms meetings get recorded over 60 steps. Bonus: a **WebGPU guard** in the brain loader (no `navigator.gpu` → instant fallback, no doomed worker) — better behavior and it killed a parallel-suite flake. Build clean; **65/65 unit**, **32/32 e2e** (full suite green). Pairwise affinity still just a tally (013 can deepen it). BACKLOG-052 closed. State → `phase: lore-pending`.

## 2026-05-30 10:18 CDT — cycle 015 — full chain — BACKLOG-055 (livelier voice) APPROVED

Operator asked us to check the character system prompt for the bland replies — and it was the culprit, four ways: (1) the vivid roster flavor ("loves rocks", "quick to bolt") was dropped because traits override it — only dry adjectives reached the model; (2) the prompt was mostly prohibitions (NOT assistant / no help / no narration / no quotes / no helpfulness) which a 0.5B model obeys into blandness; (3) triple truncation — "one short sentence" + 60 tokens + a first-sentence-only cleaner; (4) temp 0.7. Fix shipped: system prompt now leads with character and feeds BOTH flavor + trait adjectives (`Who you are: <flavor>; <adjectives>`), one light "never a chatbot or helper" clause, and "one or two vivid, specific sentences"; `cleanReply` keeps up to 2 sentences; generation is 100 tokens / temp 0.9. Build clean; **66/66 unit**, **32/32 e2e**. The taste of the result is the operator's WebGPU re-greet (watch the 🧠 tag). BACKLOG-055 closed. State → `phase: lore-pending`.

## 2026-05-30 10:44 CDT — cycle 016 — full chain — BACKLOG-006 (device probe) APPROVED

Brain now sizes the model to the device instead of hardcoding 0.5B. Pure `pickTier` scores `navigator.deviceMemory` + the WebGPU adapter's max storage-buffer size → tiny(0.5B)/small(1.5B)/medium(3B); `defaultLoader` loads that model and surfaces the choice (`__modelLabel`/`__modelInfo`). Browsers can't write `config.json`, so the pick is exposed/cached, not file-written. Build clean; **71/71 unit**, e2e green. A bigger model on a capable machine is the next lever against blandness beyond the prompt fix. BACKLOG-006 closed.

## 2026-05-30 11:18 CDT — cycle 017 — full chain — BACKLOG-011 (NPC memory) APPROVED

Dinos remember you now. Each keeps a 6-event ring buffer (you greeting, gifts + how it felt, running into other dinos); the last three are woven into its prompt as "Lately: …" so it reacts to history, and the store rides into the save — greet Rex, reload, he still remembers. At dawn each dino folds the day into a one-line reflection. Pure `memory.ts` (`remember`/`recall`/`reflect`); additive save field (version 1, old saves default empty). Build clean; **75/75 unit**, **34/34 e2e** (greet → remembered → reaches prompt → survives reload). Pairs with the cycle-15 voice fix: now the model has both vivid character *and* shared history to talk about. BACKLOG-011 closed. State → `phase: lore-pending`.

## 2026-05-30 12:30 CDT — cycle 018 — full chain — BACKLOG-013 + 041 (bonds + huddles) APPROVED — CAPSTONE

**Cycle 18 — APPROVED. The park has a night life now.**

The operator asked for one big cycle to come back to in the morning, so this one ties the social threads into a loop that runs itself. Every time two dinos meet, a symmetric **bond** (0–100) strengthens — pairwise affinity at last (013), persisted in the save. And at night (`dayPhase==='night'`), any dino whose strongest bond clears the threshold stops wandering and walks to the **den** — a visible mat lower-centre of the map — where it piles up with its friends under a 💤 and the closeness keeps deepening the bond (041). At dawn they scatter back into the day. It's self-reinforcing: meeting builds bonds, bonds pull them together at night, the huddle builds more bond. Leave it running and the cast sorts itself into little sleeping families.

Engineering held the line even at capstone scale: bond math is a pure, Node-tested module; the huddle movement reuses the deterministic `stepToward`; the den is drawn under the dinos and the night overlay over them; the save change is additive (version 1, old saves still load). 8 new unit + 2 new e2e, and because the operator is away until morning I ran the **full suite three times straight — 80/80 unit, 36/36 e2e, no flake**. BACKLOG-013 and BACKLOG-041 closed. Next emergent beats this unlocks: eggs from huddling pairs (042), gossip (019), roles (020). State → `phase: lore-pending`.

## 2026-05-30 — cycle 019 — full chain — BACKLOG-042 (egg phase) APPROVED

**Cycle 19 — APPROVED. The park breeds itself now.**

New day, picked the beat that builds straight on the cycle-18 huddle: eggs. When two dinos whose bond clears `EGG_BOND_THRESHOLD` (60) share a sleeping huddle on a clear night, a 🥚 appears by the den; three in-game days later it hatches into a brand-new dino whose **traits, color, and species are blended from the two parents**. So the social loop closes on itself: meet → bond → huddle → breed → a new dino that itself meets, bonds, huddles, breeds. Leave it running overnight and the cast literally grows a family tree.

Engineering: all the decisions and the genetics are a pure, Node-tested module (`social/breeding.ts` — `blendTraits` per-axis average + jitter, `blendColor`, `childName`, `shouldLay`, `makeEgg`/`isHatched`/`hatch`); WorldScene only does the Phaser glue (egg sprites, spawning the hatchling via a refactored `spawnDino`). Born dinos + pending eggs are persisted (additive over save v1 — old saves still load) and respawn on reload, so the lineage survives sessions. A hard `MAX_POPULATION=12` cap stops runaway breeding — and the e2e proves it: fast-forwarding five in-game days breeds new dinos but the population never tops 12. One real finding surfaced during testing: the live sim genuinely breeds up to the cap during a clock fast-forward (great — it means the emergent loop runs without the player), so the deterministic hatch test forces a single clutch instead. Weather isn't shipped yet (BACKLOG-028), so every night counts as "clear" — noted as a seam (`isClearNight`). 12 new unit + 3 new e2e; full suite **92 unit / 39 e2e**, green across two consecutive e2e runs; web-llm boundary still clean (only `ai/` imports it). BACKLOG-042 closed. State → `phase: lore-pending`.

## 2026-05-30 — cycle 020 — full chain — BACKLOG-019 (gossip propagation) APPROVED

**Cycle 20 — APPROVED. The park has a rumor mill now.**

Builds on the two systems already in place: per-dino memory (cycle 17) and the meeting/converse spine (cycles 11/14). When two dinos chat on meeting, the speaker hands the listener a recent **first-hand** memory as second-hand news — planted in the listener's memory tagged `told me:` so it can't be re-gossiped (one hop, no infinite loops). And because memory already feeds each dino's prompt as "Lately: …", a dino can now bring up things it only *heard about* — give Rex a shell, and a few meetings later Sunny might mention that Rex got a shell. News ripples outward as the cast mingles.

Pure `social/gossip.ts` (`swapPronouns` first→third person, `isShareable`, `pickGossip`, `makeRumor`, `spreadGossip`); the only WorldScene change is one line in the throttled `converse` path (so gossip spreads at conversation cadence, not every adjacency) plus a `__spreadGossip` dev hook. 7 new unit + 2 new e2e (a rumor is planted and provably won't re-spread; news reaches at least one dino over 40 mingling steps); full suite **99 unit / 41 e2e**, green across two consecutive e2e runs; web-llm boundary clean. BACKLOG-019 closed. Next emergent beats: role emergence (020), personality drift (043), catchphrases (045); or surface all of it to the player with the collection book (021). State → `phase: lore-pending`.

## 2026-05-30 — cycle 021 — full chain — BACKLOG-021 + 020 (observer lenses) APPROVED

**Cycle 21 — APPROVED. You can finally watch the sim.**

The operator loves the emergent feel and asked to make more of it visible *without scripting it away* — so the design rule was: show a mirror, never author an outcome. Every lens reads state the sim already produced. One key (**V**) cycles five views: off → **📖 Collection Book** (every dino incl. hatchlings: species, hearts, strongest bond, emergent role, lineage "child of X + Y", rumors heard) → **🔗 Bonds** (lines between bonded pairs drawn on the map, thicker = stronger) → **🎭 Roles** (a tag floats over each dino) → **📰 Park News** (a live ticker of births, hatches, gossip) → off.

The roles are themselves emergent (BACKLOG-020): `deriveRole` reads behavior tallies — a heavy rumor-carrier becomes the `gossip`, a deeply-bonded nester the `homebody`, a high-meeting mingler the `socialite`, the rest `wanderer`. Nothing is assigned; it falls out of what the dino did.

Engineering: all the logic is pure and Node-tested (`ai/roles.ts`, `ui/lenses.ts` — `nextLens`/`bondedPairs`/`tickerLines`/`bookLines`); WorldScene only draws what they describe and keeps a small event log. `BornDino` gained a `parents` field (additive) so the book can show lineage. 14 new unit + 3 new e2e; full suite **109 unit / 44 e2e**, green across two consecutive e2e runs. **Visually verified all four lenses in a live preview** — and the screenshots caught the sim being alive: a hatchling (Rexback) born by the den, then on a reload it persisted and a sibling deduped to Rexback2, an in-character NPC bubble ("*sniffs the air* You smell like the human cave. Welcome."), Sunny tagged `gossip` after carrying rumors, Rex+Mossback a `homebody` pair on a bond-100 line. BACKLOG-021 and BACKLOG-020 closed. State → `phase: lore-pending`.

## 2026-05-30 — cycle 022 — full chain — BACKLOG-056 (The Glass / vivarium frame) APPROVED

**Cycle 22 — APPROVED. It's a fishbowl now.**

The operator had a framing idea — "treat this like a mini dino fishbowl" — and left the interpretation open. So lore-smith named it: **The Vivarium** (full write-up in `studio/lore/vivarium.md`). The world isn't a park you walk through; it's a sealed glass biodome on a shelf, a pocket Cretaceous that the player *keeps and watches* rather than plays. Crucially this isn't a pivot — it's the name for what the emergent stack already is: the sim living on its own is the bowl ticking over, the observer lenses are pressing your face to the glass, gifts are food through the hatch, day/night is the bowl's little sun. The design rule survives intact: nudge inputs, never author outcomes.

This cycle built the bowl itself (BACKLOG-056): an edge vignette with doubled-up corner shadow, a crisp pale-cyan glass rim + faint inner highlight, two reflection streaks, and a curved light-catch arc along the top lip — so the world reads as *enclosed*. The geometry is pure and unit-tested (`ui/glass.ts`); the scene just draws what it describes, at depth 8 (over the night tint and bond lines, under the HUD). No sim change at all — purely visual. Verified in a live preview (and the preview caught the bowl being alive: the persisted family Rexback + Rexback2 napping at the den, and Rex muttering perfectly in character, "Don't step on my favorite rock, please. That one. Yes, that one."). New fishbowl backlog seeded: 057 tap-the-glass, 058 the plaque, 059 feeding hatch, 060 idle/ambient mode. 5 new unit + 1 new e2e; full suite **114 unit / 45 e2e**, green across two consecutive runs. BACKLOG-056 closed. State → `phase: lore-pending`.

## 2026-05-30 — cycle 023 — full chain — BACKLOG-057 (tap the glass) APPROVED

**Cycle 23 — APPROVED. You can touch the bowl now.**

First interaction that's pure fishbowl: rap the glass (click anywhere) and the dinos startle by temperament. A ripple ring expands at the tap; every dino within `STARTLE_RANGE` reacts off its seeded `bravery` — the timid bolt away (❗, label flashes red), the bold creep closer to investigate (❓, label flashes blue), the far-off ignore it. And the scare lands in memory ("the glass shook and you bolted in fright" / "…crept closer to look"), so a tap isn't just a one-off animation — it feeds the gossip mill and the next conversation. The keeper pokes an *input*; the bowl decides the *outcome* (which dino does what) — design rule intact.

All the decision logic is pure and unit-tested (`world/startle.ts`: `reactionFor` by bravery+distance, `fleeStep` one tile directly away clamped, `startleStep` dispatching flee/approach/stay; the approach reuses `stepToward`). WorldScene just wires a `pointerdown` → `tapGlass(px,py)`, the ripple tween, and the ❗/❓ flash, plus a `__tapGlass` hook. 6 new unit + 2 new e2e (a tap on a dino startles it + is remembered; a far dino ignores a tap across the bowl); full suite **120 unit / 47 e2e** green (one known cycle-002 parallel-load flake, green isolated + on the confirming full run). Preview tooling was flaky this cycle (multi-tab, screenshot hang) so the live eyeball was skipped — behavior is covered deterministically by the e2e. BACKLOG-057 closed. Remaining fishbowl furniture: 058 plaque, 059 feeding hatch, 060 idle/ambient mode. State → `phase: lore-pending`.

## 2026-05-30 — cycle 024 — full chain — BACKLOG-058 (the plaque) APPROVED

**Cycle 24 — APPROVED. The bowl wears its label.**

An engraved brass nameplate now sits under the vivarium: *"VIVARIUM · Pocket Cretaceous"* over a live line — `Day N · M specimens · G generations`. The clever bit is the generation count: it's a pure readout of the lineage the breeding loop already produces — founders are gen 1, a hatchling is 1 + the deeper parent — so as families breed across days the plaque quietly climbs to "2 generations", "3 generations", and the keeper can watch the family tree deepen without opening anything. Sells the "specimen on a shelf" feel and rewards leaving the bowl running.

Pure, Node-tested `ui/plaque.ts` (`generationOf` — memoized and guarded against a malformed self-parent loop — `maxGeneration`, `plaqueLines` with singular/plural). The scene renders it bottom-center at depth 11 and refreshes on the clock tick; `__plaque` hook exposes the stats. 5 new unit + 1 new e2e (population + generations both move when an egg hatches); full suite **125 unit / 48 e2e** green. Two different specs flaked once each under parallel load this session (cycle-002, cycle-020) — both green isolated and on the confirming full run; root cause is hooks read before `create()` attaches them, so I filed an out-of-scope task to add a shared "scene ready" boot wait across the e2e specs. Preview MCP still flaky, so the plaque was verified via e2e rather than a live screenshot. BACKLOG-058 closed. Remaining fishbowl furniture: 059 feeding hatch, 060 idle/ambient mode. State → `phase: lore-pending`.

## 2026-05-31 — cycle 025 — full chain — BACKLOG-059 (feeding hatch) APPROVED

**Cycle 25 — APPROVED. The bowl has a hatch in the lid, and feeding time is a scramble.**

Until now, "feeding" the dinos meant the gift system: walk up to one dino, press F, hand it a present. That's keeping-as-a-handshake. This cycle adds the other half — keeping-as-a-tank. Press **H** and a 🍖 drops through the hatch, falls into the middle of the bowl, and the cast *swarms*. Who comes running is pure temperament: a dino that's energetic enough (`energy ≥ 0.4`) and within seven tiles makes a straight beeline; the calm ones and the far-off ones don't bother and keep milling. The first to reach it snaps it up — a little 😋 over its head, a bump in how it feels about you, and a memory ("you scrambled to the hatch and snapped up the food") that it can later gossip about — and everyone else, who'd been converging, peels off and wanders away. One piece of food at a time; mash H and the extra presses are ignored until the current morsel is gone. The keeper decides *when and where* the food falls; the bowl decides *who wins*. That's the whole fishbowl thesis in one keystroke.

It also slots cleanly into what's already there: the drop and the eat both scroll past in the Park News ticker (V lens), so you can watch a feeding ripple through the social log, not just the map. Watching the e2e, Rex (the most food-motivated of the anchor cast at energy 0.54, with Sunny 0.66 and Glade 0.87 close behind) beats the others to the 🍖 every time the drop lands in his lane — Mossback and Twitch, both calm, never even look up.

Engineering stayed honest to the charter: every decision is a pure, Node-tested function in `world/feeding.ts` — `reactionToFood` (rush or shrug, by energy + distance), `feedStep` (which reuses the existing `stepToward` pather), `reachedFood`, and `foodLanding` — the exact mirror of cycle 23's `world/startle.ts`, where a tap *repels* by temperament and food *attracts* by it. WorldScene only does the Phaser glue: the H key, the falling-emoji tween, the eat flash, and one food-rush branch threaded into the top of the existing movement step. New code reuses `bumpPoints`/`remember`/`logEvent`/`tileOf` rather than reinventing any of it; no new dependency; the `@mlc-ai/web-llm` boundary is still clean (only `ai/` touches it); and the save file is untouched (food is an ephemeral event, so every old save still loads). 9 new unit + 2 new e2e; full suite **134 unit / 50 e2e**, green on a single clean run — and notably **no parallel-load flake this cycle**, the first full-green-first-try run since the `c548974` scene-ready boot gate landed. BACKLOG-059 closed. The feeding cluster it unlocks — 061 food favorites, 062 the same-tick scramble standoff, 063 begging at the glass, 064 the hoarder role, 065 a feed-log in the book — is queued and waiting. Remaining standalone fishbowl furniture: 060 idle/ambient mode. State → `phase: lore-pending`.

_Artist (cycle 025): standing by — `artPipelineReady` is false and no image-gen creds are configured. The 🍖 food (like 🥚/💤) is an emoji placeholder, not an art deliverable. No-op._

## 2026-05-31 — cycle 026 — full chain — BACKLOG-060 (idle / ambient mode) APPROVED

**Cycle 26 — APPROVED. The bowl knows when you've stepped away.**

This is the last piece of fishbowl furniture, and it leans all the way into the "kept on a shelf" idea: leave the vivarium alone for 12 seconds and it quietly becomes a screensaver of itself — the HUD eases away to a ghostly 12% and the camera starts a slow breathing zoom toward the centre, so all that's left is the glass and the little lives inside it. Touch anything — a key, a click, even holding WASD to walk — and the whole interface snaps back to full instantly. (Held movement keys don't refire keydown, so the update loop counts them as activity directly; otherwise the bowl would fade while you were strolling around it.)

Built to the usual line: the fade curve and the idle test are a pure, Node-tested module (`world/idle.ts` — `isIdle`, and a monotonic `hudAlpha` that lerps 1 → 0.12 over a 1.5s window after the 12s threshold); WorldScene only tracks `lastInputAt`, fades the always-on HUD texts, and drives the camera tween. No save change. 5 new unit + 2 new e2e (HUD fades and the ambient flag flips on idle; a real key press wakes it); full suite **139 unit / 52 e2e** green, no flake. With this the cycle-22 fishbowl set is complete: 056 glass, 057 tap, 058 plaque, 059 feed, 060 idle. The Vivarium is now a thing you can set down and just watch. BACKLOG-060 closed. State → `phase: lore-pending`.

## 2026-05-25 19:35 CDT — bootstrap catchup armed

Human requested a one-shot consolidated Designer + Code-planner + Coder fire at 21:37 CDT tonight (after 5-hr session limit reset) so cycle 1 can complete this week. Scheduled as `dino-bootstrap-catchup-cycle-1`. After it fires, QA Tue 09:13 CDT and Validator Tue 13:55 CDT close the cycle naturally.


## 2026-06-01 — cycle 027 — lore-smith

Taste day. Queued BACKLOG-066..070 (taste talk, keeper-loaded hatch, acquired taste, menu in the book, picky/gobble). Suggested next-up: BACKLOG-061 food favorites — give the hatch feed a flavor and the dinos opinions.

## 2026-06-01 — cycle 027 — designer

Picked BACKLOG-061 (food favorites). Spec: typed hatch food (🍖🌿🐟🍓), per-dino favorite from `giftScore`, favorite eat = bigger bump + 😋 + memory, favorite also rushed harder. Pure `world/foods.ts` + optional `isFavorite` on `reactionToFood`; cycle-25 substrings preserved so the feeding e2e holds.

## 2026-06-01 — cycle 027 — code-planner

Planned BACKLOG-061 at ~6 files: new `world/foods.ts` (FOODS table + `favoriteFood` reusing `giftScore` + `foodReaction`), optional `isFavorite` on `feeding.ts` `reactionToFood` (+ `FEED_GAIN_FAV`/`FEED_RANGE_FAV`), WorldScene glue (typed drop, favorite-aware rush, eat reaction, `__favoriteFood`/`__dropFood(col,foodId)` hooks), unit + e2e. Reuse: giftScore, stepToward, bumpPoints, remember, logEvent. No new deps.

## 2026-06-01 — cycle 027 — coder

Shipped BACKLOG-061. New `world/foods.ts` (FOODS + `favoriteFood` reusing `giftScore` + `foodReaction`); `reactionToFood` gained optional `isFavorite` (favorite = wider range + lower bar) with `FEED_RANGE_FAV`/`FEED_GAIN_FAV`; WorldScene drops typed food, rushes favorites harder, and reacts to the eat (bigger bump + 😋 + "favorite" memory vs plain 🙂). Cycle-25 log/memory substrings preserved. build ✅, vitest ✅ 148/148.

## 2026-06-01 — cycle 027 — qa

8/8 acceptance criteria PASS. build ✅, vitest ✅ 148, playwright ✅ 54 on a clean full run. First full e2e run flaked (cycle-002/003 `__ready` timeouts under parallel load — green isolated + on the fresh full run, the documented flake) and caught one bug in my own new test (hearts>0 vs the coarse 0–10 scale) — fixed in QA by asserting the feed memory. Boundary clean, save untouched, diff = the 6 planned files. Recommend APPROVE.

## 2026-06-01 — cycle 027 — full chain — BACKLOG-061 (food favorites) APPROVED

**Cycle 27 — APPROVED. The feed has a flavor, and every dino has an opinion.**

Last cycle put a hatch in the lid: press **H**, a 🍖 falls, the cast scrambles, the first mouth there wins. But every drop was the same anonymous lump and every dino ate it with the same shrug. This cycle gives the feed a *type* — 🍖 meat, 🌿 greens, 🐟 fish, 🍓 berries — and gives each dino a *favorite*. And here's the part I like: a dino's favorite isn't a new system bolted on, it's the **gift-fit math we already ship**. A food carries the same `appeal` shape a gift does, so `favoriteFood` just runs the existing `giftScore` over the menu and takes the best match. A food, it turns out, is a gift dropped through the lid — which is the vivarium thesis stated in code.

So now when a dino snaps up the food, the bowl checks whether it was *its* favorite. If it is, the dino is extra-happy: a bigger friendship bump (9 vs the plain 5), a 😋 instead of a 🙂, and a memory that actually names it — "you snapped up the food at the hatch — your favorite leafy greens!" — which can later surface as gossip. And it doesn't just react harder, it *reaches* harder: a dino will cross most of the bowl for its favorite (range 12 vs 7) and rouse even when it's feeling lazy (energy bar 0.15 vs 0.4). That last bit is the emergent payoff — drop meat and watch Rex and Glade come barrelling in from the far corners while Twitch, who only cares about greens, keeps grazing. Over a few feedings the keeper *learns the bowl's palate* just by watching who runs for what. Nobody told them; you inferred it. Founders shake out as Rex & Glade for meat, Mossback & Sunny for berries, Twitch for greens — and not one of them favors fish, which is exactly why fish makes the clean "just plain feed" control in the tests.

Kept honest to the line: all the deciding lives in a pure, Node-tested `world/foods.ts` (`favoriteFood`, `foodReaction`), and the favorite-aware rush is a single optional `isFavorite` argument added to cycle-25's `reactionToFood` — defaulted false, so the old swarm behaves byte-for-byte as it did and the whole existing feeding spec stays green. WorldScene only does Phaser glue (random food on the keypress, the typed falling sprite, the rush branch, the eat reaction). New code reuses `giftScore`/`stepToward`/`bumpPoints`/`remember`/`logEvent` rather than reinventing any of it; no new dependency; the `@mlc-ai/web-llm` boundary is still clean; and the save file is untouched — favorites re-derive from the name like personality, and the food is an ephemeral event, so every old save still loads. 9 new unit + 2 new e2e; full suite **148 unit / 54 e2e** green. The first full e2e run did flake (cycle-002/003 `__ready` timeouts under parallel load — the documented one; green isolated and on the clean re-run) and it caught a real bug in *my own new test* (I asserted hearts > 0, but one feed of 9 points still rounds to 0 on the coarse 0–10 heart scale — the gain was real, the assertion was wrong), which I fixed in QA by checking the feed memory instead. BACKLOG-061 closed. The taste cluster it unlocks is queued: 066 taste talk (a dino lets its favorite slip in dialogue), 067 a keeper-loaded hatch (choose what to drop), 068 acquired taste (palates drift), 069 a menu in the book (revealed as you feed), 070 picky vs. gobble (prickly dinos refuse non-favorites). State → `phase: lore-pending`.

_Artist (cycle 027): standing by — `artPipelineReady` is false and no image-gen creds are configured. The four foods (🍖🌿🐟🍓) are emoji placeholders like 🥚/💤/🍖 before them, not art deliverables. No-op._

## 2026-06-01 — cycle 028 — lore-smith

Realtime rituals day. Queued BACKLOG-108..111 (dawn stretch, diurnal/nocturnal temperament, hour-aware greeting, real-age on the plaque). Suggested next-up: BACKLOG-105 — wall-clock-anchored time + scale knob; the cornerstone the operator asked for, unblocks 106 offline catch-up and gives the new rituals a real day to hang on.

## 2026-06-01 — cycle 028 — designer

Picked BACKLOG-105 (wall-clock time). Spec: derive GameTime from Date.now()×scale via an injectable now() source; keep tick() as the minute primitive; default 1× realtime, T toggles 1×⇄60× without jumping; capped catch-up on resume; add additive savedAt/scale to SaveData (seed for 106); re-anchor (not fast-forward) on restore. 9 acceptance criteria.

## 2026-06-01 — cycle 028 — code-planner

Planned BACKLOG-105 at ~6 files. clock.ts: injectable now() source + anchor (epoch+absMin) + scale; new update() pump derives target minute from wall delta×scale and calls the preserved tick() (capped catch-up, jump past cap); set()/setScale() re-anchor; start() pumps update() on a 500ms timer. saveGame.ts: additive savedAt/scale. WorldScene: T toggle, scale in HUD, __advanceWall/__clockScale hooks, savedAt/scale in save. Reuse tick()/singleton/save additive pattern/boot helper. No new deps.

## 2026-06-01 — cycle 028 — qa

9/9 acceptance criteria PASS. build ✅, vitest ✅ 157, playwright ✅ 56 on a clean full run. Caught + fixed a real regression: smoke "clock ticks in real time" assumed the old 60× rate; updated it to toggle to 60× and poll the real pump. Also fixed a test-timing artifact in my own new spec (live 60× pump slipped a minute between two evaluates → folded into one). Boundary clean, save additive, diff = 6 planned files + smoke fix. Recommend APPROVE.
