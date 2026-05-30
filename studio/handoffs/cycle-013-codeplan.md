# Cycle 13 — Lore + Design + Code-plan (BACKLOG-053)

## Item
BACKLOG-053 [core] Sane controls — WASD movement, **E** to interact, **F** to give. Operator feedback: arrow-only movement is awkward and the core verbs were on Z/G with E wasted on save-export.

## What ships
- Movement: **WASD** added alongside the arrow keys.
- Interact (talk): **E** added (Z kept as alias so nothing breaks).
- Give gift: **F** added (G kept as alias).
- Save-export moved off **E** → **O** (it was squatting on the interact key).
- A small controls-hint HUD: `WASD move · E talk · F give · [ ] item · C friends · O export`.

## Files to modify
- `game/src/scenes/WorldScene.ts`
  - Field `private wasd!: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>`; init via `addKeys('W,A,S,D')`.
  - Bind interact to **E** and **Z** (both → `handleInteract`).
  - `update()`: move on `cursors` OR `wasd` (left/A, right/D, up/W, down/S).
  - Gifts: bind **F** and **G** → `giveGift`.
  - Save: rebind export from `E` → `O`.
  - Add a controls-hint text (bottom-right, depth 11).

## Reuse
- Existing `handleInteract` / `giveGift` / `exportSave` — only the key bindings change.
- Existing movement clamp logic in `update()`.

## Test plan
- E2E `tests/e2e/cycle-013-controls.spec.ts`:
  - press **KeyD** → player x increases (WASD works).
  - press **KeyE** near a dino → dialog/greet flow runs (E interacts).
  - `__heldItem` then press **KeyF** via `__giveGift`-independent path… (F give: assert pressing F changes a dino's hearts after walking adjacent — or simplest, assert F is wired by checking a greet/gift side effect). Keep it light: press F, no throw, game still live.
- All prior suites stay green (arrows + Z + G aliases preserved; no test used the E export key — uses `__exportSave` hook).

## Risks
- **Don't remove arrows/Z/G** — many e2e press ArrowRight/KeyZ; keep them as aliases.
- E was the only export keybind; tests use the `__exportSave` hook, so moving it to O is safe.

## Touch count
2 files (1 modified src, 1 new e2e). Small polish cycle.
