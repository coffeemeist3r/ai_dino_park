# Cycle 139 — Verdict

**Lore track: APPROVED. Structure track: APPROVED.**

Build clean. Unit **1997 passed / 2 skipped**. E2E **579 passed / 1 failed** — BACKLOG-430's long-dialog
spec, red on a clean HEAD and off both diffs. 24/24 acceptance criteria pass. The brain boundary holds
(`@mlc-ai/web-llm` appears nowhere outside `game/src/ai/`). Save changes are additive on the `!save` branch
only; no version bump.

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-411 — glad of the company

**Rationale.** Fifty cycles of the tic went into making its *start* legible — idleness, a solitary day, a
friendless ground, a fresh sting, a departed friend — and one ending got a beat: the keeper walking up. The
commoner ending, another dino wandering into range, went straight through `resetTic` and left nothing. Now
it leaves a float, a memory that names both the ritual and whoever walked up, a ticker line, and a
short-lived trace the dino leads its next greeting with. Every decision is a pure exported function with
unit coverage, and the scene only wires.

Two things make the verdict comfortable rather than merely satisfied. The first is that `companyNear` was
**refactored** into `nearestCompany` rather than a second scan being written beside it, so the beat and the
solitude rule are physically incapable of disagreeing about who was standing there — this codebase has
caught that exact class of bug four times and this is the first cycle that pre-empted it. The second is the
ordering: the keeper's catch outranks the trace *structurally* (one ternary, one prefix or the other or
neither), and the spec asserts the harder half — a catch takes the line and leaves the trace unspent.

**Reachability (CHARTER v7).** *In a fresh save, watched for ten minutes:* the Park News ticker carries a
line the park has never printed — `🤗 Pip came over while Bramble was at its ritual` — and greeting Bramble
after it opens with a sentence Bramble has never said. Nothing is gated on friendship, on a bond floor, or
on a day boundary; the founding cast wanders freely across five grounds and a solitary stretch costs as
little as six steps, so this is among the most frequent events in the park rather than a rare one.

---

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-497 — the council nobody can convene

**Rationale.** The item was filed as documentation and a test, which under CHARTER v7 is a track that ships
nothing a player can see. Reading the constants against the shipping roster is what turned it into a cycle:
`GOVERNANCE_OBSERVABLE_AT` says out loud that a council needs **two** seats to be more than the provider
role in a different badge, and the founding park seated exactly one, on one ground, in the Grove. Everything
487 built on top — the majority arithmetic, the tie-break, a call that can split — was as far out of reach on
a fresh save as the whole of governance had been before 492 patched the Grove by hand. The bowl now carries a
ledger too, and the seam that states the claim is checked by a test that walks it.

The seam is in the right place, and there is evidence rather than an assertion: **`WorldScene` gained no new
call site for this track.** The two loops that already iterate `FOUNDING_BANKED` — the `!save` seed and
`__clearFounding` — picked the second ground up for free, which is exactly what the code plan said would
distinguish a seam from a patch.

**Reachability (CHARTER v7).** *In a fresh save, watched for ten minutes:* before the player has walked
anywhere, the zone lens shows the ground they are standing on seating **two** voices where it has always
shown none, the collection book gives Sunny and Glade a standing they have never held (*one of the Pocket
Cretaceous's 2 voices*), and that ground's pantry policy is decided rather than absent. Pinned in the
running game by `cycle-139-quorum.spec.ts`, not only in data.

**The finding worth recording.** Seven e2e specs across five files went red, all on one cause — the ground
the player spawns on now has politics from the first frame — and **every one of them was asserting the
defect**: "a young park has no policy", "the bowl raises a granary the instant the pile allows". That is
the third consecutive cycle in which moving a founding constant was the only thing that revealed what the
suite was actually claiming, which is BACKLOG-495's entire argument, now with a third data point attached.
The repair was the fixture 495's groundwork already provided (`emptyGrounds`, named in each spec's header),
and the one spec in that set whose subject genuinely *is* the founding state deliberately does not call it.

**The by-product.** `foundingCouncils()` now states plainly that the Hollow and the Sunward Ridge seat `[]`,
because nobody lives on them — two of five grounds, against CHARTER v7's own text that says every ground the
player can walk to has life on it at boot. That is BACKLOG-500, seeded this cycle by the Structure-smith
before the code was written and now carrying its own evidence.

---

## Milestone bookkeeping

**Milestone 15 lore arc 2 — "The ritual is a living habit" — ✅ complete.** 421 shipped the drift last
cycle; 411 was the open half (the warm trace), and it is closed. All three structure arcs closed in cycle
138. **One arc remains: lore arc 3 (BACKLOG-423, the ritual colours the voice.)** The milestone does not
ship tonight — it ships when 423 does, and 423 is now the obvious next-up.
