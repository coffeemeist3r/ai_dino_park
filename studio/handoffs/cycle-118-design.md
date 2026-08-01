# Cycle 118 — Design

Two tracks. **Lore:** BACKLOG-471 — the grumble reaches the keeper (Milestone 9's last arc).
**Structure:** BACKLOG-465 — per-crop seasonal yield (the half 461 deferred).

---

## Lore track — BACKLOG-471

**Item:** BACKLOG-471 [emergent] The grumble reaches the keeper.

**Why this cycle.** Milestone 9 set out to make governance legible, transferable and lived. 467 announced
the say changing hands, 468 put the policy on the lens, 469 gave a hungry mouth a private grievance about
it, 470 let the bowl pass the policy around as a public fact. Every one of those is *description* — the
park telling you what it decided. Nothing yet tells you the decision **cost** somebody. The bank-first
reserve (463) is the sharpest edge in the whole governance system: it is the one rule that can look at a
starving resident with food in the pantry and say no. Until tonight that refusal happened in complete
silence — `pickFoodToSpend` returned `null`, the loop moved on, and the dino simply stayed starving. 471
gives that silence a voice at the glass. It is also the arc that turns governance into a **care signal**:
the keeper reads the line, drops food, and the policy's cost is answered by a hand. Ship it and M9 closes.

**What ships.**
- When `feedFromStores` finds a starving resident on a **bank**-priority ground and the reserve is the
  *only* reason it goes unfed (the zone holds food it would have spent under a `feed` policy), that ground
  records a **short**. A `feed` ground, a policy-less ground, or an empty pantry records nothing — an empty
  pantry is want, not a decision, and the arc is about decisions.
- Once a ground has stood two mouths short, a faint discontent line lands in the keeper's event ticker:
  **`😟 The Grove's going hungry while the granary fills`** (no leading article — two of the three zone
  names carry their own, the `storesFedLine` precedent).
- The line is a **standing, not a tic**: at most once per in-game day per ground, however many mouths go
  short in it. The keeper hears the grievance once a day, the way 221's cold alarm and 226's one-visit-per-
  sorrow gate work.
- Feeding fixes it: the moment that ground's stores *do* feed one of its own, its short count resets to
  zero, so the grumble stops as soon as the policy stops biting. Same for a ground whose say changes hands
  (467) to a feed-first provider — the count is only ever read while the policy is `bank`.
- No save change. The count is a live read of a live situation, exactly like the policy it reports.

**Acceptance criteria**
- [ ] `heldShort(pile, favoriteId, priority)` returns true **only** when `priority === 'bank'` and the pile
      holds food that a reserve of 0 would have spent — false for `'feed'`, `null`, `undefined`, and false
      for an empty pile under any policy.
- [ ] A starving resident of a `bank` ground with a stocked-but-reserve-only pantry goes unfed (unchanged
      463 behaviour) **and** that ground's short count rises by one.
- [ ] On the second short, `__events` contains a line matching `/going hungry while the granary fills/`
      naming that ground.
- [ ] Further shorts on the same in-game day add **no** second ticker line; advancing the clock a day and
      shorting again does log a new one.
- [ ] When that ground's stores successfully feed a starving resident, its short count returns to 0.
- [ ] A park with no provider (no policy anywhere) never logs a discontent line — the ticker is
      byte-identical to today's on the default boot path.
- [ ] Build clean, `npx vitest run` green, `npx playwright test` green; no new save fields; no
      `@mlc-ai/web-llm` import outside `game/src/ai/`.

**Out of scope.** No lens/book surface for discontent (468 owns the lens read, and a second glyph there
would crowd it). No dino-side memory or spoken line — 469 already owns the mouth's own voice, and this arc
is deliberately the *keeper's* channel. No auto-correction (the provider does not change its mind because
the ticker fired) — that is governance responding to governance and belongs with 473's second decision.
No persistence of the short count.

**Constraints.** The discontent read must not change *whether* a dino is fed — 463's reserve behaviour is
already shipped and approved, and this arc only observes it. The detection must live in a pure module so
the reserve logic is not duplicated: it must call the same `pickFoodToSpend` + `feedReserve` the spend site
calls, not re-implement the comparison. File overlap with the structure track: both land in
`WorldScene.ts`, in disjoint methods (`feedFromStores` here, `harvest` + the season-turn tail there).

---

## Structure track — BACKLOG-465

**Item:** BACKLOG-465 [emergent] Per-crop seasonal yield.

**Why this cycle.** 461 shipped the flat park-wide seasonal grip and wrote its own deferral into the
source: *"per-crop seasonal yield stays deferred (BACKLOG-465)."* That flat grip moves every ground by the
same amount at the same time, which means the year can make the whole park richer or poorer but can never
make one ground richer **than another**. That is the missing half. The chain economy is built almost
entirely on differences between grounds — the ferry (447) moves food from the fuller zone to the lighter
one, the demand read (438) points at what a ground can't grow, migration (450) walks mouths toward plenty,
decline (460) reads a zone hollowing — and the only thing that has ever produced those differences is
chance. 465 makes the **calendar** produce them, on a schedule, four times a year, forever.

**What ships.**
- A per-crop season table: each farmed crop gets one **good** season and one **lean** one.
  - 🍓 berries (the bowl) — good **summer**, lean **fall**
  - 🥬 greens (the Grove) — good **fall**, lean **winter**
  - 🥕 roots (the Fernreach) — good **winter**, lean **summer**
  Each of summer/fall/winter has exactly one thriving ground and exactly one thin one, and they rotate
  around the chain. **Spring is the hinge for every crop** — the same discipline 461 used, and the reason a
  fresh boot (day 1, spring) banks exactly what it banks today.
- The harvest hook reads it: a harvest in the crop's good season banks **two** units into the ground's
  store (cap permitting), in its lean season **none**, otherwise one as before. The harvest still drops
  food into the feeding loop in every season — the year shapes what a ground can *bank*, never whether its
  dinos can eat what they just picked.
- The hauler (448) is credited **per banked unit**, so a double harvest is two units of provider standing
  and a lean one is none — the year now shapes who becomes a ground's provider, too.
- Nothing changes silently (CHARTER §Quality bar). A non-neutral harvest says so on the ticker
  (`🍓 the berries came in thick — two for the stores` / `🍓 a lean year for berries — nothing to bank`),
  and the season turn adds a line naming the season's winner and loser
  (`🌾 fall favours the Grove's greens; the bowl's berries come in thin`) beside 461's existing park-wide
  grip line. Spring's line is empty, exactly as 461's is.

**Acceptance criteria**
- [ ] `cropYield(food, season)` returns 2 in that crop's good season, 0 in its lean season, and 1 in every
      other season; an unknown food id returns 1 in every season.
- [ ] `cropYield(food, 'spring') === 1` for **every** crop — the hinge holds.
- [ ] Across the three farmed crops, each of summer/fall/winter has exactly one crop at yield 2 and exactly
      one at yield 0 (a table-shape test, so a future crop can't silently break the rotation).
- [ ] Harvesting the bowl's ripe plot in **summer** banks two berries where the pre-465 build banked one
      (cap permitting), and credits the hauler twice.
- [ ] Harvesting the bowl's ripe plot in **fall** banks zero and credits no hauler — but still drops the
      crop into the feeding loop (the food piece is in play) and still clears the plot and bumps the
      per-zone harvest tally.
- [ ] A good-season harvest never banks above `foodCapFor(zone)` — a ground already one below cap gains
      exactly one, not two.
- [ ] A non-neutral harvest logs a ticker line naming thick or thin; a spring harvest logs no such line.
- [ ] The season turn into summer/fall/winter logs a line naming that season's thriving crop and its thin
      one; the turn into spring logs none.
- [ ] Build clean, `npx vitest run` green, `npx playwright test` green; no new save fields.

**Out of scope.** No new column or glyph on the zone-map lens (the per-zone harvest tally 433 already reads
there, and 468 just took the tier line). No change to spoilage, the ferry, or the demand read — they read
the store, and the store is what this changes; that indirection is the point. No per-crop *growth speed*
(a crop still ripens in `RIPE_DAY` days in every season) — the arc is yield, and growth rate is a second
system. No fourth crop.

**Constraints.** Spring must stay neutral for every crop; a fresh boot must bank exactly what it banks
today or a shelf of existing harvest specs moves for no reason. The yield must route through the existing
`foodCapFor` cap so a good season can never overfill a pile past what spoilage will bleed back. File
overlap with the lore track: `WorldScene.ts` only, in `harvest` / the season-turn tail — disjoint from
`feedFromStores`. Sequence structure first, then lore, so the two edits never share a hunk.
