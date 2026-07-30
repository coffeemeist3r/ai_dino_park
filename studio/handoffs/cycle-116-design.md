# Cycle 116 — Design

Two tracks, both governance (Milestone 9). Independent verdicts.

---

## Lore track — BACKLOG-469: Fed first, or left short

**What the player sees.** Greet (`E` → tone pick) a dino that is **hungry** (over the 371 need threshold)
and lives on a zone that has a **provider-set spend priority** (463). Its reply carries one extra aside,
appended after the hunger tell, coloured by the ground's policy and its own temperament:

- **feed-first ground** → grateful/reassured ("good thing this ground feeds its own first — I'll be alright").
- **bank-first ground** → grumbling ("…and we go short while the walls go up. figures.").

Silent otherwise: not hungry → no aside; zone has no provider-set policy (`spendPriorityFor` → `null`) → no
aside. It's a flavour beat that only surfaces when the policy actually *bears* on the dino (it's short), the
way `seasonAside` stays quiet in summer/fall.

**Where it lives.** A new `policyAside(policy: SpendPriority, traits?): string` in `ai/brain.ts`, mirroring
`seasonAside`/`providerAside` exactly (three temperament bands via `PRICKLY_MAX`/`EFFUSIVE_MIN`, leads with a
space, back-compat plain line when no traits). `NPCContext` gains `groundPolicy?: SpendPriority`. `cannedReply`
appends the aside when `ctx.hungry && ctx.groundPolicy` (self-gating on hunger so the module is consistent
regardless of caller), composing after the hunger aside and before/among the ambient asides. WorldScene's
greet bag (`pickTone`) sets `groundPolicy` only when the dino is hungry:
`pressingNeed(this.needs[name]) === 'hunger' ? (this.spendPriorityFor(zoneOf(name)) ?? undefined) : undefined`.

**Boundary.** Deterministic fallback owns the fact (the aside text); the LLM path may colour but never
authors world state. `@mlc-ai/web-llm` untouched. `ai/brain.ts` already imports from `world/seasons` — the
new `SpendPriority` import from `world/governance` is the same (game→world type import), no cycle.

**Acceptance criteria (lore):**
1. `policyAside('feed', warmTraits)`, `('feed', pricklyTraits)`, `('feed', undefined)` each return a distinct
   grateful line leading with a space; the three `('bank', …)` variants each return a distinct grumbling line.
2. `cannedReply` with `hungry:true, groundPolicy:'feed'` appends the grateful aside; with
   `groundPolicy:'bank'` the grumble; with `hungry:false` (any policy) appends **nothing**; with
   `hungry:true, groundPolicy:undefined` appends nothing.
3. The aside composes onto an existing register (e.g. a fond/wistful base line still shows, with the policy
   aside after the hunger tell) — output length still clamped.
4. e2e: a hungry dino in a zone with a known provider policy shows the policy phrase in its greeting line;
   a non-hungry dino in the same zone does not. (Reuse the governance e2e's provider/priority setup.)
5. Build clean, full unit + e2e green, no `@mlc-ai/web-llm` import outside `game/src/ai/`.

---

## Structure track — BACKLOG-467: The say changes hands

**What the player sees.** When a zone's `provider` (448) changes to a different dino — the incoming one has
out-banked the incumbent, or a zone gets its first provider — a one-off line appears on the **Park News**
ticker (`ticker` lens): `🧺 <NewProvider> sets <Zone>'s table now — <mouths before walls | walls before
walls>`, the phrasing reading the incoming provider's spend priority (feed → "mouths before walls", bank →
"walls before mouths"). It fires **once** per handover, not every step the provider stays.

**Where it lives.** A new pure `world/handover.ts`:

```
handoverBeat(prev: string | null, next: string | null, zoneName: string, priority: SpendPriority): string | null
```
Returns the ticker line when `next && next !== prev` (a genuine change to a non-null provider — covers first
emergence and true turnover), else `null`. Node-testable, no Phaser, no roles store.

WorldScene:
- Persisted additive `lastProviderByZone: Record<string, string>` (save field; absent → `{}` on load; never
  breaks an old save).
- `checkProviderHandover()` called at the **tail of `forceStep`** (after `checkGather`, so this step's banking
  is reflected). For each zone id: `const cur = this.providerFor(zone)`; if `cur && cur !== lastProviderByZone[zone]`:
  `this.logEvent(handoverBeat(lastProviderByZone[zone] ?? null, cur, zoneById(zone).name, this.spendPriorityFor(zone)!))`,
  then `this.lastProviderByZone[zone] = cur`. (Reading `spendPriorityFor` also persists the new policy — the
  463 re-set, now marked instead of silent.) A departing provider that leaves a zone with *no* provider does
  **not** clear `lastProviderByZone` — the policy lingers (463's documented behaviour) and no false handover
  fires when the same dino later re-emerges; only a genuinely *different* incoming provider fires a beat.
- Dev hook `__providerHandover()` → returns the current `lastProviderByZone` map (lets the e2e assert the
  tracked provider) and the ticker already exposes the beat via `__ticker`/the lens.

**Acceptance criteria (structure):**
1. `handoverBeat(null, 'Sunny', 'The Grove', 'feed')` → a line naming Sunny, The Grove, "mouths before walls";
   `handoverBeat('Sunny', 'Rex', 'The Grove', 'bank')` → names Rex + "walls before mouths";
   `handoverBeat('Sunny', 'Sunny', …)` and `handoverBeat('Sunny', null, …)` both → `null`.
2. Driving banking so a zone's provider emerges/changes over `__stepWorld` calls logs exactly **one** ticker
   beat per handover (not one per step); a stable provider across many steps logs no repeat.
3. `lastProviderByZone` round-trips through save/load; an old save without the field loads to `{}` and the
   first handover after load still fires correctly.
4. A zone whose provider departs (no provider now) logs nothing and does not lose its stored policy; if a
   *new* dino later becomes provider, that fires one beat.
5. Build clean, full unit + e2e green. Additive save only.

**Cross-track:** shared file is `WorldScene.ts` (469 in `pickTone`, 467 in `forceStep`/save) — no logic
overlap; sequence the one additive save field (`lastProviderByZone`). The Coder builds both, commits once.
