# Cycle 127 — Design

Two tracks. **Lore:** BACKLOG-402 — the manner at the hatch (Milestone 12 lore arc 3 of 3, the last
one). **Structure:** BACKLOG-479 — more than one voice on the call (Milestone 12 structure arc 3 of 4).

---

## Lore track — BACKLOG-402 (Hatch temperament in the book)

**Item:** BACKLOG-402 [pokemon] Hatch temperament in the book — the collection book shows each dino's
table manner (generous / greedy / unbowed / timid), one legible `at the hatch:` line derived from the
feeding tallies, replacing three separate counters the player has to average in their head.

**Why this cycle.** The contested-drop trio has been complete since cycle 84-ish and has never been
*read*: `yieldFoodTo` (375/385), `gobblerAmong` (387) and `standsGround` (390/394) each file their own
memory string in `checkFeeding`, and the book shows none of them. Milestone 12's lore half is about a
cast that doesn't blur, and the two shipped arcs answered that by adding behaviour. This one answers it
by **reading what is already recorded** — the right closing beat for the milestone, because the blur it
removes is one the park created for itself by accumulating tallies faster than it made them legible.
The four manners fall out of the four memory strings already in the ring, which is why this is a
derivation and not a new counter: the `foodwebStanding` (443) precedent is explicit that a standing is
what a dino *remembers*, not a second persisted tally.

**What ships.**

A new pure module `game/src/world/manner.ts` deriving a **table manner** from a dino's live memory ring:

| manner | earned by | memory string already filed |
|---|---|---|
| generous | stepping back so a hungrier friend eats first | `you stepped back and let <name> eat first` (375), `you repaid <name>'s kindness at the hatch` (385) |
| greedy | shouldering past the winner of a drop | `you shouldered past <name> and snatched the food first` (387) |
| unbowed | holding the tile when a gobbler pushed | `you stood your ground and kept your food from <name>` (390) |
| timid | backing off when someone wouldn't budge | `<name> wouldn't budge — you slunk off` (394) |

The manner is the **highest count**. Ties break by a fixed precedence — `unbowed > greedy > generous >
timid` — chosen so the rarer, more characterful read wins and, in particular, so **timid never wins a
tie**: a dino that slunk off once and yielded once is generous, not timid, because one lost contest is
not a character. A dino with no contested-drop memory at all has **no manner** (`null`) and shows no
line, exactly as `foodwebStanding` shows nothing at 0.

In the collection book (`ui/lenses.ts` `bookLines`), an optional `manner` row renders under the
food-web line as `🍽️ at the hatch: generous — steps back so a friend eats first`. One line per dino,
one glyph (🍽️, already the spend-policy glyph, used here in its plain feeding sense — see Constraints).

**Acceptance criteria**

- [ ] `hatchManner([])` is `null`; `mannerLine([])` is `null` (no line for a dino that has never contested a drop).
- [ ] A ring holding only `you stepped back and let Rex eat first` derives `generous`.
- [ ] A ring holding only `you shouldered past Rex and snatched the food first` derives `greedy`.
- [ ] A ring holding only `you stood your ground and kept your food from Rex` derives `unbowed`.
- [ ] A ring holding only `Rex wouldn't budge — you slunk off` derives `timid`.
- [ ] The 385 repay memory (`you repaid Rex's kindness at the hatch`) counts toward **generous**.
- [ ] Two generous memories + one greedy derives `generous` (highest count wins, not most recent).
- [ ] A 1–1 generous/timid tie derives `generous` (timid never wins a tie).
- [ ] A 1–1 greedy/unbowed tie derives `unbowed` (the declared precedence).
- [ ] `mannerLine` for each manner returns a single line starting `🍽️ at the hatch: <manner> — ` with a description.
- [ ] `bookLines` renders the manner row only when `BookRow.manner` is set; a row without it is byte-identical to before.
- [ ] E2E: with a manner memory injected for a named dino via the dev hook, opening the collection book (`V` to the book lens) shows that dino's `at the hatch:` line; a dino with no such memory shows no such line.
- [ ] Zero console errors on the e2e run.

**Out of scope**

- Any *new* tally, counter or save field. The manner is derived from the live ring, full stop.
- Voicing the manner (a dino saying it), the scan reading it, gossip about it — 264's shape for gratitude manner is the model for a later cycle, not this one.
- Changing any feeding behaviour, threshold or memory string. If a memory string has to change to make this derivable, the derivation is wrong.
- Lifetime tallies that survive the 6-slot recall window. The standing is recent behaviour on purpose (443's rule).

**Constraints**

- Pure module, Node-testable, no Phaser import.
- The 🍽️ glyph is already in use on the zone-map lens as the feed-first *spend policy* (468). It is not ambiguous here — different lens, different subject (a dino, not a ground) — but the book row must carry the `at the hatch:` prefix so the two never read as the same fact.
- No file overlap with the structure track except `ui/lenses.ts` (this track touches `BookRow` + `bookLines`; 479 touches `ZoneMapEntry` + `zoneMapModel`) and `WorldScene.ts` (different methods: `bookRows()` vs `zoneMapEntries()`). **Sequence: do 402 first**, then 479, so the two lens edits land in separate hunks.

---

## Structure track — BACKLOG-479 (More than one voice on the call)

**Item:** BACKLOG-479 [emergent] More than one voice on the call — a derived per-zone **council** (the
top few food-bankers of a ground, not only its single top banker) as a persistent standing beside
`provider`.

**Why this cycle.** Governance in this park is one dino setting two enums. 463 gave the provider a
spend priority, 473 a work priority, 467 made the handover a swap of that whole table — a monarchy, and
an honest one, but a monarchy. BACKLOG-031 ("at threshold population, NPCs vote on a simple rule") has
been open since cycle 1 and deferred every time, and the reason was never that a vote is hard: it is
that **there has never been a set of deciders**. This cycle derives the set. Nothing votes yet — 481 is
already queued for that — and building the seam a cycle before the thing that uses it is the same
discipline that put 456 (the trustworthy suite) a cycle before 478 (the fork).

**What ships.**

`zoneCouncil()` in `game/src/ai/roles.ts`, beside `zoneProvider()` — same module, same
`ProviderCandidate` shape, same tie rule:

- **Who is eligible:** a resident of that zone whose `foodBanked` is at least `COUNCIL_MIN_BANKS = 1`. A dino that has banked nothing has no claim on the pantry's say. It does **not** require the settled `provider` role — the council is broader than the role by construction, which is the entire point of the item.
- **How many seats:** one voice per `COUNCIL_PER_HEADS = 2` residents, floored, minimum 1 when anyone is eligible, capped at `COUNCIL_SEATS_MAX = 3`. So a ground of 1 seats 1, a ground of 4 seats 2, a ground of 6+ seats 3.
- **Who sits:** the eligible residents by banked-food descending, ties alphabetical (identical to `zoneProvider`, so a reload never reseats the council).
- **Degenerate cases, which are the load-bearing ones:** an unsettled ground (474) with no residents returns `[]`; a ground hollowed to one resident (the 460 floor) returns that one dino if it has banked, else `[]`; a fresh park where nobody has banked anything returns `[]` **park-wide**, so the whole feature is inert on a new save and the suite stands still — the 476 calibration standard.
- **Derived, never stored.** No save field, no migration, no second list to fall out of sync — `provider` (448) and the hop table (475) are both precedent.

Surfaced in two places, both minimal:

1. **Zone-map lens** — the head-count line gains ` 👥N` when a zone seats a council (`3 🦕  👥2`). No new row, no box resize; `ZoneMapEntry` gains `council: string[]` and `zoneMapModel` a trailing optional `councils` param (the existing positional style — folding these into one options bag is BACKLOG-482's job, queued this cycle).
2. **Collection book** — a seated dino gets `👥 one of the Grove's 2 voices` (same glyph, so the lens and the book teach each other).

**Acceptance criteria**

- [ ] `zoneCouncil([], 'grove')` is `[]`.
- [ ] A zone whose residents have all banked 0 returns `[]` (a fresh park seats nobody anywhere).
- [ ] A zone with 1 resident who has banked ≥ 1 returns exactly that dino (1 seat).
- [ ] A zone with 4 eligible residents returns the top **2** by banked food.
- [ ] A zone with 6+ eligible residents returns exactly **3** (the cap).
- [ ] Residents of *other* zones are never seated, whatever they have banked.
- [ ] A resident with `foodBanked` 0 is never seated even when seats remain unfilled.
- [ ] The council is ordered banked-descending; an exact tie orders alphabetically and is stable across repeated calls.
- [ ] The zone's `provider` (when one exists) is always seat 1 of that zone's council — the two reads never disagree about who banks most.
- [ ] `zoneMapModel` called without the new `councils` argument yields `council: []` on every entry (older callers/tests unchanged).
- [ ] The lens box shows ` 👥N` only when N ≥ 1; a zone with no council shows the head-count line exactly as before.
- [ ] `bookLines` renders the council row only when `BookRow.council` is set.
- [ ] E2E: banking food for a dino via the existing dev hooks and opening the zone map (`V` to the map lens) shows a `👥` marker on that dino's zone; a fresh boot shows none on any zone.
- [ ] Zero console errors on the e2e run.

**Out of scope**

- **Voting.** The council decides nothing this cycle; the provider still sets both calls. That is BACKLOG-481.
- Any change to `provider` emergence (448), the handover beat (467), or either priority (463/473).
- A council seat as a `Role` value. `Role` is a per-dino singular job; a seat is a per-zone standing, and conflating them would break `settleRole`'s durability rule.
- Dialogue, gossip or a ticker beat about the council. Word of the council travels in a later cycle if it earns one.
- Folding pioneer/provider/council into one standings module — queued as BACKLOG-482 on purpose, *behind* this item, because the fold is only honest once the third standing exists.

**Constraints**

- Pure derivation in `ai/roles.ts`; no Phaser, no new module needed (reuse `ProviderCandidate` — the Coder must check prior art here before adding a type).
- Additive save changes only; this item ideally adds **none**.
- `@mlc-ai/web-llm` stays out of everything touched (`ai/roles.ts` is under `game/src/ai/` but has never imported it and must not start).
- File overlap with the lore track: `ui/lenses.ts` and `scenes/WorldScene.ts` only — different symbols in each. Land 402 first.
