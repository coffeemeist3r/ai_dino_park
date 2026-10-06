# Cycle 179 — Design

Milestone 26 (TENTPOLE): minds that act and reflect. Both tracks serve it.

## Lore track — BACKLOG-585: the day in its own voice

**Spec.** At the dusk turn (`checkReflection`, 17:00) every dino's reflection gains a spoken line, `said`, and each dino
in view says it in a bubble. The floor is deterministic and persona-shaped (pure `dayVoice` in `ai/reflection.ts`):

| Day | Warm (agree ≥ 0.6) | Prickly (agree < 0.35) | Otherwise |
|---|---|---|---|
| with a rival (grudge ≥ `RIVAL_BAR`) | wary of it | sour about it | wary of it |
| with someone | glad of them | grudging | plain |
| alone, sociable (≥ `MISSES_COMPANY`) | promises itself company tomorrow | | |
| alone, not sociable | content | | |

Two variants per row, picked by a name hash, so two dinos with the same day still sound different. A dino that went
somewhere on purpose today (586's `went`) leads with where: *"Went all the way to The Grove."*

- `said` and `went` are additive optional fields on `Reflection` (save parse keeps strings, drops anything else).
- The book's `yesterday:` line appends the line in quotes: `yesterday: spent it with Rex — "…"`.
- The founding yesterday (583's `foundingReflection`) carries a floor line too, so the book shows a voice at frame one.
- **The model's hand:** `NPCBrain.reflect?(ctx, summary)` (optional; WebLLM only, ready-engine only, any failure → null).
  Fired per dino at dusk when `allowAmbient`. A non-empty answer replaces `said` (if the reflection is still today's)
  and is said again with the 🧠 prefix. Floor first, always.

**Acceptance criteria**
1. L1 `dayVoice` returns different lines for a warm-with-friend, prickly-with-rival, sociable-alone and loner-alone day (unit).
2. L2 Two dinos in the same bucket can differ (name-hash variants), and a `went` day leads with the place (unit).
3. L3 Founding: `__reflections().Sunny.said` is non-empty on a fresh as-shipped boot; the book shows a quoted line.
4. L4 Crossing 17:00 in a fresh park files `said` on every reflection and a dusk line is live in a bubble (`__bubbleTexts`).
5. L5 Save parse keeps a string `said`; a non-string `said` is dropped; absent stays absent (unit).
6. L6 `reflect` exists only on the WebLLM brain; `@mlc-ai/web-llm` stays under `game/src/ai/`.

**Ten-minute answer:** at 17:00 (~9 real minutes in) every dino on screen says how its day went, in its own words; the
book carries a line from the first frame.

## Structure track — BACKLOG-586: places in the plan

**Spec.** Pure `ai/place.ts`:
- `planPlace(name, day, phase, kind, home, neighbours, appeal)` → a zone id or null.
  - `restless` → one linked neighbour, seeded by `name#place#day#phase` over the sorted neighbours.
  - `forage` → the neighbour with the highest `appeal` if it beats home's; else null (it forages at home).
  - other kinds → null.
- `errandLine(name, zoneName, kind)` → `🧭 Glade sets off for The Grove — itchy feet.` /
  `🧭 Sunny sets off for The Grove — after the food there.`

WorldScene: on the migration cadence (`maybeMigrate`, after the bookkeeping reads, before the cooldown/chance gate), one
**errand** per tick: the first (by name) dino, not migrating, whose current day+phase has not been errand-checked gets
its place computed and cached; if the place is set, differs from home, and home holds more than `ZONE_FLOOR`,
`startMigration(d, dest)` + ticker line + 🧭 mark, and the day's `went` is filed for 585. Not a roll: no chance gate,
no settle-resist. A tick that launches an errand stamps `lastMigrationMs` and ends. Book: `heading: The Grove (itchy
feet)` while the phase's place is set and the dino is not there yet. Hooks: `__errand()`, `__place(name)`.

**Acceptance criteria**
1. S1 `planPlace` — restless names a neighbour deterministically; forage names a richer neighbour, null when home is
   richest; social/solitary null (unit).
2. S2 Fresh as-shipped boot at 08:00: `__errand()` launches a day-phase errand — the dino is in `__migrating()`, bound
   for a linked neighbour, and the ticker carries 🧭.
3. S3 An errand runs once per dino per phase.
4. S4 The last resident of a ground does not leave on an errand.
5. S5 The book shows `heading:` for a dino with a place.
6. S6 Build clean; vitest + full e2e green; save additive only.

**Ten-minute answer:** inside the first minute (the first migration tick, 20 s) a dino sets off for another ground
with a reason — `🧭 Glade sets off for The Grove — itchy feet.` — and walks there; at each phase turn more follow.
