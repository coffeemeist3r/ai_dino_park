# Cycle 120 — Design

Two tracks, both Milestone 10. The lore track gives the *teller* of news a stake for the first time in
seventy cycles of gossip; the structure track makes an empty ground reachable, foundable and legible.

---

## Lore track — BACKLOG-364

**Item:** BACKLOG-364 [emergent] *The one who knew first* — a dino that has been to a ground and tells a
never-been dino about it keeps a small teacher's-pride memory naming the ground and the listener.

**Why this cycle.** Milestone 10 lore arc 2. Queued at cycle 79 in its grove-and-pond wording ("showed them
the pond"); the milestone reframes it to any ground, which is now the only honest framing — there are four
grounds and one of them nobody has ever stood in. Every news system in the park (019 gossip, 185 cold word,
223 warm word, 342 grove word, 453 provider word, 470 policy word, 458 plenty word) moves a fact from a
speaker to a listener and gives the *listener* the memory. The speaker is a pipe. This item makes being the
one who knew first a thing that marks the dino who knew it — the CHARTER's distinctness goal applied to
knowledge rather than temperament.

**What ships.**

- The park keeps, per dino, the set of **grounds it has actually set foot in** (`seenZones`). Seeded from
  each dino's home zone at spawn/load — a dino that lives in the bowl has plainly seen the bowl — and added
  to at the same two arrival seams 343 already uses (`crossDino`, the visible crossing; `relocate`, the
  instant path the dev hooks and away catch-up take). This is the general form of `groveVisited`, which
  stays exactly as it is and keeps owning the grove beats (339/346/342 are untouched).
- When two dinos meet, if the speaker has seen a ground the listener has **not**, the speaker *shows them
  the way*: it files a pride memory naming the listener and the ground (`🚩 showed <listener> The Hollow`),
  the listener files a rumor-marked word memory of that ground it can't re-spread, both gain a small bond,
  and a ticker line reports it. Deterministic pick when the speaker knows several grounds the listener
  doesn't: the first in `zoneChain()` order, so the same meeting always teaches the same ground.
- Once per (speaker, listener, ground): the pride memory itself is the dedup key, so a pair that keeps
  meeting doesn't re-teach the same place, but a speaker that later sees a *fourth* ground has something new
  to show the same friend.
- The teaching is **independent of the gossip cascade** — it runs beside `pondSwapBeat`, not as another rung
  in the `relief → warm → cold → grove → provider → policy → plenty → generic` chain. A dino can lead with
  a cold night *and* show its friend the Hollow in the same meeting; those are different registers, and
  wedging a rung into that chain would make one of the eight existing beats silently rarer.
- The collection book reads it: a dino that has shown others grounds gets a line
  (`showed 2 others the way to The Hollow`, naming the ground it has taught most). Optional `BookRow` field
  on the 303/393/012/443/343 precedent, so existing `BookRow` literals stay valid.

**Acceptance criteria.**

- [ ] `seenZones` records a dino's home zone at spawn, and adds the destination on **both** arrival seams
      (visible crossing and instant relocate) — unit-tested for both.
- [ ] Two dinos meeting where the speaker has seen a ground the listener hasn't: the speaker's memory gains
      a pride entry naming the listener and the ground; the listener's memory gains a rumor-marked entry
      naming the speaker and the ground.
- [ ] The listener's entry carries `RUMOR_MARK` and is therefore **not** re-shareable (1 hop, like every
      other word in the park).
- [ ] The pride memory is not shareable and does not contain `GROVE_NEWS_TOKEN` — it can never be mistaken
      for first-hand grove news and re-spread (the 346 `pondSwapMemory` precedent).
- [ ] Nothing fires when the listener has already seen every ground the speaker has (including the common
      case of two bowl-only dinos).
- [ ] Nothing fires between a dino and itself.
- [ ] A second meeting of the same pair with no new ground in between teaches nothing (dedup).
- [ ] Both dinos gain a small bond on a successful teaching; the ticker logs one line naming teacher,
      learner and ground.
- [ ] The collection book shows the teaching line only for dinos that have taught at least once.
- [ ] The eight-rung gossip cascade is byte-identical — the same rung wins the same meeting as before.
- [ ] Save is additive: `seenZones` absent in an old save → seeded from live home zones, no version bump.
- [ ] Dev hook exposes the record for e2e (`__seenZones`), and a hook drives one teaching directly.

**Out of scope.** LLM-authored teaching dialogue (the bubble uses the deterministic line; brain colour is a
later item). A "learner wants to go there" migration priming — that is 458's job for plenty and 362's for
yearning, and doubling it here would make the two indistinguishable in the migration logs. Retro-filling
`seenZones` with grove history from `groveVisited` (the park did not record cross-zone visits before; the
bowl seed plus live crossings is the honest floor, same reasoning as 343's no-back-fill).

**Constraints.** The gossip cascade in `WorldScene.startConversation` must not gain a rung. `groveword.ts`
and `groveVisited` are not to be refactored into the new record this cycle — 339/342/346 are shipped
behaviour pinned by cycle-076/078 specs. Pure logic in a new `game/src/world/taught.ts`; WorldScene glue
stays thin.

---

## Structure track — BACKLOG-474

**Item:** BACKLOG-474 [core] *The unsettled ground* — a zone fills from empty by migration alone; the first
to settle founds it.

**Why this cycle.** Milestone 10 structure arc 2, the arc that closes the milestone's spine. 472 proved a
fourth ground is a row of data; it did not prove anyone can get there. An unsettled ground's appeal is the
lowest in the park by construction (`zoneProsperity` = structures×3 + heads×2 + harvested + stockpile = 0)
and the destination pick takes the **highest** appeal, so the Hollow is unreachable in practice by the
system that is supposed to populate it. The milestone's promised proof — a ground the player watches get its
first resident — is one destination tier and two readouts away.

**What ships.**

- **A frontier pull.** A ground is *unsettled* when it has **no residents and has never been founded** (no
  pioneer). The migration destination pick gains a tier above the richest-neighbour read: if any neighbour
  of the migrant's home is unsettled, that's where it goes. Deterministic (`ZONE_LINKS` order on a tie), so
  it can't become the BACKLOG-456 flake shape. The "never founded" half matters: a ground that hollows out
  later has a pioneer forever, so it is a *declining* ground (460's job) and never re-reads as frontier.
- **A founding you can watch.** `foundZone` already fires at both arrival seams and already knows whether
  this footfall founded the ground — it returns nothing today, so make it return that fact and ride it. The
  first arrival in a never-founded ground gets a settling beat over the existing pioneer ticker line: a
  bubble, a memory the founder keeps (`🌱 first to settle The Hollow`) that can colour a later greeting, and
  a ticker line. One dino, once, per ground, forever.
- **An unsettled read on the lens.** `zoneMapModel` gains an `unsettled` flag; the zone-map lens shows an
  empty, never-founded ground as unsettled instead of `○ quiet · 0`, and stops the moment someone lives
  there. This is the whole player-facing point of the milestone arc — the box on the lens that changes.
- **Confirm, don't rebuild, the pop-0 reads.** Pin with tests rather than code: prosperity 0 → `quiet`;
  `zonePopulations` seeds every `ZONES` id; the pantry is an empty pile; `providerFor` → null and
  `spendPriorityFor` → null (both governance hooks documented inert at null); `isDeclining` false at heads 0
  (an unsettled ground never wears ⬇); `ZONE_FLOOR = 1` keeps the founder from wandering straight back out;
  `checkLastOne` (464) stays silent at peak 1 / heads 1 so a founder is not told its new home has gone quiet.

**Acceptance criteria.**

- [ ] `isUnsettled` is true only for a ground with 0 residents **and** no recorded pioneer; false for an
      inhabited ground and for an emptied ground that was once founded.
- [ ] With an unsettled neighbour available, a migrating dino's destination is that ground, over a richer
      inhabited neighbour; the pick is deterministic under a fixed input order.
- [ ] With no unsettled neighbour, the destination is byte-identical to today's `richestNeighbor` result.
- [ ] The first dino to arrive in a never-founded ground gets a settling memory, a bubble and a ticker line;
      the second arrival gets none of the three.
- [ ] The settling beat fires on both arrival seams (visible crossing and instant relocate).
- [ ] The zone-map lens marks an unsettled ground as unsettled, and does not once it has a resident.
- [ ] Tests pin: prosperity 0 → `quiet` tier; `isDeclining(0, 0)` false; `checkLastOne` silent for a
      founder alone in its new ground; `providerFor`/`spendPriorityFor` null on an empty ground.
- [ ] A dino that founds a ground is recorded as its pioneer by 343 with **no new pioneer code** — the same
      generalization proof this milestone keeps making.
- [ ] Save is additive; no version bump (the pioneer map that backs `isUnsettled` is already persisted).
- [ ] Dev hooks: `__unsettled()` reports the current unsettled grounds.

**Out of scope.** A ground being *added* to the chain at runtime (the `ZONES` table stays static; 472's row
is the fourth ground). Emptying an inhabited zone to re-open it as frontier. The first-to-bank-founds-the-
provider half of 474's text — `deriveRole`/`providerFor` already produce exactly that with zero new code the
moment the founder banks `PROVIDER_BANKS` units, so it is a test to write, not a feature to build. Hop
distance (475) and any change to how *far* a migrant will travel: the frontier pull is neighbour-scoped,
same as every other destination read today.

**Constraints.** No weight tweak to `zoneAppeal` — appeal is documented monotonic in plenty and an
unsettled ground is genuinely the poorest place in the park; a frontier bonus folded into appeal would make
"appeal" mean two different things and would leak into `poorestResidents` (which decides *who* leaves) as an
unintended side effect. The frontier tier sits in the destination pick only. Word-of-plenty priming (458)
keeps its precedence over the scarcity pick; decide and document where frontier sits relative to it.

---

## File overlap between the tracks (for the Coder's sequencing)

Both tracks touch `WorldScene.crossDino` and `WorldScene.relocate` — the two arrival seams — within a line
or two of the existing `foundZone` call, and both add a field to the save envelope. Everything else is
disjoint: 364 is `world/taught.ts` + the meeting seam + a book row; 474 is `world/frontier.ts` +
`scarcityDestOf` + `foundZone`'s return value + the lens model. **Land the structure track first** (it only
changes `foundZone`'s signature and the two call sites' use of its return), then the lore track adds its
`markSeen` line beside it. `world/scarcity.ts`, `world/decline.ts` and `world/pioneer.ts` are read but not
edited by either track.
