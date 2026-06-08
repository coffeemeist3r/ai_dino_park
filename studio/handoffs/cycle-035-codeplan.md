# Cycle 35 — Code Plan

## Item
**BACKLOG-142 [social] Player dialogue tones** — greeting opens a Warm/Tease/Honest tone menu;
the pick applies a personality-fit affinity delta, files a memory, and persists a recalled
last-tone trace. (See cycle-035-design.md for behavior + acceptance criteria.)

## Files to create

### `game/src/art/`… — none.

### `game/src/social/tones.ts` (NEW, pure — no Phaser)
Mirror the shape of `social/gifts.ts`.
- `export type ToneId = 'warm' | 'tease' | 'honest';`
- `export interface Tone { id: ToneId; label: string; appeal: Partial<Personality>; memory: string; }`
- `export const TONES: ReadonlyArray<Tone>` — ordered Warm, Tease, Honest (menu order = 1/2/3):
  - `warm`   label `'Warm'`,   appeal `{ agreeableness: 1, sociability: 0.5 }`,  memory `'the keeper greeted me warmly'`
  - `tease`  label `'Tease'`,  appeal `{ bravery: 1, energy: 0.5, agreeableness: -0.5 }`, memory `'the keeper teased me'`
  - `honest` label `'Honest'`, appeal `{ curiosity: 1, bravery: 0.5 }`, memory `'the keeper spoke to me honestly'`
- `export function toneScore(tone: Tone, traits?: Personality): number` — identical math to
  `giftScore`: `Σ weight · (traits[key]*2 - 1)`; no traits → 0.
- `export type ToneVerdict = 'loved' | 'liked' | 'neutral' | 'clashed';`
- `export interface ToneReaction { verdict: ToneVerdict; delta: number; }`
- `export function toneReaction(tone: Tone, traits?: Personality): ToneReaction` — thresholds
  tuned smaller than gifts (greets repeat): `>=0.6 loved +5`, `>=0.2 liked +3`,
  `<=-0.2 clashed -2`, else `neutral +1`.
- `export function toneById(id: ToneId): Tone` — lookup (throw/`TONES[0]` fallback on bad id).
- `export function toneLabel(id: ToneId): string`.
- `export function lastToneLine(id: ToneId | undefined): string` — `''` when undefined, else
  `Last time you were ${pastTone} with them.` where past form is warm→`warm`, tease→`teasing`,
  honest→`honest` (small map; keep it a pure string helper for the menu header).

### `tests/unit/tones.test.ts` (NEW)
See Test plan.

### `tests/e2e/cycle-035-tones.spec.ts` (NEW)
See Test plan.

## Files to modify

### `game/src/world/saveGame.ts`
- Add to `SaveData`: `/** Each dino's last greeting tone (BACKLOG-142). Additive; absent → {}. */ lastTone: Record<string, string>;`
- In `deserialize`: parse `o.lastTone` exactly like `friendship` but **string** values
  (reject if not object, or any value not a string); default `{}` when absent. Add `lastTone`
  to the returned object. **Do NOT bump `SAVE_VERSION`.**
- (Type the field as `Record<string,string>` not `Record<string,ToneId>` to keep saveGame free
  of a tones import and tolerant of unknown ids from hand-edited saves.)

### `game/src/scenes/WorldScene.ts`
- Imports: add `import { TONES, toneById, toneReaction, lastToneLine, type ToneId } from '../social/tones';`
- New state fields:
  - `private toneMenuOpen = false;`
  - `private toneTarget: Dino | null = null;`
  - `private lastTone: Record<string, ToneId> = {};`
- **Key bindings** (in `create`, near the E/Z binding ~line 134): bind the free digit keys:
  ```
  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE).on('down', () => this.pickTone('warm'));
  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO).on('down', () => this.pickTone('tease'));
  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE).on('down', () => this.pickTone('honest'));
  ```
- **`handleInteract`** (line ~1079): change the open-dialog branch so that if the *tone menu* is
  open, E/Z cancels it (`this.closeToneMenu()`); if a normal dialog is open, hide as today.
  When near a dino and nothing open → call `this.openToneMenu(target)` instead of greeting
  directly. (Move the greet/reply work into `pickTone`.)
- **New `private openToneMenu(target: Dino): void`**:
  - `this.toneTarget = target; this.toneMenuOpen = true; this.dialogOpen = true;`
  - Build menu text: header `Greet ${target.name} — [1] Warm  [2] Tease  [3] Honest`, plus a
    second line `lastToneLine(this.lastTone[target.name])` when non-empty. `this.dialog.show(text)`.
- **New `private closeToneMenu(): void`**: `this.toneMenuOpen = false; this.toneTarget = null;
  this.dialog.hide(); this.dialogOpen = false;`
- **New `private async pickTone(id: ToneId): Promise<void>`**:
  - Guard: `if (!this.toneMenuOpen || !this.toneTarget) return;`
  - `const target = this.toneTarget; this.toneMenuOpen = false;` (keep dialogOpen true; reply replaces menu)
  - `this.recordTone(target.name, id, target.traits);`
  - Then the existing greet→reply flow from the old `handleInteract` (lines 1092–1099): show
    `${target.name}: ...`, `await target.greet({ timeOfDay, affection, recentMemory })`, show reply.
    `this.toneTarget = null;`
- **New `private recordTone(name: string, id: ToneId, traits?: Dino['traits']): void`** — the
  tone-aware twin of `recordGreet`, preserving the BACKLOG-125 repair seam:
  - `const repairing = this.pendingRepair === name;`
  - `const gain = repairing ? repairGain(traits) : toneReaction(toneById(id), traits).delta;`
  - `this.friendship = bumpPoints(this.friendship, name, gain);`
  - memory: `this.memory = remember(this.memory, name, repairing ? repairMemory(name) : toneById(id).memory);`
  - `this.lastTone = { ...this.lastTone, [name]: id };`
  - repair bubble + clear exactly as `recordGreet` does (`if (repairing) { this.pendingRepair = null; … showBubble(dino, repairLine(name)); }`)
  - `void this.saveGame(); this.refreshHeartsPanel();`
  - NOTE: leave `recordGreet` and the `__greet` hook **unchanged** (used by repair/jealousy specs).
- **Save wiring**:
  - `currentSaveData()`: add `lastTone: this.lastTone,`.
  - restore in `loadFromDb().then`: `this.lastTone = (save.lastTone ?? {}) as Record<string, ToneId>;`
- **Dev hooks** (add near `__memory`, line ~795, and in the save setup):
  - `(window as any).__friendship = () => ({ ...this.friendship });` (QA needs to read points; none exists today)
  - `(window as any).__lastTone = () => ({ ...this.lastTone });`
  - `(window as any).__toneMenuOpen = () => this.toneMenuOpen;`
  - `(window as any).__toneMenuText = () => this.dialog && this.toneMenuOpen ? <current dialog text> : null;`
    (expose the menu string; simplest: store the last shown menu text in a field
    `private toneMenuText = ''` set in `openToneMenu`, return it.)
  - `(window as any).__pickTone = (name: string, id: ToneId) => { const d = this.dinos.find(x=>x.name===name); this.openToneMenu(d!); return this.pickTone(id); };`
    — lets e2e drive a tone without positioning the player (mirrors `__greet`).

## Reuse list (CHARTER demands reuse — cite paths)
- `social/gifts.ts` `giftScore` math + `GiftReaction` shape → **mirror exactly** in `toneScore`/`toneReaction`.
- `social/friendship.ts` `bumpPoints`, `heartsFromPoints` → affinity application (do not reinvent).
- `ai/memory.ts` `remember`, `recall` → the tone memory trace.
- `ai/personality.ts` `Personality` type → tone `appeal` weights.
- `world/repair.ts` `repairGain`, `repairMemory`, `repairLine` → preserved repair seam (already imported in WorldScene).
- `ui/DialogBox.ts` `show`/`hide` → the menu reuses the existing dialog box; **no new widget**.
- `world/saveGame.ts` additive-field pattern (see `gratitude`/`friendship` blocks) → copy for `lastTone`.

## New dependencies
**none.**

## Test plan

### Unit — `tests/unit/tones.test.ts` (vitest)
- `toneScore` is 0 with no traits; sign tracks appeal (a maxed-agreeableness/sociability dino
  scores > 0 for Warm; a maxed-bravery/energy, low-agreeableness dino scores > 0 for Tease).
- `toneReaction` personality-fit (criterion 3): construct a warm/social `Personality` → Warm
  verdict is `loved`/`liked` with positive delta; a bold/prickly `Personality` → Tease verdict
  positive; a timid/low-energy dino → Tease verdict `clashed` with negative delta.
- `toneReaction` thresholds map to the right delta signs at the boundaries.
- `TONES` has 3 entries, each appeal ⊆ `Personality` keys; `toneById` round-trips all ids.
- `lastToneLine(undefined) === ''`; defined ids produce a non-empty `Last time …` string.

### Unit — `tests/unit/saveGame.test.ts` (EXTEND existing)
- `serialize`→`deserialize` round-trips a `lastTone` map (criterion 6).
- A JSON payload **without** `lastTone` (older save) deserializes with `lastTone === {}`.
- A payload with a malformed `lastTone` (non-string value) returns `null`.

### E2E — `tests/e2e/cycle-035-tones.spec.ts` (playwright, use `boot` from helpers)
- **Menu opens, not a reply** (criteria 1,2): focus canvas, move next to a dino (or use the
  `__pickTone` path for determinism); assert `__toneMenuOpen()` true after pressing E with a
  dino in range *(or)* assert the menu text contains `[1] Warm`. Then drive a pick and assert
  the menu closes.
- **Tone changes affinity + files memory + persists** (criteria 4,5,6,7): `await __pickTone('Rex','warm')`;
  assert `__friendship().Rex` changed by the expected sign; `__memory().Rex` last entry matches
  the tone memory; `__lastTone().Rex === 'warm'`; reopen the menu (`__pickTone` opens then we read
  `__toneMenuText()` before second pick — or call `openToneMenu` via a second `__pickTone` after
  reading) → header contains `Last time you were warm`. Simplest: add a `__openToneMenu(name)`
  read path, or assert the trace via `__lastTone` + a unit test on `lastToneLine`. **Keep e2e
  resilient**: prefer `__lastTone`/`__friendship`/`__memory` reads over pixel/text scraping.
- **Boundary**: a quick `expect` that boot is error-free (mirror cycle-007's error capture).

> Note for coder: cycle-007 & cycle-012 press Z and tolerate a `null` reply source, so the
> new menu-first flow won't regress them — but **run them** to confirm.

## Risks
- **Double key-handling**: the digit keys fire `pickTone` always; guard with
  `if (!this.toneMenuOpen) return;` so stray 1/2/3 presses during normal play are no-ops.
- **`dialogOpen` bookkeeping**: the menu sets `dialogOpen=true`; ensure `pickTone` leaves it
  `true` (reply shown) and only `handleInteract`'s close path / `closeToneMenu` flips it false.
  Mis-wiring here is the most likely bug — cover with the menu-open/close e2e.
- **Repair interaction**: `recordTone` must branch on `pendingRepair` *before* computing the
  tone delta so a make-up greet still gets `repairGain` (criterion 8). The existing
  `cycle-032-repair.spec.ts` drives repair via `__greet`/`__pickRepair` hooks (unchanged), so it
  stays green; if it drives via pressing E, the coder must route that through `recordTone` —
  **verify cycle-032 still passes**.
- `__friendship` is a *new* hook — confirm no existing spec defines one (grep shows none).

## Estimated touch count
**~6 files** (tones.ts NEW, saveGame.ts MOD, WorldScene.ts MOD, tones.test.ts NEW,
saveGame.test.ts MOD, cycle-035-tones.spec.ts NEW). At budget; no split needed.

---

## Shipped

**Files touched (6, as planned):**
- `game/src/social/tones.ts` (NEW) — `ToneId`/`Tone`/`TONES` (Warm/Tease/Honest), `toneScore` (mirrors `giftScore`), `toneReaction` (loved+5 / liked+3 / neutral+1 / clashed−2), `toneById`, `toneLabel`, `lastToneLine`.
- `game/src/world/saveGame.ts` (MOD) — additive `lastTone: Record<string,string>`; parsed like `friendship` but string-valued; default `{}`; **no `SAVE_VERSION` bump**.
- `game/src/scenes/WorldScene.ts` (MOD) — tone-menu state (`toneMenuOpen`/`toneTarget`/`toneMenuText`/`lastTone`), 1/2/3 key bindings, `handleInteract` now opens the menu, `openToneMenu`/`closeToneMenu`/`pickTone`/`recordTone` (repair-seam-preserving twin of `recordGreet`), save assembly + restore, dev hooks `__friendship`/`__lastTone`/`__toneMenuOpen`/`__toneMenuText`/`__pickTone`/`__openToneMenu`.
- `tests/unit/tones.test.ts` (NEW) — 9 tests: structure, scoring sign, personality-fit verdicts (warm/tease/honest across opposite dinos), thresholds, `lastToneLine`.
- `tests/unit/saveGame.test.ts` (MOD) — +3: `lastTone` round-trip, older-save default `{}`, malformed rejection; `sample` gains `lastTone`.
- `tests/e2e/cycle-035-tones.spec.ts` (NEW) — 4 specs: menu structure + clean boot, digit-key selection + tone memory, affinity delta + trace, save-persist + remembered-trace header.

**Deviations:** none material. Added a second dev hook `__openToneMenu` (read the remembered-trace header without picking) beyond the planned set — still test-only, no production behavior. `recordGreet` + the `__greet` hook left untouched as planned (legacy/repair specs unaffected).

**Build:** ✅ `tsc -b && vite build` clean.
**Unit:** ✅ 243 passed (was 231; +9 tones, +3 saveGame).
**Dev render:** ✅ `curl http://localhost:5173/` → HTTP 200.
**E2E:** deferred to QA stage (full `playwright test`).
