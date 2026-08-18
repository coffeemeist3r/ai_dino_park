# Cycle 134 — Design

Two tracks. Milestone 14's last lore arc on one; the gate that judges it on the other.

---

## Lore track — BACKLOG-409

**Item:** BACKLOG-409 [pokemon] Tics in the book — the collection book names each dino's signature tic, the
distinctness the player collects at a glance. Builds on 405 / 021 / 407.

**Why this cycle**

Milestone 14 gave the ritual a cause (412) and legs (407) and left it invisible. The tic exists only in the
instant it is performed: a glyph floats, a ticker line scrolls past, and unless the player was looking at that
dino in that minute, forty-seven cycles of the most per-dino behaviour in the park leave no trace they can
find again. The collection book (021) is the one surface whose job is to hold what the player has collected
about a dino — it already holds the *idle quirk* (303, `fidget`), which is the tic's shallower sibling. The
ritual belongs on the line under it.

After 407 the line is better than a label. A dino's ritual may be its own or one it caught off a friend, so
the book entry carries a small piece of social history — the first line in the book that names a fact one
dino learned from another.

**What ships**

- A new book line per dino: `ritual: paces a fixed little path`, prefixed with the tic's glyph and rendered
  directly under the 303 quirk line (the two idle fingerprints together — the glyph it wears and the ritual
  it performs).
- **The line is earned, not derived.** It shows only for a dino whose ritual has actually *formed* in this
  park — the first float of a solitary stretch (`performTic`'s invention branch) or the moment it picks a
  friend's ritual up (407). A dino that has never been alone long enough shows no line at all, exactly as
  `manner` (402), `pecking` (401) and `foodweb` (443) show nothing until the behaviour has happened. The book
  records what the park did, never what `signatureTic(traits)` would answer if asked.
- **A borrowed ritual names its source.** When the tic was caught off a friend the line ends
  `— caught off Thornback`. When the park knows the ritual is borrowed but not from whom (a pre-409 save),
  it falls back to `— picked up from a friend`, which is what the 407 label already says.
- **Persisted additively:** a set of the dinos whose ritual has formed, and the name each echo was caught
  from. Both survive a reload — a ritual you watched form is exactly the kind of fact a save is for. An old
  save loads with an empty set and back-fills every dino already carrying an echo (an adopted ritual is by
  construction one the park announced), so no existing save shows a blank where a ritual plainly exists.
- The "formed" set is **never cleared by `resetTic`**. `ticInvented` is a per-stretch flag (company returns,
  the streak drops, the ritual re-forms later); the book's fact is lifetime. Two different questions, two
  different pieces of state, and conflating them is the bug this design is written to avoid.

**Acceptance criteria**

- [ ] `ticBookLine(t)` renders `<glyph> ritual: <label>` for a dino's own ritual.
- [ ] `ticBookLine(t, 'Thornback')` appends `— caught off Thornback`; `ticBookLine(t, null)` and
      `ticBookLine(t)` render identically (no dangling separator).
- [ ] `bookLines` shows a row's `tic` line when present and omits it entirely when absent, with the quirk
      line still above it and `today:`/`plans:` still below — no existing line moves.
- [ ] Every pre-409 `BookRow` literal in the existing unit tests still type-checks and renders unchanged
      (the field is optional; zero existing assertions are amended).
- [ ] Dev hook: a dino driven through `__inventTic` reports its ritual in `__book()`; a dino that has never
      ticced has no `ritual:` line in `__book()`.
- [ ] Dev hook: a watcher driven through 407's three watches shows `ritual: <performer's label> — caught off
      <performer>` in `__book()`, and the performer shows the same ritual with no `caught off` suffix.
- [ ] The ritual line survives a save/reload round-trip.
- [ ] A save written before this cycle (no formed-set field) loads without error, and a dino carrying an echo
      in that save still shows a ritual line.

---

## Structure track — BACKLOG-486

**Item:** BACKLOG-486 [infra] The run, not the spec — bound the e2e load instead of chasing victims.

**Why this cycle**

Three cycles, three distinct victims (`cycle-110-plenty`, `cycle-123-wandering`, `mobile-minds`), each green
5/5 in isolation in seconds, none near its cycle's diff. The failure is a property of the run. Milestone 14's
remaining arcs are being judged by a gate that fails at random, which means they are not being judged.

**The mechanism, named**

`playwright.config.ts` sets `fullyParallel: true` and **no `workers` value at all**, so Playwright takes half
the machine's cores — six browsers on this box — each hitting one Vite dev server. And the two timeouts are
in the wrong order: `helpers.ts` waits up to **30s** for `__ready`, while Playwright's per-test timeout is its
default **30s**. A boot that legitimately takes 22s under six-way cold load therefore cannot be reported as a
slow boot; it is reported as *whatever assertion the spec was on when the clock ran out* — a different spec
every run, always green in isolation, always "not near the diff". That is the shape of every victim to date.

**What ships**

- An explicit, calibrated `workers` cap in `playwright.config.ts`, overridable by an `E2E_WORKERS` env var so
  a future run can be recalibrated without a code change. Calibrated against a measured baseline run on this
  machine, recorded in the QA handoff.
- A per-test `timeout` set strictly **above** the boot ceiling, so a slow-but-correct boot can spend its
  budget booting and still have room to assert. The boot ceiling and the test timeout stop being the same
  number.
- Boot settle discipline in `helpers.ts`: the boot ceiling is named beside the config timeout it must stay
  under, and the helper waits for the scene to have produced a frame past `__ready` rather than taking the
  flag as the last word.
- **Evidence, not assertion:** three consecutive clean full runs recorded in `cycle-134-qa.md` with their wall
  times, plus the baseline run's worker count and duration. The success condition of this item is a number,
  not a claim.

**Acceptance criteria**

- [ ] `playwright.config.ts` sets an explicit `workers` value; `E2E_WORKERS=N` overrides it.
- [ ] The per-test `timeout` in `playwright.config.ts` is strictly greater than `helpers.ts`'s boot ceiling.
- [ ] `npx playwright test` runs the full suite green.
- [ ] **Three consecutive** full runs are green, with wall times recorded in the QA handoff.
- [ ] No spec file's assertions are weakened, skipped, or `test.slow()`-ed to achieve the above — the fix is
      in the run's configuration, not in what the suite checks.
- [ ] Unit suite and `npm run build` unaffected.
