# Cycle 97 — Design

Two file-disjoint tracks. Milestone 3 openers: the economy starts pushing surplus toward need (429),
and a hungry dino lets the want slip into its voice (368).

---

## Lore track — BACKLOG-368: Hunger in the voice

**What:** A dino over its hunger threshold (`needs.pressingNeed(...) === 'hunger'`) lets it slip in its
next greeting — a short aside appended to whatever the greeting register produces ("…could eat, honestly").
Reuses the shipped need-drive (371, `world/needs.ts`) and the deterministic greeting path (`cannedReply`),
so the tell is a *layer* on the existing line, not a new register that fights the gratitude/wistful/fond
ladder. Temperament-shaded per the same PRICKLY_MAX / EFFUSIVE_MIN cut the thanks/greeting lines use.

**Design:**
- `ai/brain.ts`: add `hungry?: boolean` to `NPCContext`. Add pure `hungryAside(traits?)` → three
  agreeableness-shaded variants (prickly grumble / warm plea / even mention). In `cannedReply`, compute
  the base reply as today, then **if `ctx.hungry`** append `hungryAside(ctx.traits)` (clamped length).
  The aside composes with *every* branch (gratitude, wistful, fond, generic) — hunger leaks regardless of
  topic, which is exactly "lets it slip."
- `ai/webllmBrain.ts`: thread the hunger fact into the prompt (buildMessages) so the model can *colour*
  it — enrichment only; the canned fallback already carries the deterministic tell, so behavior never
  depends on the model (CHARTER: NPCBrain boundary, deterministic floor).
- `scenes/WorldScene.ts`: at the greet ctx (`pickTone` → `target.greet({…})`, ~line 3870) add
  `hungry: pressingNeed(this.needs[target.name]) === 'hunger'`.

**Acceptance criteria:**
1. A dino with `pressingNeed === 'hunger'` greets with the hunger aside appended to its line.
2. A sated dino — or one whose pressing need is *thirst* (not hunger) — greets byte-identically to before
   (no aside): the tell is hunger-specific.
3. The aside is temperament-shaded: prickly / warm / even variants are distinct, cut at PRICKLY_MAX / EFFUSIVE_MIN.
4. The aside composes with every greeting register — gratitude, wistful, fond, and generic each still fire
   and carry the aside when hungry.
5. Deterministic under stub/fallback (no model required); the LLM path receives the hunger fact for colour
   but the tell does not depend on it.
6. No save change; `@mlc-ai/web-llm` stays imported only under `ai/`. Build + unit + e2e green.

**Tests:** unit `test/cycle-097-hunger-voice.spec.ts` (hungryAside variants; cannedReply appends-when-hungry
/ byte-identical-when-sated; composes with each register). e2e `tests/cycle-097-hunger-voice.spec.ts`
(`__setNeed(name,'hunger',0.8)` → greet → line carries the aside; a sated control does not).

---

## Structure track — BACKLOG-429: Zone carry pressure

**What:** A per-zone stockpile *soft* cap. When a crossing dino leaves a zone whose pile total is over the
soft cap **and** enters a strictly-lighter neighbour, the carry link (329/356/377) sheds harder — it
ferries the glut (its most-stocked acceptable kinds), up to `PRESSURE_CARRY` units, instead of the single
craft-deficit kind. So banked resources *flow toward need* instead of piling forever in one zone. When not
over cap, or when the neighbour is heavier/equal, behavior is byte-identical to today (one directed kind) —
resources are never pushed into an already-fuller zone.

**Design (all pile math pure in `world/resource.ts`):**
- `STOCKPILE_SOFT_CAP` (per-zone total; below the per-kind `STOCKPILE_CAP=8` × kinds so it bites before a
  hard cap does), `PRESSURE_CARRY = 2`.
- `pileTotal(pile)`, `overSoftCap(pile)`.
- `pressuredCarry(src, dest, recipe = CRAFT_RECIPE): ResourceKind[]` — **not** over cap or dest not lighter
  → `[directedCarry(...)]` (or `[]`), byte-identical to the current single carry. Over cap **and** dest
  strictly lighter → simulate up to `PRESSURE_CARRY` transfers of `pickCarry` (most-stocked kind dest can
  still accept), each re-checking `atCap(dest)` on a working copy so it stays lossless + cap-safe.
- `scenes/WorldScene.ts` `crossDino`: replace the single `directedCarry` transfer with the `pressuredCarry`
  list, applying each on the same `takeResource`→`bankResource` path; log the count/first kind.

**Acceptance criteria:**
1. Source pile over `STOCKPILE_SOFT_CAP`, dest strictly lighter → ferries up to `PRESSURE_CARRY` (2) of the
   most-stocked acceptable kinds (sheds the glut), not the single directed kind.
2. Source at/under the soft cap → byte-identical to 356/377 (one `directedCarry` kind); no regression to the
   grove/bowl/Fernreach carry any existing spec pins.
3. Source over cap but dest heavier/equal → **no** boost (normal single carry): resources never flow into a
   fuller neighbour.
4. Transfers stay lossless and cap-safe — each ferried unit re-checks the dest per-kind cap; nothing lost,
   dest never exceeds `STOCKPILE_CAP`.
5. Pure/Node-testable in `resource.ts`; WorldScene glue only applies the returned transfers + logs.
6. Additive save (per-zone piles already persist; **no** schema change). Build + unit + e2e green.

**Tests:** unit `test/cycle-097-carry-pressure.spec.ts` (pressuredCarry: under-cap == directedCarry; over-cap
+ lighter → 2 sheds; over-cap + heavier → 1; cap-safe/lossless; empty src → []). e2e
`tests/cycle-097-carry-pressure.spec.ts` (mirror the existing 329/356 carry crossing spec: `__setZonePile`
a glutted source + light dest, drive `__startMigrationTo` to a crossing, assert the pressured amount moved;
a not-over-cap control moves one).

**No cross-track collision:** 368 touches `ai/brain.ts` + `ai/webllmBrain.ts` + the greet ctx; 429 touches
`world/resource.ts` + `crossDino`. Distinct WorldScene methods, distinct modules.
