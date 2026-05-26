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

## 2026-05-25 21:38 CDT — cycle 001 — code-planner — BACKLOG-007 World tick clock

Code-planner audited `game/src/` and found the `clock.ts` stub already has the right `GameTime` interface and `advanceMinutes` arithmetic — both reused. Plan: rewrite `clock.ts` as a `WorldClock` class (pure TS, no Phaser, testable in Node) with `tick()`, `onTick()`, `onHour()`, `now()`, and `start(scene)`. Wire into `WorldScene` for HUD display and `window.__clockNow` dev hook. 4 files touched, 6 unit tests, 1 new e2e test. Key risk: `import type Phaser` in Node/Vitest env — mitigation documented. State advanced to `phase: coder-pending`.

## 2026-05-25 21:37 CDT — cycle 001 — designer — BACKLOG-007 World tick clock

Designer picked BACKLOG-007 (world tick clock) per Lore-smith's recommendation. The `clock.ts` stub already has the right `GameTime` shape and pure `advanceMinutes()` helper — BACKLOG-007 promotes it to a real Phaser-driven ticker with hour event broadcast and a HUD display. Design doc written with 9 acceptance criteria, all testable. BACKLOG-007 marked `[~]`. State advanced to `phase: codeplan-pending`.

## 2026-05-25 19:35 CDT — bootstrap catchup armed

Human requested a one-shot consolidated Designer + Code-planner + Coder fire at 21:37 CDT tonight (after 5-hr session limit reset) so cycle 1 can complete this week. Scheduled as `dino-bootstrap-catchup-cycle-1`. After it fires, QA Tue 09:13 CDT and Validator Tue 13:55 CDT close the cycle naturally.

