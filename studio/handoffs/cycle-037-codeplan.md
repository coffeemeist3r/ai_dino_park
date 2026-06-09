# Cycle 37 — Code Plan

## Item
**BACKLOG-155** [core] Selectable keeper — character-select spine + persisted choice + affinity-fit ability.

## Files to create
- `game/src/keeper/keepers.ts` — pure module (no Phaser). Exports:
  - `interface KeeperAbility { label: string; desc: string; appeal: Partial<Personality> }`
  - `interface Keeper { id: string; name: string; era: string; backstory: string; ability: KeeperAbility }`
  - `const KEEPERS: ReadonlyArray<Keeper>` — exactly 3 time-traveling robot observers:
    - `aether` — `AETHER-1 "Aki"` — Empath Protocol — `appeal: { agreeableness: 1, sociability: 0.5 }`
    - `vanta` — `VANTA-9 "Vix"` — Daredevil Drive — `appeal: { bravery: 1, energy: 0.5 }`
    - `lumen` — `LUMEN-3 "Lux"` — Scholar Lens — `appeal: { curiosity: 1, bravery: 0.3 }`
  - `const DEFAULT_KEEPER_ID = KEEPERS[0].id`
  - `keeperById(id: string | undefined): Keeper` — find by id, else `KEEPERS[0]` (never throws).
  - `keeperFit(keeper, traits?): number` — Σ `weight · (trait*2 − 1)` over `appeal` axes; no traits → 0. (Copy the proven shape of `toneScore` in `social/tones.ts`.)
  - `keeperBonus(keeper, traits?): number` — map fit → integer in `[0, 2]`: `fit >= 0.8 → 2`, `fit >= 0.3 → 1`, else `0`. Never negative (the bonus is a perk, not a punishment).
- `tests/unit/keepers.test.ts` — unit tests (below).
- `tests/e2e/cycle-037-keeper.spec.ts` — e2e tests (below).

## Files to modify
- `game/src/world/saveGame.ts` — add `keeperId?: string` to `SaveData` (additive, documented like `lastTone`); in `deserialize`, parse `o.keeperId` only if present, reject if non-string, default missing → `undefined` (caller defaults to the first observer). Do **not** bump `SAVE_VERSION`. Include `keeperId` in the returned object.
- `game/src/scenes/WorldScene.ts`:
  - New state field `private keeperId: string = DEFAULT_KEEPER_ID;` and `private keeperPickerOpen = false;`
  - Import `KEEPERS, DEFAULT_KEEPER_ID, keeperById, keeperBonus` from `../keeper/keepers`.
  - `currentSaveData()` — add `keeperId: this.keeperId`.
  - `setupSave()` load path — `this.keeperId = save.keeperId ?? DEFAULT_KEEPER_ID;`. When `loadFromDb()` resolves to **null** (fresh game), call `this.showKeeperInvite()` (non-blocking fading text).
  - New `private applyKeeperBonus(traits?): number` → `keeperBonus(keeperById(this.keeperId), traits)`.
  - `recordGreet()` — non-repair branch: `greetGain(traits) + this.applyKeeperBonus(traits)`.
  - `recordTone()` — non-repair branch: `toneReaction(...).delta + this.applyKeeperBonus(traits)`.
  - gift handler (the `giftReaction` seam near line 1661) — `delta + this.applyKeeperBonus(traits)` (only when delta would raise affinity; simplest: always add the non-negative bonus).
  - `create()` — bind `K` → `this.openKeeperPicker()` (verify `K` unbound — confirmed: only T/O/E/C/Z/F/G/1/2/3/H/V used).
  - Convert the `ONE/TWO/THREE` key handlers to a dispatcher `onNumberKey(n)`: if `keeperPickerOpen` → `pickKeeperIndex(n-1)`, else `void this.pickTone(...)`.
  - New methods: `openKeeperPicker()` (build `[1] name — abilityLabel: desc` lines via `dialog.show`, set `keeperPickerOpen`/`dialogOpen`), `pickKeeperIndex(i)` (clamp to roster, set `keeperId`, close picker, `void this.saveGame()`, show one-line confirmation), `closeKeeperPicker()`, `showKeeperInvite()` (a centered `add.text` that tweens alpha 1→0 over ~5s then destroys; sets nothing modal).
  - `handleInteract()` — at the top, if `keeperPickerOpen` → `closeKeeperPicker(); return;` (E/Z dismisses the picker without greeting; mirrors the tone-menu guard).
  - `addControlsHint()` — append `· K observer` to the hint string.
  - Dev hooks in `setupSave()` (alongside the others): `__keeper`, `__keepers`, `__pickKeeper`, `__keeperPickerOpen`, `__keeperBonus`.

## Reuse list
- `social/tones.ts` `toneScore` — the exact Σ `weight·(trait*2−1)` scoring shape; `keeperFit` copies it. **MUST** mirror, not reinvent.
- `ai/personality.ts` `Personality` type + axis semantics — `appeal` keys must be real axes.
- `social/friendship.ts` `greetGain`, `bumpPoints` — the affinity seam the bonus adds onto.
- `social/tones.ts` `toneReaction`, `social/gifts.ts` `giftReaction` — the other two gain seams.
- `world/saveGame.ts` `lastTone` handling — the exact additive-string-field pattern to copy for `keeperId`.
- `scenes/WorldScene.ts` tone-menu (`openToneMenu`/`pickTone`/`closeToneMenu`, `toneMenuOpen`) — the overlay + number-key + handleInteract-guard pattern to mirror for the keeper picker.
- The existing dev-hook block in `setupSave()` — same `(window as any).__x = …` convention.
- The fading-text idea: `this.tweens.add({ targets, alpha: 0, … })` (used around lines 325/380/488).

## New dependencies
none.

## Test plan
**Unit — `tests/unit/keepers.test.ts`** (mirror `tones.test.ts`):
- `KEEPERS` has exactly 3 entries; ids are unique; each has non-empty `name`/`era`/`backstory` and an `ability` with `label`/`desc`/`appeal`.
- `keeperById('vanta')` returns VANTA-9; `keeperById('nope')` and `keeperById(undefined)` return `KEEPERS[0]`.
- `keeperFit` returns 0 for `undefined` traits; positive for a personality maxed on the appeal axes; negative for one minned on them.
- `keeperBonus` ∈ `[0,2]` always; a strongly-fitting personality (e.g. `{bravery:1,energy:1,…}` for VANTA-9) → `2`; a strongly-clashing one → `0`; `undefined` traits → `0`.
- For at least one keeper, a fitting dino gets `>0` and a clashing dino gets `0` (proves per-dino observability).

**Unit — extend `tests/unit/saveGame.test.ts`**:
- A save object with `keeperId: 'vanta'` round-trips through `serialize`/`deserialize`.
- A v1 JSON with **no** `keeperId` deserializes (not null) and yields `keeperId === undefined`.
- A malformed `keeperId` (number) → `deserialize` returns `null`.

**E2E — `tests/e2e/cycle-037-keeper.spec.ts`** (boot via `helpers.boot`, watch console errors == []):
1. Boot is clean and default observer is set: `__keeper()` === default id; no dialog/tone menu open; `errors == []`.
2. Picker flow: `__openKeeperPicker?` not needed — press `K` (keyboard) or use `__pickKeeper('vanta')`; assert `__keeper()` changes and `__keeperPickerOpen()` toggles correctly; pressing `Digit2` while the picker is open selects the 2nd observer.
3. Persist across reload: `__pickKeeper('lumen')`, `__saveNow()`, reload page, `boot`, assert `__keeper()` === `'lumen'` and `__exportSave()` JSON `.keeperId === 'lumen'`.
4. Ability touches play: pick the observer that fits a known dino (read `__keeperBonus(name) > 0`), greet it via `__greet(name)`, assert friendship delta === `base + bonus`; switch to an observer with `__keeperBonus(name) === 0`, greet a fresh dino, assert delta === base. (Use `__friendshipPoints` before/after; pick dinos by reading `__keeperBonus` so it's deterministic without hard-coding seeds.)
5. Old-save compatibility: `__exportSave` of a hand-built v1 save lacking `keeperId` still boots to the default observer (covered at the deserialize layer in unit; e2e asserts a fresh boot defaults).

## Risks
- **Number-key routing.** The `1/2/3` keys are shared with the tone menu. The dispatcher must check `keeperPickerOpen` first; the two overlays must never be open at once (opening the picker while a tone menu is up shouldn't happen — `K` is a world key, the tone menu is opened by E on a dino — but guard by closing any open tone menu when the picker opens, to be safe).
- **Boot cleanliness.** The first-time invite must be pure decoration: no `dialogOpen`, no input capture, auto-destroys. If it ever sets a modal flag it will break the ~20 existing specs that press E/digits at boot. Keep it a tweened `add.text` only.
- **Gift seam.** Adding a non-negative bonus to the gift delta is fine (gifts can be negative for a disliked item; adding 0..+2 only softens a dislike slightly — acceptable and consistent with "the observer you chose helps you bond"). Keep it simple: add the bonus unconditionally on the gift gain.
- **e2e determinism.** Don't hard-code which dino fits which observer; read `__keeperBonus(name)` to choose the test subject. Traits are name-seeded so the values are stable, but reading the hook keeps the test robust if seeding ever changes.
- Known parallel-load boot flake (cold Vite) may hit the new spec once; re-run isolated per the routine.

## Estimated touch count
**~6 files** (2 created prod: `keepers.ts` + e2e spec; 1 created unit; 2 modified prod: `saveGame.ts`, `WorldScene.ts`; 1 modified unit: `saveGame.test.ts`). At budget — ships as the spine; 156/157/158 are separate cycles.
