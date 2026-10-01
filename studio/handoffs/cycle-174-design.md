# Cycle 174 — Design

Both tracks serve Milestone 24 (*friendship has an opposite*). They are paired the way 565/134 were in cycle 171:
the structure track builds the graph, the lore track makes two dinos act on it in front of the player.

## Structure track — BACKLOG-574

**Item:** BACKLOG-574 [core] The park keeps grudges.

**Why this cycle:** every pairwise number in the park measures warmth. The milestone's headline needs a cold one
that lasts longer than the hatch's six-slot memory ring, starts above its own bar on a fresh save (CHARTER v7
corollary), and is on a page the player can open.

**What ships:**
- `social/grudges.ts` (pure): `RIVAL_BAR = 20`, `GRUDGE_PER_CONTEST = 6`, `GRUDGE_DRIFT = 0.001`,
  `worstRival(name, grudges, others)` (the `closestFriend` pick over the grudge map with `RIVAL_BAR` as its floor),
  `rivalLine(rival)` → `😒 doesn't get on with <rival>`.
- `world/founding.ts`: `FOUNDING_GRUDGES = [['Mossback', 'Twitch', 40]]` + `foundingGrudges()`. Both live on the
  bowl. Mossback is slow to trust; Twitch bolts — every bolt is one more thing Mossback takes personally.
- Scene: `grudges` map seeded in `seedFounding` beside the bonds (a pair a spec already wrote wins; the `strangers`
  fixture clears it with the bonds). `resolveContest` adds `GRUDGE_PER_CONTEST` between eater and gobbler on every
  contested drop, whichever way it goes. Each ambient step (not held) drifts grudges toward 0 via `driftBonds`.
- Save: additive optional `grudges` field (same validation as `bonds`); absent in old saves → `{}` (no founding
  feud is retro-seeded into an existing park).
- Book: each page carries `😒 doesn't get on with <rival>` directly under the closest-friend line when the worst
  grudge is ≥ `RIVAL_BAR`; no line otherwise.
- Hooks: `__grudges()`, `__setGrudge(a, b, v)`.

**Acceptance criteria:**
- [ ] Fresh save: `__grudges()` has Mossback|Twitch = 40 and no other pair.
- [ ] Fresh save: the book page for Mossback includes `😒 doesn't get on with Twitch`, and Twitch's page includes `😒 doesn't get on with Mossback`; Rex's page has no `😒` line.
- [ ] A contested drop resolved by `resolveContest` raises that pair's grudge by `GRUDGE_PER_CONTEST` (unit + e2e via the existing contest hook).
- [ ] Grudges drift toward 0 at `GRUDGE_DRIFT` per ambient step, and slower than bonds drift (`GRUDGE_DRIFT < BOND_DRIFT`), asserted in unit.
- [ ] Save round-trip preserves `grudges`; a save without the field loads with `{}`; a malformed one is rejected.
- [ ] The `strangers` fixture leaves `__grudges()` empty.
- [ ] Founding grudge pair names are roster names and share a spawn zone (unit).

**Out of scope:** a grudge lens/overlay; grudges changing hearts or bonds; feuds mending; retro-seeding old saves;
away-time drift.

**Constraints:** reuse `strengthen` / `bondPoints` / `driftBonds` / `closestFriend` — no copies. Additive save only.

## Lore track — BACKLOG-024

**Item:** BACKLOG-024 [pokemon] Rivalry duels — reshaped: rivals square off.

**Why this cycle:** the oldest open idea in the park, and the one the grudge graph makes possible. A book line
alone is a fact; two dinos bristling at each other in the grass is a moment.

**What ships:**
- `social/standoff.ts` (pure): `STANDOFF_COOLDOWN_STEPS = 20` (~60 s), `STANDOFF_BACKOFF = 2`,
  `STANDOFF_ART_KEY = 'standoff'`, `STANDOFF_GLYPH = '💢'`; `squareOff(a, b)` → `{ holder, yielder }` (higher
  bravery holds, tie → lexicographically smaller name holds); `backOffTile(yielder, holder, cols, rows)` (two tiles
  directly away, clamped; same tile → steps +x); `standoffLine`, `heldMemory`, `backedMemory`.
- Scene, in the ambient meeting loop (same ground, adjacent, ambient not held): if the pair's grudge ≥ `RIVAL_BAR`
  and the pair is off cooldown, a **standoff replaces that meeting** (no meet recorded, no bond gain): 💢 pops over
  both through `makeHourMark(STANDOFF_ART_KEY, ...)` for ~1.2 s (only when in view), the yielder steps back
  `STANDOFF_BACKOFF` tiles, the ticker logs `💢 <holder> and <yielder> squared off — <yielder> backed down`, the
  holder files `you stared down <yielder>`, the yielder files `<holder> stared you down — you backed off`.
  Off cooldown, rivals who bump meet as normal.
- `STANDOFF_ART_KEY` joins `worldPlacedProps` (so BACKLOG-575 can be drawn tonight).
- Hooks: `__lastStandoff()` → `{ holder, yielder } | null`; `__forceStandoff(a, b)` runs the production path for a
  pair (placing them adjacent first).

**Acceptance criteria:**
- [ ] `squareOff` gives the bolder dino the hold, and breaks ties by name (unit).
- [ ] `backOffTile` moves 2 tiles away along each nonzero axis and clamps to the grid (unit).
- [ ] In a fresh save with ambient running, Mossback and Twitch square off on their own within 10 minutes of watching: the ticker gains a `💢 … squared off` line naming both (e2e, polled; the pair may be nudged adjacent to keep the spec fast, but through ordinary ambient steps, not the force hook).
- [ ] After a standoff the yielder is ≥ 2 tiles (Chebyshev) from the holder, unless clamped by an edge (e2e via `__forceStandoff`).
- [ ] Both dinos' memory rings carry the standoff lines (e2e).
- [ ] A second standoff between the same pair cannot fire within `STANDOFF_COOLDOWN_STEPS` (unit on the cooldown predicate).
- [ ] A pair under `RIVAL_BAR` never squares off; they meet as before (unit + Rex/Sunny unchanged).
- [ ] `worldPlacedProps()` contains `STANDOFF_ART_KEY` (unit).

**Out of scope:** hearts/bond loss from a standoff; the player intervening; standoffs feeding the grudge; any LLM
text (deterministic only, so no brain path changes).

**Constraints:** both tracks touch `WorldScene.ts` (structure first: the `grudges` field, then lore's loop branch)
and `founding.ts` only on the structure side. Holding ambient must suppress standoffs, so every spec that pins
positions is unaffected.
