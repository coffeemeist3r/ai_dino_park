# Cycle 75 — Design

Two tracks, both thin glue over pure modules, disjoint code paths. The lore track touches the gossip cascade + `crossDino`; the structure track touches the plaque. No shared file except `WorldScene.ts` (different regions) — no save change either track.

---

## Lore track — BACKLOG-342: Tell of the grove

**Item:** BACKLOG-342 [social] Tell of the grove.

**Why this cycle:** Cycle 74 made the grove a place a dino *arrives* in (339). This cycle the bowl *hears* about it: a dino freshly back from the grove leads its next gossip with what it saw over there, so news of the second zone travels the same way word of cold nights (185) and the keeper's warmth (223) already does. It is the keystone of the two-zone "make the split world talk" theme and reuses the existing cold/warm/relief word cascade verbatim, so it lands in one fire.

**What ships:** When a dino crosses *back to the bowl from the grove* (a return crossing), it files a first-hand "grove news" memory (`🌿 saw the pond over in the grove`). The next time that dino meets another in the bowl, it **leads** the meeting with grove word — the listener gets a 1-hop rumor (`<speaker> told me: you should see the pond over in the grove`) and an event logs (`🌿 <listener> heard about the grove from <speaker>`), exactly as cold/warm word do. Grove word slots into the existing cascade **after** cold word and **before** generic gossip, so a dino with both a cold memory and grove news still leads with the cold night (hardship outranks scenery), but grove news outranks an ordinary retelling.

**Acceptance criteria (342):**
- [ ] `spreadGroveWord(store, speaker, listener)` is pure: a speaker carrying a shareable grove-news memory yields a non-null rumor remembered on the listener; a speaker without one yields `{ rumor: null }` and an unchanged store.
- [ ] `speaker === listener` yields `{ rumor: null }` (no self-gossip), mirroring the other spread\*Word helpers.
- [ ] The grove-news memory is **shareable** (no `RUMOR_MARK`) and contains the stable token, so it spreads; the spread rumor line **carries** `RUMOR_MARK` so it does not re-spread (1 hop), matching `makeRumor`.
- [ ] A dino driven through a full grove→bowl return crossing ends up with the grove-news memory in its ring (`__recall(name)` includes it).
- [ ] In a meeting where the speaker carries grove news and no cold/warm/relief word, the cascade picks grove word: the listener's memory gains the grove rumor and the `🌿 … heard about the grove …` event logs (not the generic `🗣️` line).
- [ ] Cascade precedence holds: a speaker carrying **both** a cold-night memory and grove news leads with the **cold** word (the existing cold rung fires first); grove word only fires when cold/warm/relief did not.
- [ ] A bowl→grove crossing (outbound) files **no** grove-news memory — only the return crossing does.
- [ ] No save change (grove news rides the existing memory store, which already persists); `version` unaffected; build clean; `groveword.ts` imports no `ai/` backend.

**Out of scope:** The newcomer-pull (345), pond-swap bond (346), and grove-struck idle bubble (347) — all seeded, all separate cycles. No LLM-coloured grove line; the deterministic rumor is the shipped path.

**Constraints:** Insert grove word into the existing cascade at WorldScene ~L2044–2052 between the `cold` and `gossip` rungs; preserve the existing else-if log order (relief → warm → cold → **grove** → generic). Do not change `crossDino`'s 339 arrival beat — only add the return-crossing memory file. `NPCBrain` boundary untouched.

---

## Structure track — BACKLOG-316: Zone indicator

**Item:** BACKLOG-316 [core] Zone indicator.

**Why this cycle:** Seven cycles built two zones (143→334) but from inside one you cannot tell how the cast is split without walking to the other. Before the economy splits further (328/329), make the split legible: the plaque — the existing "specimen on a shelf" readout — gains a line naming each zone and its population, with the keeper's active zone marked.

**What ships:** A new plaque line below the existing Stores line: `Zones · ▸Pocket Cretaceous 4 · The Grove 2` — every zone in `ZONES`, its current resident count, with a `▸` marker on the keeper's active zone. The line refreshes on the world tick (like the rest of the plaque) and after a zone switch, so crossing into the grove flips the marker. Population counts dinos by home zone (`dinoZones`), matching how the world already gates rendering/migration.

**Acceptance criteria (316):**
- [ ] `zonePopulations(dinoZones, names, fallback)` is pure and returns a count per zone id present in `ZONES` order, counting each name by its home zone (fallback for unmapped names); a name in no zone map counts to the fallback zone.
- [ ] `zoneTallyLine(populations, activeZoneId)` is pure and renders `<name> <n>` per zone joined by ` · `, prefixing the active zone's segment with `▸` (and no marker on the others).
- [ ] The plaque shows the zone tally as its last line. With the default roster all in the bowl, the line reads `▸Pocket Cretaceous <N> · The Grove 0`.
- [ ] After `__setZone('grove')` (or a real crossing), the `▸` marker moves to `The Grove` and the line re-renders (counts unchanged by a keeper crossing — the keeper is not a dino).
- [ ] Migrating a dino across zones (`__migrate(name,'grove')`) and refreshing the plaque shows the moved population: bowl count −1, grove count +1.
- [ ] `__plaque()` exposes the tally (e.g. a `zoneTally` field) so e2e can assert it without reading rendered text.
- [ ] No save change; build clean; existing plaque tests (population/day/generations/stores lines) stay green.

**Out of scope:** Per-zone stockpile readout (328 owns that), a minimap, any HUD beyond the plaque line, zone resource bias (348). Counts are home-zone residents only (not eggs, not the keeper).

**Constraints:** Extend `PlaqueStats` additively (`zoneTally?: string`) so existing `plaqueLines` callers/tests are unchanged when absent. Build the tally string in `WorldScene` from the pure helpers and pass it in (keep `plaque.ts` Phaser-free). The two `__plaque` sites (the hook ~L488 and `refreshPlaque` ~L514) must stay in sync.

---

**Build order:** Either order — fully disjoint. Structure (316: zones.ts + plaque.ts + WorldScene plaque block) and lore (342: groveword.ts + WorldScene cascade + crossDino) touch different regions of `WorldScene.ts` and different pure modules. Both: no `SAVE_VERSION` bump, no new deps, `NPCBrain` boundary untouched.
