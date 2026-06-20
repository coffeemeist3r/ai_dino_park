# Cycle 62 — Design

Two tracks, specced independently.

## Lore track — BACKLOG-278: Earned the nickname

**Item:** BACKLOG-278 — the deepest friendship drops the keeper's designation for its nickname.

**Why this cycle:** Cycle 61 (276) gave a fond (≥8-heart) dino the keeper's *designation* ("There you
are, AETHER-1!"). 278 is the next rung up the same line: at the very top of the friendship scale the dino
uses the nickname the unit carries ("There you are, Aki!"). Same warm sentence — a smaller, fonder name.
It's the most distinct queued beat: only the single closest dino calls you what your friends call you.

**What ships:** Walk up to a dino you've maxed out (10 hearts) and press E — its fond opening names you by
nickname ("There you are, Aki!") instead of the designation. A dino at 8–9 hearts still opens with the
designation ("There you are, AETHER-1!") exactly as cycle 61. Swapping observers swaps the nickname
(VANTA-9 → "Vix", LUMEN-3 → "Lux").

**Acceptance criteria:**
- [ ] `nicknameOf` returns the quoted nickname for every keeper: AETHER-1→`Aki`, VANTA-9→`Vix`, LUMEN-3→`Lux`.
- [ ] `nicknameOf` on a name with no quoted part falls back to the designation (back-compat / safety).
- [ ] `keeperAddress(keeper, hearts)` returns the **nickname** at hearts ≥ `NICKNAME_MIN` (10) and the **designation** below it.
- [ ] A dino at 10 hearts, greeted, opens with a fond line containing the nickname (`Aki`) and NOT the designation (`AETHER-1`).
- [ ] A dino at 8 hearts, greeted, opens with a fond line containing the designation (`AETHER-1`) — cycle-61 behavior preserved byte-for-byte.
- [ ] `ai/` imports nothing from `keeper/` — the address string is computed in the scene and passed as `keeperName` (NPCBrain boundary holds).
- [ ] Build + unit + e2e green; no save or world change on this track.

**Out of scope:** the designation-first-then-nickname ordering (283), the book readout (284), any LLM
prose change beyond passing the already-supported `keeperName`.

**Constraints:** `fondGreeting(name, keeperName)` signature unchanged — it just renders whatever string it
is handed. Only the *choice* of which name to hand it changes, and only at the two WorldScene greet sites.
Do not touch the resource-track files.

## Structure track — BACKLOG-146: Resource gathering spine

**Item:** BACKLOG-146 — a raw resource appears, a dino notices it, walks over, and picks it up (tally).

**Why this cycle:** First beat of the resources→crafting→building→governance arc, landed now that the
save has a version + migration hook (040). Gathering only; the stockpile (285) and crafting (286) build on
it next. It mirrors the proven feeding spine, so it's low-risk and reuses existing movement helpers.

**What ships:** Every so often a raw resource (a fallen branch 🪵 or a shiny stone 🪨) appears at a random
spot in the bowl. A curious dino in range notices it, walks to it over successive tick steps, and picks it
up — the resource vanishes, the dino flashes a 🪵/🪨 bubble, and its personal gather tally goes up by one.
The tally rides the save (a dino that gathered keeps its count across reload).

**Acceptance criteria:**
- [ ] `noticeResource(curiosity, distTiles)` returns `fetch` when within `RESOURCE_RANGE` and curiosity ≥ the bar, `ignore` when out of range or below the bar.
- [ ] `resourceLanding(cols, rows, rand)` returns an in-bounds tile (0 ≤ x < cols, 0 ≤ y < rows), away from the very rim.
- [ ] `rollResource(rand)` is deterministic for a seeded `rand` and fires at the documented rate.
- [ ] Spawning a resource one tile from a curious dino and advancing the tick: the dino reaches it, `__gathered()[name]` increments by exactly 1, and `__resource()` becomes `null`.
- [ ] Only one resource exists at a time (a new one spawns only when none is present).
- [ ] The gather tally persists: gather one, save, reload → the tally is still there.
- [ ] An old save with no `gathered` field loads cleanly (defaults to `{}`) — additive rule honored.
- [ ] Build + unit + e2e green; feeding still works (food remains higher priority than a resource).

**Out of scope:** banking into a shared stockpile (285), crafting (286), resource depletion/respawn-cadence
tuning, per-zone resources, carrying animation, a book/HUD readout of the tally (a dev hook is enough this
cycle).

**Constraints:** food/feeding stays the higher movement priority — a hungry dino rushing food must not be
hijacked by a resource. New pure logic in `world/resource.ts`; WorldScene glue lives in the world-tick /
spawn region, NOT the greet sites (lore track owns those). The `gathered` field is additive on the save.

## Cross-track note
Both tracks edit `WorldScene.ts` but in disjoint regions (greet glue vs. tick/spawn glue) and disjoint
imports (`keeper/`+`ai/` vs. `world/`). Coder: apply both, build the combined result green before commit.
