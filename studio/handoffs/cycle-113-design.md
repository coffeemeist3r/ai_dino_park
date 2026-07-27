# Cycle 113 — Design (two tracks)

Milestone 8, "The seasons bite," opener. The year finally reaches the food economy (structure) and the
cast's voice (lore).

---

## Lore track — BACKLOG-173: Season in the voice

**Item:** BACKLOG-173 [ai] Season in the voice — the current season joins the dialogue context so a dino
grumbles through winter and savours spring in its own voice, unprompted.

**Why this cycle:** The bowl has run a four-season clock since cycle 40, but a dino has never once
mentioned the weather. Time-of-day already colours a greeting (051/110); the season should too. It's the
lore opener for Milestone 8 and the deterministic-fallback foundation the later seasonal feeling beats
(178, 215) read best after. Pairs cleanly with the structure pick (461): the year bites the stores *and*
the cast says so.

**What ships:** When the player greets a dino, its reply may carry a short seasonal aside composed onto
whatever it was already going to say — a **winter grumble** or a **spring savour**, shaded by the dino's
temperament (prickly / warm / even), exactly like the existing hunger (368), rattled (440), and provider
(453) asides. Summer and fall are **deliberately silent** — contentment needs no comment, and gating to
the two emotionally-charged seasons keeps the aside a flavour beat, not an every-greet tic. The season
also enters the WebLLM prompt context (like `timeOfDay`) so the model path colours the same fact; the
canned fallback carries the deterministic line so behaviour never depends on the model (CHARTER "Living
minds" / NPCBrain boundary).

**Acceptance criteria:**
- [ ] `NPCContext` gains an optional `season` field; WorldScene sets it to the live season on the player-greet context.
- [ ] In **winter**, a greeted dino's canned reply contains a winter grumble aside (a deterministic line); in **spring**, a spring-savour aside.
- [ ] In **summer** and **fall**, the canned reply contains **no** seasonal aside (byte-identical to no-season behaviour).
- [ ] The seasonal aside is **temperament-shaded**: a prickly dino (agreeableness < 0.4), a warm dino (> 0.6), and an even dino each get a distinct winter (and spring) line.
- [ ] The seasonal aside **composes** with the other asides (hungry/rattled/provider) — a hungry winter dino carries both, within the length cap.
- [ ] The WebLLM `buildMessages` system prompt includes a season clause in winter/spring (verified by a unit test on the pure `buildMessages`).
- [ ] A dino with no `season` in context replies byte-identically to before (back-compat).
- [ ] Unit tests cover the aside per season × temperament and the compose case; build + full suite green.

**Out of scope:** Season colouring npc↔npc meet lines (that's gossip territory, 175); summer/fall voices;
any change to the reply length caps beyond appending the aside; per-crop or per-zone seasonal flavour.

**Constraints:** Keep the `season` type off any WebLLM coupling — a type-only import of `Season` from
`world/seasons` into `ai/` is fine (the boundary rule is about `@mlc-ai/web-llm` runtime, not types). No
new files strictly required; the aside lives beside its siblings in `ai/brain.ts`. No file overlap with
the structure track.

---

## Structure track — BACKLOG-461: The lean season

**Item:** BACKLOG-461 [emergent] The lean season — one pure park-wide seasonal food modifier the
harvest-banking and spoilage hooks read: the lean season tightens banking and quickens spoilage, plenty
eases both.

**Why this cycle:** The food economy (446 banking, 454 granary, 455 spoilage, 447 ferry) has been fully
season-blind for its whole life — a zone banks and spoils identically in every season. This is the join
between the calendar and the economy, and Milestone 8's structure opener. Foundation-first per the queued
item: one flat park-wide modifier now, per-crop seasonal yield deferred (465).

**What ships:** A pure `seasonGrip(season)` returning a per-season `{ capDelta, spoilMarginDelta }`:
- **winter (lean):** `capDelta -1` (a ground holds one less per food id), `spoilMarginDelta +1` (the near-cap spoil band widens, so a hoard bleeds sooner and to a deeper floor).
- **summer / fall (plenty):** `capDelta +1` (hold one more), `spoilMarginDelta -1` (spoils only at the very cap — plenty eases both).
- **spring (neutral):** `{ 0, 0 }` — the year's hinge, unchanged from today.

WorldScene threads the seasonal cap through a single `foodCapFor(zone)` helper (granary cap + the season's
`capDelta`) used at every food-cap site — harvest banking, the ferry accept-cap, and the spoilage pass —
and passes the seasonal margin (`SPOIL_MARGIN + spoilMarginDelta`, floored at 0) into `spoilFood`. The
`__foodCap` dev hook returns the seasonal cap so e2e can drive it. The season-turn banner gains a second
line naming the economic shift ("winter tightens the stores" / "summer eases the stores"), so the grip is
player-visible and never silent (CHARTER §Quality bar).

**Acceptance criteria:**
- [ ] `seasonGrip(season)` is pure and unit-tested: winter `{capDelta:-1, spoilMarginDelta:+1}`, summer/fall `{+1,-1}`, spring `{0,0}`.
- [ ] `spoilFood(pile, cap, margin?)` accepts an optional margin (default `SPOIL_MARGIN` → every existing caller byte-identical) and a widened margin spoils more / to a deeper floor; unit-tested.
- [ ] `foodCapFor(zone)` in winter is one below the granary-aware base cap; in summer/fall one above; in spring equal. Verified via the `__foodCap` dev hook in an e2e that sets the season.
- [ ] In winter, a zone's hoard at the base cap spoils on the daily pass down to the winter floor (deeper than the spring floor); e2e via `__season` + `__spoilFood` + `__foodStore`.
- [ ] In summer, a pile one below the base cap does **not** spoil (plenty eases spoilage); e2e.
- [ ] Harvest banking clamps at `foodCapFor(zone)` — a winter zone banks one less than the same zone in spring; unit or e2e.
- [ ] The season-turn banner shows the economic line; e2e or manual note.
- [ ] Existing spoilage/foodstore/granary unit tests unchanged and green; build + full suite green.

**Out of scope:** Per-crop or per-zone seasonal yield (465); seasonal water/thirst (466); the away-jump
spoilage catch-up (462, next milestone cycle); any save-schema change (the grip is *derived* from the
already-persisted clock day — nothing new in the save).

**Constraints:** `seasonGrip` lives in `world/seasons.ts` (pure, Node-testable). The seasonal cap must be
applied **consistently** at banking, ferry, and spoilage or a pile could bank above what spoilage will
bleed — route every food-cap read through the one `foodCapFor` helper. Additive save only (derived, no new
fields). No file overlap with the lore track (seasons.ts / spoilage.ts / WorldScene food wiring vs.
ai/brain.ts / ai/webllmBrain.ts / WorldScene greet-context).
