# Cycle 140 — Structure Handoff

**Intent:** Make the constitution true. CHARTER v7's third change says in as many words that "every ground
the player can walk to has life on it at boot," and the roster that shipped alongside that sentence spreads
eight dinos as **5 bowl / 2 grove / 1 fernreach / 0 hollow / 0 ridge**. Two of five grounds are as empty
today as all four were before the amendment. Everything a ground can hold — a plot, a landmark, a pile, a
provider, a council, an upkeep bill, a mend errand — is inert on the Hollow and the Ridge from boot to
save-death, and the amendment that promised otherwise is the highest-authority document in the repo. This
is not a polish item: it is a claim in the constitution that a test can now be made to hold.

**Why this over 495 and 501.** Both are good, and both are *about* the founding state rather than *in* it —
495 gives specs a named fixture, 501 gives verdicts a machine-checked register. Each of them would, this
cycle, be written against a founding state that still has two dead grounds in it, and each would then need
editing the moment 500 lands. Fix the fact before building the two instruments that describe it. 501 in
particular gets materially easier once "every ground has a resident" is an invariant with a test rather
than a sentence.

**Collision check.** The Lore-smith's pick is BACKLOG-423 (tic-flavored voice), which lives in
`game/src/ai/` and the dialog frame. This item lives in the roster, `zoneChain()`, and the founding-state
specs. No overlap.

**Added to Structure Track:**
- BACKLOG-503 [core] The branch with nothing to choose — the Ridge is the only ground reached by a decision,
  and offers nothing the line cannot supply. Carries the operator's 2026-07-18 Idea Box nudge that cycle 106
  routed to this lane with the instruction to weigh it once 450 was built.
- BACKLOG-504 [core] The pile is a number in a menu — the park's oldest structural loop (285 → 328) is
  load-bearing in five systems and visible only as a line of text inside a lens.

Both are deliberately the *leftovers of 500*: once every ground has a body on it, the next two questions
are what that body is there **for** (503) and where the thing it carries actually **goes** (504).

**Chosen this cycle:** **BACKLOG-500** — the grounds nobody lives on. Give the roster a residency invariant
with a test that reads `zoneChain()` and asserts every ground has at least one resident, and seed whatever
residents that costs.

**The tension the Designer must resolve rather than paper over.** The bowl at five is the cast that the 460
last-one floor, the huddle and the food scramble were all tuned against. Moving a body off the bowl to fill
the Hollow is not free. Decide explicitly between a **rebalance of eight** (and re-check the bowl-count
assumptions that a drop to four disturbs) and a **slightly larger roster** (which costs nothing on the bowl
but adds two minds to every per-tick scan and every spec that counts the cast). Say which, and say why, in
the design.
