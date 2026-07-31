# Cycle 117 — Code Plan

Two small, heavily-precedented diffs. Every piece has a live sibling in-tree to copy the shape from; the
plan below names the sibling for each so the Coder writes *this* codebase's code, not generic code.

---

## Lore track — BACKLOG-470 · Word of how the ground decides

### Reuse (read these first — do not reinvent)

| Need | Prior art | Note |
|---|---|---|
| Rumor module shape | `game/src/world/providerword.ts` | the direct sibling — same file layout, same doc-comment voice, same `{ store, rumor }` return |
| `RUMOR_MARK` + 1-hop | `game/src/social/gossip.ts` (`RUMOR_MARK`, `isFirsthand`) | the mark alone buys the 1-hop property; add no new rule |
| Memory write | `remember(store, listener, line)` from `ai/memory` | listener's store, never the speaker's |
| The policy value | `SpendPriority` from `world/governance.ts` | type only — the module never derives a policy, callers pass it |
| Cascade + ticker ladder | `WorldScene` `npc_meet` block (~line 3447–3480) | the `?:` chain and the mirroring else-if ladder |
| Dev hook | `__spreadProviderWord` (~line 2723) | copy verbatim, swap the module + the policy read |

### Files

- **NEW** `game/src/world/policyword.ts` (~40 lines)
  - `policyWordLine(speaker, zoneName, p: SpendPriority): string` — `` `${speaker} ${RUMOR_MARK} ${zoneName} feeds its own first` `` for `'feed'`, `` `… ${zoneName} banks against the winter` `` for `'bank'`. No article before `zoneName` (carry `providerWordLine`'s comment).
  - `spreadPolicyWord(store, speaker, listener, priority, zoneName)` — early-return `{ store, rumor: null }` on `speaker === listener || !priority`; else build the line and `remember` it against the listener.
  - Doc comment in the house voice: what it is, that it's pure/Node-testable, and *why* the two gates are in the module rather than at the call site (no caller can skip them — the `providerword.ts` argument).
- **EDIT** `game/src/scenes/WorldScene.ts`
  - import `spreadPolicyWord` beside the `spreadProviderWord` import (line ~101).
  - `npc_meet` cascade: insert one rung between `pword` and `plenty`:
    ```ts
    const policy = pword.rumor
      ? pword
      : spreadPolicyWord(this.memory, a.name, b.name, this.spendPriorityFor(zone), zoneById(zone).name);
    const plenty = policy.rumor ? policy : spreadPlentyWord(this.memory, a.name, b.name);
    ```
    `zone` is already in scope from the provider rung — reuse it, don't recompute.
  - Ticker ladder: `else if (policy.rumor) this.logEvent(\`🏛️ ${b.name} heard from ${a.name} how ${zoneById(zone).name} spends\`);` placed between the `pword` and `plenty` rungs so the ladder still tracks the cascade order (the existing comment says it must).
  - Extend the cascade comment block to name the new rung and its precedence reason (a name beats a stance; both beat news of another ground).
  - Dev hook beside `__spreadProviderWord`:
    ```ts
    (window as any).__spreadPolicyWord = (a: string, b: string) => {
      const zone = zoneOf(this.dinoZones, a, BOWL_ID);
      const p = spreadPolicyWord(this.memory, a, b, this.spendPriorityFor(zone), zoneById(zone).name);
      this.memory = p.store;
      return p.rumor;
    };
    ```

### Tests

- **NEW** `tests/unit/cycle-117-policy-word.test.ts` — model `tests/unit/cycle-108-provider-word.test.ts`:
  1. line wording differs by priority; both carry `RUMOR_MARK`; no article injected before the zone name (assert against a real zone display name, `'The Grove'`).
  2. spread writes to the **listener's** store and returns the rumor; speaker's store untouched.
  3. `priority: null` → `{ rumor: null }`, store identity unchanged.
  4. `speaker === listener` → `{ rumor: null }`, store identity unchanged.
  5. 1-hop: feed the spread line through `spreadGossip` as the listener's only memory and assert it does not re-spread (the `isFirsthand` gate) — same assertion style as the 108 suite's hop test.
- **NEW** `tests/e2e/cycle-117-policy-word.spec.ts` — model `cycle-115-governance.spec.ts`:
  - boot, console-error collector, `expect(errors).toEqual([])` at the end (the no-GPU warn-not-error rule holds).
  - a policy-less bowl first: `__spreadPolicyWord('Rex', 'Mossback')` → `null` (the ground has no say yet).
  - then drive a provider into being with the 115 spec's `onlyResident` + `harvestBowl` helpers (copy them; they're spec-local there too), assert `__spendPriority('bowl')` is non-null, and assert `__spreadPolicyWord(...)` now returns a line containing `told me:` and the zone's display name.

---

## Structure track — BACKLOG-468 · The provider's read on the lens

### Reuse

| Need | Prior art | Note |
|---|---|---|
| Glyph helper beside its type | `world/decline.ts` `declineGlyph()`, `world/granary.ts` `GRANARY_GLYPH` | same placement rule; put `spendGlyph` in `governance.ts` |
| Optional back-compat column | `zoneMapModel`'s `granaryZones` / `declining` params | 8th and 7th columns added exactly this way |
| Per-zone record helper | `WorldScene.decliningZones()` (~line 2599) | `zoneSpends()` is its twin, three lines |
| Draw-site append | `drawZoneMap()` tier line (~line 2637) | append to the existing line; do **not** add a line or grow `boxH` |

### Files

- **EDIT** `game/src/world/governance.ts` — add `spendGlyph(p: SpendPriority | null | undefined): string`
  returning `'🍽️'` / `'🏦'` / `''`, with a one-line doc naming 468 and the lens it feeds.
- **EDIT** `game/src/ui/lenses.ts`
  - import `type SpendPriority` from `../world/governance`.
  - `ZoneMapEntry` gains `spend: SpendPriority | null;` with the house-style comment (`BACKLOG-468 … null when unknown, so older callers/tests stay valid`).
  - `zoneMapModel` gains 9th param `spends: Record<string, SpendPriority | null> = {}`; map `spend: spends[id] ?? null`.
- **EDIT** `game/src/scenes/WorldScene.ts`
  - `private zoneSpends(): Record<string, SpendPriority | null>` next to `decliningZones()`.
  - `zoneMapEntries()` passes `this.zoneSpends()` as the 9th argument with the trailing `// BACKLOG-468` comment matching its neighbours.
  - `drawZoneMap()`: `` txt `` gains `${e.spend ? ` ${spendGlyph(e.spend)}` : ''}` at the end of the tier line; import `spendGlyph` from `world/governance` (that import line already exists — extend it).

### Tests

- **NEW** `tests/unit/cycle-117-spend-lens.test.ts`:
  1. `spendGlyph` — `'feed'` → 🍽️, `'bank'` → 🏦, `null` → `''`, `undefined` → `''`.
  2. `zoneMapModel` attaches `spend` per zone from the `spends` argument; a zone absent from it reads `null`.
  3. back-compat: the 3-arg and 8-arg call shapes still compile and yield `spend === null` everywhere.
- **EXTEND** `game/src/ui/lenses.test.ts` — one case asserting the pre-468 8-arg call still produces entries (guards the column addition where the existing column tests live).
- **NEW** `tests/e2e/cycle-117-spend-lens.spec.ts` — boot, `__zoneMap()` reports `spend: null` for every zone in a young park; crown a provider with the 115 helpers; `__zoneMap()` now reports that zone's `spend` equal to `__spendPriority(zone)`; console errors empty.

---

## Order of work

1. Structure track first (`governance.ts` → `lenses.ts` → `WorldScene`) — it touches the type module the
   lore track imports from, so landing it first means the lore rung compiles against final types.
2. Lore track (`policyword.ts` → `WorldScene` cascade + hook).
3. Unit suites, then `npm run build`, then `npx vitest run`, then `npx --yes kill-port 5173` +
   `npx playwright test`.

## Blockers

None known. Both tracks are additive reads over shipped state.

## Invariants to hold

- No save-envelope change on either track (design makes this a QA assertion — diff `world/saveGame.ts` and
  the persisted-field list to prove it).
- `@mlc-ai/web-llm` stays imported only under `game/src/ai/` (neither track goes near `ai/`).
- `zoneMapModel`'s existing call shapes keep working — the whole point of the optional 9th parameter.
- The `npc_meet` ticker else-if ladder keeps tracking the cascade order (its own comment demands it).
