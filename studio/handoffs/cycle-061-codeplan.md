# Cycle 61 — Code Plan (two tracks)

## Lore track — BACKLOG-276: The keeper has a name

**Item:** A fond (≥8-heart) dino names the chosen observer by designation in its hello.

**Files to create:**
- `tests/unit/cycle-061-keeper-name.test.ts` — see Test plan.
- `tests/e2e/cycle-061-keeper-name.spec.ts` — see Test plan.

**Files to modify:**
- `game/src/keeper/keepers.ts` — add `export function designationOf(keeper: Keeper): string` returning the unit code before the nickname: `keeper.name.split('"')[0].trim()` (`'AETHER-1 "Aki"'` → `'AETHER-1'`). Pure.
- `game/src/ai/brain.ts`
  - `NPCContext`: add `keeperName?: string` (additive, optional; doc-comment: the chosen observer's designation, surfaced by a fond greeting — BACKLOG-276).
  - `fondGreeting(name: string, keeperName?: string)`: when `keeperName` is given → `There you are, ${keeperName}! Good to see you back, friend.` (still starts with "There you are" so the fond register is recognizable); when absent → **return today's line byte-for-byte** (`There you are, friend! ${name}'s been hoping you'd come round.`).
  - `cannedReply` fond branch: pass `ctx.keeperName` → `fondGreeting(ctx.name, ctx.keeperName)`. Ordering (gratitude → wistful → fond → generic) unchanged.
- `game/src/ai/webllmBrain.ts` — the `fond` clause: keep the existing sentence byte-identical, and **append** a naming instruction only when `ctx.keeperName` is set: `+ (ctx.keeperName ? \`Greet them by name — call them ${ctx.keeperName}. \` : '')`. Byte-identical prompt when `keeperName` unset.
- `game/src/scenes/WorldScene.ts` — import `designationOf` from `../keeper/keepers`; at the two greet-context build sites add `keeperName: designationOf(keeperById(this.keeperId))`:
  - `pickTone` (the real greet, ~line 2204) — in the `target.greet({...})` extra.
  - `__greetPrompt` dev hook (~line 1697) — in the `buildMessages` ctx.
- `tests/e2e/cycle-060-fond-greeting.spec.ts` — **in-fire fixup**: the in-game fond line now names the keeper, not the dino. Replace `expect(reply).toContain('Twitch')` with `expect(reply).toContain('AETHER-1')` (the default observer's designation). FOND / not-WISTFUL / not-`cleared` assertions stay. This is the feature deliberately changing what the old test pinned (cf. cycle 57/58 softening prior assertions).

**Reuse list:**
- `keeperById` (`keeper/keepers.ts`) — resolve the current observer; `this.keeperId` (WorldScene) already tracked + persisted.
- `cannedReply` / `buildMessages` greeting-clause structure (`ai/`) — extend the existing fond branch, don't add a new path.
- `dino.greet` (`entities/dino.ts`) already spreads `...extra` over the ctx, so `keeperName` flows through with **no change to `dino.ts`**.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-061-keeper-name.test.ts`):
  - `designationOf` strips the nickname for all three keepers (`AETHER-1` / `VANTA-9` / `LUMEN-3`).
  - `fondGreeting('Sunny', 'AETHER-1')` contains `'AETHER-1'`; `fondGreeting('Sunny')` (no keeper) === the legacy dino-named line (back-compat) and contains `'Sunny'`.
  - `cannedReply({affection:8, keeperName:'AETHER-1'})` text contains `'AETHER-1'`; `cannedReply({affection:8})` (no keeperName) === `fondGreeting(name)` (back-compat, matches cycle-060).
  - ordering pins: gratitude beats fond-with-name; wistful (≤1) unaffected by keeperName; mid-band (5) still generic.
  - `buildMessages` fond clause names the keeper when `keeperName` set; byte-identical (no `call them`) when unset.
- E2E (`tests/e2e/cycle-061-keeper-name.spec.ts`): mirror cycle-060 — befriend Twitch to ≥8 hearts via `__greet`, `__pickTone('Twitch','warm')`, read the dialog; assert the reply contains `'AETHER-1'` (default keeper) and `'There you are'`, and NOT `'cleared'`/wistful. (Optionally switch keeper via `__pickKeeper`/`__setKeeper` and assert the new designation — only if a hook exists; else keep to the default observer.)

**Risks:**
- The cycle-060 e2e fixup is mandatory (above) — without it that spec fails, because the in-game fond line stops naming the dino. The cycle-060 **unit** tests pass no `keeperName`, so they stay green untouched.
- NPCBrain boundary: `ai/` must NOT import `keeper/`. The designation string is computed in the **scene** and passed in via ctx — verify no new `ai → keeper` import (grep).

**Estimated touch count:** ~7 files (4 src, 2 new tests, 1 test fixup) — small edits.

---

## Structure track — BACKLOG-040: Save format versioning + migration hook

**Item:** `save.version` field + migration hook so an older save is upgraded on load, not discarded.

**Files to create:**
- `tests/unit/cycle-061-save-version.test.ts` — see Test plan.

**Files to modify:**
- `game/src/world/saveGame.ts`
  - `SAVE_VERSION = 2`.
  - Add a migration registry + a pure exported `migrate`:
    ```ts
    type Migration = (o: Record<string, unknown>) => Record<string, unknown>;
    // Each N→N+1 step upgrades a parsed save by exactly one version. Future non-additive
    // changes register their step here; the chain runs them in order.
    const MIGRATIONS: Record<number, Migration> = {
      // v1 → v2: every field added since v1 was additive-optional, so a v1 payload is already
      // shape-compatible — the step just stamps the new version (the worked example proving the hook).
      1: (o) => ({ ...o, version: 2 }),
    };
    /** Lift a parsed save of any supported version up to SAVE_VERSION, else null (unknown/newer/missing). */
    export function migrate(raw: Record<string, unknown>): Record<string, unknown> | null {
      const v = raw.version;
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > SAVE_VERSION) return null;
      let o = raw;
      for (let from = v; from < SAVE_VERSION; from++) {
        const step = MIGRATIONS[from];
        if (!step) return null; // gap in the chain — refuse rather than guess
        o = step(o);
      }
      return o;
    }
    ```
  - `deserialize`: after the `typeof raw !== 'object'` guard, replace `const o = raw as Record<...>; if (o.version !== SAVE_VERSION) return null;` with `const o = migrate(raw as Record<string, unknown>); if (!o) return null;` — then the existing field validation runs against the migrated `o` unchanged. (Update the file's top doc-comment: migration is now in scope; BACKLOG-040.)
- `tests/e2e/cycle-036-sky.spec.ts` — **fixup**: line ~67 `expect(save.version).toBe(1)` → `toBe(2)` (the only literal-version assertion outside saveGame's own tests; all other tests use the `SAVE_VERSION` constant and bump automatically).

**Reuse list:** the existing `deserialize` field-validation block is reused wholesale — only the version gate at the top changes. `serialize` is unchanged (it writes `data.version`, which callers set to `SAVE_VERSION`).

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-061-save-version.test.ts`):
  - `SAVE_VERSION === 2`; `JSON.parse(serialize(validV2)).version === 2`.
  - a literal `version: 1` save (valid v1 fields) deserializes non-null and returns `version: 2` (migration ran).
  - a `version: 99` save → null; a missing-version / non-numeric-version save → null; a `version: 0` save → null.
  - `migrate({version:1, ...})` returns an object with `version: 2` and does NOT mutate its input (input.version still 1 after the call); `migrate` of a v2 object is identity; `migrate` of an unknown version is null.
  - a v1 save carrying only a subset of additive fields (no `roles`, no `keeperId`) still loads (defaults applied) and returns `version: 2`.
- Existing `tests/unit/saveGame.test.ts`: stays green untouched — `version: 0` still → null (below the floor), and the `SAVE_VERSION`-constant samples become v2 automatically. (Coder: confirm, don't edit unless a literal slipped in.)

**Risks:**
- The only at-risk existing assertion is `cycle-036-sky.spec.ts` `toBe(1)` (fixup above). Grep for any other literal `version: 1` / `.version).toBe(1)` before committing.
- Keep the additive-load behavior: a real on-disk v1 save (subset of fields) MUST still load — the new unit test pins this.

**Estimated touch count:** ~3 files (1 src, 1 new test, 1 e2e fixup).

---

## Cross-track collision
None. Lore: `ai/brain.ts`, `ai/webllmBrain.ts`, `keeper/keepers.ts`, `scenes/WorldScene.ts` (+ tests). Structure:
`world/saveGame.ts` (+ tests). No shared file. Build + full suite must be green for the combined result.

---

## Shipped (Coder)

**Files touched:**
- Lore 276:
  - `game/src/keeper/keepers.ts` — `designationOf(keeper)` (split off the nickname).
  - `game/src/ai/brain.ts` — `NPCContext.keeperName?`; two-arm `fondGreeting(name, keeperName?)`; `cannedReply` fond branch passes `ctx.keeperName`.
  - `game/src/ai/webllmBrain.ts` — fond clause appends the "call them <designation>" instruction only when `keeperName` set (byte-identical otherwise).
  - `game/src/scenes/WorldScene.ts` — import `designationOf`; pass `keeperName: designationOf(keeperById(this.keeperId))` at the `pickTone` greet + the `__greetPrompt` hook.
  - `tests/unit/cycle-061-keeper-name.test.ts` (new, 10 tests); `tests/e2e/cycle-061-keeper-name.spec.ts` (new, 1).
  - `tests/e2e/cycle-060-fond-greeting.spec.ts` — in-fire fixup: fond in-game line names the keeper now (`'Twitch'` → `'AETHER-1'`).
- Structure 040:
  - `game/src/world/saveGame.ts` — `SAVE_VERSION = 2`; `MIGRATIONS` registry + pure exported `migrate(raw)`; `deserialize` swaps the exact-match gate for migrate-then-validate.
  - `tests/unit/cycle-061-save-version.test.ts` (new, 10 tests).
  - `tests/e2e/cycle-036-sky.spec.ts` — fixup: `save.version` `toBe(1)` → `toBe(2)`.

**Deviations from plan:** none. `dino.ts` untouched as predicted (greet spreads `...extra`).

**Build + tests:** `npm --prefix game run build` clean. `npm run test:unit` → 576 unit green (+20). `npx playwright test` → 190 passed, 1 cold-boot flake (`cycle-005-roster`, untouched by the diff; 4/4 green isolated on re-run). New cycle-061 specs + both in-fire fixups green. NPCBrain boundary verified (no web-llm outside `ai/`, no `ai → keeper` import).
