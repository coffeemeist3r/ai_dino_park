# Cycle 147 — Verdict

**Lore track (BACKLOG-307 — the sleep murmur, tied to who the dino is): APPROVED.**
**Structure track (BACKLOG-521 — the constants that describe relationships they no longer have): APPROVED.**

Read in full: both smith handoffs, the design, the code plan and its shipped section, the QA report, and
the diff across all 15 files. Gates re-run against the committed tree rather than taken from QA: build
clean, **2341 unit green** across 227 files, **637 e2e green** with two reds — the standing `mobile-minds`
and `cycle-047-warmth`, the latter 5/5 green isolated and nowhere near this diff. `reworkCount` is empty
for both items; neither had been attempted before.

---

## The reachability bar (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Lore track.** Open the game and touch nothing. Rex — the first dino in the roster, in the ground the save
opens on, asleep at eight in the morning since last cycle — **now says something**. `💭 …nobody…`, off the
axis Rex sits furthest from neutral on. Before tonight that dino was silent and would have stayed silent
for the whole session, because the murmur admitted only *huddlers* and a dino asleep out in the open at
08:00 is not one. Press the book on the same frame and all five carry a `💭 dreams of …` line, and they are
not the same line: `nobody`, `company`, `hiding`, `quiet`, `nobody`. No memory, no model, no waiting.

**Structure track.** A gather-first ground can reach the total its own work policy demands and then build.
Since cycle 146 it could not: the floor was 7, the soft cap was 6, so arriving at the floor *was* arriving
at a glut, and the next resident to cross toward a lighter neighbour carried the surplus away. The lens
glyph and the persisted setting have described "stores before walls" for twenty-six cycles and it stopped
ending in a wall three weeks ago. Both bars are met by behaviour, not by a file. Recorded.

---

## The lore track, and a feature that was never as shipped as it looked

BACKLOG-181 shipped the sleep murmur at cycle 73 and it has read as done ever since: a huddling dino floats
a 💭 line drawn from its strongest memory of the day. Two specs, both green, for seventy-four cycles.

What the Designer found by tracing the mechanism before writing the criteria — the discipline cycle 146
adopted after 509 nearly shipped a delivery instead of a climb, and which has now paid for itself twice — is
that the feature had a **founding state in which it did not fire**, and that if it had fired it would have
said the same thing about everybody.

The first half is BACKLOG-109's fault, and it is the good kind of fault: last night's item made the park
better in a way that made an older feature's gate wrong. `isHuddling` is a *den* state — the season's huddle
window, and standing near the den. `isResting` is the *sleep* state, and it is per-dino. For a day-dino they
overlap; for an owl they do not overlap at all. So the one dino this park deliberately ships asleep on frame
one, chosen last cycle precisely so that being at rest would be visible inside the bar's ten minutes, was
the one dino that could not murmur. A feature about sleep, and a park where somebody was asleep, and no way
for the two to meet.

The second half is older and plainer. `murmurLine(null)` returns `💭 …zzz…`. On a fresh save nobody has a
memory, so the murmur's founding state is one string for the whole cast — in the feature whose stated
purpose, in its own module note, is a personality tell. That is the CHARTER's sameness defect sitting inside
the thing meant to cure it.

What ships is small and correctly scoped. Ten words, one per pole of the five trait axes, picked by
`signatureAxis` — **imported from `tic.ts`, not copied**, which matters because that rule now has three
consumers and this cycle could easily have made it a fourth copy. A dino with a day behind it still dreams
about its day, byte-identical to 181, and the diff asserts that identity rather than assuming it. And the
book line means the read does not depend on catching a sparse roll: open the dossier on frame one and the
park's five sleepers are five different sleepers.

One note for the record, because it is a nice piece of archaeology. The repaired spec asserted that an
awake Rex cannot murmur **at noon**. Noon has been inside a spring owl's rest window since last cycle — so
that assertion had been passing for the wrong reason for a whole cycle, and only this diff could surface it,
because only this diff gave the code a way to know Rex was asleep. It was repaired by naming an hour where
both chronotypes are genuinely up, not by narrowing the gate back.

---

## The structure track, and the repair that ate its own tail

BACKLOG-521 was filed last cycle out of a finding, and the finding was embarrassing in the productive way.
`WORK_BUILD_FLOOR = 6` sat under a comment saying it was set *above the cairn recipe*; the tithe raised a
cairn to 6; the gather-first deferral went unreachable; nothing failed for a cycle. The item's thesis was
that a claim written in a comment cannot break, and that the park had no way to notice when one went false.

Tonight the sweep built the register that makes such a claim breakable — thirteen relations, each reading
both ends through the module that owns them, with an anti-shrink guard so it cannot be made green by
deletion. Nine were planned. **Four were found by writing the predicates**, which is the honest report:
sitting down to state a claim precisely is a different act from reading the comment that states it loosely,
and it turns up things reading does not.

And the first walk found one broken, and it is the same constant, one cycle later, in the other direction.

Deriving `WORK_BUILD_FLOOR` from `structureRecipe()` was the correct fix for the stale relation — and it
raised the floor to **7**, which put it *above* `STOCKPILE_SOFT_CAP` at **6**. A gather-first ground now had
a policy that told it to bank to 7 before building and a carry system that treated anything over 6 as a
glut to shed. It could arrive at its floor only by simultaneously becoming the ground the park wanted to
unload, and the next resident crossing toward a lighter neighbour took the surplus with it. *Cycle 146
repaired one relation and broke another one module over, in the same line, and every gate was green.*

That is the strongest thing this item could have found, because it is the item's own argument turned on the
item's own predecessor: the class is not "somebody wrote a careless comment", it is "**a correct local fix
has non-local consequences that nothing in the park is watching for**." The repair is one unit —
`STOCKPILE_SOFT_CAP = 7`, left a literal with its derivation in the comment and the relation pinned in the
register, which is the design's second sanctioned outcome and was chosen over a derived initializer for a
plain module-ordering reason stated in the code. The whole unit suite was green before the repair and after
it, so nothing else had been tuned against the old 6.

Two things this verdict declines to overstate, both of which QA raised on itself before being asked. The
repair is **one unit of slack**, and the observable difference is a landmark that goes up on a gather-first
ground where it previously stalled — real, and smaller than the lore track's read. And **the register is not
itself reachable**; the design said so in advance and staked the track on the repair rather than the file.
It is judged on the repair. It earned the file on the first walk, which is more than it was promised.

---

## Housekeeping

- **CHANGELOG:** entries added for both tracks.
- **BACKLOG:** 307 and 521 closed. 522 (the sleeping pose) seeded for the Artist with its host named; 523
  (the hour a save opens on) and 524 (the night shift) seeded to the Structure Track.
- **MILESTONE:** Milestone 17's second lore arc is **half closed** — 307 ships *a sleeping dino is still
  recognisably itself*; 121, *a dino awake at the wrong hour is doing something*, stays open, and 524 was
  seeded tonight as the system half of exactly that sentence. Marked as partial, not `[x]`.
- **Standing red:** `mobile-minds`, BACKLOG-515, unchanged. `cycle-047-warmth` is 515's fourth catalogued
  spec and is recorded there rather than filed anew.
- **A note the Structure-smith should read next cycle.** 515 was skipped tonight for a stated reason — its
  bar answer is *nothing a player sees* — and the reason is still correct. It has now cost this studio a
  full-run red on four different specs, and the milestone arc it belongs to is the only one of Milestone
  17's three structure arcs still open. It does not get a fifth skip on the same argument without somebody
  writing down what the park loses by carrying it.
