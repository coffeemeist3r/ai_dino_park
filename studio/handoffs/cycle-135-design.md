# Cycle 135 — Design

Two tracks, two different corners of the codebase: the lore track is `world/tic.ts` plus the solitary-stretch
block of `WorldScene`; the structure track is `world/governance.ts` plus the governance block of `WorldScene`.
The only shared file is `WorldScene.ts`, and the two regions are ~500 lines apart. Build structure first
(it touches the wider blast radius), then lore.

---

## Lore track — BACKLOG-416

**Item:** BACKLOG-416 [emergent] Not the only one — when two solitary dinos happen to tic within sight of each
other (just past company range, so neither breaks), each files a faint "not the only one out here" — a wordless
kinship between loners without contact or a bond change.

**Why this cycle:** Milestone 14 taught the private ritual (405) to travel. Every beat it added needed a
*channel*: a sting to start it (412), a friend near enough to watch and learn it (407), a book to name it (409).
This is the one beat in the thread that has no channel at all. Two dinos, each deep enough into its own solitude
to have invented a ritual, each near enough to see the other at it, and **neither one crosses**. The band that
makes it possible is the band 407 already established and named — strictly past `TIC_COMPANY_RANGE` (any nearer
and no ritual would have formed) and inside `ECHO_WATCH_RANGE` (any further and there is nothing to see). 407
read that band for the case where one dino is ticcing and the other is idle; nobody has ever read it for the
case where **both** are. That case is the whole feature, and it is nearly free: the geometry already exists, the
solitary-stretch bookkeeping already exists, and the beat asks for nothing the sim does not already track.

Deliberately *no bond floor* and *no bond change* — 407 requires a real friend because you cannot learn a
stranger's ritual from a distance, but you can absolutely feel less alone next to one. That asymmetry is the
design, not an oversight: this is the first thing in the park that two dinos share without knowing each other.

**What ships:**
- When a dino falls into its ritual and another dino **in the same zone** is *also currently ticcing* at a
  Chebyshev distance strictly greater than `TIC_COMPANY_RANGE` (3) and at most `ECHO_WATCH_RANGE` (8), **both**
  dinos file a one-time memory naming the other: "you were not the only one out here — <Other> kept to its own
  ritual across the way".
- One ticker line per pairing, naming both: "🌑 <A> and <B> keep to their own rituals, in sight of each other".
- **No** float/glyph over either dino, **no** bond change, **no** dialogue, **no** interruption of either
  ritual. Both keep ticcing exactly as they were. The beat is legible only in the ticker and, later, in talk.
- Once per solitary stretch, per dino: a dino that has filed its kinship note this stretch does not file
  another, and the flag clears when its stretch ends (company or a need returns) — the `ticCaughtFiled`
  precedent, cleared in `resetTic`.
- Persists nothing new: the memory goes into the existing per-dino ring, and the per-stretch flag is transient
  like every other per-stretch flag in that block.

**Acceptance criteria:**
- [ ] `world/tic.ts` exports `kinshipMemory(other: string): string` and `kinshipLine(a: string, b: string): string`, both pure, both unit-tested.
- [ ] Unit: the kinship band is `watchingTic` and no second number is introduced — a spec asserts `watchingTic(3) === false`, `watchingTic(4) === true`, `watchingTic(8) === true`, `watchingTic(9) === false`, and that the 416 scan is gated on that same predicate.
- [ ] Unit: `kinshipMemory('Mossback')` contains `Mossback` and does not contain the word "friend" (this is not a bond beat).
- [ ] Unit: `kinshipLine('Rex','Sunny')` names both dinos.
- [ ] E2E: two dinos in the same zone, ~5 tiles apart, both driven into their tic; step the world and assert **both** dinos' memory rings contain the kinship note.
- [ ] E2E: the same two dinos at distance 2 (inside company range) file **no** kinship note for either — and in fact neither invents a ritual, since company breaks solitude. Pins that the beat cannot fire through the near case.
- [ ] E2E: the two dinos at distance 10 (outside `ECHO_WATCH_RANGE`) both invent rituals and **neither** files a kinship note.
- [ ] E2E: the pairwise bond between the two dinos is **unchanged** across the beat (read before and after via the bonds dev hook).
- [ ] E2E: the note is filed at most once per stretch — stepping the world further with both still ticcing adds no second copy to either ring.
- [ ] `npx vitest run` and `npx playwright test` green; `npm run build` clean.

**Out of scope:**
- Any bond change, any dialogue line, any float glyph over either dino, any change to who ticcs or when.
- Making the kinship note surface in a greeting — the memory being *available* to the existing
  greeting/reflection path is the whole delivery, exactly as `ticMemory` was in 405.
- Three-or-more-way kinship as a distinct beat: with N dinos ticcing in band, each pairing is filed
  independently by the same loop, which is the correct generalization and needs no special case.
- Anything in the collection book (415 owns the "keeps to itself" bar and is not this item).

**Constraints:**
- Both dinos file, so the beat must run from a place that can see the *other* dino's live tic state. Run it from
  `performTic`'s invention branch — the same once-per-stretch seam `watchTic` (407) already uses — and have it
  read `ticInvented` for the other dino. That means the pairing fires when the **second** of the two falls into
  its ritual, which is the honest moment: until then there was only one loner out there.
- Must not disturb 407: `watchTic` skips a dino that already carries an echo, and the kinship scan must not
  change `ticWatches`, `ticEchoes` or `ticEchoFrom` in any way. Two independent reads of one band.
- `ambientHeld` must gate this the way it gates `watchTic` — a held ambient sim files nothing.
- File overlap with the structure track: `WorldScene.ts` only, ~500 lines apart. Structure lands first.

---

## Structure track — BACKLOG-487

**Item:** BACKLOG-487 [core] The other call goes to the council — the ground's spend priority (463) runs
through the same vote the work priority (473) now uses.

**Why this cycle:** This is Milestone 14's last unchecked arc. When 481 handed the *work* call to the council
it left the *spend* call with the provider on purpose and said so in the source: "leaving 463 with the provider
means the unchanged call sits beside the changed one as a live control." That control has now run four cycles.
The voted call acquired a term (484), a turnover beat (484), and a feedback loop from the ground's own
skyline (485). The unvoted one is still re-set unilaterally, silently, by whoever out-banks everyone else,
every time a provider changes (467). The control has reported; retire it. And it retires *cheaply* — 481's
majority arithmetic is not specific to `WorkPriority`, so 487 is a generic plus a mirror of `decideWork`,
not a second governance system.

**What ships:**
- `governance.ts` grows `councilMajority<T extends string>(votes, tieBreak)` — 481's exact arithmetic, made
  generic over the enum. `councilWorkPriority` becomes a one-line delegation to it (its own spec unchanged and
  still passing), and a new `councilSpendPriority(votes, tieBreak)` is its twin.
- Each seat votes its spend call with `providerPriority(traits)` — the **same** agreeableness read the provider
  always used, so a council of one behaves exactly as that one dino did alone. Majority wins; a tie falls to
  the provider's own vote, and with no provider to `votes[0]` (most-banked first). Identical tie-break law to
  481's, for the same recorded reason.
- `WorldScene.spendPriorityFor` becomes the mirror of `workPriorityFor`/`decideWork`: council first, then the
  standing provider, then the lingering stored policy, then `null`. The `null` seam is untouched, so both spend
  hooks (`feedReserve` at `feedFromStores`, `granaryDeferredForFeeding` at `buildOnGather`) and the discontent
  ledger (471) read exactly as before on any ground that seats nobody.
- The spend call lands a **ticker beat when it changes**, the way the work call has since 481:
  "🗳️ the <Ground>'s council calls it: <meaning>", in the legend's own words via a new `spendCallMeaning`
  reading `SPEND_CALL` — one table, and now three readers on both calls instead of two on one. The first call
  a ground records seeds silently (the `checkCouncilCall` first-seating precedent), so a reload announces nothing.
- The handover beat (467) consequently fires on a **vote** rather than one dino's temperament: `spendPriorityFor`
  is what it reads, and that function now answers the council.

**Acceptance criteria:**
- [ ] `councilMajority` is exported from `world/governance.ts`, generic, and unit-tested directly: majority wins; unanimity wins; an even split returns `tieBreak`; an even split with `tieBreak === null` returns `votes[0]`; `[]` returns `null`.
- [ ] Unit: `councilWorkPriority` still returns identical answers to its pre-487 spec for every case that spec covers (the existing `governance.test.ts` cases pass untouched).
- [ ] Unit: `councilSpendPriority(['feed','feed','bank'], null) === 'feed'`; `councilSpendPriority(['feed','bank'], 'bank') === 'bank'`; `councilSpendPriority(['feed','bank'], null) === 'feed'`; `councilSpendPriority([], 'feed') === null`.
- [ ] Unit: `spendCallMeaning('feed')` and `spendCallMeaning('bank')` return exactly the `meaning` strings in `SPEND_CALL`, so the ticker can never announce a spend call in words the `[?]` legend disagrees with.
- [ ] E2E: a ground that seats **no** council still reads the provider's spend priority — `__spendPriority(zone)` is byte-identical to its pre-487 answer on a fresh save. The compatibility control.
- [ ] E2E: a ground seating a council whose **majority** disagrees with the provider reads the majority's call from `__spendPriority(zone)`, and the spend hooks follow it (the bank reserve applied / not applied accordingly).
- [ ] E2E: when a ground's spend call flips, a `🗳️ ... council calls it:` line appears in the event ticker naming the ground and the legend's own meaning text; the *first* recorded call after a reload announces nothing.
- [ ] E2E: the `[?]` governance legend and the zone-map lens row are unchanged (`governanceLine` / `governanceLegend` untouched — the spend glyph already existed and still means the same thing; only *who decided it* changed).
- [ ] Old saves load: a save carrying `spendPriorityByZone` from before this cycle loads and its stored policy is still honoured as the lingering fallback when no council and no provider stand. Additive only — no new save field.
- [ ] `npm run build` clean; `npx vitest run` and `npx playwright test` green.

**Out of scope:**
- **Not** giving votes anything to read besides the birth trait — that is the freshly-seeded BACKLOG-492, and
  it is deliberately the next item rather than this one. 487 must land the *seat* of the decision before 492
  can change *what the seat knows*.
- Not touching the term (484), the bill's lean (485), the discontent gate (471), or the four freshness gates
  489 owns. If the spend beat needs a gate, it uses `checkCouncilCall`'s existing first-seating pattern
  verbatim and does **not** attempt 489's shared seam.
- No new lens glyph, no new legend row, no book line. The spend call has been on the lens since 468.
- No change to `providerPriority`'s own temperament read — the same function, now called once per seat.

**Constraints:**
- `spendPriorityFor` is called from ~8 sites, several more than once per step. It must stay cheap and, crucially,
  the **ticker beat must not fire from inside it** — announce from `checkCouncilCall` only, exactly the rule 481
  wrote for the same reason ("which several hooks call several times a tick and which would announce the same
  vote four times a step").
- `spendPriorityFor` is called with a non-null assertion at the handover site (`WorldScene.ts:2992`). It is
  reached only under a live provider, and the council branch cannot make it `null` (a non-empty council always
  yields a call), so the assertion stays sound — but the Coder must confirm that rather than assume it.
- Default 5-dino park: `councilSeats` needs 6 residents for a second seat and `COUNCIL_MIN_BANKS` to seat
  anyone at all, and `zoneCouncil`'s comparator is byte-identical to `zoneProvider`'s, so seat 1 is always the
  provider. A shipping park is therefore **bit-identical** after this change, which is what keeps the
  regression risk low — and is also why the interesting E2E must seed a grown ground deliberately.
- File overlap with the lore track: `WorldScene.ts` only. Build this track first.
