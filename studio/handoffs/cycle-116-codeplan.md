# Cycle 116 — Code Plan

**SHIPPED (coder):** both tracks built as planned. Lore 469 — `policyAside` + `NPCContext.groundPolicy` +
`buildMessages` policy clause + `pickTone` greet-bag wiring; compose clamp raised to 400. Structure 467 — new
`world/handover.ts` (`handoverBeat`/`priorityPhrase`), `lastProviderByZone` field + `checkProviderHandover()`
at the `forceStep` tail + save/load + `__ticker`/`__providerHandover` hooks; save-envelope type + validator.
New tests: `handover.test.ts`, `tests/unit/cycle-116-policy-voice.test.ts`, e2e `cycle-116-handover.spec.ts` +
`cycle-116-policy-voice.spec.ts`. **Build clean · unit 1389/1389 · e2e 397/397 (full green, no flake this run)
· web-llm boundary intact.** No blockers.


Reuse-first. Both tracks slot into existing patterns; one new pure module per track's testable core.

## Lore track — BACKLOG-469 (policy voice)

**Reuse:** `seasonAside`/`providerAside`/`hungryAside` register in `ai/brain.ts`; `PRICKLY_MAX`/`EFFUSIVE_MIN`
bands; the `buildMessages` clause chain in `webllmBrain.ts`; `spendPriorityFor(zone)` + `pressingNeed` +
`zoneOf` already imported in WorldScene.

**Files:**
1. `game/src/ai/brain.ts`
   - `import type { SpendPriority } from '../world/governance';`
   - `NPCContext`: add `groundPolicy?: SpendPriority;` (doc: set only for a hungry dino on a policy'd ground).
   - New `policyAside(policy: SpendPriority, traits?: Personality): string` — three bands, leads with a space,
     no-traits → even line. feed → grateful ("good thing this ground feeds its own first…"), bank → grumble
     ("…and we go short while the walls go up. figures.").
   - `cannedReply`: after the `provider` block, before/after `season`, add
     `if (ctx.hungry && ctx.groundPolicy) reply = {...reply, text: (reply.text + policyAside(ctx.groundPolicy, ctx.traits)).slice(0, 400)};`
     (bump the clamp to 400 to leave room for the extra aside; season clamp stays 360 → raise to 400 too so
     nothing truncates when both fire).
2. `game/src/ai/webllmBrain.ts` `buildMessages`: a `policy` clause mirroring `seasonal`, inserted in the chain,
   gated on `ctx.hungry && ctx.groundPolicy` (feed → grateful nudge, bank → grumble nudge). Deterministic
   floor owns the fact; this is enrichment only.
3. `game/src/scenes/WorldScene.ts` `pickTone` greet bag: add
   `groundPolicy: pressingNeed(this.needs[target.name]) === 'hunger' ? (this.spendPriorityFor(zoneOf(this.dinoZones, target.name, BOWL_ID)) ?? undefined) : undefined,`

**Tests:** `tests/unit/cycle-116-policy-voice.test.ts` — policyAside 3 bands × 2 policies distinct + space-led +
no-traits even; cannedReply composition (feed grateful / bank grumble / not-hungry silent / no-policy silent /
composes onto fond+hunger within cap); buildMessages policy clause present only when hungry+policy.
e2e `tests/e2e/cycle-116-policy-voice.spec.ts` — emerge a provider (harvest×3, onlyResident) so bowl has a
policy; `__setNeed(name,'hunger',<over-threshold>)`; `__pickTone(name, 0)` → line contains the policy phrase;
a non-hungry dino's line does not. Zero console errors.

## Structure track — BACKLOG-467 (handover beat)

**Reuse:** `logEvent`/`eventLog`/`tickerLines`; `providerFor(zone)`; `spendPriorityFor(zone)`; `zoneById`;
the additive save-field pattern (`spendPriorityByZone`).

**Files:**
1. `game/src/world/handover.ts` (new, pure) — `handoverBeat(prev: string | null, next: string | null,
   zoneName: string, priority: SpendPriority): string | null`. Returns `🧺 <next> sets <zoneName>'s table now
   — <mouths before walls | walls before mouths>` when `next && next !== prev`, else `null`. Imports only the
   `SpendPriority` type.
2. `game/src/world/handover.test.ts` — first-set fires (prev null), turnover fires, same-provider → null,
   departure (next null) → null, priority colours the tail (feed vs bank).
3. `game/src/scenes/WorldScene.ts`
   - Field `private lastProviderByZone: Record<string, string> = {};` near `spendPriorityByZone`.
   - `private checkProviderHandover(): void` — for each `zoneById` id (bowl/grove/fernreach — iterate the same
     zone list `spendPriorityFor` callers use; reuse `ZONES`/`zoneById` ids): `const cur = this.providerFor(z)`;
     `if (cur && cur !== this.lastProviderByZone[z]) { this.logEvent(handoverBeat(this.lastProviderByZone[z] ?? null, cur, zoneById(z).name, this.spendPriorityFor(z)!)); this.lastProviderByZone[z] = cur; }`.
     `spendPriorityFor(cur's zone)` is guaranteed non-null when a provider stands.
   - Call `this.checkProviderHandover();` as the **last line of `forceStep`** (after `checkHatch`).
   - Save: add `lastProviderByZone: this.lastProviderByZone,` to `currentSaveData()`.
   - Load: `this.lastProviderByZone = (save.lastProviderByZone as Record<string, string>) ?? {};`
   - Hooks: `(window as any).__ticker = () => [...this.eventLog];` and
     `(window as any).__providerHandover = () => ({ ...this.lastProviderByZone });`
4. `game/src/world/saveGame.ts` — type field `lastProviderByZone?: Record<string, string>;`; a validator block
   after `spendPriorityByZone` (object, each value a string, else reject); add to the returned object.

**Tests:** `game/src/world/handover.test.ts` (above). e2e `tests/e2e/cycle-116-handover.spec.ts` — emerge Rex
as bowl provider over steps, `__stepWorld()` once → `__ticker()` contains one "sets The Bowl's table" beat;
step again → no second beat (one-off); `__providerHandover().bowl === 'Rex'`. Zero console errors.

**Zone id note:** use the canonical zone id list the scene already has (`ZONES`/`Object.keys` of the terrain
table, ids `bowl`/`grove`/`fernreach`) so a fourth zone needs no change here. Confirm the exact iterator the
Coder picks matches `providerFor`'s id space (raw zone ids, not display names).

**Sequencing:** both edit `WorldScene.ts` (pickTone vs forceStep/save/hooks — disjoint) and the save envelope
(only 467 adds a field). Build both, run `npx vitest run` from **repo root** (root config = tests/unit +
game/src, ~1375 tests), then e2e. One commit.
