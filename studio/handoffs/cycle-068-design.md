# Cycle 68 — Design

Two tracks, independent verdicts. Lore is a light, isolated surfacing beat; structure is the heavier zone-population spine. They share `WorldScene.ts` but touch disjoint regions (lore: the homecoming bubble; structure: `nearestDino`/feed/gather find-sites + a migration roll), so the Coder can land them in either order without collision.

---

## Lore track — BACKLOG-306: In-character homecoming

**Why this cycle:** Cycle 66 gave each dino a signature idle fidget (298), cycle 67 named it in the book (303). The fidget is now a kept fingerprint — but it only ever happens while a dino wanders, or sits as text in a menu. The welcome-back beat (112) is today a generic 👋 from your closest dino. This cycle that beat should *perform* the dino's body language, so even the greeting is unmistakably **that** dino: Rex paces up, the timid one peeks before coming over.

**What ships:** After a long absence (the existing `HOMECOMING_MIN_MINUTES` gate), the closest dino's floating welcome-back line now leads with its signature idle quirk (the same `fidget()` label the book and the above-head glyph use) before the spoken `👋` line — e.g. `Rex paces over — You're finally back! 👋`, `Twitch peeks around timidly — Oh — you're back. 👋`. The quirk is read deterministically from the dino's name-seeded traits; no model, no save. The jealous runner-up's sulk (120) is unchanged.

**Acceptance criteria:**
- [ ] After a homecoming (away ≥ `HOMECOMING_MIN_MINUTES`), the welcome-back line contains the homecomer's name, its `fidget()` quirk label, and `👋`.
- [ ] The quirk label in the homecoming line equals `fidget(traitsOf(homecomer)).label` (book/live-glyph agreement holds).
- [ ] Two homecomers with different most-pronounced traits produce visibly different welcome-back lines beyond the warmth tier (different quirk clauses).
- [ ] Calling `homecoming(friendship, awayMinutes)` with **no** quirk lookup returns the exact cycle-30 strings (the cycle-30 homecoming unit spec stays green untouched).
- [ ] Pure/deterministic: no WebLLM, no save-format change; `homecoming.ts` stays Phaser-free.

**Out of scope:** Tone/LLM-coloured homecoming dialogue (that's 311); shading the quirk by mood (310); the jealous runner-up performing its own quirk. Keep this to the homecomer's welcome-back line only.

**Constraints:** `homecoming.ts` must stay pure (it already imports only `friendship`). Thread the quirk via an **optional** lookup parameter so the omitted-arg path is byte-identical (protects the cycle-30 spec). WorldScene supplies `(name) => fidget(<that dino's Personality>).label`.

---

## Structure track — BACKLOG-274: Populate the grove

**Why this cycle:** Cycle 59 made the grove walkable (143); cycle 67 gave it its own terrain — a tinted clearing with a path and a pond (294). But it stands **empty**: every dino lives in the bowl and never leaves, so the new ground is a room nobody's in. The cross-zone *render* filter already shipped (operator 2026-06-20: `dinoZones` + the `inView` gate). This cycle finishes the spine — dinos can move between zones and the keeper can only interact with the zone it's standing in — so the grove becomes an inhabited place, the foundation 308 and future zone content build on.

**What ships:**
1. **Durable occupancy.** `dinoZones` (per-dino home zone) is persisted in the save, additively (old saves → all bowl; no `SAVE_VERSION` bump, validated like `gathered`/`roles`). Initial spawn is unchanged — every founder still starts in the bowl — so the populated state arises from migration, not a spawn relocation (this keeps every existing bowl-targeting spec green by construction).
2. **Migration.** A dino can move between the bowl and the grove: its home zone flips and it repositions to a sensible tile inside the destination zone. Two drivers: a **sparse ambient roll** (real-time cadence with a per-in-game-day cap — the proven sky-event discipline, so it can't drag the cast or fire repeatedly), and a deterministic dev hook `__migrate(name, zoneId)` for tests/observability. A migration is logged (`🌿 <name> wandered into The Grove` / `… back to the bowl`).
3. **Proximity-interaction filter.** Every keeper↔dino interaction that finds a dino by pixel distance now skips dinos not in the keeper's active zone (reuse the existing `inView`): `nearestDino()` (greet E / tone menu, scan B), the feeding eater find (`checkFeeding`), and the resource pickup find (`checkGather`). A dino that lives in the grove can't be talked to, scanned, or snap up bowl-dropped food while the keeper is in the bowl, and vice-versa.

**Acceptance criteria:**
- [ ] `__migrate('Rex', GROVE_ID)` (keeper in bowl) hides Rex (sprite/label invisible) and `nearestDino()` standing on Rex's old tile no longer returns Rex.
- [ ] After the keeper crosses east into the grove, a grove-resident dino is visible and `nearestDino()` beside it returns it (greet/scan work in the grove).
- [ ] A grove-resident dino does not eat food dropped in the bowl (`checkFeeding` skips off-zone dinos), and does not pick up a bowl resource (`checkGather` skips off-zone dinos).
- [ ] Home zones persist: migrate a dino, save, reload → the dino is still in its migrated zone (`__visibleDinos` / `zoneOf` reflect it).
- [ ] An old save with no `dinoZones` field loads with every dino in the bowl (migration logic + `deserialize` default).
- [ ] Spawn is byte-identical: with no migration, all five founders are in the bowl and every existing greet/feed/scan e2e behaves exactly as before.
- [ ] The ambient migration roll is capped (≤ one per in-game day) and does not fire on boot/restore.

**Out of scope:** Zone-scoping the *world objects* themselves — food sprites, cairns, the plot, spawned resources still render at bowl coordinates regardless of zone; making them zone-aware is BACKLOG-308 (next cycle). This cycle only gates which *dino* may interact, plus dino occupancy/migration. No per-zone wandering bounds rework (a grove dino still wanders the same tile space; it's just hidden + non-interactive off-zone) — keep the movement core untouched beyond the reposition-on-migrate.

**Constraints:** Keep `forceStep`/wandering byte-identical except the migration roll and reposition. The migration roll must follow the sky-event cadence discipline (real-time roll + per-day cap, never on `clock.set()`), or a full e2e run could flake. Additive save only. Reuse `inView`, `zoneOf`/`setZone`, `linkedZone` (for the destination entry tile) — no new occupancy primitive. **File overlap with the lore track:** both edit `WorldScene.ts`; the homecoming bubble text (lore) and the interaction/migration sites (structure) are separate methods — no sequencing constraint.
