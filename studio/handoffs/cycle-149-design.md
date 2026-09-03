# Cycle 149 — Design Handoff

Two tracks. The structure track goes first in the Coder's fire: both add an entry to
`REACHABILITY_REGISTER`, and the lore track's entry wants the founding hour to already have a name.

---

## Structure track — BACKLOG-523

**Item:** BACKLOG-523 [core] The hour a save opens on.

**Why this cycle.** Milestone 17 is *A day in the park*, and it has spent five cycles building reads that are
all measured from one number: `_time = { day: 1, hour: 8, minute: 0 }` in `clock.ts`. 109's whole reachability
answer is *"Rex is asleep at eight in the morning"* — a claim about the **opening hour**, not about
chronotypes. 493's session claim, 520's two hour-marks, the huddle window, spoilage, upkeep, the council's
term and (tonight) the vigil all read a clock whose zero is this. Move it four hours either way and the
milestone's frame-one read changes completely — one way every dino is up, the other the park opens in the
dark — and **nothing fails.** Closing this milestone without pinning its own origin would close it with the
one number under all of it still unexamined.

**What ships.**

1. `clock.ts` gains `export const FOUNDING_HOUR = 8`, declared **beside `ACTIVE_SCALE`** with a shared note:
   *when a session starts* and *how fast it runs* are the two halves of "what fits in a sitting" and have
   never been read in the same place. `WorldClock._time` initialises from it. No behaviour changes; the park
   opens at exactly the hour it opened at yesterday.
2. A tenth entry in `REACHABILITY_REGISTER`, id `BACKLOG-523`, of 501's shape:
   - **system:** `the park opens on an hour where its cast is split — somebody up, somebody down`
   - **fact:** `the founding hour falls inside some residents' rest window and outside others'`
   - **holds:** walks `foundingResidents()`, derives each name's traits through the same seeded path the
     world uses, and asserts that at `FOUNDING_HOUR` **at least one** resident is `atRest` and **at least
     one** is not. It restates neither `8` nor any other hour, and it goes through `chronotypeOf`/`atRest` —
     rule 1 of the register's own header.
3. A unit test that **moves the hour and watches the entry go dark**: the same predicate is exercised at a
   set of hours around the shipping one and shown false at an hour where the whole cast is up (or down) and
   true at the shipping one. This is the part that makes the constant pinned rather than merely named.

**Acceptance criteria**
- [ ] `FOUNDING_HOUR` is exported from `game/src/world/clock.ts` and is the only place the opening hour is
      written; `grep -rn "hour: 8" game/src` returns nothing.
- [ ] `FOUNDING_HOUR` and `ACTIVE_SCALE` are declared adjacently in `clock.ts` under one shared comment.
- [ ] A fresh `WorldClock` still reports `{ day: 1, hour: 8, minute: 0 }` — the park opens unchanged.
- [ ] `REACHABILITY_REGISTER` contains an entry whose `id` includes `BACKLOG-523`, and `darkEntries()` is
      empty on the shipping park.
- [ ] The 523 claim returns `false` when evaluated against an hour at which every founding resident is at
      rest, and `false` at an hour at which none is — proven in a unit test that passes the hour in, not by
      editing the constant.
- [ ] The 523 entry's source contains no numeric hour literal.
- [ ] Existing register entries and their tests are untouched.

**Out of scope.** Making the opening hour *configurable* or save-persisted; changing what hour the park opens
on; `SESSION_MINUTES` (it is the register's own claim, deliberately left where 519 left it); BACKLOG-528's
played-save axis and BACKLOG-529's keeper-clock seam, both seeded tonight for later cycles.

**Constraints.** Additive only — no save-shape change on this track. `clock.ts` must stay Phaser-free.
`reachability.ts` is shared with the lore track: **this track lands first**, and the lore track appends after
it rather than editing the same lines.

---

## Lore track — BACKLOG-121

**Item:** BACKLOG-121 [emergent] Keeper-shaped routine — the vigil at the hatch.

**Why this cycle.** Milestone 17's last open arc owes one sentence: *a dino awake at the wrong hour is doing
something* — and specifically, per the arc's own note after cycle 148, **an owl doing something a day-dino
would not, rather than the same behaviour under a different sky.** 524 gave the park a system that counts who
is waking. Nothing yet gives a dino something to *do* with being the one who is up. 121 is the only queued
item where who is awake changes **who performs the beat**, and it does it without a single branch that
mentions owls: a dino that is down cannot stand at the glass, so the roster filters itself by the hour.

**What ships.** You open the park at about the hour you usually open it, and somebody is already walking to
the hatch to wait for you.

1. **New pure module `game/src/world/vigil.ts`** (no Phaser, no clock, no randomness — hours are parameters):
   - `noteVisit(hours, hour)` — appends a real local hour to the visit history, newest last, capped at
     `VISIT_HISTORY_MAX = 8`.
   - `habitualHour(hours)` — the modal hour of the history, requiring at least `MIN_VISITS = 2` sightings;
     ties broken by the smallest hour; `null` when the history cannot support a claim.
   - `hoursApart(a, b)` — circular distance on a 24-hour dial (so 23 and 0 are one apart).
   - `isAnticipating(hours, hour)` — `habitualHour` exists and is within `VIGIL_WINDOW = 1` of `hour`.
   - `vigilKeeper(candidates)` — takes `{ name, friendship }[]` (**callers pass only waking residents of the
     ground in view**) and returns the fondest; ties, including an all-zero friendship book, broken by name
     order. `null` for an empty list.
   - `vigilLine(name, hearts)` / `vigilMemory()` — the spoken beat and the memory, warmth graded by hearts
     the way `homecoming.ts` grades its welcome.
2. **Save (additive):** `visitHours?: number[]`, validated as an array of finite numbers, absent in every
   older save and read as `[]`. No existing field changes; an old save loads and a new save loads in an old
   build.
3. **The founding visit.** A save with no history has no habitual hour, so a fresh park would ship this beat
   dark — the exact defect CHARTER v7 exists to catch. The founding save therefore records **the boot itself
   as a prior visit**: on a first boot the history is seeded with the current local hour and then the boot is
   noted, giving two sightings of the same hour. Derived from when the park is actually opened; **no hour
   literal anywhere in the path.** A keeper who then returns at an unusual hour still finds nobody waiting,
   which is the read the item is about.
4. **Scene glue, built as `checkMend`/`stepMend`'s twin** (that pair is the house pattern for "somebody walks
   somewhere and something happens on arrival"):
   - `checkVigil()` — once per world step, for the ground **in view** (same discipline as the mend: a beat
     nobody is present for is what v7 was written about). Requires `isAnticipating`, no vigil in flight, and
     a wall-clock cooldown. Candidates are that ground's residents who are **not** `atRest` at the current
     in-game hour. `vigilKeeper` picks. The dino is sent to `HATCH_TILE`.
   - `stepVigil()` — walks it with `stepToward`; on arrival (chebyshev distance ≤ 1) it shows `vigilLine`,
     flashes the 👀 mark, files `vigilMemory()` against that dino, logs one event line, and saves. Leaving the
     ground, or running out of steps, cancels the errand costing nothing.
   - The 👀 mark shares 520's hour-mark slot and **takes precedence over 👁**: what a dino is doing beats what
     hours it keeps. It is mutually exclusive with 💤 by construction (a sleeper is never a candidate).
5. **A reachability entry, id `BACKLOG-121`:** *somebody is already waiting at the hatch when you open the
   park* — fact: *the founding hour leaves at least one resident of the hatch's ground awake to keep the
   vigil*, routed through `foundingResidents()`/`atRest`/`FOUNDING_HOUR` (the structure track's constant,
   which is why that track lands first).

**Acceptance criteria**
- [ ] `noteVisit` caps the history at 8, keeping the newest entries.
- [ ] `habitualHour([])` and `habitualHour([9])` are `null`; `habitualHour([9, 9])` is `9`;
      `habitualHour([9, 9, 21])` is `9`; a tie between `[7, 7, 21, 21]` returns `7`.
- [ ] `hoursApart(23, 0) === 1` and `hoursApart(0, 12) === 12`.
- [ ] `isAnticipating([9, 9], 10)` is `true` (inside the window) and `isAnticipating([9, 9], 15)` is `false`.
- [ ] `vigilKeeper` returns the highest-friendship name; with every friendship at 0 it returns the
      alphabetically first; with an empty list it returns `null`.
- [ ] A save round-trips `visitHours`; a save JSON with the field absent loads with an empty history and no
      error; a save with a malformed `visitHours` is rejected exactly as other malformed fields are.
- [ ] On a **fresh save at the founding hour**, the Bowl's waking residents are Glade, Mossback, Sunny and
      Twitch (Rex is the Bowl's owl and is down), so the vigil is kept by **Glade** — asserted through the
      production functions, not by naming the hour.
- [ ] Evaluated at an hour in the park's night, the same read returns **Rex** — the owl is the only Bowl
      resident who *can* keep the vigil, with no owl-specific branch in the code.
- [ ] `darkEntries()` is empty, and the register contains an entry whose `id` includes `BACKLOG-121`.
- [ ] e2e: on a fresh save, one dino walks to within one tile of the hatch and carries the vigil mark; a save
      whose history says the keeper comes at a different hour produces no vigil.
- [ ] `@mlc-ai/web-llm` is still imported only under `game/src/ai/`.

**Out of scope.** The goodbye glance (119), the visit streak (122), the missed-you memory (116) — all three
want BACKLOG-529's keeper-clock seam first. Drawing the vigil pose (that is BACKLOG-526, the Artist's).
Changing `homecoming.ts` (112): the welcome-back and the vigil are different beats — one fires on *how long*
you were gone, this one on *what hour* you came back — and they may both fire in the same boot.

**Constraints.** `vigil.ts` stays pure and Node-testable; every hour is a parameter. Save changes additive
only. `reachability.ts` is shared with the structure track — **append after it**. The vigil must not contend
with the mend errand for the same dino, and must not fire while a dino is sleeping, crossing zones, fleeing
or on a hunt — the existing precedence ladder in the movement branch stands and the vigil sits below it.
