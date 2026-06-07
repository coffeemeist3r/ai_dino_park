# Cycle 34 — Design

## Item
**BACKLOG-132 [emergent] Gratitude echo** — a dino that got consoled (BACKLOG-130) files *who* consoled it; when that friend later sulks, the consoled dino is first to drift over and console it back. Reciprocity hardens into the bond graph.

## Why this cycle
Cycle 33 (BACKLOG-130) was the first time the long-dormant dino↔dino bond graph (BACKLOG-013, since cycle 18) did anything: the sulker's *closest friend* crossed the bowl to console it. But that selection only looks at raw bond strength — it has no memory. This cycle gives the gesture consequence: the comforted dino remembers who showed up, and pays it back. When the favor's giver later finds itself the sulking runner-up, the dino it once consoled is the one who comes — even past a peer with a stronger bond. That's the bond graph bending behavior in *both* directions, with nobody scripting which pair. The cycle-33 verdict named this the keystone unblock (132/133/136). It is small, pure, and additive-save — a textbook one-cycle extension of an existing seam.

## What ships
Reciprocity layered onto the existing homecoming → jealous-sulk → comfort beat (BACKLOG-112/120/130), changing *who* crosses the bowl when there's a gratitude debt:

- When a comfort beat plays (a friend consoles a sulker), the **sulker now files the comforter** as someone it owes — a persisted, additive `gratitude` ledger (`sulker → [comforters who came for it]`, deduped).
- On a *later* homecoming where someone sulks, the comforter is chosen as before (closest friend ≥ floor) **unless** the sulker is owed a debt: if any present dino was previously consoled *by this sulker* (i.e. this sulker is in that dino's gratitude list), that **grateful debtor crosses over instead** — the echo. This override ignores the bond floor (you show up for the friend who showed up for you, regardless), and among multiple debtors picks the highest-bond one (alpha tie-break, matching `comfort.ts`/`homecoming.ts`).
- The echo plays exactly like a normal comfort beat: the debtor steps toward the sulker, floats `There there, <sulker>. 🫂`, the pair's bond grows by `COMFORT_BOND`, the sulker keeps the comfort memory, and `__lastComfort` reflects the debtor as comforter.
- The gratitude ledger persists in the save (additive, like `memory`/`bonds`), so an echo can span sessions.

Observable in-bowl: stage a homecoming where A sulks and B (its closest friend) consoles it; later stage a homecoming where B sulks while another dino C has a *stronger* bond with B — A (not C) is the one who drifts over and throws the 🫂. A dev hook `window.__gratitude()` exposes the ledger.

## Acceptance criteria
- [ ] `recordGratitude(ledger, consoled, byWhom)` returns a new ledger with `byWhom` appended under `consoled`, and is deduped (recording the same pair twice does not duplicate).
- [ ] `recordGratitude` does not mutate its input ledger (returns a new object).
- [ ] With no gratitude ledger (or an empty one), `comforter(sulker, bonds, names)` behaves exactly as in cycle 33 — all 7 existing comfort unit tests still pass unchanged.
- [ ] When the sulker is owed a debt by a present peer, `comforter(sulker, bonds, names, gratitude)` returns that grateful debtor even when another peer has a strictly higher bond with the sulker.
- [ ] The gratitude override returns the debtor even when the debtor's bond with the sulker is **below** `COMFORT_BOND_FLOOR` (reciprocity ignores the floor).
- [ ] Among multiple grateful debtors, the highest-bond one wins; bond ties break to the lexicographically-smallest name.
- [ ] A debtor named in the ledger but **not present** in `names` is ignored (only current dinos cross over); with no present debtor, selection falls back to the normal closest-friend-above-floor rule.
- [ ] `serialize`/`deserialize` round-trips a save containing a `gratitude` ledger; a save with no `gratitude` field still loads (defaults to `{}`), and a malformed `gratitude` value is rejected (returns null) — additive, no `SAVE_VERSION` bump.
- [ ] E2E: after a comfort beat fires, `window.__gratitude()` shows the sulker owes the comforter; staging a second homecoming where that comforter sulks (with a *different* dino holding the higher bond) makes `window.__lastComfort()` report the original debtor as the comforter — the echo.

## Out of scope
- Clearing/consuming a debt once repaid (that's BACKLOG-138 — debts here are a growing ledger).
- Group/multiple comforters arriving at once (BACKLOG-137).
- Surfacing gratitude in dialogue or the collection book (BACKLOG-139/140).
- Any change to who *sulks* (BACKLOG-120) or to the keeper-repair path (BACKLOG-125) — those seams stay byte-for-byte unchanged; this cycle only changes which dino is selected to comfort and records the debt.
- `walk-it-off` procession (BACKLOG-133) — the comforter still just takes one `stepToward`.

## Constraints
- **Do not touch `homecoming.ts` or the BACKLOG-125 repair seam** — 120/125 must ship exactly as before. This cycle only consumes `jealous.name` and extends `comfort.ts` + its WorldScene glue.
- Keep all selection/ledger logic in pure, Node-tested `world/comfort.ts`. WorldScene does glue only (record into `this.gratitude`, pass it into `comforter()`, persist it).
- `comforter`'s new `gratitude` parameter must be **optional** and trailing, so existing call sites and tests are unaffected when omitted.
- Save changes additive only: new `gratitude?: Gratitude` field, default `{}`, no `SAVE_VERSION` bump, old saves load.
- The `@mlc-ai/web-llm` boundary stays intact — nothing new imports it; `comfort.ts` imports only `social/bonds`.
- Reward currency remains the dino↔dino bond (`COMFORT_BOND`); no player-friendship points change from a comfort/echo beat.
