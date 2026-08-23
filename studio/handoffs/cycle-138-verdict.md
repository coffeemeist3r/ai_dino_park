# Cycle 138 — Verdict

Both tracks **APPROVED**. Build clean, unit 1964/1964, e2e 568 pass / 2 fail (BACKLOG-430, red on a clean
HEAD, and one rotating parallel-load victim that was green isolated on both runs). The `@mlc-ai/web-llm`
boundary holds — three importers, all under `game/src/ai/`. Both save changes are additive and both are, for
the first time in this park's history, covered by a spec that fails when the parser drops a field.

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-421 — the ritual drifts

**Rationale.** Every acceptance criterion passes, and the cycle is worth more than its criteria because the
Designer refused the item's own premise. 421 was filed as "the anchor pins one tile"; the code says
otherwise — `ticAnchor` was set to wherever the wander had dropped the dino and thrown away by `resetTic`,
so a dino that had taken up its ritual six times on one ground had performed it in six unrelated places.
That is the *opposite* failure from the one filed and the same missing thing: a ritual with no memory of
where it happens is not a habit whether it never moves or moves at random. Shipping the item as written
would have made a wandering ritual stationary and called it progress.

What shipped instead is a **haunt** — one worn tile per (dino, ground) that the ritual returns to and that
steps one tile further along each stretch — and two rules that are the whole design. The haunt survives
`resetTic` where the anchor does not, which is the difference between a habit and a first stretch repeated
forever. And the drift is drawn from the dino's own name rather than `world/rng.ts`, because that stream is
global and seeded by the e2e: a path that reshuffles because another dino rolled a wander step is not a
path, and it would not survive a reload either.

The re-seat rule is the part that earns the reachability answer. A dino that falls into its ritual more than
six tiles from its haunt does not trek back; it lays a new one where it stands. Without that the feature
would read as a dino spending whole stretches walking, which is the failure mode a `ponytail:` note in
`tic.ts` now names against the day someone raises the constant.

**Reachability (CHARTER v7) — in a fresh save, watched for ten minutes, what is new?**

> A dino you watch take up its little ritual twice on the same ground performs it in a **different place**
> the second time, one tile along from the first, and comes back to *that* — rather than wherever it
> happened to be standing. Watch it long enough and the path visibly walks across the ground, and the park
> tells you so once: *"…'s little path has worn its way across the ground."* Solitary stretches are cheap
> since cycle 135 spread the cast over five grounds and 412 cut the onset to six steps for a stung dino, so
> the second stretch is minutes away, not hours. Reload and the park still knows where the paths are.

**Milestone:** lore arc 2 ("the ritual is a living habit") is **half done** — 421 ships the drift, 411 (the
warm trace a catch leaves) is the other half and stays open. The arc box stays unchecked; the honest read is
that this cycle did the larger half.

**One note for the record, not a defect:** the design's criterion names `hauntAnchor` and the code ships
`ticAnchorFor` — the codeplan's own name, carried forward correctly. QA flagged it rather than letting the
verdict discover it, which is the right instinct.

---

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-489 — the gate that was written for one door

**Rationale.** This item over-counted its own blast radius, and the Structure-smith read the source before
believing it. 489 names four freshness gates; **two exist in the shape it describes**. The once-a-day
discontent (471) already fires on its first record. The gratitude fade (251) is a ring-position window and
not a gate of this kind. The one-visit-per-sorrow (226) has never been built at all — `sympathyVisit` in
`cold.ts` carries a `ponytail:` comment saying exactly that, written in good faith by the cycle that
deferred it. An item that inventories the codebase from memory instead of from the codebase is a hazard
precisely because it reads as thorough; three of the four ports would have been fiction, and the third would
have been a port of nothing.

What is left is small and true: 481's work call and 487's spend call, keyed by ground, unable to tell "this
ground has never spoken" from "this authority has never spoken". `world/gates.ts` keeps 481's rule exactly
and asks it of the **cause** instead of the ordinal — an opening seating is silent because a council's first
word is a seating, not because it happens to be first. 485's hand-rolled `!seeding || lean === call` is
deleted; its behavior now falls out of the rules rather than sitting beside them.

**Reachability (CHARTER v7) — in a fresh save, watched for ten minutes, what is new?**

The design's own answer was wrong, and QA corrected it rather than passing the criterion on a technicality.
The proposed sequence (council speaks, *then* the ruin arrives) is unreachable on a fresh park: 488 ships the
Grove's ruin at boot, so the bill always speaks first, and a landmark falling later needs upkeep decay across
an in-game day boundary — the very "it fires on the day boundary" answer v7 rejects. The reachable sequence
is the same defect from the other end, and it is the better beat:

> Boot. The Grove's walls are coming down and its bill says so. You walk a resident over and **mend the
> founding ruin** — 488's errand, the first structure a new player ever inspects. The bill falls silent, the
> ground goes back to deciding for itself, and its council calls it: *"fills its stores first."* **That is
> the same call the bill made**, which is why the pre-489 park said nothing at all: the value had not
> changed. A player watched an emergency end and was never told who was in charge afterward.

`cycle-138-billcall.spec.ts` asserts the exact string, so the *reason* the line used to be swallowed — two
authorities agreeing — is recorded in the spec rather than in a handoff nobody re-runs. Zero council lines
before the mend, exactly one after, nothing on the step following.

### The defect this cycle found, and the one it fixed for good

`catchWarmth` — shipped **last night**, BACKLOG-422's lifetime ceiling, the number whose entire purpose is
to stop being-found becoming farmable — was declared in `SaveData`, written by the scene, and **never parsed
by `parseSave`**. Every reload refunded it. Nothing failed, no suite went red, and the cycle that shipped it
recorded 21/21 criteria pass.

The remarkable part is that the studio had already written down that this would happen. Cycle 137's QA found
that the field had no round-trip spec, declined to count the criterion covered, and filed **BACKLOG-498** —
*"a field whose entire purpose is to survive a reload, and which is unobservable until somebody reloads, is
exactly the one that will be dropped by a refactor and caught by nothing."* It was already dropped. The
prediction was not about a future field; it was an unwitting description of the one in front of it.

So the repair is not a parse block (though it is that too). `tests/unit/cycle-138-save-coverage.test.ts`
reads the `SaveData` interface out of the source and asserts every key it declares appears in what the parser
hands back. QA verified the guard is not decorative by deleting `catchWarmth` from the return literal and
re-running: two tests fail. **BACKLOG-498 is closed by this**, one cycle after it was filed, by the failure
it was filed about.

**Milestone:** structure arc 3 ("a gate that does not silence its next cause") is **done**. All three
structure arcs of Milestone 15 are now closed. The milestone stays ACTIVE on its lore side (two of three
arcs open).

**Filed:** BACKLOG-499 — every governance beat in the park has been printing *"the The Grove's council calls
it"* since 481, because the ground's display name carries its own article and the template prepends another.
Six templates interpolate a zone name; the fix is one decision made once, not a `slice` at the loudest call
site, which is how the second article got there. Cosmetic, pre-existing, and — since 488 and 492 made a
ground speak in the first step of a fresh save — now visible immediately. Found by QA reading the exact
string a spec asserts, which is an argument for specs that assert strings.
