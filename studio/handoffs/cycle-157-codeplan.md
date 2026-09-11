# Cycle 157 — Code Plan

Build order is **structure first, lore second**, because both tracks edit `WorldScene.eatFood` and the
structure track's edit there is a field conversion the lore track's edit sits on top of.

---

## Structure track — BACKLOG-544

### New file

**`game/src/world/expiry.ts`** — pure. No Phaser, no `Date.now()`, no clock.

| export | signature | notes |
|---|---|---|
| `FunkKind` | `'sulk' \| 'shoulder'` | the two callers this cycle ships |
| `Funk` | `{ kind: FunkKind; since: number }` | `since` is a world step, owned by the caller |
| `Funks` | `Readonly<Record<string, Funk>>` | one funk per dino; a new funk replaces an older one |
| `FUNK_WINDOW` | `Readonly<Record<FunkKind, number>>` | `{ sulk: SULK_FADES_AFTER_STEPS, shoulder: 20 }` — imported from `sulk.ts`, never re-typed |
| `enterFunk` | `(f, name, kind, atStep) => Funks` | immutable; spread-and-add, like `bonds.ts` |
| `clearFunk` | `(f, name) => Funks` | immutable; absent name is a no-op returning an equal record |
| `funkOf` | `(f, name) => Funk \| undefined` | |
| `inFunk` | `(f, name) => boolean` | |
| `expiredFunks` | `(f, atStep) => { name, kind }[]` | `atStep - since >= FUNK_WINDOW[kind]`; sorted by name for determinism |

**Reuse check (prior art):** `sulkHasFaded` (sulk.ts) and `stingIsFresh` (tic.ts) already exist and are the
two shapes being generalised; `FUNK_WINDOW.sulk` imports the former's constant rather than restating 40.
The immutable-record idiom is `ai/memory.ts` / `social/bonds.ts`. No new dependency, no class, no Map.

### Added to `game/src/world/sulk.ts`

Four strings for the standoff funk, beside `shookItOffMemory` (the standoff sulk is a sulk):

- `shookOffShoulderMemory(name)` — the unattended ending. **Must not contain `keeper`.**
- `shookOffShoulderLine(name)` — its float.
- `shoulderMendedMemory(name)` — the attended ending. **Must contain `keeper`.**
- `shoulderMendedLine(name)` — its float.

### `game/src/scenes/WorldScene.ts`

**Fields (≈557–560):** delete `pendingRepair: string | null` and `pendingRepairAt: number`; add
`private funks: Funks = {}`. Transient, never persisted — same lifetime `pendingRepair` had.

**Two private helpers:**
- `private sulker(): string | null` — the single dino currently in a `sulk` funk (the bowl only ever has
  one jealous runner-up, which is why `pendingRepair` was one field).
- `private cheerShoulder(name: string): boolean` — if `name` is in a `shoulder` funk, clear it, file
  `shoulderMendedMemory`, float `shoulderMendedLine`, `liftMood`, log. Returns whether it fired. One method,
  three callers (meal, greet, tone-greet) — the keeper's attention is the keeper's attention whichever
  door it comes through.

**Call-site conversion (mechanical, 1:1):**

| line (pre-edit) | today | after |
|---|---|---|
| 2656 | `if (this.pendingRepair === d.name)` | `if (this.sulker() === d.name)` + `clearFunk`; then `this.cheerShoulder(d.name)` |
| 2699 `checkSulk` | single-sulker age check | `checkFunks()` — loop `expiredFunks(this.funks, this.worldSteps)`, branch on kind |
| 5758 | `this.pendingRepair === d.name ? 'sulk' : undefined` | `inFunk(this.funks, d.name) ? 'sulk' : undefined` — **both** kinds shade the idle glyph to 😒 |
| 6021–6022 | two assignments | `this.funks = enterFunk(this.funks, hc.jealous.name, 'sulk', this.worldSteps)` |
| 7889 / 7911 | `repairing` read + clear | `this.sulker() === name` + `clearFunk`; `cheerShoulder(name)` added after the repair block |
| 7926 / 7947 | same, in `recordGreet` | same |
| 8732 | `__pendingRepair` | `() => this.sulker()` — hook contract unchanged |
| 8734 | `__sulkAge` | reads `funkOf(...,'sulk').since` — hook contract unchanged |
| new | — | `__funks()` → `{ name, kind, age }[]` |

**`resolveContest` (≈2578):** in both branches, beside the existing `this.sting(...)` call on the dino that
came away with nothing, add `this.funks = enterFunk(this.funks, <loser>, 'shoulder', this.worldSteps)` and a
`logEvent`. The loser is already identified in both branches — no new decision, no new read, no re-parse of
a memory string (BACKLOG-483's rule).

**`checkFunks` ordering** stays where `checkSulk` was in the `forceStep` tail — after `checkFeeding`, so a
meal on the very step a window elapses is what ended the funk.

### Tests

- `game/src/world/expiry.test.ts` — the nine pure criteria (enter/clear/immutability/window table/expiry
  boundary/two-at-once/empty).
- `game/src/world/sulk.test.ts` — **append** a describe block for the four new strings (the existing
  cycle-123 blocks stay untouched; if they go red the conversion is wrong, which is the point).
- `tests/e2e/cycle-157-funk.spec.ts` — the four e2e criteria via `__funks`, `__forceStep`, `__memory`.

---

## Lore track — BACKLOG-066

### `game/src/world/foods.ts`

- `ateFavoriteMemory(label: string): string` and `ateMemory(): string` — the two strings currently inline in
  `eatFood`, exported verbatim so no memory already in a save changes text.
- `lastTaste(memories: readonly string[]): { label: string; loved: boolean } | null` — scan the ring
  **backwards**, match against the builders' own shapes, return the first hit. Precedent:
  `lastHatchOutcome` in `world/manner.ts` (BACKLOG-404) does exactly this against the four hatch strings;
  this is the same read for the two meal strings, and it is the first half of BACKLOG-483 paid down.

### `game/src/ai/brain.ts`

- `NPCContext.tasted?: { label: string; loved: boolean }`.
- `tasteAside(label, loved, traits): string` — six lines, `PRICKLY_MAX` / `EFFUSIVE_MIN` split, leading
  space, exactly the shape of `mealtimeAside` and `hourAside`.
- `cannedReply`: compose it **last**, after the `standing` block, raising only the final cap (540 → 620).

### `game/src/ai/webllmBrain.ts`

- One clause in `buildMessages` naming the food and whether it was the favorite; the model colours the
  fact, it never authors the frame (the 423/300 discipline).

### `game/src/scenes/WorldScene.ts`

- `eatFood`: the two inline template literals become the builders (applied **after** the structure track's
  edit to this method).
- The live greet literal (≈7608, beside `mealtime`) and `greetContextFor` (≈6203) both gain
  `tasted: lastTaste(recall(this.memory, name)) ?? undefined`.

### Tests

- `game/src/world/foods.test.ts` — **append**: builders + `lastTaste` (empty / loved / plain / most-recent /
  rolled-off).
- `game/src/ai/brain.test.ts` — **append**: six distinct asides, label present, leading space, byte-identity
  when `tasted` is absent.
- `tests/e2e/cycle-157-taste.spec.ts` — the two e2e criteria.

---

## Blockers

None known at plan time. Risk noted: the `pendingRepair` conversion touches nine sites read by roughly
thirty e2e assertions through `__pendingRepair` / `__sulkAge`; the hook contracts are held identical on
purpose so those assertions are the conversion's own regression net.

---

## Shipped (Coder, cycle 157)

Build order held: the 544 field conversion went into `eatFood` first, the 066 builder swap on top of it.

**Structure track — BACKLOG-544**
- `game/src/world/expiry.ts` (new, pure) — `FunkKind` / `Funk` / `Funks`, `FUNK_WINDOW`, `enterFunk`,
  `clearFunk`, `funkOf`, `inFunk`, `expiredFunks`. `FUNK_WINDOW.sulk` imports `SULK_FADES_AFTER_STEPS`
  rather than restating 40.
- `game/src/world/sulk.ts` — four standoff strings appended (`shookOffShoulderMemory` / `Line`,
  `shoulderMendedMemory` / `Line`).
- `game/src/scenes/WorldScene.ts` — `pendingRepair` + `pendingRepairAt` deleted, replaced by one `funks`
  record; `sulker()`, `shoulderFunk()` and `cheerShoulder()` added; `checkSulk` became `checkFunks`;
  `resolveContest` enters a `shoulder` funk on the dino it already stings in both branches; the idle mood
  glyph now reads `inFunk` so either kind shades to 😒; `__pendingRepair` / `__sulkAge` held byte-identical;
  `__funks` added.
- Tests: `game/src/world/expiry.test.ts` (14), `sulk.test.ts` +3, `tests/e2e/cycle-157-funk.spec.ts` (4).

**Lore track — BACKLOG-066**
- `game/src/world/foods.ts` — `ateFavoriteMemory`, `ateMemory`, `lastTaste` appended.
- `game/src/ai/brain.ts` — `NPCContext.tasted`, `tasteAside` (six lines), composed last at cap 620.
- `game/src/ai/webllmBrain.ts` — one taste clause in `buildMessages`.
- `game/src/scenes/WorldScene.ts` — `eatFood` files through the builders; the live greet literal and
  `greetContextFor` both carry `tasted`.
- Tests: `tests/unit/cycle-157-taste.test.ts` (16), `tests/e2e/cycle-157-taste.spec.ts` (3).

**Two plan deviations, both because the plan named a hook that does not exist.**
1. The e2e reads the canned greeting through `__greetLine`, not `__cannedLine` — the latter was the plan's
   invention. `__greetLine` is the existing hook and returns exactly what the plan wanted.
2. The planned "idle glyph reads 😒" e2e assertion was **dropped**, not faked. There is no `__moodGlyph`
   hook and inventing one to assert a `setText` would be a hook that re-implements the thing it tests —
   the cycle-128 discipline, in reverse. The glyph path is covered where it is decidable: `inFunk` is
   unit-tested, `moodFidget(traits, 'sulk')` already has cycle-070's spec, and the e2e asserts the funk
   record the glyph reads from. Noted for QA rather than quietly deleted.
3. Also dropped: an e2e assertion on the non-favorite food's *label* being absent, which would have needed
   a `__foods` hook. Replaced with the stronger and hook-free assertion that the line mentions the hatch
   but never the word `favorite`.

**Gates:** `npm run build` clean. `npx vitest run` — **2683 passed, 3 skipped, 253 files**.
`npx playwright test` — **713/713 passed in full** (6.2m), including `mobile-minds` long-dialog.
`@mlc-ai/web-llm` imported only under `game/src/ai/`. `cycle-145-reachability` green (8/8) — no rig shipped
without a host. No save-format change.

**One flake, noted not hidden.** On the first (two-spec) run, two `cycle-157-funk` specs failed at
`boot`'s `__ready` wait while two others in the same file passed. Re-run isolated: 4/4 green. Re-run in the
full 713-spec suite: green. The known cold-Vite parallel-load flake (BACKLOG-538's third instance was
logged last cycle); this is its fourth, and it remains a boot-timing failure rather than a regression.
