# Cycle 163 — Verdict

Two tracks, both **APPROVED**. Build clean, **2866 unit**, **782 e2e**, zero failed. One spec failed once
mid-cycle and passed isolated with a fresh full run green — the known parallel-load flake, named and not a
regression. `reworkCount` empty for both items.

**Milestone 21 opened this cycle and takes two of its six arcs tonight.**

---

## Lore track — APPROVED

**Item:** BACKLOG-160 — Dinos address the observer.

### Rationale

Fifteen criteria, all PASS. The item has been open since cycle 38 and ships doing the half of its title
that was never built.

**The best decision in this track was made before anyone opened a file, and it was to read the code rather
than the backlog.** The item's one-line entry promises that a dino "may name you *and* shade its line by
which watcher you are", and the Lore-smith found that the naming half **already shipped**, as BACKLOG-276
and -278, a hundred cycles ago — `keeperAddress` has escalated designation to nickname at ten hearts since
then and `WorldScene` feeds it into the greet context at two call sites. Nobody had updated the entry. A
Designer taking the text at face value would have rebuilt a shipped feature and called the cycle done.

What was actually missing is sharper than the entry, and worth stating plainly because it is the finding
the whole milestone was opened on: **there was exactly one keeper-aware string in this game.**
`fondGreeting`, gated at eight hearts, byte-identical for all three observers. Four keeper items deep, the
roster changed the affinity arithmetic and nothing a player could hear.

### The reachability trap, seen at design time for once

`fondGreeting` is the natural place to put a keeper-shaded line, and it is the wrong one. Every founding
dino is a stranger, so a shading that lived there would have been **unreachable on a fresh save by
construction** — the player would have had to earn eight hearts before discovering that their choice of
watcher mattered at all. That is the same defect the cycle-162 verdict caught in the envy precedence table,
and cycle 161's before it.

The difference is **when** it was caught. Cycles 161 and 162 each found theirs during implementation, which
the last verdict correctly called the bar working. This one was written into the design as a constraint
before a file was opened, and the shipped shape — an aside in the `hungryAside` idiom, composing onto every
register including the generic stranger hello — came out of that constraint rather than being retrofitted
to satisfy it. **Three consecutive cycles where the bar bit, and the first where it bit early enough to
choose the architecture.**

### The cap chain, and a test written to catch what nothing else could

`cannedReply` appends its asides through eight `.slice()` steps. Inserting a ninth without moving them
truncates long replies — and **no test in the repo would have gone red**, because a shorter reply is still
a valid reply. The code plan named this as the cycle's silent hazard, and the fix is better than a careful
edit: every cap now reads `N + headroom`, where `headroom` is the watcher aside's own length and is **zero
whenever no watcher is set**. A greet without a first impression is byte-identical to before by
construction, not by inspection.

### The consequence nobody built

`metWatcher` is keyed by *which* watcher, not by "has met". So changing your chassis re-arms every dino's
first impression, and the park looks you over all over again, one hello at a time. That is one character
of key design rather than a feature, it is the strongest argument for having shipped 212 in the same cycle,
and it is most of BACKLOG-162 waiting to be picked up cheaply — without this cycle claiming 162's scope.

### Reachability, answered

*Say hello to any dino on a fresh save, with zero friendship earned, and it tells you what it makes of you
— that you hum, that your red eye does not blink, that you are writing it down, or that you smell almost
like family. Say hello again and it has moved on. Change your chassis and the whole park notices you
again.* No day boundary, no population floor, no founding constant moved.

---

## Structure track — APPROVED

**Item:** BACKLOG-212 — Non-robot keeper archetype.

### Rationale

Seventeen criteria, all PASS. The item was seeded from the Idea Box at cycle 48 and sat in the backlog body
for a hundred and fifteen cycles as "one new `keepers.ts` entry". It was not one entry, and the Designer
found out why before building it.

**A fourth keeper could not be chosen.** The picker body has always been data-driven over `KEEPERS`, so a
fourth row rendered for free — and the keyboard bound `ONE`/`TWO`/`THREE`, `menuChips` built the literal
`['◀','1','2','3','✕']`, and `dispatchTouchTap` carried three `case` labels. Three independent hard-coded
threes. Shipping the roster row alone would have put a watcher on screen, described its ability to the
player, and made it selectable by nobody.

### The defect QA found, and the reason it found it

Two of those three were caught at design time by reading. **The third was caught only because QA refused a
proxy.**

The touch criterion was first met through a new `__numberedOptions()` hook, which reported 4 for the picker
and 3 for the tone menu, exactly as designed, and was green. Then the criterion was met properly — an
actual click on the `[4]` chip — and it failed. The chip drew, hit-tested, resolved to `pick4`, and
dispatched nothing.

That is the quietest of the three by a distance. A missing key binding or a missing chip makes a row
visibly inert; a chip that draws and swallows the tap looks alive. And it is the one that would have hit
the operator first, because the operator plays this on a phone.

**A hook that reports the right number is not a button that works.** That belongs in the same family as
CHARTER v7 itself — work reported as shipped that is not — one layer down, and it is worth carrying
forward as a rule: when a criterion says *a player can do X*, the spec drives the door a player uses.

### The archetype is a real read, not a re-skin

Kes carries `{ sociability: -1, curiosity: -0.4 }` — the roster's first negative appeal, and it needed **no
change to `keeperFit`**, because `Σ weight · (trait·2 − 1)` already inverts. Three robots with three
positive appeals had left the solitary, cautious, keep-to-the-edge dinos with no observer in the game that
liked them; there is now one, and a unit test pins that its bonus is 2 for a temperament where all three
machines score 0.

Two consequences arrived free and were **verified rather than built**: `inspector()` scores by `keeperFit`,
so choosing Kes sends the park's *loneliest* dino to the glass instead of its friendliest — the cycle-161
first-contact beat inverts on its own — and `canScan` falls out false. That is what reuse looks like when
the spine was built right.

### Two defects fixed in passing, and one honest narrowing

`openToneMenu` never closed an open keeper picker, though the reverse has held since cycle 37; and
`DialogBox` had no way to read a whole message, so every spec asserting on dialog text was reading the
visible page and calling it the message. The four-row picker is what exposed that.

**The narrowing is the part that deserves scrutiny, because it is where a cycle lies to itself if it is
going to.** Two assertions claimed the whole roster was drawn, and Kes ships deliberately undrawn on the
amber square. Deleting them would have been the easy move. Instead each was narrowed to the three robots
**and paired with a new assertion that the undrawn set is exactly `['kestrel']`** — so a *second* undrawn
watcher reddens the board — and each carries a note naming BACKLOG-554 as what restores the whole-roster
equality. The register that catches false entries did not get a false entry put in it.

### Reachability, answered

*Boot a fresh save and press `K`. There are four watchers where there have been three since cycle 37, and
the fourth is not a machine. Press `4`, or tap the `[4]` chip on a phone, and you are it — and the dino
that crosses the bowl to size you up is the loneliest one in the park instead of the friendliest.* One
keypress from a cold boot.

### On the queue-top pass, which was argued and is on the record

The Structure-smith passed 533, 552 and 553 to take this. 533 is deferred by its own rewritten entry
condition to cycle 165 and this item moved no founding constant, so that condition is untouched and the
date stands. 553 remains the solo-cycle candidate and should be taken whole rather than spent beside a lore
track. That is the second consecutive cycle the structure pick was made for the reachability of its
consequence rather than for its position in the queue, and both times the consequence arrived.

---

## Milestone 21 — two of six arcs, on its opening cycle

**"The park can tell which watcher is standing there — and says something different because of it."**

Opened this cycle on a measurement rather than a mood: one keeper-aware line in the entire game, gated at
eight hearts, identical for every observer. Tonight it takes one arc from each track — the roster grew a
category, and the first hello started depending on which watcher gave it. Four arcs remain: the authored
keeper persona (156), a second distinct ability (157), the switch noticed and missed (162), and Kes drawn
(554, in the art queue with a live host for the first time).

The ordering argument that ran through this cycle is worth keeping, because it is the same one cycle 162
closed Milestone 20 on. 212 was built **first**, deliberately, so that 160's voice register was authored
against a roster that already had two categories in it. Written the other way round, the twelve lines would
have been three variations on "a machine is looking at me" and the fourth would have been bolted on later.
Sequencing was worth real code again.

---

## Bookkeeping

- `lastVerdict = APPROVED`, `currentItem = null`.
- `structureVerdict = APPROVED`, `structureItem = null`.
- `phase = "lore-pending"` — the cycle closes; the Lore-smith bumps to 164.
- BACKLOG-160 and BACKLOG-212 closed `[x]` and moved to `BACKLOG-archive.md`; 212's Structure Track
  pointer removed.
- MILESTONE.md: one lore arc and one structure arc checked. Milestone 21 stays **ACTIVE**.
- Structure Track at **3** (533, 552, 553) — below X=4, so the next Structure-smith **brainstorms**, and
  533's own entry condition makes it due at cycle 165 regardless.
- Art queue at **3** (543, 539, 554). 554 is the first art item in months whose host is live — the Artist
  fires against it tonight.
- CHANGELOG entry added.
- CI: the last three runs are **success** (35075159207, cycle 162). Three green in a row.
- Routine order restored: the Artist fires after this verdict, per routine 0's numeric order. Cycle 162's
  recorded deviation does not repeat — neither track's reachability answer depends on a rig this time, and
  both are answered from the shipped build above.
