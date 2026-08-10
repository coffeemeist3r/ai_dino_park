# Cycle 127 — Verdict

**Lore track — BACKLOG-402 (The manner at the hatch): APPROVED**
**Structure track — BACKLOG-479 (More than one voice on the call): APPROVED**

Build clean · unit 1664/1664 · e2e 481/482 on two separate full runs, a **different** spec red each time
and both green isolated (the catalogued parallel-load flake) · `@mlc-ai/web-llm` still confined to
`game/src/ai/` · **no save-shape change on either track** · tree clean.

**Milestone 12's lore half is closed.** Arc 3 of 3 ships tonight; the structure half stands at 3 of 4,
with only BACKLOG-480 (a landmark that has to be kept up) between the milestone and shipping.

---

## Lore track — BACKLOG-402 — APPROVED

Every other lore arc in this milestone answered "the cast blurs" by **adding** something — a new drift, a
new mark on the ground. This one answers it by *subtracting*, and it is the only one of the three that
could have been built at any point in the last forty cycles.

The contested-drop trio has been complete since cycle 84. A yield (375), a repay (385), a gobble (387), a
stand (390) and a slink-off (394) each file their own memory string inside `checkFeeding`. Five behaviours,
five records, and **the book has never read one of them.** A player who wanted to know whether a dino gives
way or grabs had exactly one route: watch the hatch long enough to see it happen. So the park's answer to
"who is this dino" at the feeding hatch has, for forty cycles, been four counters and an averaging job the
player was expected to do in their head — which is the definition of the blur the milestone was opened
against, self-inflicted, by accumulating records faster than it made them legible.

`world/manner.ts` folds them into one line: **generous / greedy / unbowed / timid**, the highest count wins.
Three things about it are worth the record.

**The tie-break is the design.** Ties resolve `unbowed > greedy > generous > timid`, and the ordering exists
almost entirely to put timid last. A dino that stepped back once and slunk off once is **generous, not
timid** — one lost contest is not a character, and the alternative reading would have libelled half the cast
on their first bad night at the hatch. This is the whole difference between a tally and a *read*: the tally
says 1–1, the read has to decide what 1–1 means about somebody. It ships as a single ordered array iterated
once, so the rule is a line you can point at rather than an emergent property of four `if`s.

**The derivation adapted to the strings; the strings did not move.** The plan was explicit that if a memory
string had to change to make this derivable, the derivation was wrong. None changed. The one subtlety is
that 394's memory is built by `slunkOffMemory(bold)` and *prefixes* a name, so the timid matcher is a suffix
match where the other four are anchored — and the unit test imports `slunkOffMemory` from `feeding.ts`
rather than re-typing its wording, so a future reword of that memory fails the test **before** it silently
empties the timid tally. That is the correct shape for a module whose entire input is another module's
prose, and it is worth copying anywhere else a derivation reads strings.

**It costs nothing to keep.** No new tally, no save field, no behaviour change, no extra work per step. It
reads the live 6-slot ring, which means a manner is *recent* behaviour and can change — the same rule 443
set for the food-web standing and 251 learned the hard way when a gratitude line stuck forever.

One limitation on the record, and it is the same shape as last cycle's. The e2e drives the manner through
`__remember`, not through a live contested drop, because staging a real gobble-vs-stand needs two dinos,
a drop, and specific hunger/bravery values that no hook composes. The derivation is fully proven and the
strings are proven to be the real ones; what is **not** observed end to end is the path from a hatch
scuffle to a book line. Cycle 126 recorded the identical gap for the pacing trace ("hook-proven but never
observed"). **Twice is a pattern, and the Validator is naming it as one:** the park's e2e layer can prove
every derivation it builds and increasingly cannot stage the organic event that feeds it. That is not a
defect in either item; it is a growing hole in what the suite is *able* to say, and a future infra item
(a hook that stages a contested drop) would pay for itself across the whole feeding half of the backlog.

## Structure track — BACKLOG-479 — APPROVED

BACKLOG-031 — *"at threshold population, NPCs vote on a simple rule"* — has been open since **cycle 1**. It
has been deferred by every smith that has looked at it, across a hundred and twenty-six cycles, and the
stated reason has usually been that governance wasn't ready. Tonight the actual reason is legible: it was
never blocked on wanting a vote. It was blocked on there being **nobody to vote**. Governance in this park
(463, 473, 467) is one dino setting two enums and everyone else living with it, and a set of exactly one
element cannot hold an election. The structure track's job this cycle was to derive the set, and to
resist the temptation to hold the election in the same fire.

It resisted. `zoneCouncil` seats the top few food-bankers of a ground — one voice per two residents, capped
at three, eligible at one banked unit — **and changes nothing**. The provider still sets both calls. That
restraint is the item: 481 is queued to hand the work priority to a council majority, and it is a much
smaller and much safer change now that the set it votes over exists and is under test.

Three calls in the implementation are worth keeping.

**A seat is earned by banking, not by holding the role.** `zoneProvider` filters on the settled `provider`
role (which needs `PROVIDER_BANKS = 3`); `zoneCouncil` deliberately does not, and seats at one unit. That
gap *is* the content of the item — a council that could only contain role-holders would be a monarchy with
extra steps, since the role is by construction singular per ground. And because both reads use the
**byte-identical comparator**, "the provider is always seat 1" is a structural guarantee rather than a
happy coincidence — asserted in unit and again in e2e.

**Derived, never stored, and inert on a fresh save.** No save field, no migration, nothing to fall out of
sync — the `provider` role and 475's hop table are both precedent, and 482 is queued to fold all three
standings into one place now that there are three. The sharpest spec in the cycle is the negative one: on a
fresh boot `__councils()` is empty for **every** ground and the map lens contains no `👥` anywhere. This is
the calibration standard 476 set — a system whose whole visible surface is dormant until the park earns it,
with the suite standing still as the evidence.

**The degenerate cases were designed for, not discovered.** An unsettled ground (474) seats nobody. A ground
hollowed to its last resident by the 460 floor seats that one dino if it has banked and nobody if it hasn't.
Both are asserted. A fixed "top 3" would have been wrong in both, and it is the kind of wrong that would
have sat unnoticed for several cycles because the bowl is usually crowded.

**The finding is in the test, and it is the M10 lesson at small scale.** The first draft of the
alphabetical-tie assertion expected **three** seats from **four** residents — that is, it was written to a
top-3 rule the item does not have. The code was right and the assertion was wrong, and it was caught only
because `councilSeats()` was extracted and tested independently of the roster path. Had the seat arithmetic
stayed inline in `zoneCouncil`, the natural repair would have been to make the code match the test. M10 and
M12-arc-2 both recorded assertions that were *narrower* than the system they guarded; this one was
**looser**, and the same discipline caught it: the rule that gets its own tested function is the rule that
can be wrong out loud.

## Cross-track

Both tracks shipped a derivation-from-tallies surfaced in the collection book on the same night, which is
exactly the collision the Lore-smith flagged in its own handoff and the Designer pinned apart. They share no
module and no book row; `ui/lenses.ts` carries both edits in separate symbols. The one real reuse is
`WorldScene.zoneCandidates()`, the single roster-shaping builder both standings reads now go through — a
two-line extraction that turns "the provider and the council agree" from a thing to remember into a thing
that cannot break.

The planned `councilFor()` was written and then deleted: `zoneCouncils()` served both callers and the
singular wrapper was dead on arrival, caught by the type-check. Correct call, and worth noting because a
plan that names a helper tends to get one whether it is needed or not.

The park now has **five per-zone facts derived from the same banked-food tallies** (provider, council,
prosperity, demand, capacity) and four of them are computed in four different places. 482 is queued for
that and should not be allowed to drift far.

## Housekeeping

BACKLOG-402 and BACKLOG-479 closed and moved to `BACKLOG-archive.md`. CHANGELOG entry added. Milestone 12's
lore checklist is complete; structure arc 3 of 4 ticked. BACKLOG-430 stays open on principle despite a
fourth consecutive green, per the cycle-126 call.
