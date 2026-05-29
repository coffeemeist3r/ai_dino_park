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

## 2026-05-25 19:35 CDT — bootstrap catchup armed

Human requested a one-shot consolidated Designer + Code-planner + Coder fire at 21:37 CDT tonight (after 5-hr session limit reset) so cycle 1 can complete this week. Scheduled as `dino-bootstrap-catchup-cycle-1`. After it fires, QA Tue 09:13 CDT and Validator Tue 13:55 CDT close the cycle naturally.

