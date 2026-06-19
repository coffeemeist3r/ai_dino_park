# Cycle 60 — Design

Two tracks (CHARTER v5). Independently testable + shippable. They share no files.

---

## Lore track — BACKLOG-272 [social] Fond greeting from a close dino

### Item
BACKLOG-272 — a high-friendship dino opens a keeper greeting with a familiar, fond line instead of the
generic hello; the warm pole of cycle 59's wistful greeting (271).

### Why this cycle
Cycle 59 gave the neglected pole a wistful opener keyed on `ctx.affection`. The warm pole is still flat:
a dear-friend dino greets exactly like a stranger. 272 closes the spectrum so a greeting's *first words*
read the relationship — wistful when ignored, fond when close, generic in between — the affection
counterpart of the gruff/nod/gush thanks register. Cheapest possible win, mirroring 271 exactly.

### What ships
- A new fond greeting register. When the keeper greets a dino with **no gratitude pending** and
  **`ctx.affection` ≥ `FOND_MIN` (8 hearts)**, the canned reply is a warm, familiar line — e.g.
  *"There you are, friend! I was hoping you'd come round."* — naming nothing it can't know.
- A dino below 8 hearts greets as today (wistful at ≤1, generic otherwise).
- LLM path matches: a fond dino's `buildMessages` system prompt picks up a *fond/familiar* instruction;
  fires only for ≥8 hearts with no gratitude. Wistful and fond clauses are mutually exclusive.

### Acceptance criteria
- [ ] `fondGreeting(name)` (exported, pure) returns a warm line containing the dino's name.
- [ ] `FOND_MIN` is exported and equals `8` (hearts).
- [ ] `cannedReply` with `affection ≥ FOND_MIN` and no `gratitude` returns the fond line via `source: 'canned'`; the cutoff is **inclusive** (exactly 8 → fond).
- [ ] `cannedReply` ordering holds: gratitude (any) wins; then wistful (≤1); then fond (≥8); then generic (2–7). A dino at 5 hearts gets a generic line; a dino at 8 gets fond; a dino at 1 gets wistful.
- [ ] `cannedReply` with no `affection` field returns a generic line (back-compat unchanged).
- [ ] `buildMessages` adds the fond instruction for a ≥8-heart dino (no gratitude) and NOT for a mid/low one or a grateful one; wistful and fond never both appear.
- [ ] E2E: a dino set to ≥8 hearts, greeted headless (canned), returns the fond line — names the dino, is not the wistful line, not a thanks line. No console errors.
- [ ] `npm run build` clean; full `vitest` + `playwright` green in one fresh run.

### Out of scope
- Snubbed-resigned (275), observer-name-in-greeting (276), last-gift recall (277) — follow-ups.
- Any affection change from the greeting; mid-band (2–7) keeps the generic line.

### Constraints
- **Two files only**, mirroring 271: `game/src/ai/brain.ts` (`fondGreeting` + `FOND_MIN` + the
  `cannedReply` branch) and `game/src/ai/webllmBrain.ts` (the prompt clause). No WorldScene/world/save.
- Branch order in `cannedReply`: gratitude → wistful → fond → generic. Wistful (≤1) and fond (≥8) can
  never overlap. The generic + wistful paths stay byte-identical so cycle-059 specs pass untouched.
- NPCBrain boundary intact: dialogue text stays under `game/src/ai/`.

---

## Structure track — BACKLOG-032 [emergent] Roles persist across cycles

### Item
BACKLOG-032 — an emerged role becomes durable: once a dino has found a non-wanderer role it keeps it,
instead of reverting the moment the behavior that earned it fades.

### Why this cycle
Roles emerge from live behavior tallies (`deriveRole`), recomputed on every read — so a socialite that
stops mingling silently drops back to 'wanderer'. Jobs that evaporate aren't jobs. 032 makes an emerged
identity stick, the spine the persistent-civilization arc (a guard that stays a guard) builds on.

### What ships
- A pure `settleRole(prev, derived)` in `roles.ts`: a held non-wanderer role never falls back to
  'wanderer'; it only changes when a *different* non-wanderer role emerges.
- Per-dino settled roles persisted in the save (additive `roles: Record<string, Role>`; absent → {}).
- `roleOf(name)` routes the live `deriveRole` through `settleRole` against the persisted store, writes
  the settled role back, and returns it — so the roles lens, the collection book, and `__roles` all show
  the durable role. The store restores on load.

### Acceptance criteria
- [ ] `settleRole(undefined, 'socialite')` → `'socialite'`; `settleRole('wanderer', 'socialite')` → `'socialite'`.
- [ ] `settleRole('socialite', 'wanderer')` → `'socialite'` (never reverts to wanderer — the core of 032).
- [ ] `settleRole('socialite', 'gossip')` → `'gossip'` (a real change to another non-wanderer role still takes).
- [ ] `settleRole('wanderer', 'wanderer')` → `'wanderer'` (still searching).
- [ ] Save round-trips `roles`: `deserialize(serialize({...,roles:{Rex:'gossip'}})).roles.Rex === 'gossip'`; a save without `roles` deserializes with `roles` defaulting to `{}` (additive, old saves valid).
- [ ] E2E: a dino driven to a non-wanderer role (e.g. enough meetings → socialite) keeps that role in `__roles` after its meeting tally is no longer the deciding factor — the role doesn't revert to wanderer. No console errors.
- [ ] The roles lens / book still render a role for every dino (no regression). Build + full suites green.

### Out of scope
- Role-driven *behavior* (a guard actually guarding) — that's the BACKLOG-104 action layer; 032 is the
  durable role *identity* only.
- New role types; changing `deriveRole`'s thresholds.

### Constraints
- Pure logic in `roles.ts` (Node-testable); WorldScene change is the `roleOf` routing + the additive
  save + restore, nothing more.
- Additive save only (`roles?`), mirroring `zoneId`/`keeperId`; old saves must deserialize.
- The roles lens, book rows, and `__roles` must keep working — `roleOf` stays the single source.

---

## Cross-track note
Lore touches `game/src/ai/{brain,webllmBrain}.ts`; structure touches `game/src/ai/roles.ts`,
`game/src/world/saveGame.ts`, `game/src/scenes/WorldScene.ts`. No shared file (brain.ts vs roles.ts are
distinct). Build in either order.
