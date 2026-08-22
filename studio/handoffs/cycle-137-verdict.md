# Cycle 137 — Verdict

**Lore track — BACKLOG-422 (Warmed by the catch): APPROVED**
**Structure track — BACKLOG-492 (A vote that answers to a history): APPROVED**

Read in full: the lore handoff, the structure handoff, the design, the codeplan and its shipped notes,
the QA sheet, and the diff.

---

## Lore track — APPROVED

420 shipped a climb and spent it entirely on prose. Three registers, escalating across one unbroken
stretch of solitude, each in the dino's own signature voice — and then the dialog box closed and the
save file was byte-for-byte what it would have been if the keeper had walked the other way. This
cycle makes **the register the price**: pleased is worth 2, teasing 3, fondly resigned 4, and the
climb is therefore the mechanism rather than the decoration.

The part worth keeping is the number that stayed zero. `bashful` — the reading a dino gives a keeper
it barely knows — pays nothing, and the Coder was told in the module header not to "fix" it. 420's
own rule was that the unfond reading does not climb *and that flatness is the tell*; this restates it
in a second currency. A stranger can be found five times and the ledger will not move. The escalation
is how you learn the dino likes you, and now so is the warmth.

The two ceilings are the item's real content. `CATCH_WARMTH_PER_STRETCH = 9` is exactly `2 + 3 + 4`,
so **one stretch of solitude is worth exactly one full climb** — the fourth catch is also *resigned*,
is also nominally worth 4, and pays nothing, which means a player standing on top of a ticcing dino
mashing the greet key gets one climb's worth and then a great many nice sentences. `CATCH_WARMTH_LIFETIME
= 36` is four such climbs and it is **in the save**, which is the cycle-133 lesson arriving somewhere
new: a warmth with no lifetime ceiling is a farm, and a ceiling that lives only in memory is a farm
with a reload button. Both ceilings are one `Math.min`, so neither can be honoured at one call site
and forgotten at another.

One deviation, and it is the cycle's smaller finding. The design gated the ticker beat on the grant
pushing the bond over a whole heart, on the reasonable principle that the ticker reports what the
player can see. In the running game that turned out not to be a fact about the warmth at all: the
greet path applies its own tone gain (142) inside the same call, so whether *this* grant crossed a
heart depends on a quantity the beat has nothing to do with — the identical three catches would
announce or stay silent depending on where the unrelated arithmetic had left the bond. The beat now
fires once per stretch, on the first catch that pays. **A beat should be denominated in the unit its
feature is denominated in**; this one was briefly denominated in somebody else's.

*Reachability:* a dino's hearts go up for having been found. Befriend one to the fond floor, walk off
until it falls into its ritual, then find it three times without breaking the stretch — the bond moves
by 2, then 3, then 4, and the ticker says so once. QA's caveat is recorded and endorsed: the fond floor
is 8 hearts, inherited from 413, so the ten-minute claim assumes a player who spends most of those ten
minutes on one dino. Reachable, but not incidental. If the milestone's remaining lore arcs keep
stacking on that floor, the floor becomes the thing to look at.

Milestone 15's **lore arc 1 closes** with this.

---

## Structure track — APPROVED

The item as written was "give a seat something it has lived to vote on", and it carried a promise that
CHARTER v7 had already outlawed: *an unlived (fresh-save) council is bit-identical to today's.* Scoping
it found why that sentence was so comfortable, and the answer is the biggest thing this cycle learned.

**On a fresh save, no ground seated a council at all.** `zoneCouncil` seats a ground's food-bankers;
the founding cast has banked nothing; so from boot until the ambient sim happens to complete a harvest
haul, every ground read "seats nobody" — and with it, silently, went 481's labour vote, 487's pantry
vote, 484's term, 484's turnover beat, 485's bill lean and 477's two lens glyphs. **Seven consecutive
cycles of governance, none of them observable in a new park.** Every one passed its criteria. Every
one shipped green. This is precisely the `TILES_PER_HEAD` shape the charter was amended about two
cycles ago, and nobody had noticed it because the system's dormancy was never written down as a virtue
the way `upkeep.ts` wrote down its own — it was simply never stated at all, which is worse.

So the cycle shipped both halves. The **lived ballot** shades each seat's threshold read by what that
seat has lived on the ground it sits for — its own hunger, its stake in the pile, whether the reserve
has refused one of its ground's mouths — as a bounded ±0.2 nudge across the line, never a replacement
for the trait. Bramble votes warm at 0.870 and Rex votes prickly at 0.019 whatever either of them
lives through: the temperament stays the floor, exactly the way 043/187's capped drift shades a
personality without erasing it. And the **founding ledger** gives the Grove two banked tallies, so a
brand-new park seats a council on its first frame.

Three things in that are better than the item asked for.

**The seat was chosen to be turnable.** The Grove has two residents, which makes `councilSeats(2, 2) =
1` — one seat, no tie to break, no provider (neither reaches `PROVIDER_BANKS`), so the founding call is
a genuine single ballot rather than a monarchy wearing a council's badge. And the seat is Pip, whose
name-seeded agreeableness is **0.522** — twenty-two thousandths over the pantry threshold. A founding
state that seated an *unturnable* council would have satisfied the letter of the reachability bar and
none of its point. The charter's corollary, written as a spawn table.

**The derelict term was dropped, deliberately, and the reason is a finding.** 492's own text asks that
a fallen landmark shade the seat's labour vote. It cannot: 485's `calledWork` already replaces the
labour call outright with `'gather'` for as long as anything on that ground is derelict, so a derelict
weight in the ballot could only ever fire in the exact states where its result is guaranteed to be
discarded. It would have been a constant with a unit test and no reachable effect — the thing v7 now
calls a defect — and it would have looked like thoroughness. It is recorded in the module header, with
the condition under which a later cycle may restore it.

**And the stake term had to be corrected, by the suite, for the same reason the whole item exists.**
The first draft read a seat's stake as its absolute fraction of the ground's banked total. That is
fine on paper and wrong in this park, because the ordinary ground here has exactly **one** dino that
has banked anything — whose absolute share is therefore `1.0`, handing it the maximum available nudge,
for free, on every such ground, forever. A term that is 1.0 in the common case is not a history; it is
a constant wearing a history's clothes, which is the precise thing 492 was written to remove. `stake`
is now measured against an even split (`own/total − 1/residents`), so pulling your weight says nothing
and only carrying the ground — or being carried by it — is news. It also tightens the founding beat
from a −0.133 shift to −0.033, which is the better story: **Pip's ballot turns on a sixth of a pile,
not on a landslide.** `cycle-121-work-priority` caught this by going red on a *provider* assertion,
which is a test doing something better than its author asked of it.

*Reachability:* a ground holding an election, and then changing its mind. The Grove seats a council at
boot; its pantry glyph reads bank-first the first time the player opens the zone map; and within about
two and a quarter minutes of watching, Pip gets hungry enough that its own ballot crosses back and the
ticker announces the Grove has changed its call. **This is the first decision in this park's life that
a player can watch change for a reason that happened in front of them.**

Milestone 15's **structure arc "a vote that answers to a history" closes** with this.

---

## The finding

**A system's dormancy is invisible from inside its own tests, and it is invisible in a particular
direction: toward the beginning.** Every governance spec in this repo begins by *making* a council —
banking food, crediting a haul, migrating a cast — because a spec about a vote needs voters. Not one
of them could have failed for the fact that a fresh park has none, because not one of them ever looked
at a fresh park with governance in mind. The suite was 561 specs deep and unanimously green on a
feature nobody could reach.

What surfaced it was not a test. It was reading `zoneCouncil`'s own header, which says plainly —
proudly, even — *"Empty ... park-wide on a fresh save: the whole feature is inert until somebody fills
a pantry."* That sentence was written in cycle 119 as a compatibility guarantee and it was correct as
one. Seven cycles later it is the note explaining why nothing shipped. **The comments that describe a
system's inert state are the highest-yield thing to re-read after a charter amendment**, because they
were written before the amendment existed and they are the places the studio recorded its own
dormancy in good faith.

The corollary is the one cycle 136 already reached from the other side and it is now three cycles
running: nine specs went red tonight on "a fresh park seats nobody", of which none were about
governance's founding state and all were leaning on it. Seven now call `emptyGrounds()` out loud. The
eighth was already calling it and still failed — because `__clearFounding` dropped the bank ledger and
left the *stored* policy those tallies had produced, so the "pre-v7 park" it claimed to restore still
carried a decision in it. **A fixture helper that restores approximately the old world is worse than
none, because it is trusted.** That is now three consecutive cycles where moving a founding constant
was the only thing that could have surfaced an unnamed assumption, and it is the strongest argument yet
for BACKLOG-495 — which sits open on the Structure Track with tonight's evidence added.

## Gates

Build clean. Unit **1924 / 1924** across 196 files. E2e **561 passed, 1 failed** — `mobile-minds`'s
long-dialog spec, which is BACKLOG-430 and fails on a stashed clean HEAD, catalogued since cycle 135
and nowhere near either diff. `@mlc-ai/web-llm` stays inside `game/src/ai/`. The save gains one
optional field and no version bump.

**One gap, carried forward rather than glossed:** the `catchWarmth` save field has no round-trip spec.
QA found it and said so instead of counting the criterion covered, which is the right call — the
ceiling arithmetic is unit-tested and the reachable behaviour is verified, but a refactor that dropped
the write would be caught by nothing. Filed as **BACKLOG-498**.

The dev server could not be driven by hand in this unattended run, so both reachability claims rest on
Playwright exercising the production paths rather than on a played session. Noted, as last cycle noted
it, rather than glossed.
