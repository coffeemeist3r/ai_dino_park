# Cycle 60 — Code Plan

Two tracks, no shared files.

---

## Lore track — BACKLOG-272 (fond greeting)

### Files to modify
- `game/src/ai/brain.ts` — `export const FOND_MIN = 8;` (hearts, near `WISTFUL_MAX`); `export function
  fondGreeting(name: string): string` (warm/familiar line, names the dino); in `cannedReply`, after the
  wistful branch and before the generic pick: `if (ctx.affection !== undefined && ctx.affection >= FOND_MIN) return { text: fondGreeting(ctx.name), mood: moodFromTraits(ctx.traits), source: 'canned' };`
- `game/src/ai/webllmBrain.ts` — a `fond` clause in `buildMessages`: when `!ctx.gratitude &&
  ctx.affection !== undefined && ctx.affection >= 8`, append a fond/familiar instruction. Mutually
  exclusive with the wistful clause (≤1 vs ≥8 can't overlap). Weave into the system string beside `wistful`.

### Files to create
- `tests/unit/cycle-060-fond-greeting.test.ts`, `tests/e2e/cycle-060-fond-greeting.spec.ts`

### Reuse
- `moodFromTraits`, `ctx.affection` (already fed at both greet sites). No WorldScene change.

### Test plan
- Unit: `fondGreeting` names the dino; `FOND_MIN===8`; cannedReply fond at 8 (inclusive) and above,
  generic at 5, wistful at 1, generic at undefined; gratitude beats fond; buildMessages fond clause for
  ≥8 only, never alongside wistful.
- E2E: set a dino to ≥8 hearts (drive via existing friendship — `__bondPair` is bonds, not friendship;
  use the friendship path: greet/gift, OR a direct hook if present). If no friendship setter exists,
  assert through `cannedReply` is unit-covered and the e2e drives hearts via repeated gifting. **Check at
  build time which hook sets friendship; fall back to the unit coverage + a lighter e2e (a fond dino's
  greeting via a friendship hook).**

### Risk
- Branch order: gratitude → wistful (≤1) → fond (≥8) → generic. Keep generic/wistful byte-identical.

---

## Structure track — BACKLOG-032 (roles persist)

### Files to modify
- `game/src/ai/roles.ts` — `export function settleRole(prev: Role | undefined, derived: Role): Role`:
  `if (!prev || prev === 'wanderer') return derived; return derived === 'wanderer' ? prev : derived;`
- `game/src/world/saveGame.ts` — additive `roles?: Record<string, Role>` on `SaveData` (store as plain
  `Record<string,string>` to avoid a roles import; default `{}` on load, validate string values). Mirror
  the `lastTone` additive pattern (string-valued map).
- `game/src/scenes/WorldScene.ts` — add `private roles: Record<string, Role> = {};`; in `roleOf`:
  `const derived = deriveRole({...}); const settled = settleRole(this.roles[name], derived); this.roles[name] = settled; return settled;`. Add `roles: this.roles` to `currentSaveData()`; restore
  `this.roles = (save.roles ?? {}) as Record<string, Role>`. Add `(window as any).__roleStore = () => ({ ...this.roles });`.

### Files to create
- `tests/unit/cycle-060-roles-persist.test.ts`, `tests/e2e/cycle-060-roles-persist.spec.ts`

### Reuse
- `deriveRole` (roles.ts) stays the live derivation; `settleRole` wraps it. `roleOf` stays the single
  source so lens/book/`__roles` all get the durable role.

### Test plan
- Unit: settleRole all four cases (undefined→take, wanderer→take, held non-wanderer + wanderer→keep,
  held + other non-wanderer→change); save round-trips `roles`, absent→`{}`.
- E2E: drive Rex to a non-wanderer role via `__bondPair('Rex','Mossback',60)` (homebody at topBond≥60),
  read `__roles().Rex==='homebody'`, assert it's written to `__roleStore()` and survives in
  `__exportSave()` (persistence wiring). **Deviation from the design AC's behavior-reversion e2e:**
  `__bondPair` only *raises* bonds (cumulative `strengthen`), so a tally-lowering reversion can't be
  driven in-browser; non-reversion is fully unit-covered by `settleRole`, and the e2e proves the
  persistence integration instead. No console errors; lens/book still render a role for every dino.

### Risk
- `roleOf` now mutates `this.roles` on read — idempotent (settle is stable once set), called in render;
  fine. Keep the additive save string-typed so an old/hand-edited save can't crash deserialize.

---

## Shipped (Coder)

### Lore track — BACKLOG-272
- `game/src/ai/brain.ts` — `FOND_MIN = 8`, `fondGreeting(name)`, cannedReply branch (gratitude→wistful→fond→generic).
- `game/src/ai/webllmBrain.ts` — `fond` clause in buildMessages (≥8 hearts, no gratitude; mutually exclusive with wistful).
- `tests/unit/cycle-060-fond-greeting.test.ts`, `tests/e2e/cycle-060-fond-greeting.spec.ts`.

### Structure track — BACKLOG-032
- `game/src/ai/roles.ts` — `settleRole(prev, derived)` (held non-wanderer never reverts; a different non-wanderer takes).
- `game/src/world/saveGame.ts` — additive `roles?: Record<string,string>` (default {} on load, string-validated like lastTone).
- `game/src/scenes/WorldScene.ts` — `roles` store, `roleOf` routed through settleRole, `__roleStore` hook, save round-trip + restore.
- `tests/unit/cycle-060-roles-persist.test.ts`, `tests/e2e/cycle-060-roles-persist.spec.ts`.

### Deviations / fixes
- Fond e2e: drove **Twitch** (warm founder) + Warm tone instead of Rex — a Warm tone on prickly Rex is a negative personality fit that docked a heart below FOND_MIN (caught in test, fixed). Twitch+Warm holds affection at the cap.
- `tests/unit/saveGame.test.ts` `sample` fixture gained `roles: {}` (additive field now in every round-trip output, as `zoneId` was last cycle).

### Status
- `npm run build` ✅ clean. `npm run test:unit` ✅ 556 passed. `npx playwright test` ✅ 190 passed (one full run; cycle-060 also green under --repeat-each=2). Both tracks green together.
