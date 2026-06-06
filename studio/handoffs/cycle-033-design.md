# Cycle 33 — Design

## Item
**BACKLOG-130 [social] Comforting nuzzle** — when a dino sulks (😒), its closest dino-friend
(highest bond) drifts over and throws a 🫂, nudging the funk down; friendship between dinos blunts
jealousy. Builds on BACKLOG-120 (jealous sulk) + BACKLOG-013/bonds.

## Why this cycle
Three cycles of the attention economy have all pointed at the keeper: you come home (112), the
favorite glows, a runner-up sulks (120), you make it up (125). The dino↔dino **bond graph** has
been accumulating since cycle 18 and does almost nothing visible. This cycle turns the camera
sideways: when the homecoming makes a near-tied runner-up sulk, *another dino* — the sulker's
closest friend — crosses the bowl and consoles it. Society you watch happen *between* inhabitants,
not just transactions with you. It's the most "Project Sid" beat we can ship cheaply on existing
pure modules, and it's the spine for 132 (gratitude echo), 133 (walk-it-off), 136 (comfort-is-for-
friends).

## What ships
When a homecoming fires (after a long absence) and a near-tied runner-up sulks `Hmph. 😒`
(unchanged BACKLOG-120 behavior), the studio now also picks the **sulker's highest-bond peer** whose
bond clears a floor. If one exists, that friend plays a comfort beat in the same moment: a floating
`<friend>: There there, <sulker>. 🫂` over the friend (placed beside the sulker so it reads as
consolation), the **bond between the two grows** by a small amount, and the sulker keeps a faint
`<friend> came over to comfort me` memory. If the sulker has no friend above the floor (a poorly
integrated dino), nothing extra happens — the sulk and the keeper-repair path (125) are untouched.

A QA tester: trigger a homecoming with a jealous runner-up that has a strong bond to a third dino
(dev hook to force bonds), and watch a 🫂 bubble appear over that third dino while their pairwise
bond ticks up. With all bonds weak, only the 😒 sulk shows.

## Acceptance criteria
- [ ] A new pure module `game/src/world/comfort.ts` exists; it imports only `social/bonds` (+ types) — **no Phaser import, no `@mlc-ai/web-llm` import** (grep outside `game/src/ai/` stays empty).
- [ ] `comforter(sulker, bonds, names)` returns the highest-bond peer (excluding `sulker`) whose pairwise bond is **≥ `COMFORT_BOND_FLOOR`**; returns `null` when no peer clears the floor. Unit-tested both ways.
- [ ] Bond ties are broken deterministically by lexicographically-smallest name (matching `homecoming.ts` `topBy`). Unit-tested.
- [ ] `comfortLine(friend, sulker)` contains `🫂` and **both** names; `comfortMemory(friend)` names the friend; `COMFORT_BOND > 0`. Unit-tested.
- [ ] On a homecoming whose jealous sulker has a qualifying friend, a comfort 🫂 bubble appears over that friend in the same beat as the 😒 sulk (e2e via `__bubbleTexts` + a new `__lastComfort` hook returning `{comforter, sulker}`).
- [ ] After that beat the comforter↔sulker pairwise bond has increased by exactly `COMFORT_BOND` (e2e reads `__bonds`/`__bondPair`).
- [ ] When the jealous sulker's every bond is below the floor, **no** comfort beat fires (`__lastComfort` stays null) and the BACKLOG-120 sulk + BACKLOG-125 `__pendingRepair` behavior is byte-for-byte unchanged (e2e regression).
- [ ] `npm --prefix game run build` clean; `npm run test:unit` green (new comfort describe included); `npx playwright test` green (new + neighboring specs).
- [ ] Save stays additive: no `SAVE_VERSION` bump, no new persisted field — the bond bump rides the already-persisted `bonds` map.

## Out of scope
- Multi-tick "walk over" animation / walking the sulker back to the den — that's BACKLOG-133 (walk-it-off). A one-shot placement beside the sulker is enough this cycle.
- A bond *floor that sharpens who-comes* beyond the basic threshold — BACKLOG-136.
- The comforted dino later returning the favor — BACKLOG-132.
- Comfort for the BACKLOG-062 standoff (😤) sulk or any sulk other than the homecoming jealousy. Only the homecoming `jealous` path triggers comfort this cycle.
- Changing keeper-repair (125): comfort does **not** consume `pendingRepair`; the keeper make-up greet still works independently.

## Constraints
- Do **not** touch `homecoming.ts` selection logic — only *consume* its `jealous.name`, exactly as cycle 32 did for repair.
- Keep the reward currency the **dino↔dino bond** (`strengthen`/`bondPoints` from `social/bonds`); do not move player-friendship points in the comfort path (that's the keeper's lever, not a peer's).
- The comforter may, in principle, be the homecomer itself (the favorite consoling its own rival) — that's allowed and a little poignant; only the sulker is excluded from candidacy. Don't add special-casing for it.
- All comfort math lives in the pure module; `WorldScene` does glue only (compute comforter from `this.dinos` names + `this.bonds`, float the bubble, `strengthen` the pair, `remember` the sulker, set `__lastComfort`, optional reposition). Mirror the cycle-32 repair seam.
- Additive save only; never leave `main` red or the tree dirty.
