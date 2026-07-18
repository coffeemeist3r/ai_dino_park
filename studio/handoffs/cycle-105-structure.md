# Cycle 105 — Structure Handoff

**Intent:** Close Milestone 5's spine. The park now banks food per zone (446) and spends it on a
starving resident (444) — the hunger half of the need-drive is fully served by local infrastructure.
The thirst half is still where cycle 80 left it: **one puddle in the whole park.** `checkNeeds` only
resolves thirst for a dino standing at the grove's NE pond, and `seekTarget` returns `null` for a
parched dino anywhere else — so a Fernreach dino wearing 💧 has nothing to walk to and the 436
need-pull silently does nothing for two of three zones. This cycle makes water local, the way crops
went local in 418/432.

**Cap rule:** Structure Track was at **3 open** (445/447/448), below X=4 — so 1–3 new items were
required before picking. Seeded **2**. (Per the section's own convention since cycle 92, the full
item text lives in the `## Structure Track` block itself; no duplicate body stub.)

**Added to Structure Track:**
- **BACKLOG-449 [infra] One terrain per zone, as data** — fold each zone's ground rule + named
  landmark tiles into a per-zone descriptor on the `ZONES` table, so a fourth zone is a table row
  rather than a new `*TileAt` function plus an `if` arm in `zoneTileAt` plus a bespoke landmark
  helper. This cycle's work is what surfaced it: 445 has to reach for "this zone's water tile"
  three times and there is no generic way to ask.
- **BACKLOG-450 [core] Scarcity moves the herd** — bias the migration decision (274/334) with the
  prosperity index (428) and the zone's food store (446), so mouths move toward plenty the way
  438/447 move goods toward need.

**Chosen this cycle:** **BACKLOG-445 — the waterhole.**

**Why now / why this one:** it's the last unchecked Milestone 5 structure arc, it's top of the
queue, and it's unblocked — 447 wants the food-carry rails and 448 wants a per-dino bank tally,
both of which are cleanly *after* the milestone closes. 445 also retires a real dead branch rather
than adding surface: `seekTarget`'s `zoneOf(...) === GROVE_ID ? grovePondTile(COLS) : null` is a
two-thirds-of-the-park no-op sitting in the middle of a shipped feature.

## The shape (Designer is free to override)

The park's terrain already tells us most of the answer, which is the pleasing part:

- **The Fernreach already has water** — `fernreachTileAt` lays a 2-wide creek down the west side
  (x∈[3,4]) and has since 399. Nothing drinks from it. This is pure plumbing, not new terrain.
- **The grove already has its pond** — NE block, `grovePondTile`.
- **The bowl has no water at all** — `zoneTileAt` returns `null` for it (all grass). The bowl is the
  only zone that needs actual new ground.

So the work is: give the bowl its own water feature in its tile layout, then generalize the two
grove-hardcoded lookups — the "am I at water" drink check and the "where is water" seek target —
to resolve **per zone**, from the zone's own terrain. All three zones then slake thirst locally and
436's need-pull starts working park-wide instead of in one corner.

**Keep separate on purpose:** `nearPond` / `pondSeen` / the first-pond-sight beat (359) and the
pond-swap gossip (346) are *grove lore* — a dino's first sight of **the grove's** pond. Do not
rewire those to mean "any water" or you'll retro-fire a once-ever beat for every dino standing in
the Fernreach creek and quietly break two shipped features. Generalize the **need** path; leave the
**lore** path pointed at the grove.

**No save change expected** — needs are already persisted per dino (371) and terrain is derived,
not stored.

**Collision check vs. the lore track:** the Lore-smith picked BACKLOG-381 (a friend fetches a
withdrawn loner to the hatch). That's the hunger/social/bond path — the food drop, the withdrawn
state, the wander bias toward the hatch. This is the thirst/terrain path — zone tile layout and the
water lookup. Both touch `seekTarget`'s neighbourhood in `WorldScene`, which is worth the Coder
knowing, but they touch opposite branches of it (hunger vs. thirst). No real collision.
