# Cycle 90 — Design (first arc-sized cycle, CHARTER v6)

## Lore track — BACKLOG-393 Brain-biased intent

**Item:** BACKLOG-393 [ai] Brain-biased intent — the operator's cycle-85 nudge, Milestone 1 arc 1.

**Why this cycle:** Ninety cycles built a deterministic behavior floor (huddle/gather/mope/tic/
socialize/wander, rolled per step in WorldScene). Nothing above it chooses. This arc adds the
choosing layer: a per-dino, per-day **intent** that leans on those rolls — authored by the brain
where a model runs, by a deterministic seeded author everywhere else. It is the spine 103 (persona)
and 104/012 (daily plan) land on.

**What ships:** Each in-game day, every named dino gets an intent — one of a closed set of four
kinds, with a flavored note:
- `social` — "feels like company today" → socialize roll chance up
- `solitary` — "keeping to itself today" → socialize chance down, tic onset sooner
- `forage` — "has food on the brain" → resource-notice range wider
- `restless` — "itchy feet today" → plain-wander steps re-roll "stay" (moves more), socialize unchanged

The intent is **enrichment on a deterministic floor**: with no model (stub/fallback/headless CI/
declined download) a seeded procedural author produces the same *kind* of intent deterministically
from (name, day-index, traits); the weight-nudge machinery is identical either way. The model path
asks the brain for a kind + note once per dino per day (async, cached until the day turns, never
per-step); unparseable/absent output falls back to procedural. The model authors **no world state**
— it picks a lean, the deterministic rules still make every actual decision.

Player-visible: the collection book (V) gains a "today:" line per dino showing its current intent
note. Dev hooks `__intent(name)` and `__setIntent(name, kind)` for QA/e2e.

**Acceptance criteria:**
- [ ] After boot, `__intent(name)` returns `{kind, note, until}` for every named dino without any model (procedural path).
- [ ] Intent kinds are exactly the closed set `social | solitary | forage | restless`; the procedural author is deterministic — same (name, day-index) → same intent (unit-pinned).
- [ ] Weight nudges are pure + pinned: `social` raises the socialize chance above base, `solitary` lowers it and lowers the tic-onset threshold, `forage` widens resource notice, `restless` re-rolls "stay" wander steps (unit tests pin the table).
- [ ] Nudges are bounded: chances clamp to [0.05, 0.95], tic onset never below half its base — no intent can freeze or peg a behavior (unit-pinned).
- [ ] A brain `intend()` that returns null, throws, or emits an unknown kind falls back to the procedural intent (unit).
- [ ] `@mlc-ai/web-llm` imports remain confined to `game/src/ai/` (grep) — the LLM intent path lives behind NPCBrain.
- [ ] The collection book shows each dino's current intent note ("today: …") — e2e proves the line renders for a named dino.
- [ ] `__setIntent(name, kind)` forces an intent and `__intent(name)` reads it back (e2e), so behavior-lean is drivable in tests.
- [ ] No save-format change: intents are transient per day; a reload re-authors them.

**Out of scope:** persona authorship (103), multi-step daily *plans* (104/012), intent driving
zone migration, LLM note text shown when the model is absent, persisting intents in the save.

**Constraints:** NPCBrain boundary hard (CHARTER). The per-step decision block in WorldScene keeps
its existing priority order (huddle > gather > mope > tic > socialize > wander) — intent only
scales the rolls inside it, never reorders it. Intent authoring must never block a frame (async,
cached, fire-and-forget like `converse`). Governor applies: no ambient intent inference while
hidden/low-battery — the procedural intent stands in that day.

## Structure track — BACKLOG-398 Edge indicator

**Item:** BACKLOG-398 [core] Edge indicator — Milestone 1 structure arc 1 (operator Idea-Box nudge).

**Why this cycle:** Three zones, zero on-screen admission that any edge leads anywhere. The chain
is only legible by walking off an edge and being surprised. One small permanent UI read fixes it,
and it's pure adjacency-table work (383) — the map lens (425) builds on the same read next.

**What ships:** At every linked edge of the current zone, a small label names the neighbour:
in the bowl "The Grove ▸" on the east edge; in the grove "◂ Pocket Cretaceous" west AND
"The Fernreach ▸" east; in the Fernreach "◂ The Grove" west. Labels re-render when the keeper
crosses zones. Unlinked edges get nothing. Data comes from `zoneNeighbors` + `zoneById` so a
future fourth zone labels itself with zero new UI code.

**Acceptance criteria:**
- [ ] A pure `edgeIndicators(zoneId)` helper returns `{edge, text}` per linked edge, unit-pinned for all three zones (bowl: 1, grove: 2, fernreach: 1) with the exact label strings above.
- [ ] Booting into the bowl renders "The Grove ▸" at the east edge and nothing at the other three edges (e2e via a `__edgeLabels` hook or text query).
- [ ] Crossing bowl→grove re-renders: "◂ Pocket Cretaceous" and "The Fernreach ▸" both present (e2e).
- [ ] Labels are chrome, not world: depth above floor/below dialog, small font, edge-centered, no overlap with the plaque or HUD.
- [ ] Crossing behavior itself is byte-identical (no changes to crossing/linkedZone logic; existing zone e2e specs stay green).

**Out of scope:** the zone map lens (425), minimap, per-edge art, pointing arrows for diagonal
adjacency (none exists), labels for dino migration edges in *other* zones.

**Constraints / cross-track:** No file collision — 393 touches `ai/` + the WorldScene decision
block + book lens; 398 touches `zones.ts` (pure helper) + a WorldScene render hook. Both touch
WorldScene in disjoint regions; Coder implements 398's render hook first (smaller), then 393.
