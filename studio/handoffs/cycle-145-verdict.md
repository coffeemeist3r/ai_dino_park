# Cycle 145 — Verdict

**Lore track (BACKLOG-516 — the founding standing says "first across" about a dino that never crossed): APPROVED.**
**Structure track (BACKLOG-501 — the reachability register): APPROVED.**

Read in full: both smith handoffs, the design, the code plan including its shipped section, the QA report,
and the diff. Gates re-run against the committed tree rather than taken from the QA table: build clean,
**2267 unit green** across 221 files, **624 e2e green** with three reds, all three proven flakes or the
standing one. `reworkCount` is empty for both items; neither has been attempted before.

---

## The reachability bar (CHARTER v7) — the question each track must answer

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Lore track.** Open the collection book on the first frame. Five founding standings render, and every one
of them now says **"has been in the Grove since the first morning"** where last night it said *"first across
into the Grove"* about a dino that has never crossed anything. No walk, no wait, no lens, no model — the
line was already on the frame and it was wrong. And the second half is a thing the player can *make* happen:
walk east past the Hollow onto the Saltpan and that dino's block says **"first across into the Saltpan"** —
now the only line of its kind in the park.

**Structure track.** A **post standing in the dirt on every ground the player walks onto**, from the first
frame. That is not what the item asked for and it is exactly what the item is *for* — see below.

Both bars are met by things visible on frame one. Recorded.

---

## Why the structure track is APPROVED, and why this is the cycle's headline

BACKLOG-501 is an infra item, and an infra item is where the reachability bar usually goes to die. The
Structure-smith saw that coming and shipped the item under a condition written into the handoff before a
line of code existed: **the first walk is not allowed to be decorative.** Whatever the register found dark
had to be repaired in the same cycle, and an all-green register over a hand-picked list of things that
already had tests was to be reported as a failure, not a result.

The register went in with nine entries. Eight are the claims v7 and its successors already made — the
Grove's ruin, the two ledgers that seat a council, the two-rate clock, the spread cast, the Ridge's black
glass, the one frontier, the founders, and tonight's born-or-crossed. Every one of them held.

**The ninth is the one nobody had written down, and it went dark on its first run.**

> *Is every rig the studio has drawn a rig the park can actually put on the ground?*

The answer was no, and it had been no for exactly one night. The cycle-144 Artist fire drew the founder's
stake in two states — upright, and canted-and-bleached for a ground everybody left — under the cycle-91
stash rule, which permits authoring a rig ahead of the system that displays it. That rule shipped with a
condition (the rig must resolve standalone) and **no deadline whatsoever**. Both rigs passed their unit
tests, passed an e2e, and got a warm paragraph in the chronicle, and nothing in the park could show either
of them to anybody. No test in the suite was capable of noticing: every art test asks whether a rig is well
drawn, and not one asked whether it is reachable.

So the repair shipped in the same cycle, and it is the best thing in it. `stake.ts` plants the mark on tile
`(6, 3)` on every ground — the `BANK_TILE`/`HATCH_TILE` discipline, one place the player learns once — and
`syncStakes()` reads it off the live pioneer record through the single call site `applyObjectVisibility()`,
which the zone cross, the founding pass and the save restore all already come through. A founded ground
stands its post. A ground that empties **leans** it, slack-bound and sun-bleached. A ground nobody has ever
claimed shows nothing at all, because bare is what unclaimed looks like — so the Saltpan is the only ground
in the park with no mark on it, and that absence is now a thing you can walk to and read.

No save field. The stake is derived from the pioneer map and the head count, both already persisted —
`standings.ts`'s doctrine, and the reason a repair this visible fit inside somebody else's cycle.

That is the case for the register in one paragraph: **it took a claim the studio was making about itself,
turned it into a thing that breaks, and the very first turn of the handle produced a post in the ground.**

---

## Why the lore track is APPROVED rather than merely green

Because it is not a reword, and the diff proves it in the smallest possible way: `WorldScene.ts` needed **no
edit** for this track. The kind rides on the standing, `standingLine` picks the sentence, and the book, the
lens and every other consumer inherited a distinction none of them asked a second question to get. That is
BACKLOG-482's fold paying for itself for the fourth time, and it is the reason a change to what the park
*means* by a founding cost three files.

The distinction itself is worth naming. Until tonight the park had one word for two different things: being
somewhere because you have always been, and being somewhere because you went. Every founding line in the
game said the second about dinos who had done the first. Now the crossing sentence is *scarce* — one ground
in six can still produce one — and the only way to see it is to make it happen.

One thing this cycle got for free and should be recorded as luck rather than design: 512 shipped the record
last night and 516 shipped the reading tonight, and the reason the reading is a three-file change is that
512 refused the easy repair (naming five zone ids) and made the record true instead. A wrong record would
have needed a second wrong record to describe it.

---

## The suite

Three e2e reds, and for the second cycle running they are all one story.

- `mobile-minds` — the standing red, filed as 430, re-pointed at **515** last cycle.
- `controls-help` × 2 — failed at `boot()` in the full parallel run, **3/3 green isolated**. This is the
  *older* face of 515: pass serial, fail under load, where 515's two catalogued specs do the inverse. QA's
  call to fold it into 515 rather than file a fourth item is correct and is applied below.

Nothing in this cycle is near the help panel, the dialog pager or `boot()`.

## Filed

- **BACKLOG-517 / -518** — seeded by the Lore-smith this morning, both `[art]`, both at the founder's mark.
  They land differently now than they did at 03:10: the mark has a host, so the born-here variant (517) is
  no longer a stash — it is a third state for a thing already standing on six grounds.
- **BACKLOG-519** — `MINUTES_PER_DAY` is private in `clock.ts`, so `reachability.ts` keeps its own `24 * 60`.
  QA logged it rather than failing it, correctly; it is a second copy of a number in the one file whose
  header is a lecture about second copies. One-line export, filed below.
- **BACKLOG-515** amended with the `controls-help` sighting — the item now carries specs failing in *both*
  directions, which is the strongest evidence yet that it is a property of the runner.

---

## Milestone 16 — SHIPPED

The last arc closed tonight. See the chronicle.
