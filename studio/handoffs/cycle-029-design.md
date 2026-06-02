# Cycle 29 — Design

## Item
BACKLOG-106 [emergent] Offline catch-up ("while you were away").

## Why this cycle
Cycle 28 pinned the bowl to the wall clock and laid `savedAt` into the save for exactly
this. Right now, loading a save just *resumes* at the stored in-game time — a gap of hours
or days is silently dropped, so "leave it running and come back" lands you nowhere new. This
cycle reads the real elapsed time since the last save and fast-forwards the world **cheaply**
(no per-tick loop, no LLM): bonded pairs that keep each other company drift closer, each
leaves a faint memory, and the player gets a short "While you were away…" homecoming digest on
load. It's the emotional payoff of realtime and the spine the rest of the cycle-29 cluster
(112–116) hangs off.

## What ships
- A **pure** `world/away.ts` fast-forward: given the saved clock time, `savedAt` epoch,
  `scale`, current `bonds` and `memory`, plus "now", it returns the new clock time, rolled-
  forward bonds + memory, and a short human-readable `digest` — all without simulating
  per-tick.
- On **load** (the existing `setupSave` restore path), the saved `scale` is restored to the
  clock, the world is fast-forwarded over the away gap, and if any in-game time elapsed a
  **"While you were away…"** panel is shown in the existing dialog box listing the digest.
- The simulated span is **capped** (max 7 in-game days of effect) so a week-long absence
  rolls forward instantly instead of hanging the load; the digest notes when the gap exceeded
  the cap.
- Companionship drift: pairs already bonded at/above the huddle threshold gain a small,
  per-away-day, capped bond bump (they kept meeting/huddling while you were gone). Pairs not
  yet bonded are left untouched (no companionship to deepen) — falling-outs are a deliberate
  follow-up (BACKLOG-113).
- A dev hook `window.__catchUp(realMs)` applies a fast-forward against current state for the
  given elapsed real-ms (at the current scale) and returns `{ days, minutes, capped, digest }`;
  `window.__awayDigest()` returns the last digest. These let Playwright drive catch-up
  deterministically without a real wait.

## Acceptance criteria
- [ ] `awayMinutes(savedAt, scale, now)` returns 0 when `savedAt` is undefined, 0 when `now <= savedAt`, and `floor(realMs * scale / 60000)` otherwise (unit).
- [ ] `fastForward` with 0 elapsed minutes returns the input time/bonds/memory unchanged and an empty digest (unit).
- [ ] `fastForward` over ≥1 whole in-game day advances the clock time by exactly the (capped) elapsed minutes — verified via abs-minute math (unit).
- [ ] A pair bonded at ≥ the huddle threshold gains `min(DRIFT_PER_DAY * days, MAX_DRIFT)` bond over the away span; a pair below the threshold is unchanged (unit).
- [ ] Each companion pair gains a "while the keeper was away … kept each other company" memory entry for both dinos after a multi-day catch-up (unit).
- [ ] When the real gap exceeds the cap, `fastForward` reports `capped: true`, clamps `minutes` to `MAX_AWAY_DAYS` days, and the digest names it (unit).
- [ ] E2E: boot, bond Rex↔Glade above the threshold, call `__catchUp` for 3 in-game days; `__bonds` shows Rex|Glade increased and `__awayDigest()` contains a "grew closer" line and a duration line.
- [ ] E2E: a fresh boot with no save shows no homecoming dialog (catch-up no-ops when there's nothing to restore).
- [ ] `npm run build` clean; full `vitest` + `playwright` suites green; `@mlc-ai/web-llm` still imported only under `game/src/ai/`.

## Out of scope
- Per-dino "missed-you" memory and hour-aware greeting hooks (BACKLOG-116, 110).
- Bond **decay** / falling-outs for non-bonded pairs while away (BACKLOG-113).
- Re-readable away-log in the collection book (BACKLOG-114).
- Night-owl-weighted away meetings (BACKLOG-115 — needs 109 first).
- Rolling forward feeding/hunger (feeding is ephemeral — nothing persisted to advance).
- Any LLM/inference in the fast-forward. Procedural summaries only, per the CHARTER inference rules.

## Constraints
- Fast-forward logic lives in a **pure, Node-testable** module (`world/away.ts`); WorldScene
  only does the glue (restore wiring, the dialog, the dev hooks).
- **Additive save only** — no `SAVE_VERSION` bump; old saves (no `savedAt`) load and simply
  no-op the catch-up.
- Reuse existing utilities — `bondedPairs` (lenses), `strengthen`/`bondPoints` (bonds),
  `remember` (memory), and the clock's abs-minute conversion. Do not reinvent time math; add a
  small pure `advanceTime(time, minutes)` helper to `clock.ts` if needed.
- Keep `tick()`/`update()` and the realtime clock behavior from cycle 28 intact; restore must
  re-anchor the clock at the post-catch-up time (don't double-advance via the live pump).
- Must not break the existing save round-trip e2e (cycle-003): an immediate reload has ~0
  elapsed and must not pop a homecoming dialog.
- `@mlc-ai/web-llm` stays under `game/src/ai/` only.
