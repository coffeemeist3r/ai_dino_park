# Cycle 89 — Design (two tracks)

## Lore track — BACKLOG-413 Fond of being caught

**Item:** BACKLOG-413 [social] — a dino caught mid-tic (408) that already loves the keeper reads *pleased*, not bashful.

**Why this cycle:** Cycle 88 shipped the catch (408) but made every dino react identically bashful — a sameness
defect in a "living minds" game whose whole premise is that a tic makes a dino unmistakably itself. 413 forks the
*reaction* on the individual's bond: the dino you've befriended is glad to be seen at its private ritual; a
stranger is still sheepish. Same event, opposite reading, decided by who that dino is to you. Tiny, deterministic,
model-free, and it directly upgrades the beat that just shipped.

**What ships:** Greet a dino deep in its solitary ritual (405, `ticInvented`) the way 408 already handles — but now
the reaction is bond-graded:
- If the dino's friendship is **below** the close-friend floor (`FOND_MIN = 8` hearts, the same threshold the fond
  greeting 272 already uses): unchanged from 408 — a 😳 startle, the `bashfulOpener()` prefix, the sheepish
  `caughtMemory`.
- If the dino is **fond** (hearts ≥ `FOND_MIN`): a 😊 pleased mark instead of 😳, a warm `fondOpener()` prefix
  ("delighted you came by, doesn't mind being seen"), and a glad `fondCaughtMemory` filed instead of the sheepish one.
The opener is still a deterministic frame wrapping whatever the brain/stub returned — it never asks the model to be
fond, so it tests headless and the `NPCBrain` boundary stays intact. A dino greeted while **not** mid-tic is
byte-identical to before (no frame either way).

**Acceptance criteria:**
- [ ] Greeting a fond (hearts ≥ 8) mid-tic dino shows a 😊 mark (not 😳) as the tone menu opens.
- [ ] The fond caught dino's reply is prefixed with the warm `fondOpener()` frame, not the bashful one.
- [ ] The fond caught dino files a *glad* caught memory (distinct text from the bashful `caughtMemory`), once per solitary stretch.
- [ ] Greeting a non-fond (hearts < 8) mid-tic dino is unchanged from 408: 😳 + `bashfulOpener()` + sheepish memory.
- [ ] Greeting a dino that is **not** mid-tic (fond or not) is byte-identical to pre-413 — no bashful and no fond frame.
- [ ] `pickKind`/tone flow, the affinity delta (142), and every bond are unchanged — 413 only colours the line + files a memory (no points/bond change).
- [ ] `fondOfBeingCaught`, `fondOpener`, `fondCaughtMemory` are pure (unit-tested); build clean; web-llm boundary intact.

**Out of scope:** A lasting affinity bump for being caught fond (that's the seeded follow-up 422). Teasing on a
*repeat* catch (420). Any change to how the tic forms (405) or to the 408 non-fond path.

**Constraints:** Reuse `FOND_MIN` from `ai/brain.ts` — do not invent a new threshold. Both the glyph (in
`openToneMenu`) and the opener/memory (in `pickTone`) must compute fondness from the same source
(`heartsFromPoints(this.friendship[name])`) so they never disagree. Keep the caught-once memory guard
(`ticCaughtFiled`) — a fond catch files at most one memory per stretch, same as bashful.

## Structure track — BACKLOG-384 Resource regrowth

**Item:** BACKLOG-384 [emergent] — each zone's gather source depletes as it's worked and slowly regrows.

**Why this cycle:** The gather economy has been infinite since 146 — a zone's slot re-rolls forever at a flat
chance, however hard it's worked (314 made it per-zone but still bottomless). 384 is the first *renewable
constraint*: a zone can be exhausted and must rest, which is the spine every future scarcity beat needs and the
first real economic reason for carry/barter between a worked-out zone and a fresh one.

**What ships:** Each zone carries a *yield* (fertility, 0..`YIELD_MAX`=1), starting full.
- A pickup in a zone **thins** that zone's yield by `YIELD_DEPLETE` (~3 back-to-back gathers empty it).
- Each spawn-roll tick a zone's yield **regrows** by `YIELD_REGROW` (slow — a worked-out zone stays thin a while),
  capped at full. Regrowth runs whether or not a resource is currently sitting in the slot.
- The per-zone spawn chance is **scaled by yield**: `RESOURCE_SPAWN_CHANCE × yield`. A full zone spawns at the old
  rate (back-compat: a fresh zone behaves exactly as pre-384); a thinned zone spawns proportionally rarer; a fully
  exhausted zone (yield 0) spawns nothing until it regrows.
Yield is **transient** (in-memory, not persisted) — a reload starts each zone fresh-full; regrowth is a
within-session pressure, so there is **no save-format change**.

**Acceptance criteria:**
- [ ] `depleteYield(y)` returns `y - YIELD_DEPLETE`, floored at 0 (never negative).
- [ ] `regrowYield(y)` returns `y + YIELD_REGROW`, capped at `YIELD_MAX` (never above full).
- [ ] `yieldSpawnChance(base, y)` returns `base × y` for `y` in [0,1]; `y=1` → `base` (unchanged), `y=0` → 0.
- [ ] After a real gather in the bowl (spawn on a dino + one world step), the bowl's yield drops below `YIELD_MAX` (`__yield('bowl') < 1`).
- [ ] A zone starts at `YIELD_MAX` (`__yield` reads 1 before any gather); an unworked zone never exceeds `YIELD_MAX`.
- [ ] Bowl/grove/Fernreach gather, bank, carry, barter, and craft are otherwise unchanged (yield only gates the *spawn roll* and depletes on pickup — no change to what's gathered or where it banks).
- [ ] Build clean; the new pure module is unit-tested; no save-version bump; web-llm boundary intact.

**Out of scope:** Persisting yield across sessions (transient by design). A visible yield readout on the plaque
(could be a follow-up). Depletion tuned per resource kind or per zone bias — one flat rate for all zones this cycle.

**Constraints:** Reuse the existing `RESOURCE_SPAWN_CHANCE` as the base (don't hardcode 0.12 in the new module).
`rollResource()` in `resource.ts` is replaced at the call site by the yield-scaled roll — leave the old export in
`resource.ts` (unit tests reference it) but drop it from WorldScene's import if it goes unused. Deplete the **active
zone**'s yield (that's where the gathered resource physically was). Regrow only zones with residents (an empty zone
isn't being worked, so it neither spawns nor regrows — acceptable).

## Cross-track notes
Both tracks touch `WorldScene.ts` but in **different methods** (413: `openToneMenu`/`pickTone`; 384:
`maybeSpawnResource`/`checkGather` + a new field + a dev hook) — no collision. 413 also touches `world/tic.ts`;
384 adds `world/regrowth.ts`. Disjoint. Either order is safe.
