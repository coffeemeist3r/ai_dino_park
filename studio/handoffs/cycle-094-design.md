# Cycle 94 — Design

## Lore track — BACKLOG-414: A ritual for the missing friend

**Item:** BACKLOG-414 [emergent] — a dino whose closest friend has migrated to another zone aims
its solitary tic (405) at the edge that friend left by (paces toward it), so solitude gains a
direction and the departure leaves a visible ache.

**Why this cycle:** Milestone 2's second lore arc ("The ache of a departed friend"). Cycle 93
gave a dino a *home* it settles into (341); this is the underside — when the one dino it's
closest to (013) crosses the chain to another zone (334), its private ritual stops being
aimless and turns toward the boundary they left through. Emergence over polish: the same tic
now reads five different griefs.

**What ships:** A dino truly alone (nothing pressing, no company — the existing 405 onset)
whose *closest* pairwise-bond friend (above a real-friend floor) currently lives in a different
zone will, when it falls into its tic, walk to the linked edge that leads toward that friend's
zone and perform its ritual there (rather than settling wherever it happened to be standing).
It files a distinct one-time memory naming the friend ("your closest friend Twitch crossed away
— you pace a fixed little path at the edge they left by") and the event line reads the same. A
dino whose closest friend shares its zone (or who has no real friend) keeps the plain in-place
405 ritual unchanged.

**Acceptance criteria:**
- [ ] `griefEdge(dinoZone, friendZone)` returns `'east'` when the friend's zone is further east
  in the chain, `'west'` when further west, and `null` when same zone / off-chain (unit).
- [ ] `griefAnchor('west', row, cols)` → `{tileX:0, tileY:row}`; `griefAnchor('east', row, cols)`
  → `{tileX:cols-1, tileY:row}` (unit).
- [ ] `closestFriend(name, bonds, others, floor)` returns the highest-pairwise-bond peer above
  `floor`, lexicographic tie-break, `null` when none clears the floor (unit).
- [ ] E2E: a bowl dino with its strongest bond to a friend it is then migrated into the grove
  falls into its tic aimed at the **east** edge — its tic anchor sits at `tileX === COLS-1` — and
  it files a grief memory naming the friend.
- [ ] E2E control: a dino whose closest friend stays in its own zone anchors its tic at (or
  adjacent to) where it was standing, not at a zone edge, and files the plain 405 memory.
- [ ] Non-grief path is byte-identical: with no cross-zone closest friend, `ticStep` still
  anchors at the dino's current tile (existing cycle-087-solitary-tic spec stays green).

**Out of scope:** Changing the tic *motion kinds* (pace/fuss/circle stay as-is); the
homesick-drift follow-on (340); any bond or migration change; naming the grief in the collection
book or dialogue (later arcs). The friend does not have to be the one who *most recently* left —
just the closest friend who currently lives in another zone.

**Constraints:** Pure helpers (`griefEdge`/`griefAnchor`/`griefTicMemory` in `world/tic.ts`,
`closestFriend` in `social/bonds.ts`) — no Phaser, no WebLLM. The grieving dino must *walk* to
the edge (step toward the anchor), not teleport there in one frame. `resetTic` must clear the
new grief state alongside the existing tic state. No file overlap with the structure track
(structure touches only the three timer callbacks + hooks + `helpers.ts`; lore touches the tic
block + `performTic` + tic/bonds modules).

## Structure track — BACKLOG-431: Pause ambient timers in e2e

**Item:** BACKLOG-431 [infra] — a `__pauseAmbient()` dev hook that freezes the real-time
background timers, wired into the shared e2e `boot()`, killing the parallel-load flake class.

**Why this cycle:** Operator-injected, ship ahead of 418. 300+ specs run full-parallel against
one dev server; the sim's wall-clock timers (wander `forceStep` @3s, migration roll @90s, sky
roll @45s) keep mutating world state between a spec's setup and its assert, so slow CI runners
red a random spec each run ("Expected 1 Received 0"). Fix at the root: freeze the auto-timers by
default in e2e; specs drive beats explicitly anyway.

**What ships:** A scene flag `ambientPaused` (default `false`, normal play unchanged). The three
background timer *callbacks* early-return when it is set — so the automatic wander/sky/migration
rolls stop, while every explicit dev hook (`__stepWorld`, `__triggerSky`, `__migrate`,
`__maybeMigrate`, `__maybeBarter`, `__edgeBarter`, `__settleTick`, `__advanceWall`) still calls
the underlying method directly and works. New hooks `__pauseAmbient()`, `__resumeAmbient()`,
`__ambientPaused()`. `boot()` calls `__pauseAmbient()` after `__ready`, so every spec gets a
still world for free.

**Acceptance criteria:**
- [ ] `__ambientPaused()` is `true` immediately after `boot()`.
- [ ] With ambient paused, dino positions do NOT change over a wait longer than one wander tick
  (>3s) without any explicit step call.
- [ ] After ambient paused, `__stepWorld()` still moves the cast (explicit stepping unaffected).
- [ ] `__resumeAmbient()` sets `__ambientPaused()` back to `false`.
- [ ] Normal play (no hook called) is unchanged: `ambientPaused` defaults `false`, so a fresh
  non-test page still wanders/migrates/rolls sky on its timers.
- [ ] Full existing e2e suite stays green with `boot()` pausing ambient (no spec relied on the
  auto-timers; ambient-testing specs use explicit hooks / `__advanceWall`).

**Out of scope:** Removing cycle-077-carry's intent-pin band-aid (may stay); gating the dawn
chorus / season-turn `onHour` listeners (they only fire on an in-game hour crossing, inert in
short specs, and gating them would break cycle-045-chorus's live crossing); any change to
real-play behavior; the deferred BACKLOG-430 dialog-paging red (separate item).

**Constraints:** The gate lives in the *timer callback closures*, never inside `forceStep` /
`maybeStartSky` / `maybeMigrate` themselves (so the explicit hooks that call those methods keep
working). Additive only. No overlap with the lore track's files.
