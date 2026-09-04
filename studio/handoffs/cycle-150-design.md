# Cycle 150 — Design

Milestone 18's opening cycle. **Build order is fixed: structure track first.** Both tracks touch
`WorldScene.ts` and the return path, and the lore track must consume the structure track's seam
rather than adding a third bare `new Date()`.

---

## Structure track — BACKLOG-529: the keeper's own clock is not the park's

### Why this cycle

Cycle 149's vigil made the wall clock's *hour* load-bearing world state and reached it with
`new Date().getHours()` at two WorldScene call sites. `WorldClock`'s own header states the
discipline it broke — the now-source is injectable so everything stays testable in Node — and
the specs that pin the vigil currently depend on what hour the CI machine happens to be at.
Milestone 18 queues two more callers behind it (116 this cycle, 122 next), and each one that
lands before the seam answers the timezone question locally and differently.

### What ships

A narrow module that owns **the keeper's local reading of the real clock**, and the call sites
converted to it. Not a second world clock: no ticking, no listeners, no scale — a reading and an
injectable source, plus the three answers that currently exist nowhere.

`game/src/world/keeperclock.ts` (pure, Node-testable):

- `keeperHour(nowMs)` → 0–23, the keeper's **local** hour.
- `keeperDay(nowMs)` → the keeper's local calendar day as `YYYY-MM-DD`. Nothing consumes this
  yet; it ships because BACKLOG-122 is the next arc and a day-of-the-player's-life is exactly
  the reading that must not be re-derived per caller. One function, no consumer — the single
  piece of scaffolding this design allows, allowed only because the milestone names its consumer
  by number.
- `getKeeperClock()` / `setKeeperNowSource(fn)` — the singleton and its injection point,
  mirroring `getWorldClock()`'s shape so the two read as siblings.

The three answers, written once as module documentation **and** pinned by unit tests:

1. **DST fall-back.** The same local hour occurs twice. The park records both. That is correct
   and deliberate: the visit history is a record of hours *as the keeper lived them*, and the
   keeper really did open the park twice at 01:xx. No de-duplication.
2. **DST spring-forward.** An hour does not occur. A keeper whose habitual hour is the skipped
   one simply does not visit that day; the history is unchanged and out-votes the gap within
   `VISIT_HISTORY_MAX`. No special case, and the test says so.
3. **A timezone change.** The history is hours-as-lived, so a keeper who flies somewhere looks
   to the park like a keeper whose habits changed — and is believed within `VISIT_HISTORY_MAX`
   visits, by the same mechanism that believes a genuinely changed habit. The alternative (pin
   the save's original zone and translate) was considered and rejected: a keeper who moves house
   is a keeper whose hour changed, and the park should learn the new one.

`away.ts`: **reviewed, not changed.** Its `savedAt` arithmetic is on a *duration* — timezone-free
and correct as it stands. It gains one comment saying so and pointing at `keeperclock.ts` for
the hour-of-day case, because the codebase nowhere states that a duration and an hour-of-day are
different kinds of thing.

WorldScene: `checkVigil` and `recordVisit` read the seam. New dev hook `__keeperNow(epochMs?)` —
set the injected source (or read it) so vigil specs stop being hostage to CI's wall hour.

### Acceptance criteria

- [ ] `grep -rn "new Date(" game/src --include=*.ts` returns hits **only** in `keeperclock.ts`
      and in test files. Zero in `WorldScene.ts`.
- [ ] `keeperHour` returns the local hour for an injected epoch, asserted for at least two
      epochs twelve hours apart.
- [ ] A unit test pins the DST fall-back answer: two distinct epochs an hour apart that yield the
      same local hour both produce that hour, and `noteVisit` records both.
- [ ] A unit test pins `keeperDay` as a local calendar day (an epoch late in a local day and one
      early in the next yield different days).
- [ ] `__keeperNow(ms)` makes the vigil deterministic in e2e: setting the keeper's hour to the
      park's learned visit hour dispatches a vigil; setting it far from that hour dispatches none.
      Both assertions run against hours the spec **derives**, never literals.
- [ ] `away.ts` carries the duration-vs-hour-of-day note naming `keeperclock.ts`.
- [ ] The save shape is unchanged — `visitHours` is the same array of numbers, old saves load.
- [ ] Full suite green, including the existing cycle-149 vigil specs; any spec that had to change
      is named in the QA handoff with the reason.

### Out of scope

Changing the vigil's behaviour, the visit-history format, `WorldClock` itself, the visit streak
(122), and any use of `keeperDay`. This is a seam and its answers.

---

## Lore track — BACKLOG-116: missed-you memory

### Why this cycle

Milestone 18's first arc, and the one that decides whether the milestone is about a *system* or
about *five dinos*. Today an absence produces a digest paragraph and one welcome-back for the
single dino with the most friendship. The other four residents lived through the same gap and the
park has them say and do nothing about it — five identical outputs from one system, which is the
sameness the CHARTER's Living-minds line calls a defect.

### What ships

On the keeper's return, **every** resident forms its own account of the gap, graded off who it is,
and the park shows you which. Three grades, and the third one is the read:

- **missed** — it noticed and it says so. Wears a clear thought-mark on return; its next greeting
  leads with it.
- **aloof** — it noticed and will not give you the satisfaction. Wears the *same* mark, faint;
  its greeting leads with a conspicuous non-admission.
- **unmoved** — it did not register that you were gone. **No mark, no opener, nothing.** The empty
  space over that dino's head, beside two neighbours wearing marks, is the beat.

`game/src/world/missed.ts` (pure, Node-testable — no Phaser, no clock, no randomness):

- `MISSED_MIN_MINUTES = 5`. **Deliberately not `HOMECOMING_MIN_MINUTES`** (360). The catch-up runs
  at `AWAY_SCALE`, so in-game minutes here are real minutes: the nuzzle wants six real hours away,
  which is a beat a ten-minute session cannot reach. This trace is fainter and should be far
  commoner — step away for five minutes and the bowl noticed. Making an existing beat reachable in
  a shape somebody can see is most of the point of this item.
- `missedGrade(p: Personality, hearts: number): MissedGrade` — two independent reads, on purpose:
  - **did it notice** — `sociability * NOTICE_SOCIABILITY + curiosity * NOTICE_CURIOSITY` against
    `NOTICE_BAR`. Below it, `unmoved`, whatever else is true.
  - **will it admit it** — `agreeableness + hearts * HEART_LIFT` against `WARM_BAR`. Above,
    `missed`; below, `aloof`.

  Two axes rather than one because a single warmth score collapses "did not care" and "cared and
  will not say" into the same dino, and those are the two most different residents in the bowl.
  The hearts term is the progression: befriend an aloof dino far enough and it stops pretending.
- `missedMemory(grade)` / `missedOpener(grade)` — one exported builder per beat, per BACKLOG-483's
  finding, so no consumer parses a template literal back out.
- `MISSED_GLYPH` / `MISSED_ART_KEY` declared together, as `vigil.ts` declares its pair.
- `missedYou(cast, minutes)` → `Record<string, MissedGrade>`, empty below the threshold.

WorldScene: at both catch-up sites (the DB restore and `__catchUp`), file each graded dino's
memory and hold a session-only pending trace — **not persisted**, the `pendingRepair` precedent.
`missedMarks` join the hour-mark family via `makeHourMark`, refreshed in the existing chain, at
the **bottom** of the precedence order: an hour-mark or a vigil beats a thought about the keeper.
The trace is consumed by greeting that dino (the opener fires, the mark clears) or expires after
`MISSED_MARK_STEPS` world steps, so it is a reason to walk over rather than wallpaper.

Greeting: a third opener grade after `caught` and `glad`, lowest priority — never stacks.

Dev hooks: `__missedYou()` (grade per dino) and `__missedMarks()` (per dino, whether the sprite is
actually visible — the drawn thing, not the model, the `__wornMarks` precedent). The second is a
slice of BACKLOG-530 arriving early; note it in the verdict but do **not** close 530, which is
about all four existing marks.

### Acceptance criteria

- [ ] `missedGrade` is a pure function of personality + hearts: same inputs, same grade, and no
      dino name appears anywhere in `missed.ts`.
- [ ] **All three grades occur among the Bowl's founding residents at zero friendship**, asserted
      by a spec that derives the roster and its personalities rather than naming dinos.
      (CHARTER v7's corollary: the founding park exercises the system, it does not sit under it.)
- [ ] Raising a dino's hearts can move it `aloof` → `missed`, asserted through `missedGrade`.
- [ ] `__catchUp(5 * 60 * 1000)` files a missed-you memory for every non-`unmoved` dino;
      `__catchUp(4 * 60 * 1000)` files none. Both sides of the threshold.
- [ ] After that catch-up, `__missedMarks()` reports a **visible** sprite for each graded dino and
      no visible sprite for each `unmoved` dino.
- [ ] The `missed` and `aloof` grades produce different opener text and different memory strings.
- [ ] Greeting a dino holding a trace leads its line with the missed opener; after that greet,
      `__missedMarks()` reports its sprite invisible.
- [ ] An unconsumed trace clears by itself after `MISSED_MARK_STEPS` world steps.
- [ ] A dino caught mid-tic keeps the caught opener — the missed opener does not stack onto it.
- [ ] Save shape unchanged: no new persisted field; a reload re-derives grades and holds no trace.
- [ ] Build clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

The drift-apart half (113), the away-log (114), the goodbye glance (119), the streak (122), any
LLM involvement in the grade (the opener is deterministic and ships to every device; the brain is
never asked to be wistful), and any change to the homecoming nuzzle (112), which keeps firing at
its own six-hour threshold on top of this.

### Constraints

- `missed.ts` stays pure — no Phaser, no clock, no `Date`. The scene owns the marks and the steps.
- The trace is session state, never saved.
- **File overlap with the structure track:** `WorldScene.ts` (529 at `checkVigil`/`recordVisit`,
  116 at the catch-up + greet paths) and `away.ts` (529 comments it, 116 reads its output).
  **529 lands and its suite goes green before 116 starts.**
- Do not touch the four existing mark families' visibility rules; the new mark goes underneath them
  in the precedence chain and the chain's existing comments stay true.
