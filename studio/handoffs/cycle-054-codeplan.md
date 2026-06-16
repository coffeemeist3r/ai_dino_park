# Cycle 54 — Code Plan

## Item

BACKLOG-243 [social] — Grateful to the one who cleared your name.

## Approach

A pure detector + a single converse-seam rung, mirroring the shipped sympathy visit (217) /
self-correct (234) on the relief spine (235). When a **recovered sufferer** meets the dino carrying
its **first-hand relief memory** (`saw <sufferer> came through it fine`, the one `spreadReliefWord`
spreads), the sufferer warms to that clearer: a `GRATEFUL_BOND` bump, a 💛 grateful bubble, and a
`<clearer> cleared my name` memory. Precedence: **self-correct (234) > grateful (243) > sympathy
(217)** — the new rung nests inside the existing `else` of `selfCorrect`, so every older path is
byte-identical when 243 doesn't fire.

## Files to create

- `tests/e2e/cycle-054-grateful.spec.ts` — 2 specs (see Test plan).

## Files to modify

- `game/src/world/cold.ts` — add the grateful trio + detector, mirroring the `sympathyVisit` block:
  - `export const GRATEFUL_BOND = COMFORT_BOND;` — pinned to the shared console magnitude, exactly as `SYMPATHY_BOND = COMFORT_BOND`, so worry-comfort / relief-gratitude can't drift.
  - `export function clearedMyName(store, clearer, sufferer): boolean` — does `clearer` carry the *first-hand* relief memory about `sufferer`? `recall(store, clearer).some((e) => isShareable(e) && e === reliefMemory(sufferer))`. Exact-string match on `reliefMemory(sufferer)` (mirrors `heardColdWordAbout`'s exact match on `coldWordLine`), and `isShareable` excludes a downstream hearer of the relief *rumor* (which carries `RUMOR_MARK`).
  - `export function gratefulMemory(clearer): string` → `` `${clearer} cleared my name` `` — first-hand (no `RUMOR_MARK`), distinct from cold/warm/relief/cameToFind notes.
  - `export function gratefulLine(sufferer, clearer): string` → `` `${sufferer}: Thanks for setting them straight, ${clearer}. 💛` `` — 💛 register, distinct from 🫂 (sympathy/comfort), 😌 (relief), 😊 (warm), 🥶 (cold).
  - `export function clearedName(store, a, b): { sufferer; clearer; memory } | null` — pure detector mirroring `sympathyVisit`: if `clearedMyName(store, a, b)` → clearer=a, sufferer=b; else if `clearedMyName(store, b, a)` → clearer=b, sufferer=a; else null. Returns `{ sufferer, clearer, memory: gratefulMemory(clearer) }`. Guard `a === b` → null. Add a `ponytail:` note: fires on every later meeting while the relief memory persists (the once-per-clearing gate is 244/250 territory), exactly as `sympathyVisit` re-fires.
- `game/src/scenes/WorldScene.ts`:
  - Extend the `cold.ts` import to include `clearedName`, `gratefulLine`, `GRATEFUL_BOND`, and (for the new hook) `reliefMemory`.
  - In `converse`, inside the existing `else` of `if (correction)`, insert the grateful rung *before* the sympathy block:
    ```ts
    const thanks = clearedName(snapshot, a.name, b.name);
    if (thanks) {
      this.memory = remember(this.memory, thanks.sufferer, thanks.memory);
      this.bonds = strengthen(this.bonds, thanks.sufferer, thanks.clearer, GRATEFUL_BOND);
      const sDino = this.dinos.find((d) => d.name === thanks.sufferer);
      if (sDino) this.showBubble(sDino, gratefulLine(thanks.sufferer, thanks.clearer));
      this.logEvent(`💛 ${thanks.sufferer} thanks ${thanks.clearer} for clearing their name`);
    } else {
      // ... existing sympathyVisit block, unchanged ...
    }
    ```
  - Add two dev hooks beside `__selfCorrect` / `__rememberWarm`:
    ```ts
    (window as any).__clearedName = (a: string, b: string) => {
      const t = clearedName(this.memory, a, b);
      if (t) {
        this.memory = remember(this.memory, t.sufferer, t.memory);
        this.bonds = strengthen(this.bonds, t.sufferer, t.clearer, GRATEFUL_BOND);
      }
      return t;
    };
    (window as any).__rememberRelief = (name: string, sufferer: string) => {
      this.memory = remember(this.memory, name, reliefMemory(sufferer));
    };
    ```
- `tests/unit/cold.test.ts` — add a `describe('grateful to the one who cleared your name (BACKLOG-243)')` block.

## Reuse list

- `world/cold.ts`: `reliefMemory`, `RELIEF_NEWS_TOKEN`, `COMFORT_BOND` (via existing import), the `sympathyVisit`/`selfCorrect` detector shape — copy the structure.
- `social/gossip.ts`: `isShareable` / `RUMOR_MARK` — already imported in cold.ts; the first-hand vs heard distinction is the whole detector.
- `ai/memory.ts`: `remember` / `recall` — no new primitive (`forget` not needed; nothing is dropped here).
- `social/friendship.ts`: `strengthen` / `bondPoints` — the bond bump and the `__bond` hook already in WorldScene.
- WorldScene already imports `remember`, `strengthen`, `selfCorrect`, `sympathyVisit`, `reliefLine`, `spreadReliefWord` — extend the same import lines.

## New dependencies

none.

## Test plan

### Unit — `tests/unit/cold.test.ts`, new describe block

- `gratefulMemory` is first-hand (shareable) and distinct from cold/warm/relief/cameToFind memories.
- `gratefulLine` names both dinos and carries the 💛 register (and not 🫂/😌/😊/🥶).
- `GRATEFUL_BOND === COMFORT_BOND` (pinned, can't drift from the console magnitude).
- `clearedName` fires when one dino holds the first-hand `reliefMemory(other)`: returns `{ sufferer: other, clearer: one, memory: gratefulMemory(one) }`.
- direction-agnostic: call order doesn't decide who's the clearer.
- a dino that merely **heard** the relief rumor (`reliefWordLine(speaker, …)`, has `RUMOR_MARK`) is NOT a clearer → `clearedName` returns null (the `isShareable` guard).
- `clearedName(store, x, x)` returns null; returns null when neither carries the other's relief.

### E2E — `tests/e2e/cycle-054-grateful.spec.ts`, 2 specs

1. **the grateful beat fires:** boot; plant the first-hand relief memory on the clearer via `__rememberRelief(clearer, sufferer)`; read `__bond(sufferer, clearer)` before; call `__clearedName(sufferer, clearer)` → expect non-null `{ clearer, sufferer }`; `__bond` increased; `__memory()[sufferer]` includes `cleared my name` naming the clearer. Then `__forceConverse` (dinos[0]/[1]) with the relief planted on dino[1] about dino[0] and assert the converse seam logs the 💛 line — OR assert via `__clearedName` only and a separate seam check; keep it simple and mirror cycle-052's hook-driven style.
2. **control — a mere hearer is not the clearer:** boot; spread the relief *rumor* to a third dino the real way (`__rememberRelief` on a corrector, `__spreadReliefWord(corrector, third)`), then `__clearedName(sufferer, third)` → null, and no `cleared my name` memory filed on the sufferer; bond unchanged.

Free the port before e2e (`npx --yes kill-port 5173`); a lone cold-boot timeout on the first launch is the catalogued flake — re-run isolated.

## Risks

- **Precedence regression.** The sympathy block must stay byte-identical in behavior — it only moves one nesting level deeper into the new `else`. The cycle-050 sympathy spec is the pin.
- **Self-trigger.** `clearedName` must read the pre-meeting `snapshot`, not `this.memory`, so a relief memory filed *this* meeting (in the `selfCorrect` block) can't grant gratitude the same meeting — only a later one. (selfCorrect and clearedName are mutually exclusive on the snapshot anyway: a corrector drops the cold word as it files the relief, so it no longer carries cold word → selfCorrect won't re-fire; and the just-filed relief is not in the snapshot.)
- **Emoji collision.** 💛 must be unused elsewhere in the event log / bubbles — verified against 🫂/😌/🥶/😊/🗣️/👀/👂.

## Estimated touch count

~4 files (cold.ts, WorldScene.ts, cold.test.ts, cycle-054-grateful.spec.ts). Well within one fire.
