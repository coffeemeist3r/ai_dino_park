# Cycle 187 — Design

Milestone 30 (TENTPOLE): Growing up. Two tracks, cut at one seam: `world/growth.ts` (the stage — 602) and
`world/molt.ts` (the moment the stage changes — 023). Shared scene files; the Coder builds 602 first.

## Structure track — BACKLOG-602

**Item:** BACKLOG-602 [core] Life stages — every dino has an age and a stage, persisted; the founding park ships a youngster.

**Why this cycle:** The tentpole has no spine: `BornDino` records parents and traits, never when, and every hatchling
spawns adult. And an egg needs a clear night plus three in-game days (~72 real minutes at 60×), so a tentpole that
waits on eggs is unreachable in a sitting — CHARTER v7. The founding park therefore ships one youngster.

**What ships:**
- Pure `game/src/world/growth.ts`: `GrowthRecord = { hatchedAtMin: number; moltedAtMin?: number; moltedDay?: number;
  came?: MoltKind; traits?: Personality }` (absolute world minutes, `timeToAbs`). `YOUTH_MIN` (2 in-game days).
  `stageOf(rec, nowMin)` → `'young'` while `rec` exists, has not molted, and `nowMin < hatchedAtMin + YOUTH_MIN`;
  else `'adult'`. **No record → adult**, so every founder but one and every pre-187 save read unchanged.
  `moltDue(growth, nowMin)` → names whose youth has run out and who have not molted. `YOUNG_SCALE = 0.5` (a 20-cell
  rig baked at ×2 halves to exactly one screen pixel per cell — crisp). `youngVoice(p)` raises pitch ×1.5 and
  clips length. `growthLine(rec, nowMin)` — the book line.
- **Founding:** `FOUNDING_GROWTH` in `world/founding.ts`: Pip, with `hatchedAtMin` set so its youth ends at day 1
  14:00 — six in-game hours after the 08:00 founding, ~6 real minutes at the default clock, after the spring
  festival closes at 12:00. Seeded on the `!save` branch only (`??=`, a restored record wins).
- **Save:** one additive field `growth?: Record<string, GrowthRecord>`. Absent → `{}`.
- **Drawn:** a young dino's sprite renders at `YOUNG_SCALE`; every chirp it makes goes through `youngVoice`; its
  book block carries `🥚 young — grows up in ~N h`.
- e2e hooks: `__growth()`, `__stageOf(name)`, `__dinoScale(name)`.

**Acceptance criteria:**
- [ ] `stageOf` / `moltDue` / `youngVoice` / `growthLine` unit-tested; no record → adult.
- [ ] Fresh save: `__stageOf('Pip') === 'young'`, every other dino `adult`; Pip's sprite scale is 0.5, the rest 1.
- [ ] Fresh save: the book's Pip block contains `🥚 young`; no other block does.
- [ ] Pip's book voice line (selected row) reads a higher pitch than `chirpParams(Pip.traits)` alone.
- [ ] `growth` round-trips through save/restore; a save with no `growth` loads with every dino adult.
- [ ] Founding calibration pinned: Pip's youth ends inside the first ten real minutes at `ACTIVE_SCALE` and after
      the festival window.

**Out of scope:** egg-born dinos starting young (604); any reaction from other dinos (605); a distinct juvenile rig.

**Constraints:** additive save only; `Dino.traits` becomes writable (023 needs it) — no other Dino API change.

## Lore track — BACKLOG-023

**Item:** BACKLOG-023 [pokemon] Evolution / molt — the first molt.

**Why this cycle:** It is the tentpole's headline beat and the reason 602 exists; built together the founding park
shows a dino grow up inside a sitting.

**What ships:**
- Pure `game/src/world/molt.ts`: `MoltKind = 'softer' | 'harder' | 'bolder'`. `moltKind({ friendPts, grudgePts })`:
  a grudge at or above `RIVAL_BAR` hardens it (wins over a friend — a grudge is the louder thing a youth holds);
  else a friend at or above `CLOSE_BOND` softens it; else it comes out bolder. `moltTraits(traits, kind)`:
  agreeableness ∓`MOLT_NUDGE` (0.15) for harder/softer, bravery +`MOLT_NUDGE` for bolder, clamped 0..1.
  `moltLine(kind, who)` — what it says: softer *"🐚 All grown! I'm keeping {friend} close."*, harder *"🐚 Grown.
  And I haven't forgotten {rival}."*, bolder *"🐚 Look at me — all grown up!"*. `moltTicker(name, kind)` —
  `🐚 {name} molted — came out {kind}`. `moltBookLine(day, kind)` — `🐚 grew up on day N — came out {kind}`.
- Scene: on the world tick, every name in `moltDue` molts once: its traits become `moltTraits(...)` (the record keeps
  them, so a reload restores the grown temperament), the sprite tweens from 0.5 to full size, it says its line, it
  calls once in its new adult voice, the ticker posts, its memory gains `grew up — came out {kind}`, and a shed-skin
  mark (`molt` prop art when drawn, 🐚 glyph until then — BACKLOG-603) lies on its tile for a while.
- Book: the young line gives way to `🐚 grew up on day N — came out {kind}`.
- e2e hook `__moltNow(name)` (forces the due time) for focused specs; the as-shipped spec advances the wall clock.

**Acceptance criteria:**
- [ ] `moltKind` / `moltTraits` / lines unit-tested, including grudge-beats-friend and clamping.
- [ ] Fresh save advanced on the wall clock past day 1 14:00: Pip has molted exactly once — stage adult, scale 1,
      ticker `🐚 Pip molted — came out softer` (Pip is close to Bramble, 26 ≥ 25), Pip's agreeableness up by 0.15.
- [ ] The bubble over Pip carries its molt line naming Bramble; memory holds `grew up — came out softer`.
- [ ] Book line reads `🐚 grew up on day 1 — came out softer`; the young line is gone.
- [ ] Reload after the molt: Pip is adult, scale 1, and keeps the shifted agreeableness; no second molt.
- [ ] A shed-skin mark appears at Pip's tile at the molt.

**Out of scope:** the park's reaction (605); parents (604); a new sprite rig for adults vs juveniles; any LLM call.

**Constraints:** deterministic, no model; the founding feud and bonds untouched by the molt.
