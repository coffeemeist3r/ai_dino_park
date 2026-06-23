# Cycle 73 — Design

Two tracks, disjoint code paths. Build order: **structure (334) first** (the `forceStep`
migration-walk branch), **then lore (181)** (the den-render murmur hook) — the only shared
file is `WorldScene.ts`, touched in separate branches/methods.

---

## Structure track — BACKLOG-334

**Item:** BACKLOG-334 [emergent] Visible zone crossing.

**Why this cycle:** Cycle 72 (333) decoupled migration from the in-game clock, so dinos
now drift between bowl and grove every ~minute at realtime. But `relocate` still
*teleports* the migrant to a random interior tile of the far zone — the dino vanishes
from the bowl and pops up elsewhere. The journey 333 finally made frequent is invisible.
334 makes it watchable: the migrant walks to its zone's linked edge and crosses, entering
the far zone at the matching edge, exactly the way a keeper crossing works (`linkedZone`).

**What ships:** When the ambient migration roll fires, the chosen dino does **not** jump.
It enters a "crossing" state and, on each wander step, walks one tile toward its current
zone's linked edge (bowl → east edge, grove → west edge). On reaching that edge it crosses:
its home zone flips and it reappears one tile in from the *opposite* edge of the new zone
(bowl→grove enters the grove's west edge; grove→bowl enters the bowl's east edge), then
resumes ordinary life. Because cross-zone rendering is already gated by home zone (274), a
bowl→grove migrant is visible walking east across the bowl, then disappears as it crosses
(if the keeper is in the bowl); a grove→bowl migrant appears at the bowl's east edge and
walks in. Either way you see travel, not a blink. The deterministic `__migrate(name,zone)`
hook keeps its instant teleport (so every cycle-068/069 migration spec + the save-restore
path stay byte-identical); only the *ambient roll* becomes a walk.

**Acceptance criteria:**
- [ ] Pure edge math in `zones.ts` is unit-tested: a bowl migrant targets the east edge column, a grove migrant the west edge column; the cross-entry tile is one tile in from the opposite edge with the row preserved.
- [ ] A dino placed into the crossing state (via a new `__startMigration(name)` hook) is still in its **origin** zone immediately after starting (home zone unchanged until it reaches the edge).
- [ ] Stepping the world repeatedly walks the crossing dino monotonically toward its linked edge (its tile-x strictly approaches the edge until it arrives), i.e. it does not teleport.
- [ ] On reaching the edge, the dino's home zone has flipped to the other zone and its tile-x is at the far entry edge (within one tile of the opposite side), and it is no longer in the crossing state.
- [ ] The existing `__migrate(name,zone)` hook still relocates **instantly** (a returned-zone assertion identical to cycle 71 behaviour); no cycle-068/069/071 migration spec regresses.
- [ ] A `__migrating()` (or `__crossing`) hook reports the set of names currently mid-crossing, so the walk is observable from Playwright.
- [ ] No save-format change (`SAVE_VERSION` unchanged); a dino mid-crossing at save time persists by its current home zone (the in-flight walk is transient, not serialized).
- [ ] Build clean; full unit + e2e suite green.

**Out of scope:** Multi-tile-per-step pathfinding niceties, animating the keeper's own
crossing (already shipped), grove-arrival reaction (that's lore follow-up 339), a travel
glyph. The migrant keeps its ordinary wander/idle glyph while walking — the *motion* is
the feature.

**Constraints:** Don't change `relocate`'s teleport semantics (the `__migrate` hook and
restore depend on it). Migration walk is a top-priority `forceStep` branch (above food /
huddle), but **below** first-contact inspection and distress response (a committed journey
shouldn't be interrupted by food, but a startled bolt/inspect can still pre-empt — keep it
simple: place it just below `pendingRespond`). A dino already mid-crossing must not be
re-picked by `maybeMigrate`. Keep `zones.ts` pure (no Phaser).

---

## Lore track — BACKLOG-181

**Item:** BACKLOG-181 [ai] Sleep murmurs.

**Why this cycle:** The night den packs (171) and you can now sit and watch it at
realtime. The sleeping pile is silent, though — five huddled dinos read identically. 181
gives the den an inner life: a huddled dino occasionally murmurs a quiet 💭 sleep-line
drawn from its strongest memory of the day, so the night becomes a place where each dino's
day echoes back in its own half-formed thought. Distinctness in a register we've never
used (the overheard dream); fun to lean in and catch.

**What ships:** While a dino is huddling (in the den, in the huddle window) and visible in
the active zone, on a sparse roll it floats a 💭 murmur bubble. The murmur text is built
**deterministically** from the dino's memory ring: its strongest (most recent salient)
memory of the day, reshaped into a dreamy fragment (`💭 …<fragment>…`); a dino with no
memories murmurs a generic `💭 …zzz…`. Where dino minds are enabled and the governor
allows (not hidden, battery ok, engine free), the murmur may instead be **LLM-coloured**
through the existing `NPCBrain` boundary (mirroring `converse`), falling back to the
deterministic line otherwise. Murmurs are governed by the same single-flight/cooldown the
ambient chatter uses, so they never peg the GPU at night.

**Acceptance criteria:**
- [ ] Pure `world/murmur.ts` is unit-tested: `pickMurmurMemory(events)` returns the strongest/most-recent memory, or null for an empty list; `murmurLine(memory)` returns a `💭 …`-prefixed fragment for a memory and a generic `💭 …zzz…` for null.
- [ ] `murmurLine` strips a leading event emoji/glyph from the source memory so the dream reads as a fragment, not a copied log line (assert the raw memory's leading emoji is absent from the output, content retained).
- [ ] A `__murmur(name)` hook returns the deterministic murmur line a given dino would speak from its current memory (model-independent), so QA can assert per-dino distinctness (two dinos with different day-memories murmur different lines).
- [ ] Driving the den into the huddle window and forcing a murmur roll floats a 💭 bubble on a huddling, in-view dino (assert via `__bubbleTexts` containing a `💭` line).
- [ ] A non-huddling (awake) dino never murmurs; an out-of-view huddler (other zone) shows no bubble.
- [ ] With no model loaded (CI default / StubBrain), the murmur is the deterministic line — no error, no blank bubble; the `NPCBrain` boundary holds (no `@mlc-ai/web-llm` import outside `game/src/ai/`).
- [ ] No save-format change; murmurs are ephemeral (a bubble + nothing persisted).
- [ ] Build clean; full unit + e2e suite green.

**Out of scope:** Recording the murmur in the book (336), overheard→gossip (335), bond-graph
echo / shared dreams (337), the don't-wake-them tap interaction (338). The murmur is a
read-only ambient beat this cycle: it shows, it doesn't (yet) feed gossip or the book.

**Constraints:** Inference stays behind `NPCBrain`/`brain.ts` — `murmur.ts` is pure and
imports no AI backend. Reuse `recall` (memory.ts), `showBubble`, `isHuddling`, `inView`,
and the `convoInFlight`/`convoCooldown`/`allowAmbient` governor — do not add a second
engine path. Murmur cadence must be sparse (a den shouldn't be a wall of 💭). The huddle
egg-laying / cold-morning logic must be untouched.
