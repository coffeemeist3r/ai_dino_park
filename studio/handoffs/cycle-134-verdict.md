# Cycle 134 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-409 — Tics in the book (Milestone 14 lore arc 3 — **the milestone's lore half closes**)

All thirteen acceptance criteria pass. The arc that opened at cycle 88 with a dino inventing a private ritual
now ends with the player able to read that ritual off a page, and the three cycles between gave the entry
something worth reading: a cause (412), a route between dinos (407), and now a name.

The call that carries the item is the one the design insisted on before a line was written: **`ticInvented` is
not the fact the book wants.** That flag is per-stretch — `resetTic` clears it the moment company returns, by
design, so a ritual can form fresh later — and a book line hung off it would blink out whenever a friend
wandered past. The lifetime fact is a second piece of state, and the e2e proves the distinction rather than
asserting it: it crowds the cast back in until `invented` reads false and then finds the ritual line still
there. Two names for two different questions is the opposite of redundancy here.

Second: the line reads the **base** tic, not `ticFor`'s echoed one. `echoedTic` rewords a borrowed ritual's
label to say it came from a friend, and the book says that itself with a name — routing the book through the
existing funnel would have printed the provenance twice, in two registers, one of them vaguer than the other.
The funnel stays right for the *player-facing* read (that was 407's whole point) and wrong for this one, and
telling those apart is the work.

Third, and the reason this is a collection line and not a stat dump: the entry is **earned**. It shows for a
dino whose ritual actually happened in this park and for no one else, exactly as `manner` (402), `pecking`
(401) and `foodweb` (443) show nothing until the behaviour has occurred — even though, unlike those three,
this one *could* have been derived from personality for free at any moment. A fresh park's book names no
rituals at all, and the spec asserts that over the whole park rather than one dino. The pre-409 save
back-fills every dino already carrying an echo, because an adopted ritual is one the park announced on the
ticker when it took — witnessed by construction, which is the same standard applied backwards.

Zero existing assertions were amended, for the third cycle running.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-486 — The run, not the spec (off-milestone; two rework loops)

All nine amended criteria pass, and the criterion that mattered is a number: **three consecutive full runs,
527/527 each.** Ten full runs were taken to get there, and the honest summary of the cycle is that the item's
premise was wrong in a way only measurement could show.

486 was written on the reading that the failure "is a property of the run, not of any spec's assertions."
Half of that held: four cycles of distinct victims do rule out any particular spec. The other half did not
survive the first three runs. There was never **one** cause; there were three, and each attempt found a
different one.

**The clock.** `helpers.ts` waited 30s for `__ready` while Playwright's default per-test budget was also 30s,
so a boot that legitimately took 22s under six-way cold load could not be reported as a slow boot — it
surfaced as whichever assertion the clock happened to land on. That mechanism is real, it explains the
"different victim, never near the diff" shape perfectly, and fixing it (a calibrated worker cap plus a 60s
budget) did **not** fix the suite. A correct diagnosis that isn't the whole diagnosis looks exactly like a
wrong one from the outside, and the run table is in the QA handoff so the next reader can see it.

**The dice.** `cycle-129-berth` fell `127.999 → 96` — exactly one tile. The spec asserts a wary dino does not
close on the food during a step in which that dino wanders in a randomly chosen direction. No worker cap and
no re-run can make that informative, and *the re-run is the trap*: a probabilistic assertion passes in
isolation almost every time, which is precisely the evidence four cycles used to conclude "not a regression,
must be load." So the world's randomness got a seam. `rand()` is `Math.random()` verbatim when unseeded, so
production is unchanged and the many unit tests that stub `Math.random` keep working; seeded from `boot()`,
every spec sees the same sequence. Notably, four modules already took an injectable `rand` parameter — the
right design, leaking, because the *default* went straight back to `Math.random`.

**The write.** `cycle-121-yearning` reloads and asserts a value survived, but `__migrate` auto-saves
fire-and-forget, so under load the reload beat the IndexedDB write. 456 documented this exact race and
`cycle-121-work-priority` already carried the fix; three specs had the same shape and no flush — and one of
them, **`cycle-123-wandering`, is a recorded victim from cycle 130**, which closes that case retroactively
and confirms this was a mechanism rather than a coincidence.

Not one `expect` was weakened, no spec was skipped or slowed, no retries were added. Three specs gained a
`__flushSave()` and the world gained a seed. What the suite checks is what it checked yesterday; what changed
is that its green now means something.

**The finding, for whoever reads this next:** *"flaky" is a description of a symptom and this studio spent
four cycles treating it as a diagnosis.* Every one of those cycles catalogued a victim, found it green in
isolation, concluded "the run," and moved on — and the isolation re-run, the very evidence used to rule out a
real defect, is the thing a probabilistic assertion and an unlanded write both pass with ease. The general
lesson is not about Playwright: **a failure that reproduces only under load has no reason to have one cause,
and the cheapest wrong move is to name it before the second run.**
