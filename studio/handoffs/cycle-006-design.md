# Cycle 6 — Design

## Item
BACKLOG-016 [social] Friendship hearts — 0–10 hearts per NPC, visible in a collection panel.

## Why this cycle
Five dinos stand around and nothing the player does matters yet. This adds the first feedback loop: greeting a dino raises an affinity score, the score shows as 0–10 hearts, and it's remembered across sessions. It's the Stardew spine every later social feature (gifts, befriend rituals, romance) builds on, and it finally makes the save hold something the player created.

## What ships
Each dino has an affinity score (0–100 points → 0–10 hearts). Greeting a dino (the existing Z flow) raises its affinity. Pressing **C** toggles a collection panel listing all five dinos with their names and a heart bar (♥♥♥♡♡♡♡♡♡♡). Affinity rides into the existing IndexedDB save, so hearts persist across reload. A warm/social dino gains slightly more per greet than a prickly one (reuses cycle-4 traits) — but the floor gain is fixed so it's predictable.

Dev hooks (mirror `__clockNow`): `window.__hearts()` → `{ name: heartCount }` for all dinos; `window.__greet(name)` → applies one greet's affinity gain to that dino and saves (so QA can drive the loop without pixel-perfect walking); `window.__heartsPanelVisible()` → boolean.

## Acceptance criteria
- [ ] `heartsFromPoints`: 0→0, 35→3, 100→10, 105→10 (clamp), −5→0 (clamp) (unit).
- [ ] `bumpPoints` clamps to [0,100] and does not mutate its input object (unit).
- [ ] `heartString(h)` is always length 10 with exactly `h` filled hearts (unit).
- [ ] `greetGain(traits)` returns the base gain with no traits, and a strictly larger gain for a warm+social personality than for a prickly+solitary one — both within a sane bound (≤ 10) (unit).
- [ ] Save round-trips the affinity map; a v1 save with no affinity field deserializes to an empty map (back-compat) (unit).
- [ ] `__greet('Rex')` raises Rex's hearts; after reload `__hearts()['Rex']` is still ≥ that value (e2e — persistence).
- [ ] Pressing **C** toggles `__heartsPanelVisible()` between false and true (e2e).
- [ ] No regression: Z dialog, clock, day/night, save-restore, roster all still pass (e2e suites green).
- [ ] `npm run build` clean; vitest + playwright green.

## Out of scope
- Gift system (BACKLOG-015) and the formal "catch"/befriend ritual (022) — affinity only rises from greeting this cycle.
- NPC-to-NPC (pairwise) affinity (013/018) — this is strictly player↔NPC.
- A rich Pokédex-style book (021) — the panel is a plain text list, not the full collection UI.
- Sprite art for hearts — text glyphs (♥/♡) only.
- Decaying affinity over time.

## Constraints
- The affinity math must live in a pure module (no Phaser), Node-testable, like `saveGame.ts` / `personality.ts`.
- Extend the existing save: add an affinity field to `SaveData`, keep `SAVE_VERSION = 1`, and make `deserialize` default the field to `{}` when absent so existing cycle-3 saves still load (the version seam, not full migration — that's still BACKLOG-040).
- Reuse `ROSTER` for the panel's dino list/order and cycle-4 `traits` for the gain scaling. Do not re-implement either.
- Keep Rex as `dinos[0]`; do not break the cycle-3 save tests or cycle-4/5 hooks.
- The panel is built inside `WorldScene` (like the clock HUD and night overlay), not a new framework. No new npm dependencies. TypeScript strict; `any` only via the documented dev-hook pattern.
