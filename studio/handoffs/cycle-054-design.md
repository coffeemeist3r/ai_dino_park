# Cycle 54 — Design

## Item

BACKLOG-243 [social] — **Grateful to the one who cleared your name.**

## Why this cycle

The cold-rumor arc has built a complete worry cycle: the cold spreads (185), a hearer crosses the
bowl to comfort the sufferer (217 — worry becomes a deed), the keeper's warmth spreads (223), a
carrier drops a false alarm on sight (234), and that retraction now travels too (235 — the all-clear
becomes news). Cycle 53 made the relief *spread*; what it never did was reward the spreading. When
a dino carries a friend's all-clear, it does that friend a quiet service — and the recovered dino
has no way to thank it. This cycle closes the loop the arc has been circling: the **giving side of
relief**, the exact symmetric twin of the shipped sympathy visit (217). Where 217 turned a *worry*
into a bond (a carrier comes to comfort), 243 turns the *all-clear* into a bond (a recovered dino
warms to whoever carried its good news). It's a dino-on-dino beat (emergence over UI per the CHARTER
bias), deterministic and model-free, and it reuses the 217 detector shape almost symbol-for-symbol
on the relief spine 235 just laid.

## What ships

When two dinos converse and one of them is a **recovered cold-sufferer** (it carries a first-hand
relief memory about itself — i.e. someone cleared its name) and the *other* dino is **carrying that
all-clear** (it holds the first-hand relief memory `saw <sufferer> came through it fine`, the one
`spreadReliefWord` spreads), the sufferer **warms to the clearer**: a small bond bump between the
two, a floated grateful line over the sufferer (😌/💛 register, distinct from the existing
🫂/😌/🥶/😊 beats), and a first-hand "<clearer> cleared my name" memory the sufferer keeps.

Concretely, in the bowl: drop a dino into a winter cold night so it sleeps cold; warm it with the
keeper (it recovers, carries a warm memory); let another dino meet it and self-correct (234) so that
dino now carries the first-hand relief memory about it; then let the *recovered* dino meet that
clearer again — the recovered dino floats a grateful line and its bond with the clearer ticks up.

Precedence in the converse cascade: **self-correct (234) > grateful (243) > sympathy visit (217)**.
A recovered sufferer meeting a *cold-word* carrier is handled by 234 (the carrier drops it); a
recovered sufferer meeting a *relief* carrier is 243 (it thanks them); a non-recovered sufferer
meeting a cold-word carrier is still 217 (the pity visit). The three are mutually exclusive on the
pre-meeting snapshot, so each older path stays byte-identical when 243 doesn't fire.

## Acceptance criteria

- [ ] A pure detector (`clearedName` in `world/cold.ts`) returns `{ sufferer, clearer, memory }` when one conversing dino carries a first-hand relief memory (`saw <other> came through it fine`) about the other, else `null`.
- [ ] The detector keys on a *first-hand* relief memory (`isShareable`, no `RUMOR_MARK`): a dino that merely *heard* the relief rumor (`<x> told me: <sufferer> came through it fine`) is NOT treated as the clearer.
- [ ] `clearedName(store, a, a)` (same dino) returns `null`; a dino cannot clear its own name.
- [ ] In `WorldScene.converse`, when `clearedName` fires (and `selfCorrect` did not), the sufferer's bond with the clearer increases by a fixed `GRATEFUL_BOND` and the sufferer files the `<clearer> cleared my name` memory.
- [ ] A grateful bubble is floated over the sufferer naming the clearer, in a register distinct from the sympathy 🫂 line, the relief 😌 line, and the warm 😊 line.
- [ ] Precedence holds: a meeting that triggers `selfCorrect` (234) does NOT also apply the grateful beat in the same meeting (self-correct wins); a meeting where neither 234 nor 243 fires runs the existing 217 sympathy path unchanged.
- [ ] Snapshot discipline: the grateful beat reads the pre-meeting memory snapshot, so a relief memory *created* during the current meeting cannot trigger gratitude in that same meeting — only a later one.
- [ ] No save-format change (no `SAVE_VERSION` bump); no new dependency; nothing under `game/src/art/` or the scenes imports `@mlc-ai/web-llm` (boundary intact — NPCBrain not in play).
- [ ] `npm --prefix game run build` clean; full `vitest` green (new unit spec included); full `playwright` green (new e2e spec included), with the cold-boot flake re-run isolated if it trips.

## Out of scope

- The reciprocity ledger (a cleared dino later carrying its clearer's relief first) → **BACKLOG-246**.
- Gratitude surfacing in the keeper-greeting dialogue → **BACKLOG-247**.
- A "good-news bearer" role/standing from a clear-count tally → **BACKLOG-248**.
- The book showing who cleared a dino's name → **BACKLOG-249**.
- The grateful bond *cooling* if the sufferer re-sleeps cold (premature thanks) → **BACKLOG-250**.
- Once-per-clearing freshness gating (the beat may re-fire on later meetings while the relief memory persists, exactly as 217's visit does) → leave a `ponytail:` note pointing at the 226/244 freshness pattern; do not build it.

## Constraints

- **Reuse, don't reinvent.** The detector mirrors `sympathyVisit`/`selfCorrect` in `world/cold.ts`; the bond bump uses the existing `strengthen`/`bondPoints` (friendship) the way `SYMPATHY_BOND` does; the memory uses `remember`/`recall`/`isShareable`. No new memory primitive — `forget` is not needed here (nothing is dropped).
- **Pin the magnitude.** Define `GRATEFUL_BOND` pinned to the shared console magnitude (`= COMFORT_BOND`, as `SYMPATHY_BOND` is) so the relief-gratitude and worry-comfort gestures can't drift apart.
- **Byte-identical older paths.** The cycle-049 (cold word), cycle-050 (sympathy visit), cycle-051 (warm word), cycle-052 (self-correct), and cycle-053 (relief travels) gossip-seam specs must stay green untouched — the new branch only fires on a recovered-sufferer-meets-clearer meeting, an `else if` rung that is inert otherwise.
- **Snapshot.** Read `clearedName` against the `snapshot` captured before this meeting plants anything, like `sympathyVisit`/`selfCorrect` already do.
- Add a `__clearedName(a, b)` dev hook mirroring `__sympathyVisit`/`__selfCorrect` (applies the bump + memory, returns the result or null) and a `__rememberRelief(name, sufferer)` hook mirroring `__rememberWarm` (plants the first-hand `reliefMemory(sufferer)`) so the e2e can drive it headless without staging a full winter→warm→self-correct chain.
