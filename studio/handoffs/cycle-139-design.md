# Cycle 139 — Design

Two tracks. The lore track makes the *end* of a solitary stretch a moment; the structure track
makes the founding park's politics something more than one dino nodding to itself.

---

## Lore track — BACKLOG-411

**Item.** BACKLOG-411 [emergent] *Glad of the company* — a dino pulled out of its tic by a friend
wandering into range files a small "glad of the company" note, so being found mid-solitude leaves a
warm trace it can lead its next greeting with.

**Why this cycle.** It is the open half of milestone 15's lore arc "the ritual is a living habit"
(421 shipped the drift in cycle 138). And it closes an asymmetry that has stood since 405: the tic has
five ways to *start* (405 idleness, 393 a solitary day, 410 a friendless new ground, 412 a fresh sting,
414 a departed friend) and exactly one way to end that anybody notices — the keeper walking up (408 /
413 / 420 / 422). The other way, by far the more common one, is `resetTic`, which drops a whole stretch
on the floor without a memory, a float, a ticker line or a word. A dino that spent the last minute
turning a slow circle by itself greets you as though it did not.

**What ships.**

A dino that is **mid-ritual** (`ticInvented`) when another dino walks inside `TIC_COMPANY_RANGE` of it
in its own ground now marks the moment before the stretch is torn down:

1. it floats a small glyph over the dino, the way 405 floats the tic's own glyph;
2. it files a memory naming the ritual it was at and the dino that found it — *"was turning a slow
   circle when Twitch came over — glad of the company"*;
3. it prints one line to the **Park News ticker**;
4. it leaves a **warm trace** on the dino (`{ friend, at: worldSteps }`), kept for
   `COMPANY_TRACE_FADES_AFTER_STEPS` world steps.

While that trace is fresh, the dino's **next greeting leads with it** — a deterministic frame in front
of whatever the brain or the stub returned, exactly the 408/413 shape:

> `Glade: Glad you came by — Twitch found me at it. <the brain's line>`

The trace is **consumed** by that greeting, so it colours one line and not every line thereafter.

Ordering rules, all three deliberate:

- A stretch that ends because a **need** got pressing (hunger/thirst) files nothing. The point of the
  beat is *company*; a dino that walked off to the hatch was not found by anybody.
- A stretch that never reached the ritual files nothing. Twenty solitary steps that end at step
  eleven were never a ritual, and the dino has nothing to be glad about being pulled out of.
- **Being caught by the keeper outranks the trace.** A dino greeted mid-ritual gets the 408/420
  caught opener; the glad opener is for a dino whose stretch is already over. They can never both
  prefix one line.

**Acceptance criteria.**

- [ ] A dino mid-ritual whose solitary stretch ends because another dino entered `TIC_COMPANY_RANGE` in its ground files a memory naming both the ritual's label and that dino's name.
- [ ] The same beat prints exactly one line to the ticker, naming both dinos.
- [ ] The same beat floats a glyph over the found dino.
- [ ] A stretch that ends because a pressing need returned files nothing — no memory, no ticker line, no trace.
- [ ] A dino whose solitude ends **before** the ritual formed files nothing.
- [ ] While the trace is fresh, greeting that dino returns a line that begins with the deterministic glad opener naming the friend, followed by the brain's own reply text unmodified.
- [ ] A second greeting in the same window does **not** repeat the opener — the trace is consumed by the first.
- [ ] A greeting more than `COMPANY_TRACE_FADES_AFTER_STEPS` world steps after the beat does not carry the opener.
- [ ] A dino greeted *mid*-ritual gets the 408/420 caught opener and never the glad opener, even if it also carries a fresh trace from an earlier stretch.
- [ ] Every new decision (freshness, "was it company or a need", the memory/ticker/opener strings) is an exported pure function in `world/tic.ts` with unit coverage; `WorldScene` only wires.
- [ ] The beat is held by the ambient pause (`ambientHeld`) like every other ambient beat, so the e2e suite does not race it.
- [ ] An e2e spec drives the production path through dev hooks (the `__resetTic` / `__noticeTraces` precedent — a hook that calls the very method production calls, never a second path) and asserts the ticker line and the greeting lead.
- [ ] Full suite green; `npm run build` clean; no `@mlc-ai/web-llm` import outside `game/src/ai/`.

**Reachability (CHARTER v7).** *In a fresh save, watched for ten minutes:* the Park News ticker starts
carrying a line the park has never printed — one dino coming over while another was mid-ritual — and
the dino it names greets the player with a sentence it has never opened with. The founding cast wanders
freely inside five grounds and a solitary stretch now costs as little as six steps (412), so this fires
on its own within the first minutes without the player doing anything but watching.

**Out of scope.**

- No bond change, no friendship points, no affinity. 422 priced the *keeper's* catch; this is between
  two dinos and it is free. (A bond nudge is a follow-up item, not this one.)
- No escalation across repeats — no glad equivalent of 420's pleased/teasing/resigned register.
- No LLM prompt field. The opener is a deterministic frame in front of the reply; the brain is never
  asked to be glad. (That is BACKLOG-423's lane, and it is not this cycle.)
- No persistence. The trace is transient like the rest of the per-stretch tic state, and it fades in
  well under a save's lifetime anyway.

**Constraints.**

- `resetTic` must still tear down *everything* it tears down today. The beat fires **before** the reset,
  and the reset is unconditional — a stretch that files nothing must still end.
- Do not change `TIC_COMPANY_RANGE` or `undisturbed`. The band that ends a stretch is the band 405
  already named; this reads it, it does not re-tune it.
- The greet path already composes several optional prefixes; the glad opener must sit in the same place
  the caught opener does and share its mutual exclusion, not stack in front of it.

---

## Structure track — BACKLOG-497

**Item.** BACKLOG-497 [infra] *The council nobody can convene* — fold the three council constants, the
founding tallies and the reachability claim into one documented seam beside `founding.ts`, with a test
that boots the shipping roster and asserts at least one ground seats a council.

**Why this cycle.** Governance is the deepest stack in the park — `zoneCouncil` (479) is read by two
votes (481/487), a term (484), a turnover beat (484), a bill lean (485), two lens glyphs (477) and a
book standing (482) — and all of it rests on three numbers picked in cycle 119 against a five-dino bowl:
`COUNCIL_MIN_BANKS = 1`, `COUNCIL_PER_HEADS = 2`, `COUNCIL_SEATS_MAX = 3`. Nothing in the repository
says what population that stack is meant to be *observable* at, and nothing asserts the shipping roster
clears it. 492 discovered the founding park seated nobody by hand, and patched it by hand, for one
ground.

**What ships.** Two halves, and the second is what makes it a cycle rather than a comment.

*The seam.* `world/founding.ts` gains the governance claim in the same place the ruin and the pile
already live:

- `GOVERNANCE_OBSERVABLE_AT` — a documented statement of the population a **single ground** needs before
  it can seat a council that can disagree, derived from the constants rather than restating them
  (`COUNCIL_PER_HEADS * 2` residents, `COUNCIL_MIN_BANKS` banked apiece), with the reasoning written
  down: one seat is a monarchy with a different badge; the majority arithmetic 487 built needs two.
- `foundingCandidates()` — the shipping roster and the founding bank ledger as the `ProviderCandidate[]`
  the role layer consumes, so a test can ask what the park *actually boots into* rather than
  re-deriving it.
- `foundingCouncils()` — the per-ground seating that follows, through `zoneCouncil` itself. Not a second
  copy of the arithmetic: the same function the scene, the lens and the book go through.

*The reachable half.* Reading that seam against today's roster gives the answer 497 was filed to get:
**the founding park seats exactly one council, of exactly one seat.** The Grove has two residents and
`councilSeats(2, 2) = 1`; the bowl — where the player spawns and where five of the eight dinos live —
has banked nothing and so has no council at all. Every governance beat that needs more than one ballot
is therefore unreachable on a fresh save, for exactly the reason 492 found and only half-fixed. So the
founding bank ledger extends to the bowl: **Sunny 2, Glade 1**. Five residents and two eligible gives
`councilSeats(5, 2) = 2` — a two-seat council, both seats under `PROVIDER_BANKS = 3` so no provider
shadows them and the tie-break is `null`, and the two seats vote *opposite ways on the pantry call*
(Sunny's agreeableness is 0.622, Glade's is 0.085). The park's first genuinely contested vote ships on
the ground the player is standing on.

**Acceptance criteria.**

- [ ] `GOVERNANCE_OBSERVABLE_AT` exists beside the other founding constants, derives from `COUNCIL_PER_HEADS` / `COUNCIL_MIN_BANKS` rather than restating their values, and carries the reasoning in its own doc comment.
- [ ] `foundingCandidates()` returns one entry per `ROSTER` dino, carrying that dino's spawn ground and its `FOUNDING_BANKED` tally (absent → 0).
- [ ] `foundingCouncils()` returns the per-ground seating for every ground in `zoneChain()`, computed by calling `zoneCouncil` — no second copy of the seat arithmetic anywhere.
- [ ] A test boots the shipping roster and asserts **at least one ground seats a council**.
- [ ] A test asserts **at least one ground seats two or more voices** — the pin that fails if a later tuning pass to the cast, the banking rate or the seat cap takes the majority arithmetic unreachable again.
- [ ] A test asserts no founding seat holds `PROVIDER_BANKS` — the seats are a council, not a provider wearing one.
- [ ] A test asserts the two-seat ground's seats cast **different** pantry ballots through `votedSpend`, so "can disagree" is machine-checked rather than asserted in prose.
- [ ] A test asserts `councilSeats(GOVERNANCE_OBSERVABLE_AT.residents, GOVERNANCE_OBSERVABLE_AT.residents) >= 2` — the claim and the constants cannot drift apart.
- [ ] The scene's founding seed and its founding-reset hook pick up the new bowl tallies **without a new call site** — both already iterate `FOUNDING_BANKED`.
- [ ] Save-compatible: the change writes ordinary `foodBanked` entries on the `!save` branch only; a restored save seeds nothing and no save version bumps.
- [ ] Full suite green; `npm run build` clean.

**Reachability (CHARTER v7).** *In a fresh save, watched for ten minutes:* press the lens key to the
zone lens without walking anywhere and the ground the player spawned on shows two seated voices where
it has always shown none, and the collection book gives Sunny and Glade a standing they have never had
— *one of the Pocket Cretaceous's 2 voices*. When that ground's pantry call comes up it is decided by
two dinos who want opposite things, which is the first time in this park's life that a vote has had
anything to count.

**Out of scope.**

- Not re-tuning `COUNCIL_MIN_BANKS`, `COUNCIL_PER_HEADS` or `COUNCIL_SEATS_MAX`. The item asks for the
  constants to be *stated and pinned*, and moving them is a separate cycle with its own evidence.
- Not the e2e founding fixture (BACKLOG-495). Named as next, deliberately not started here.
- Not the empty grounds (BACKLOG-500) — the Hollow and the Ridge still ship with no residents and
  therefore still seat nobody. That is 500's cycle, and this cycle's tests must not accidentally
  assert it away.
- Not making a three-seat council reachable. Two is the number the majority arithmetic needs.

**Constraints.**

- `founding.ts` must stay Phaser-free and import-light: it may reach `ROSTER`, `zones` and `ai/roles`,
  and nothing that drags the scene in.
- Any e2e or unit spec that asserts the bowl seats nobody, or that the founding bank ledger is
  Grove-only, is asserting the defect. Update it and say so in the QA notes — do not weaken the new
  pins to keep it.
- Both tracks touch `WorldScene`. They do not touch the same method: 411 lives in the tic step branch
  and the greet path; 497 lives in the founding-seed branch and touches no method at all if the
  `FOUNDING_BANKED` iteration holds. **Land the lore track first** — it is the larger diff.
