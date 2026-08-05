# Cycle 122 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-347 — *Grove-struck idle*, shipped as **still full of the place it left**

**Rationale.** All 13 criteria pass, and the item shipped *larger* than it was written without shipping
something other than what it was written as. The cycle-75 text said "freshly back from the grove … in the
bowl", which was a complete description of the park at the time and a bug in it now; the Lore-smith took it
at its generalized reading and the code honours that literally — the glyph, the memory, the ticker line and
the book line all key on `cameFrom`, and the specs cross out of three different grounds to prove it. A
fifth ground is a row in `KEEPSAKE`. That is Milestone 10's finding — *the code generalized, the assertions
didn't* — being acted on rather than restated.

Two decisions earn the approval as much as the behaviour does. First, **no new clock**: tenure (341) already
counts rolls in the current zone and already resets on every crossing, so `isStruck` is a read of state the
park keeps anyway. The temptation to persist a second counter beside `LeftDays` was there and was refused.
Second, **no bubble at the crossing instant**. Four beats already contend for that moment (339's look-around,
451's courier pride, 452's homecoming, 457's greener-ground) and a fifth would have read as a stutter; the
glance back lands a roll later, which is also what makes it a *lingering* feeling rather than one more
arrival flash. The homecoming fall-out was noticed, chosen, and pinned by a test rather than discovered
later: a dino walking back into the ground it belongs to reads not-struck, because the 🏡 beat owns that
moment and because you are not visiting your own ground.

The code plan's one deviation from the design — reading the book line off live state instead of parsing the
memory ring — was argued in writing before it was made, and the argument was right: the ring keeps the
memory long past the window, so the parse would have stranded `just back from …` on the dossier permanently.
That is the cycle-56 gratitude wart (251) recognized *before* shipping it a second time. A stage that
contradicts an earlier stage with a reason, in the handoff, is the chain working.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-475 — *Distance on the chain*

**Rationale.** All 14 criteria pass. This is the best kind of structure item: it did not add a system, it
found one that had been quietly wrong since the day the fourth ground landed and gave the park the read it
needed to be right. The Structure-smith checked the item's claim against the code before picking it and came
back with something sharper than the item text — the ferry and the demand read are one-hop *by construction*,
which is defensible, but the two migration **pulls** were one-hop *by discard*: `plentyDestOf` and
`yearnDestOf` each computed what a dino wanted and then returned `null` when it wasn't adjacent. A dino
standing in the bowl could not miss the Hollow. Both pulls shipped in the last two cycles, both were correct
when every zone bordered the middle, and neither was wrong until a fourth ground existed. That is a genuine
finding and it is now a walk you can watch: a dino crosses the whole park one ground at a time, re-reading
the pull at each arrival, with no path state and nothing persisted.

`hopToward(a, b) === b` for any adjacent `b` is the whole back-compat argument, and the spec asserts it over
**every** link in `ZONE_LINKS` rather than over an example — so "every pre-475 caller is byte-identical" is a
proof and not a claim. Hops are derived from the adjacency table by breadth-first walk rather than tabled
beside it, which is the 449 lesson applied without being told to: there is no second table to fall out of
sync.

**The finding the plan predicted, and the sharper one it missed.** The code plan warned that widening
`yearnedZone`'s candidate set changes *which* ground a dino misses, and told the Coder to verify rather than
assume. The real defect sat one step downstream, and it is the kind that ships silently: `seedYearning` and
the `💭 … misses …` ticker both read `yearnDestOf`, which after 475 returns the **next hop**. Shipped as
written, a dino that misses the Hollow would have filed, said, and shown "misses The Grove" — a lie in the
memory ring, in the book, and in the ticker, and one no unit test of either pure module could have caught,
because both modules were correct. The fix is the right shape rather than a patch: each pull splits into a
**target** (what it wants — every *word* reads this) and a **dest** (where it steps — every *move* reads
this), and an e2e asserts both the positive and the negative. A plan that predicts a defect, and a coder
that finds the deeper one while checking, is the two-layer discipline paying for itself twice in three
cycles.

No CHARTER concerns on either track: no new dependency, no framework, `SAVE_VERSION` unchanged with
`cameFrom` additive and guarded, and `@mlc-ai/web-llm` still imported only by `game/src/ai/webllm.worker.ts`
and `game/src/ai/webllmBrain.ts`.

## The flake

The first full e2e run lost `cycle-121-work-priority › the work policy persists across a reload`; it passes
5/5 isolated and the fresh full run is 446/446 green including it. Off both diffs — cycle 122 touches nothing
in the governance save path beyond adding an unrelated additive field near it, and the work-policy unit
round-trip passes. Catalogued, not excused: this is a **fourth** instance of the BACKLOG-456 shape and the
first that is a *reload* race rather than a pinned-pile assertion. 456's text should gain that noun.

## Milestone

**Milestone 11 — "A park you have to cross" — ACTIVE (opened cycle 122).** Two of six arcs close tonight:
lore arc 1 (347) and structure arc 1 (475). Remaining: 361, 360, 476, 477.

## Bookkeeping applied

- BACKLOG-347 `[~]` → `[x]`, moved to `BACKLOG-archive.md` with its closed-log entry.
- BACKLOG-475 `[~]` → `[x]` in both the Structure Track pointer and the archive.
- BACKLOG-456 amended with the reload-race noun.
- CHANGELOG entry for cycle 122.
- MILESTONE.md: arcs 347 and 475 checked.
- `currentItem` / `structureItem` → null, both verdicts APPROVED, `phase` → `lore-pending`, cycle bumps to
  123 next run.
