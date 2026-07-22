# Cycle 108 — Design

Milestone 6 ("No zone stands alone"), the last lore arc and the fourth structure arc. Last cycle the park
grew its first *economic* role; this cycle the residents learn to say its name — and the ground they all
stand on stops being three hand-written functions.

---

## Lore track — BACKLOG-453 (Word of the provider)

**Item:** BACKLOG-453 [social] Word of the provider.

**Why this cycle:** It is the only unchecked Milestone 6 lore arc, and its blocker cleared last cycle when
448 landed the durable `provider` role. Right now that role is a *lens tag*: the park's first standing that
comes from the economy rather than the social graph, and the only way to learn it is to open a debug lens.
Every other standing this park has invented earns its weight the moment a second dino says it out loud — the
cold night became real when it started travelling (185), the cleared name when someone thanked its clearer
aloud (247). A provider nobody talks about is a database column. This closes M6's checklist by putting the
pantry-keeper's name in the residents' mouths, in both registers the park already has: what a dino tells
*you*, and what a dino tells *another dino*.

**What ships:**

**1. A zone has a provider.** A new pure read: given the residents of a zone and their banked-food tallies,
the zone's provider is the resident whose settled role is `provider` and whose tally is highest (ties broken
by name, so it is deterministic). A zone with no such resident has no provider and everything below is inert.
This is the per-zone ranking 448 deliberately deferred — the role stays park-wide per dino; this only asks
"of the dinos living *here*, who is the one keeping this pantry full."

**2. The keeper hears it (greeting).** A dino greeted in a zone that has a provider lets the standing slip
into whatever it was going to say — third person, about someone else:

> *There you are, friend! Sunny's been hoping you'd come round.* **The Fernreach eats because of Sunny, if you're keeping track.**

Temperament-shaded exactly like the hunger tell (368) and the rattled aside (440), because that is what this
park decided distinctness means (253/261/262): a prickly dino concedes it grudgingly, a warm one makes a
whole thing of it, an even-tempered one states it. The **fact is identical in all three** — only the voice
moves. It composes onto every existing register (gratitude / wistful / fond / generic / hungry / rattled),
appended last, because it is the least urgent thing a dino has to say.

**A provider never says it about itself.** If the dino being greeted *is* its zone's provider, no aside
fires. Reputation is what others say when you are not the one talking; a provider bragging is a different,
weaker beat. This is a hard rule, not a nicety.

**3. The park passes it on (gossip).** `spreadProviderWord` joins the existing meet cascade in `converse` as
a new rung — the same 1-hop `RUMOR_MARK` shape as `spreadColdWord` / `spreadWarmWord` / `spreadGroveWord`.
When two dinos meet in a zone with a provider and the speaker is not that provider, the speaker leads with
the word; the listener files it as a heard rumor (so it cannot re-spread), and a 🧺 ticker line names the
exchange. Cascade position: **below grove-word, above generic gossip.** A live worry (relief/warm/cold)
outranks it because hardship is urgent; a fresh sighting (grove) outranks it because news beats background;
it beats a generic retelling because it is about the ground the speaker lives on.

Because the rumor lands in the listener's memory, it rides `recall` into that listener's own next greeting
through the channel every other trace uses — so the word genuinely travels without a second mechanism.

**4. The model may colour it, and never has to.** The deterministic aside is the floor. `webllmBrain`'s
`buildMessages` gains the same fact as one prompt clause, exactly like 368/440 — nothing behavioral depends
on the model reaching it.

**Acceptance criteria:**
- [ ] `zoneProvider` returns the highest-tally `provider`-roled resident of a zone; a zone with residents but no provider role returns null; ties between equal tallies resolve to the alphabetically-first name.
- [ ] `zoneProvider` ignores providers living in a *different* zone (a provider in the grove is not the Fernreach's provider).
- [ ] `cannedReply` for a dino in a zone with provider `Sunny` appends an aside containing both `Sunny` and the zone name; the same call with no provider produces the byte-identical line it produces today.
- [ ] The aside differs between a prickly dino (`agreeableness < PRICKLY_MAX`), a warm one (`> EFFUSIVE_MIN`), and an even-tempered one — three distinct strings, each naming the same provider and zone.
- [ ] Greeting the provider itself produces **no** provider aside (no self-praise), while greeting any other resident of that zone does.
- [ ] The aside composes: a hungry, rattled dino in a provider zone shows the hunger tell, the rattled tell, **and** the provider aside, in that order, within the reply's length cap.
- [ ] `spreadProviderWord` plants a rumor carrying `RUMOR_MARK` on the listener and returns it; the planted rumor is not itself shareable (`isShareable` false), so it stops after one hop.
- [ ] `spreadProviderWord` returns `{ rumor: null }` and an unchanged store when: speaker === listener, the zone has no provider, or the speaker *is* the provider.
- [ ] In `converse`, provider-word fires only when relief / warm / cold / grove word all decline, and posts a 🧺 ticker line naming speaker and listener.
- [ ] A listener that heard provider-word carries it in `recall`, so its own next greeting can surface it through the existing memory channel.
- [ ] e2e: with a provider established in the active zone, greeting a non-provider resident shows a dialog line naming the provider and the zone.

**Out of scope:** the collection book (448 already shows the role there — no new book row this cycle); a
"provider of the whole park" ranking; a freshness/staleness gate on provider-word (the 222/233 shape is its
own arc — the durable role means the word stays true, which is exactly why it does not need one yet); any
change to how the `provider` role is earned (448 owns that); the provider's own voice about its work.

**Constraints:**
- **Zone-name articles.** Two of three zone names carry their own article (`The Grove`, `The Fernreach`), so
  the line must be `${zoneName} eats because of ${name}` with **no** leading "the" — the arc text's "the
  Fernreach" is prose, not a format string. `storesFedLine` documents this exact trap; follow it.
- **The provider read must be pure and Node-testable.** It belongs beside `deriveRole` in `ai/roles.ts`,
  which is already pure and already owns `Role`/`PROVIDER_BANKS`. No new module.
- `ai/roles.ts` must stay free of any `@mlc-ai/web-llm` import (CHARTER boundary — only `game/src/ai/brain*`
  and `webllm*` may touch it). The new gossip rung is pure `world/`-side and imports only `ai/memory` +
  `social/gossip`, exactly as `groveword.ts` does.
- `NPCContext`'s new field must be **optional**, so every existing `cannedReply` / `respond` call site and
  the ~dozen existing brain unit tests compile and pass unchanged.
- No save-shape change at all this track — the role and the tally are already persisted by 448, and the
  rumor rides the existing memory store.
- **File overlap with the structure track:** `WorldScene.ts` only (this track edits `converse` and the
  `pickTone` greet-context block; the structure track edits `drawFloor` and one import line). No shared
  function. Either order works; the codeplan should still sequence them to keep the diff readable.

---

## Structure track — BACKLOG-449 (One terrain per zone, as data)

**Item:** BACKLOG-449 [infra] One terrain per zone, as data.

**Why this cycle:** Milestone 6 promised a fourth zone would be a table row. Adjacency already works that
way — cycle 383 folded the hard-coded bowl↔grove link out of five helpers into `ZONE_LINKS`, and the third
zone then slotted in as two rows. **Ground never got that treatment.** A zone's terrain is three hand-written
`*TileAt` functions, an `if`-chain dispatcher (`zoneTileAt`), a *second* parallel `if`-chain for the named
water landmark (`zoneWaterTile`), and a *third* for the floor tint (`zoneTint`) — three branch points and six
functions encoding one fact per zone. And each landmark helper carries a hand-maintained comment, *"kept in
sync with the water block in `groveTileAt`"*: the sync is a comment, not a mechanism, and it has been one
edit away from sending a thirsty dino to dry grass since 445.

**What ships:**

A **`ZoneTerrain` descriptor** — one per zone, hanging off the existing `ZONES` table (the same way
`ZONE_LINKS` hangs beside it), carrying the three facts that make a zone's ground its own:

- its **tile-kind rule** — `(x, y, cols, rows) => TileKind`
- its **floor tint** — the multiplicative colour (`GROVE_TINT` / `FERNREACH_TINT` / untinted)
- its **water landmark** — the tile a thirsty resident walks to

The three dispatchers become table lookups. `zoneTileAt`, `zoneWaterTile`, and `zoneTint` keep their exact
current signatures and return values; they just stop branching on zone id. `atWater` and the `drawFloor`
bake are unchanged — they already go through `zoneTileAt`, which is the point.

**Byte-identical, including the exports.** `groveTileAt` / `fernreachTileAt` / `bowlTileAt` /
`grovePondTile` / `bowlPondTile` / `fernreachCreekTile` stay exported under their current names with their
current behavior (they become the descriptors' rule functions rather than dispatcher arms). Four existing
unit test files and `world/arrival.ts` import them directly; none of that should need to change. A refactor
that forces its callers to churn has just moved the cost around.

**On "the landmark derives from the rule" (the structure handoff's criterion 2).** Ruled: **no.** The three
existing landmarks are not reproducible by any single scan-and-centre rule — the grove's pond centre rounds
*up* from its x-range, the Fernreach's creek rounds *down* from its — so a derivation would move two of the
three landmark tiles, and byte-identical behavior is the higher bar (criterion 1, and 383's own standard).
Take the handoff's stated fallback: the landmark is an explicit field on the descriptor, **one authoring
site per zone instead of two**. The drift-proofing that the derivation was for is delivered as a
**mechanism** instead of a comment: a table-driven invariant test asserting, for *every* zone in the table,
that its declared landmark tile actually reports `'water'` under its own rule. A future edit that moves a
pond and forgets its landmark now fails CI instead of shipping a dino walking to dry grass. That is the
outcome the criterion wanted; the derivation was one way to get it, and it is the way that breaks the bar.

**The acceptance test is a fourth zone.** Test-only: a descriptor registered in the test, proving it gets
ground, a tint, and a working landmark through `zoneTileAt` / `zoneTint` / `zoneWaterTile` / `atWater` with
**zero** edits to any of them. If the test needs a code branch anywhere, the refactor is not done.

**Acceptance criteria:**
- [ ] For all three zones, every tile in a full `COLS × ROWS` sweep reports the same `TileKind` from `zoneTileAt` after the refactor as before (pin this as an explicit regression sweep, not a spot check).
- [ ] `zoneWaterTile` returns the identical tile for each of bowl / grove / Fernreach as it does today, and `null` for an unknown zone id.
- [ ] `zoneTint` returns the identical colour for each of the three zones, and the untinted default for an unknown id.
- [ ] `zoneTileAt` still returns `null` for an unknown zone id, so `drawFloor` still falls back to the plain grass bake (the escape hatch that has kept the floor whole through three terrain additions).
- [ ] `groveTileAt`, `fernreachTileAt`, `bowlTileAt`, `grovePondTile`, `bowlPondTile`, `fernreachCreekTile` are all still exported with unchanged behavior; the four existing terrain/pond unit test files pass **unmodified**.
- [ ] A table-driven invariant test asserts, for every zone with a declared landmark, that `zoneTileAt(zone, landmark) === 'water'`.
- [ ] Registering a test-only fourth zone descriptor gives it terrain, tint, and a landmark through the existing dispatchers with no edit to `zoneTileAt` / `zoneWaterTile` / `zoneTint` / `atWater`.
- [ ] `atWater` behavior is unchanged for all three zones (the cycle-079 / cycle-086 specs stay green).
- [ ] The floor still bakes and tints correctly in-game for all three zones (existing e2e terrain specs green: `cycle-067-path-water-art`, `cycle-086-fernreach-terrain`).

**Out of scope:** any *new* terrain, tile kind, zone, or landmark — this ships zero player-visible change on
purpose. Non-water landmarks (a zone's plot, huddle tile, or food-landing row are still owned by their own
modules; folding those in is a later arc). `world/arrival.ts`'s deliberate grove-pinning stays exactly as it
is — its comment explains why widening it to "any water" would retro-fire a once-ever beat. No change to
`bakeTerrainMap` or the art path.

**Constraints:**
- **Behavior byte-identical** is the hard bar. Every criterion above is a pin against drift; if a choice
  makes the code prettier and one tile different, take the uglier code.
- Keep the `TileKind` union and the unknown-zone → `null` path exactly as they are.
- `world/zones.ts` stays pure (no Phaser import) — it is Node-tested and `drawFloor` is the only consumer
  that touches the renderer.
- Descriptors live beside `ZONES` / `ZONE_LINKS` in `world/zones.ts`. Do not add a module for three rows.
- **File overlap with the lore track:** `WorldScene.ts` only, in a different region (`drawFloor` + the
  `world/zones` import line vs. the lore track's `converse` / `pickTone`). No shared function.
