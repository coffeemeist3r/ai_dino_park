# Cycle 87 — Verdict

## Lore track — BACKLOG-405 Solitary tic

**Verdict:** APPROVED
**Item:** BACKLOG-405

**Rationale:** After four cycles that spent the whole personality budget on the hatch standoff (a dino always
reacting to *another* dino over a scrap), 405 finally turns a dino inward. A dino left genuinely alone — no
company in its zone within range, no pressing need, nothing to do — accrues a solitary streak and, past
`TIC_AFTER_STEPS`, falls into a small ritual keyed to its most-pronounced trait: it paces a fixed path,
fusses over one spot, or turns a slow circle, filing a one-time "a little ritual of your own" memory. It's
model-free, name-seeded, deterministic — squarely the CHARTER "Living minds" mandate (a dino unmistakably
itself), and it reads even in the bowl's dead air. The implementation is clean and well-placed: the tic sits
strictly below `moping` and above pointless cross-zone `socializing`, and the solitude accounting resets only
on real disturbance (company or a need) — so a lonely loner still withdraws to the edge first and forms its
ritual on a calm step, rather than the two behaviors fighting. All 6 acceptance criteria PASS (9 unit + 1
e2e); the companioned control never invents; no bond change, no save change (transient state + the additive
memory ring). The spine 407–411 all hang off this. A small, true beat: distinctness from idleness.

## Structure track — BACKLOG-358 Edge-meet barter

**Verdict:** APPROVED
**Item:** BACKLOG-358

**Rationale:** The inter-zone economy was strictly one-way — carry (329 → directed 356 → zone-aimed 377) only
moves a resource in the direction a dino walks, on a crossing. 358 adds the converse: two dinos who linger at
their zones' shared edge barter, each handing over the kind the other's zone is short of for its own next
structure. It's a disciplined second caller of load-bearing seams — `barterSwap` is just `directedCarry` run
both ways, applied on the same lossless `takeResource`→`bankResource` path carry conserves on, over the 383
adjacency table via a new `nearLinkEdge` — so it deepens the diverging-piles story (348/377) without a new
spine. All 6 criteria PASS (6 unit + 2 e2e): conserved, cap-safe, and a nothing-to-trade meet is a clean
no-op. The one real hazard was caught and fixed in-fire: the first ambient scan mistook an *arriving crosser*
(parked a frame at the entry tile) for a meet and barter'd back the resource it had just carried, red-lining
`cycle-077-carry`. The Coder gated the scan to dinos *lingering* at the literal edge column (`band=0`,
`EDGE_DWELL=2`) so a transiting crosser can never trigger it — carry conservation restored, and a
`__maybeBarter` hook makes the ambient path deterministically testable. No bond change (economic beat only —
the social ripple stays the Lore-smith's), no save change (per-zone piles already persist).

## Disposition

Both tracks APPROVED → cycle 87 closes; `phase = "lore-pending"`, Lore-smith bumps to 88 next run.
Full run: **917 unit green (+15)**, e2e **276/277** (`cycle-081-directed-carry` = the catalogued
cold-boot/parallel-load flake, green isolated/warm; it does not touch this diff). New specs green in the full
run. `@mlc-ai/web-llm` still only under `game/src/ai/`. No save change either track.
