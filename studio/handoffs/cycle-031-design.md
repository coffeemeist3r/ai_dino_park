# Cycle 31 — Design

## Item
**BACKLOG-120 [emergent] Jealous nuzzle** — when two dinos are nearly tied for closest, the
runner-up sulks (😒) the moment the homecoming dino gets its welcome-back beat.

## Why this cycle
Cycle 30 shipped the homecoming nuzzle (BACKLOG-112): your *closest* dino throws a 👋 when you
return from a long absence. That beat singles out exactly one dino — which is precisely when a
near-equal second dino would feel slighted. BACKLOG-120 is the keystone of the cycle-31 cluster
(123 sulk-recovery, 125 runner-up repair, 126 envy all hang off it): it adds a second, *reactive*
mind to the same moment, so the homecoming reads as a little social event, not a solo cutscene.
It's pure selection logic over the same friendship map, no model needed, and it makes the
runner-up dino distinct through a flash of rivalry. Smallest possible emergence with the biggest
narrative payoff this cycle.

## What ships
When a homecoming beat fires (player returns after a long absence and the closest dino plays its
👋), the game also checks the **second-closest** dino. If that runner-up is *nearly tied* with the
closest — within one heart's worth of friendship points (≤ 10 points apart) — the runner-up
floats a brief sulk bubble (e.g. `Glade: Hmph. 😒`) right alongside the welcome-back, and files a
faint "saw the keeper fuss over <closest>" memory. If the runner-up is clearly further back (more
than 10 points behind) or there is no second befriended dino, nothing extra happens — only a true
*near*-rival sulks.

Observable in the browser via the existing `window.__catchUp(realMs)` dev hook: after a long
catch-up that stages a homecoming, the returned object now carries a `jealous` field (the sulk
beat or `null`), and a second bubble appears over the runner-up dino when one is staged.

## Acceptance criteria
- [ ] When the closest and second-closest dinos are within 10 friendship points and a homecoming fires, `homecoming(...)` returns a non-null `jealous` beat naming the second-closest dino.
- [ ] The jealous beat's `name` is the second-highest-friendship dino (ties among runners-up broken by lexicographically smallest name, matching the existing `closest` tie-break).
- [ ] The jealous beat's `line` contains the runner-up's name and the 😒 emoji.
- [ ] The jealous beat's `memory` is a short string referencing the closest dino (the one who got fussed over).
- [ ] When the second-closest dino is more than 10 points behind the closest, `jealous` is `null` (no sulk — not a near-tie).
- [ ] When only one dino has friendship > 0 (no runner-up), `jealous` is `null`.
- [ ] When the absence is below the homecoming threshold (no homecoming fires), no jealous beat is produced (`homecoming(...)` returns `null` overall, as today).
- [ ] In-world: a `__catchUp` that stages a near-tie homecoming floats a second (sulk) bubble over the runner-up dino, and `__catchUp(...).jealous` is non-null with the runner-up's name.
- [ ] `npm --prefix game run build` clean; `npx vitest run` green (incl. new jealous-nuzzle unit tests); `npx playwright test` green (incl. a new e2e exercising the near-tie sulk).

## Out of scope
- Repairing the sulk / greeting the runner-up to clear it (that's BACKLOG-125).
- The sulk fading on its own over time or via feed (BACKLOG-123).
- Envy from *low*-friendship onlookers (BACKLOG-126).
- A chorus of multiple welcomers (BACKLOG-124).
- Any change to friendship **points** — like the homecoming beat, the jealous beat is a look + a
  memory, it must not add or subtract affinity.
- LLM-authored sulk lines — the line is a deterministic, heart/personality-free template.

## Constraints
- Selection logic stays **pure** in `game/src/world/homecoming.ts` (no Phaser, no WebLLM import);
  WorldScene does glue only (float the second bubble, fold the memory through `remember`).
- **Additive save only** — no `SAVE_VERSION` bump, no new save fields. The memory rides the
  existing memory store; an old save with no `savedAt` still stages nothing.
- Must not change the existing homecoming behavior: the `Homecoming` object keeps its current
  fields; the jealous beat is an **additive** field on it (`jealous?: … | null`), so the 8
  existing `homecoming.test.ts` cases stay green.
- Keep the `@mlc-ai/web-llm` boundary intact (grep clean outside `game/src/ai/`).
- The jealous bubble must reuse the existing `showBubble`; do not invent a new bubble path.
- Do not change friendship points; `refreshHeartsPanel` must still show identical hearts after.
