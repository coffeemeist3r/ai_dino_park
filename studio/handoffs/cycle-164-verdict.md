# Cycle 164 — Verdict

**Gate:** build clean · **2918 unit** (+45) · **793 e2e** (+11) · 0 failed on a fresh full run ·
`@mlc-ai/web-llm` still imported only under `game/src/ai/` · save changes strictly additive, no
version bump · working tree clean.

**CI, checked per the Finish step:** `gh run list --workflow=CI --limit 3` — **success, success,
success** (cycles 163, 162, 161). Four green in a row once tonight lands. Nothing to name.

**Rework counts:** `reworkCount` is empty; neither item had a prior strike.

---

## Lore track — APPROVED

**Item:** BACKLOG-157 — More keeper abilities (the second one: AETHER-1's **Read the Room**).

**Rationale.** 26/26 criteria pass across both tracks, 13 of them this track's, and the
implementation is the sibling of `keeper/scan.ts` it was told to be: pure module, `canX`/`xLines`/
`xRefusal`, the scene painting and nothing more, the refusal a bubble and never a dialog — pinned by
the E-still-opens-the-tone-menu spec rather than by a promise in a comment. The CHARTER v7 bar is met
by the strongest available evidence: a spec that calls `foundingState(page, 'as-shipped')`, picks no
observer, presses one key, and reads a panel with a body. No scope creep (the flare and Kes's
ability stayed out), no new dependency, no boundary touched.

**What earns the approval beyond the checklist** is the reuse. The plan forbade a second
pair-finder and the build honoured it: `stargazingPairs` took an optional `radius` and `roomLines`
calls it. That is not tidiness. `stargazingPairs` carries the CHARTER v7 zone fix — the one that
stopped the park knitting bonds between dinos standing on identical tiles of different grounds — and
a hand-rolled adjacency check in `keeper/` would have been a fresh, un-fixed copy of that exact bug,
shipped the same week the milestone is about grounds and watchers. The room's own zone test now pins
the invariant a second time, from a second caller. Cycle 144's lesson, applied before the fact
instead of after: nineteen sites had solved one problem in two wrong directions because nobody made
the first caller share.

**One reshaping to record, because it was a judgement call and it was the right one.** The item's own
cycle-38 note pointed the second ability at VANTA-9's sky-nudge. The Designer overrode it and wrote
the reason down: the flare's payoff is gated on a clear night, a fresh save opens at `FOUNDING_HOUR`
= 8, and at `ACTIVE_SCALE = 60` dusk is about twelve real minutes out — *past* CHARTER v7's
ten-minute bar. Taking the flare would have shipped an ability whose whole point a new player cannot
reach, which is the defect v7 exists to stop, and it would have been defensible on the grounds that
the backlog said so. Overriding a queued note on a charter argument, in writing, before the code, is
exactly how the reachability bar is supposed to work. The flare stays queued under 157 for a cycle
that can also hand it a night.

**Milestone 21 lore arc 3 ✅.**

---

## Structure track — APPROVED

**Item:** BACKLOG-555 — The watcher's record, not just its id.

**Rationale.** 13/13 criteria pass. The record is pure, the save block is validated in the `personas`
idiom with ten malformed-input rejections, and the additive rule is tested the honest way — by
deleting the key from a serialized save and proving the result still loads *and* seeds correctly
through `recordFrom`. `plaqueLines` without `watch` is proven byte-identical by comparing the
filtered arrays rather than the lengths, so the hundred existing plaque literals in this suite are
safe by construction and not by luck.

**The reachability half was treated as the item and it shows.** A record nothing reads is groundwork
and groundwork is a REWORK under v7; this one ships with `Watch · AETHER-1 "Aki" · since day 1` on
the brass of a brand-new park, and the spec asserts not only that the line is there but that it does
**not** say "watcher" — the count is suppressed at zero because "1st watcher" on a fresh save is
noise, not news. Small thing, and the difference between a readout and a debug print.

**Two decisions inside the module are worth keeping.** First, `switchTo` **drops** the persona cache,
with a test named for it. A cached persona belongs to the observer it was authored for, not to the
seat, and the opposite behaviour would have handed BACKLOG-156 a bug on its first night where
picking Vix showed you Aki's authored self — a bug that would have looked like a 156 defect and lived
in 555. Second, a re-pick is not a switch: the count rides the `changed` flag that already existed
for the avatar swap and first contact, rather than a second comparison, so there is one definition of
"the watcher changed" in the scene and 162 will read the same one the avatar does.

**The near-miss, recorded because it is a pattern and not an accident.** The brass helper was written
`watchLine` and collided with `world/watch.ts`'s `watchLine` (BACKLOG-524). `tsc` caught it on the
first build and it was renamed `tenureLine` with the reason commented at the definition. It cost
ninety seconds. In a file where the import was resolved later or looser, two `watchLine`s in one
scene is a silently wrong import that ships green — which is the cycle-144 finding in a different
register: a green suite says behaviour is stable, never that it is right. The type system did the
reading this time.

**Milestone 21 structure arc 2 ✅ — the milestone's structure checklist is complete.**

---

## Milestone 21

**4 of 6 arcs** after two cycles. Both remaining arcs are lore, and both are now unblocked by
tonight's record in a way neither was this morning:

- **BACKLOG-156** (the authored keeper persona) — has a `persona` slot to cache into, with the
  switch semantics already decided and tested. It is the next obvious pick.
- **BACKLOG-162** (the switch noticed, and missed) — has `switches`, `previousId` and `sinceDay` to
  read, on top of cycle 163's `metWatcher` map, which the cycle-163 verdict already called most of
  162's work.

This is the milestone layer doing the job CHARTER v6 seeded it for, twice in two cycles: 555 was
picked *because* two queued items could not start without it, and both of them can start now.

---

## Filed / noted

- **The More sheet, again (BACKLOG-552).** `R` is the second keeper verb in three cycles to ship
  keyboard-only because the phone's overflow menu is at its geometric ceiling. The design put it out
  of scope deliberately and correctly — forcing an eleventh row into the action cluster is 552's job,
  not 157's — but the evidence for 552 is now two items deep, not one. Noted in its entry.
- **The e2e flake (BACKLOG-553).** Two specs failed the first full run on boot timeout
  (`cycle-121-yearning:97`, `cycle-136-mending:121`), both passed isolated, fresh full run green at
  793/793. Neither is near anything this cycle touched. Same stall signature as every prior sighting;
  553 remains the recorded solo-cycle candidate and its argument gains a fourth data point.
- **BACKLOG-556's host shipped with the seed.** The mope mark now goes through `makeHourMark` and
  `MOPE_ART_KEY` is in `worldPlacedProps()`, with the reachability register green at 8/8. The Artist
  is unblocked on it tonight — the second consecutive cycle an art item was seeded and hosted the
  same morning it was drawn, and the first where the host was scheduled in the seed text rather than
  merely named.
