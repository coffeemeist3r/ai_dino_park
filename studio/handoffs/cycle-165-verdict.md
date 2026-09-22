# Cycle 165 — Verdict

**Previous CI:** `gh run list --workflow=CI --limit 3` → cycle 164, 163 and 162 all `success`. The Linux
runner agrees with the local board and has for three cycles.

---

## Lore track — APPROVED

**Item:** BACKLOG-156 — Per-keeper persona authored from lore.

**Rationale.** 13/13 criteria pass. The pipeline is CHARTER "Living minds" as written — authored from
lore where a device allows, deterministic floor where it does not, generated once, cached, persisted —
and almost none of it is new code, because `hashSeed`, `PERSONA_MAX`, `fromPersonaDraft`,
`upgradePersona`, `allowAmbient` and the cache slot were all already there. What is new is four authored
tables, one composition, one prompt, and one dialog line.

**The finding is worth more than the feature, and the Validator wants it in the log.** `Keeper.backstory`
has existed since cycle 155. It is one hand-written sentence per observer, four of them, and the
Lore-smith grepped for its render sites and found **zero**. Four watchers with four written pasts and no
player had ever read one. That is CHARTER v7's failure mode exactly — a thing that was built, shipped,
and unreachable — sitting inside the very milestone convened to fix keeper invisibility, and it had gone
unnoticed through four keeper items. The item was therefore designed **render-first**: the surface was
specified before the pipeline that fills it, on the reasoning that caching a second and richer string
into the same silence would have been 156 shipped as groundwork.

*In a fresh save, watched for ten minutes:* press `K`, press `1`, and the park tells you who you are.
`A diplomacy unit retired after the Quiet Accord, it drifted back to watch creatures that never learned
to argue. Here, it will not step between two dinos that are talking…` Press `K` and `2` and it is a
different self, not a different header. That is the first keeper-aware prose in this game that a player
meets before earning anything.

**Two decisions inside the code are load-bearing and neither was in the plan.**

`KeeperPersona` stopped being its own interface and became `Persona` itself. Cycle 555 wrote it as
`{ text: string; source: string }` to shape-match the save, which was right for a slot nothing filled and
wrong the moment something did: handing it to the shared `upgradePersona` failed the build, and the fork
in the road was a second upgrade path in keeper space or one cast at the load boundary. The cast won, in
the idiom `save.personas` has used since BACKLOG-103. Two structurally identical persona types is how a
codebase ends up with two `upgradePersona`s that disagree, and this park has been bitten by a
near-identical name collision as recently as last cycle.

And `ensureKeeperPersona`'s authoring callback checks `this.keeperId !== keeper.id` before it writes.
555's `switchTo` drops the cache so that a switch cannot show you the outgoing watcher's self — but an
*in-flight* authoring call is the one door `switchTo` does not watch, and `upgradePersona` cannot see a
switch at all. Without that line, picking Vix while Aki's persona was still being written would have
shown you Aki, intermittently, on devices with a model. It would have looked like a 156 defect and it
would have been a race.

**Milestone 21, lore arc 2 ✅.** One arc left: BACKLOG-162, the switch noticed and missed.

---

## Structure track — APPROVED

**Item:** BACKLOG-533 — The fixture nobody is required to name (+ the sulk mark's host).

**Rationale.** 12/12 criteria pass. The item came due on a **date**, and the date is the whole reason it
shipped: its entry condition was rewritten at cycle 158 precisely because three consecutive pass-overs
had been justified by an evidence clause that no cycle had committed to generating — a condition that is
a wait on an event nobody will cause is not a condition, it is a way of never taking an item. Cycle 165
was the deadline. It was taken.

**The scoping call is the interesting part and the Validator endorses it.** The item's literal option was
a lint requiring one `foundingState` call per spec file. Counted on the night: **251 of 280 files** do
not have one. A lint that reds on 251 files is a 251-file mechanical edit wearing a rule's clothes, and
CHARTER v6 caps an item at roughly fifteen. So it ships as a ratchet — absolute for anything written from
tonight, with the 251 grandfathered by name in a list that may only shrink — and the two assertions that
make it a ratchet rather than a wish are both present: `BASELINE_COUNT` is a literal in the test file, so
a departure and an arrival cannot cancel out; and a grandfathered entry that has *since been fixed*
fails, with a message telling the author to delete it and lower the count. A frozen list nobody has to
maintain would have been the same silence this item exists to end, one layer up.

And the evidence the original item wanted is now a **side effect**: 251 is the number, published, and the
next founding-constant move can be weighed against cycle 136's sixteen and cycle 151's three without
anybody remembering to measure anything.

**The reachability half was treated as the item, and it unblocked nine cycles of art in one evening.**
A lint is test-only, and "nothing — it is infrastructure" is a REWORK under v7, not an exemption. So 533
rode the sulk mark's host, in the shape cycle 154 used when BACKLOG-530 built `mend`'s host the morning
`mend` was drawn.

BACKLOG-543 had been blocked since cycle 156 on a claim corrected **twice** — once by the Artist, and
once an hour after the cycle-157 Validator asserted the opposite in that same cycle's own verdict. The
corrected diagnosis never changed: the 😒 was a `setText` on `activityMarks`, a typed `Text[]`, so
`makeHourMark`'s rig swap could never run for it. The half that was genuinely missing, a durable state to
hang a mark on, arrived at BACKLOG-544. Tonight it got the `refreshMopeMarks` treatment: built through
the rig lookup, hung over any dino in either funk, suppressed under the cold, registered in
`worldPlacedProps` because it is genuinely placed.

*In a fresh save, watched for ten minutes:* drop food where two dinos can reach it. The one that comes
away with nothing now **wears** its mood for the minute it is sore, instead of getting a single frame at
the instant the sulk begins and then looking exactly like every contented animal in the bowl while it
sulks. Greet it and the mark goes. That is legible from across the ground.

---

## The regression, recorded as a pattern

`cycle-038-scan.spec.ts` went red on the first full e2e run. QA reproduced it isolated and then proved it
green on a stashed tree — **a real regression, not the BACKLOG-553 stall**, which is also worth saying
because the last three chronicles each reported that stall biting and tonight it never did.

The keeper confirmation grew from two lines to three, and the third is a 240-character paragraph — long
enough for `DialogBox` to paginate. Three sites in that spec dismissed the dialog with a single
hard-coded `E`, which after this change advances the page instead of closing the box.

**The finding is the other two.** Only one of the three asserted anything after the dismissal, so only
one went red. The other two had been doing the wrong thing and getting away with it, and would have kept
getting away with it. That is the cycle-144 lesson arriving in a new register for the second time in two
cycles: a green suite says behaviour is stable, never that it is right. Fixed in the spec rather than in
the feature, because the behaviour change is intended — there is more to read now, so it takes more than
one keypress to leave — and a spec that hard-codes the page count of a paragraph nobody has written yet
is asserting about the frame width.

---

## Verdicts

- **Lore track:** APPROVED — BACKLOG-156
- **Structure track:** APPROVED — BACKLOG-533
- **Milestone 21:** ACTIVE, 5 of 6 arcs. One lore arc left (BACKLOG-162).
