# Cycle 156 — Design

Milestone 19, arc 1 of each track. Both tracks answer the same question from opposite ends:
*what happens inside a visit?* The lore track makes a state **end** during one; the structure
track makes the visit itself a **thing the park holds**.

---

## Lore track — BACKLOG-123: Sulk shakeoff

### Item

BACKLOG-123 [emergent] — *a dino left sulking (😒 jealous / 😤 standoff loser) clears its funk after a
short while **or** a kind keeper gesture (greet/feed), logging a "got over it" memory; negative moods
resolve instead of sticking.*

### Read the item out loud first — half of it already shipped

The Lore-smith asked for this and it pays immediately. **The kind-gesture half is not missing.**
`WorldScene.pendingRepair` is set by `playHomecoming` when a near-tied runner-up sulks (BACKLOG-120),
and BACKLOG-125 already clears it on a greet or a tone-greet through `repair.ts` — outsized bump,
`repairLine` 😊, `repairMemory`, plus BACKLOG-318's `liftMood` recovery flourish. That path is shipped,
tested and good.

So the Lore-smith's instruction — *if only one can ship, ship the gesture* — inverts on contact with the
code, and the Designer is recording the inversion rather than quietly building the other thing. **What is
actually missing is the clock.** `pendingRepair` is a flag with exactly one exit. A dino the keeper never
walks back to sulks until the tab closes. That is the un-shipped half, it is the half the milestone's
headline is about (*something changes while you sit there*), and it is the half that is currently a
permanent state in a park whose charter calls permanent states a defect.

Two smaller gaps come with it: **feeding is not a kind gesture** (the item names greet *and* feed, and
only greet is wired), and **nothing is filed when a sulk ends unattended** — there is a `repairMemory`
for the attended ending and nothing at all for the other one.

### Why this cycle

It is the first lore arc of Milestone 19 and the cheapest true instance of the milestone's claim. It also
supplies BACKLOG-544 — the queued expiry seam — with the one real caller that item is deliberately waiting
on. Building 544's abstraction tonight would be building a seam ahead of its first user; building 123
tonight is what makes 544 legitimate next time.

### What ships

**1. The sulk has a clock.** New pure module `game/src/world/sulk.ts`:

- `SULK_FADES_AFTER_STEPS = 40` — forty `WANDER_STEP_MS` (3s) ambient steps, **two minutes**. Named in
  steps, not in game-days, and sized against the sibling that already made this exact decision:
  `STING_FADES_AFTER_STEPS = 24` (72s) in `tic.ts`, whose comment says *short enough that a fed or
  accompanied dino is over it well within a play session*. A slight outlasts a bad moment at the hatch,
  so this is longer than a sting — and it is well inside the ten minutes CHARTER v7 measures a fresh save
  over, which is the constraint that decides it. **The window must stay long enough that walking across
  the bowl to repair it is still winnable**; two minutes is roughly forty tiles of walking.
- `sulkHasFaded(stepsSince: number): boolean` — the `stingIsFresh` shape, inverted to read positively.
- `shookItOffMemory(name: string): string` — the "got over it" memory the item asks for, in the register
  of `repairMemory`. It must *not* say the keeper did anything, because the keeper did not. Something in
  the shape of "NAME got over it on its own"; the Coder picks the final wording and exports it as
  a builder (BACKLOG-483's rule — one string, one place, so a reword cannot silently empty a read).
- `shookItOffLine(name)` — the floating line, carrying a glyph that is **not** a sixth mark. Reuse
  `reliefFlourish` from `fidget.ts` via the existing `liftMood` path rather than inventing a glyph; cycle
  155 rejected a new eye for exactly this reason and the mark family is at six.

**2. WorldScene wires it.** `pendingRepair: string | null` gains a companion `pendingRepairAt: number`
stamped from `this.worldSteps` at the moment `playHomecoming` sets it — the `stungAt[name] = this.worldSteps`
precedent, one field because there is only ever one sulker. In the `forceStep` tail, if a sulk is pending and
`sulkHasFaded(this.worldSteps - this.pendingRepairAt)`, then: clear `pendingRepair`, file
`shookItOffMemory`, float the line over that dino, and call `liftMood(dino)` — **the same recovery
flourish the repair greet earns**, because it is the same recovery arriving by a different road.

**3. Feeding counts as kindness.** A sulking dino that eats a keeper-dropped food clears its sulk on the
repair path (`repairMemory` + `repairLine` + `liftMood`, no affinity change beyond what feeding already
gives). This is the item's own text and it is two lines at the existing eat site.

**4. A dev hook so the clock is testable without waiting two minutes.** `__sulkAge()` returning
`worldSteps - pendingRepairAt` (or null), beside the existing `__pendingRepair`. The e2e drives the fade
by calling the existing forced-step hook, not by sleeping.

### Acceptance criteria

- [ ] `sulk.ts` is pure — no Phaser, no WebLLM import, Node-testable; unit tests cover `sulkHasFaded` at 0, 39, 40, 41 and a negative input.
- [ ] `SULK_FADES_AFTER_STEPS` is 40 and is defined **once**; nothing else in the tree declares a sulk window.
- [ ] With a sulk pending, driving 40 ambient steps clears `__pendingRepair()` to `null` without any keeper input.
- [ ] When it clears unattended, the sulking dino's memory gains the `shookItOffMemory` string, and that string is produced by an exported builder (not a literal at the call site).
- [ ] When it clears unattended, the dino's floating line appears and its idle glyph stops being 😒 — `moodFidget` receives no `'sulk'` mood on the next render.
- [ ] Greeting a sulking dino before the window elapses still takes the BACKLOG-125 repair path exactly as before: `repairGain` bump, `repairLine`, `repairMemory` — and files **no** shake-off memory.
- [ ] Feeding a sulking dino clears the sulk and files `repairMemory`, not `shookItOffMemory`.
- [ ] A dino that was never slighted is unaffected: no shake-off memory is ever filed for it.
- [ ] e2e: a fresh save reaches a sulk, drives the steps, and asserts the glyph change and the book line — with no `page.waitForTimeout` standing in for the window.
- [ ] Save format unchanged or additive only; an old save loads clean.
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- **BACKLOG-062, the standoff loser's lingering sulk.** The 😤 at `WorldScene.ts:2590` is a one-frame
  flash, not a state, so the item's "😤 standoff loser" clause has nothing to expire. Making it a real
  lingering mood is *building 062*, which is a second lore item, and the Designer may not pick two. 123
  ships against the jealous sulk, which is a real persisted-in-memory state today. **Note for the
  Lore-smith:** when 062 lands it should enter through `sulk.ts`, not invent a second window.
- The generalized expiry seam — that is BACKLOG-544, deliberately queued behind this.
- The cold funk (`coldPending`, BACKLOG-184) is untouched. It has its own thaw and its own item.
- No persistence of `pendingRepair` across reload. It has never been persisted; making it so is a save
  change this item does not need.

### Constraints

- `liftMood` and `repair.ts` are shipped behavior with tests. Extend, do not rewrite.
- The mark family is full at six. **Do not add a seventh glyph** — reuse `reliefFlourish`.
- `worldSteps` is the clock. Do not introduce a `Date.now()` path; the whole point of the step counter is
  that a test can drive it.
- File overlap with the structure track: **both tracks edit `WorldScene.ts`.** Different regions — this
  track is the `forceStep` tail and the greet/feed sites; the other is boot, the departure handler and the
  plaque stat assembly. Sequence them, and run the full suite once after both, not once each.

---

## Structure track — BACKLOG-542: The session as a measured unit

### Item

BACKLOG-542 [core] — *once 541 knows when a session ends, the park can hold the thing it currently
cannot: how long you stayed.* Chosen by the Structure-smith; arc 1 of Milestone 19's spine.

### Why this cycle

Cycle 155 shipped `departure.ts` — the park learned **when** a session ends and immediately spent that
knowledge on measuring the *gap*. It still has no representation of the sitting itself. Every keeper-facing
number in the park (`away`, `awaylog`, `missed`, the streak, the digest) is a fact about absence. A keeper
who looks in for ninety seconds and a keeper who sits with the bowl for an hour are, to this park, the same
keeper. Both remaining structure arcs of the milestone (544's windows, 545's once-a-sitting gate) are
predicates over a record that does not exist.

### What ships

**1. `game/src/world/session.ts`, pure.** A `SessionRecord { startedAt: number; endedAt?: number }` and:

- `openSession(now)` → a record.
- `closeSession(rec, now)` → the closed record (idempotent: closing a closed one returns it unchanged).
- `sessionMs(rec, now?)` → duration; an open record measures against `now`.
- `pushSession(list, rec, keep)` → newest-first, capped. `SESSIONS_KEPT = 3`, matching the book's
  last-three-returns precedent (cycle 153) rather than inventing a fourth retention number.
- `sittingLine(ms)` → the engraved string, e.g. `12m` / `1m 40s` / `40s`. Pure formatting, its own tests.

**`SESSION_MIN_MS` is imported from `departure.ts`. It is not redefined here.** Twenty seconds already
means *long enough to count as a sitting* in this codebase; a second copy is the BACKLOG-483 defect the
cycle-155 Artist was made to correct one fire ago. A session shorter than that is discarded at close, not
pushed.

**2. WorldScene lifecycle.** Open a session at boot (`this.session = openSession(Date.now())`). Close it in
the **existing** departure handler, at the same place `shouldStamp` decides to stamp — one call site, not a
second listener set, because 541 already owns the *when*. On close: push to `this.sessions` if it clears
`SESSION_MIN_MS`, and save. Re-opening on return to `here` starts a fresh record.

**3. The consumer that proves it — the plaque.** `PlaqueStats` gains an optional `sitting?: string`, in
exactly the absent-means-nothing style of `stockpile` / `zoneTally` / `upkeep` / `streak`, rendered as
`Sitting · 4m` **above** the `Keeper ·` streak line. WorldScene fills it from the live open session on
each plaque refresh, so it reads as a number that grows while you stand there.

This is the reachability answer, and it is deliberately the whole point: **open a fresh save, walk to the
plaque, and it tells you how long you have been in the park.** Not on a day boundary, not at six residents,
not after a reload — immediately, and it changes while you watch. Nothing in any prior version of this game
could show that number.

**4. Additive save.** `sessions?: SessionRecord[]` on the save data. An old save has none, gets `[]`, and
the plaque simply shows the live sitting; nothing renders a zero or an em-dash.

### Acceptance criteria

- [ ] `session.ts` is pure — no Phaser, no WebLLM, no `Date.now()` inside it (the caller passes `now`); Node-testable.
- [ ] `SESSION_MIN_MS` is imported from `departure.ts`; `grep` finds exactly one definition of it in the tree.
- [ ] `pushSession` caps at `SESSIONS_KEPT = 3`, newest first, and drops the oldest beyond that.
- [ ] `closeSession` on an already-closed record returns it unchanged (idempotent — the blur→visibilitychange double-fire cycle 155 documented must not close twice).
- [ ] A session shorter than `SESSION_MIN_MS` is not pushed to the list.
- [ ] `sittingLine` unit-tested at 0s, 40s, 100s (`1m 40s`), 12m, and one hour-plus value.
- [ ] The plaque shows a `Sitting · …` line on a fresh save, and the value **increases** between two reads separated by real time.
- [ ] A `PlaqueStats` with no `sitting` produces byte-identical output to the pre-156 plaque (the existing plaque literals in the suite stay untouched).
- [ ] After a simulated departure and return, the closed session is present in the persisted save and the plaque's sitting line has reset to the new session.
- [ ] Save is additive: a save written before this cycle loads without error and the plaque renders.
- [ ] e2e: fresh save → plaque shows a sitting line; the number is not `0s` after the world has run.
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- **BACKLOG-545, once-per-sitting gating.** 542 ships the record and *one* consumer. Converting the wave,
  the digest or the arrival line to session-gating is 545 and is queued.
- The vigil's hour-learning and the digest's tone — both named in 542's text as *future* consumers.
- Any change to how absence is measured. `departure.ts`, `away.ts` and the catch-up are untouched.
- No session history UI. Three records are kept because the successors need them; only the live one is rendered.

### Constraints

- **Do not add a second departure listener.** 541 owns the transition; hook the existing handler.
- Do not redefine `SESSION_MIN_MS`, and do not move the plaque's `Keeper ·` line (the streak stays last on
  the brass — every line above it is about the park, and cycle 154 put it there on purpose).
- Additive save only.
- File overlap with the lore track: see that track's Constraints. Both edit `WorldScene.ts` in different regions.
