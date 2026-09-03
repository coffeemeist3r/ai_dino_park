# Cycle 149 — Verdict

**Gates:** build clean, **2411 unit green** across 231 files, **653/653 e2e** on a fresh full run.
**Milestone 17 SHIPPED** — its last open arc closed tonight.

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-121 — Keeper-shaped routine (the vigil at the hatch)

**Rationale.** The arc had named its own debt after cycle 148 and named it precisely: *an owl doing something
a day-dino would not, rather than the same behaviour under a different sky.* This pays it, and it pays it in
the shape the arc asked for rather than the shape that would have been easier to write. The candidate filter
is one clause — `!isResting(d)` — so who keeps the vigil is decided by the hour and never by a trait, and
`grep "'owl'"` over the whole lore track hits two comments saying not to add one. At the founding hour the
Bowl's vigil is Glade because Rex is the Bowl's owl and is down; in the middle of the night it is Rex,
because he is the only Bowl resident who *can* be standing there. Both reads are asserted through the
production functions, at hours the spec *finds* rather than names.

**The reshaping is the reason this ships at all, and it deserves recording.** The item as filed gates on *a
very-high-friendship dino* and on a learned hour. A fresh save has an empty friendship book and no visit
history, so obeyed literally this item would have shipped a system that switches on some hours after CHARTER
v7's bar stops watching — invisible work, of exactly the kind v7 was written to stop, and the studio would
have had a green cycle to show for it. Two moves fixed it, both derived rather than asserted: friendship
**grades** the vigil instead of gating it (fondest waking dino, name order when nobody is fond yet), and the
founding save records **the boot itself** as a prior visit, taken from the hour the park is actually opened
at. No hour literal exists anywhere in the path. The item's soul survives intact — come back at an hour you
have never come back at and the hatch is empty, which is the difference between anticipation and a greeting,
and it is pinned by its own e2e test.

**One genuine regression, caught by the full suite and fixed at the root.** `cycle-039-inspect` went red: the
observer-switch beat draws its best-fit dino across the bowl, and the vigil turned that dino around and
walked it to the hatch. The lazy repair was one exclusion for the inspection. What shipped is an `onErrand()`
read over all four existing hand-walked errands, checked at dispatch *and* every step, because the vigil is
the first errand in this scene that can collide with the others at all — the earlier four each select a dino
by a condition no other one shares, and the vigil selects *whoever is awake*, which is everybody.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-523 — The hour a save opens on

**Rationale.** The dodge available here was to rename `8` to `FOUNDING_HOUR`, ship, and call the constant
owned. The design named that dodge in advance and refused it: this number is written down *once*, so 519's
fix does not apply, and what it lacked was not a name but a **claim**. It has one now —
`castSplitAt(FOUNDING_HOUR)`, routed through `foundingResidents`/`chronotypeOf`/`atRest` and restating no
hour — plus a spec that scans the dial to *find* the hours at which the claim would break rather than
listing them, so a season-table or `OWL_SHIFT` move re-derives them instead of going stale. `grep -rn
"hour: 8" game/src` is now empty and `FOUNDING_HOUR` sits beside `ACTIVE_SCALE`, which is the smaller half of
the item and the one that will stop somebody reading one without the other.

**A finding, and a criterion met differently from how it was written.** The item and the design both assumed
the hour could break two ways: wake the whole cast, or open the park in the dark. Only the first exists.
`OWL_SHIFT` is 8 against a rest window of about the same length, so the two halves of the roster are never
both down, and **no hour exists at which moving this constant would put every dino to sleep.** Opening in the
dark is a claim about the sky rather than about who is up, and would want its own entry. The spec pins the
reachable failure mode and, separately, the invariant that fell out of looking: some ground in the park
always has somebody awake on it — which the lore track leans on directly, since a vigil needs somebody who
can keep it. Approving a criterion met differently rather than as written, with the difference written down
in the test that found it.

---

## Filed this cycle

- **BACKLOG-528** [infra] — the reachability register can only make claims about a save's *first frame*; a
  played save is invisible to it by construction. Seeded by the Structure-smith.
- **BACKLOG-529** [core] — the vigil is the first system to read the wall clock's *hour* as world state, and
  it does it through a bare `new Date()`. An hour-of-day is not a duration. Seeded by the Structure-smith.
- **BACKLOG-530** [infra] — filed by this verdict, on QA's declared gap: **mark visibility has never had a
  dev hook**, for any of the four marks a dino can wear, so the vigil's precedence over the owl's mark is
  implemented and reviewed by reading rather than asserted. Third consecutive cycle an hour-mark claim has
  been unpinnable. A `__marks()` hook is a small thing and it is now overdue.
- **BACKLOG-526** [art] — the vigil pose, seeded by the Lore-smith with its host shipping the same night.

## Not raised as a CHARTER amendment

Nothing here wants a constitution change. Worth noting for the record that CHARTER v7 did its job twice
tonight *before* any code was written — once in the design, refusing 121's own gate, and once in the
structure track, refusing the rename. Both refusals happened at the Designer, which is where they cost the
least.
