# Cycle 94 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-414 — A ritual for the missing friend

**Rationale:** All six acceptance criteria pass; build clean, 1029/1029 unit, 308/308 e2e. The solitary
tic (405) now carries a *direction*: a dino whose closest bonded friend (013, above an 8-point floor) lives
in another zone walks its ritual to the linked edge that leads toward that friend and performs it there,
filing a one-time memory that names them ("your closest friend Twitch crossed away — you pace a fixed little
path at the edge they left by"). The non-grief path is byte-identical — the anchor is still the dino's own
tile when there is no departed friend, so the cycle-87 solitary-tic spec stays green (hardened for determinism,
same intent). Pure helpers (`griefEdge`/`griefAnchor`/`griefTicMemory` in tic.ts, `closestFriend` in bonds.ts)
are Node-testable and reuse the chain/bond primitives; no WebLLM, no save change, no NPCBrain breach. QA
surfaced a *pre-existing* quirk (meets key on pixel proximity, not zone — `WorldScene.ts:2472`) that let an
isolated dino bond across zones; that's out of scope and, if anything, feeds grief correctly. Milestone 2 lore
arc 2 of 3. Ships.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-431 — Pause ambient timers in e2e

**Rationale:** All six criteria pass. A scene flag `ambientPaused` (default false — normal play untouched)
gates the three wall-clock background timer callbacks (wander `forceStep`, sky roll, migration roll); the
shared e2e `boot()` sets it, so every spec runs against a still world while the explicit dev hooks
(`__stepWorld`, `__triggerSky`, `__migrate`, `__maybeBarter`, `__advanceWall`) — which call the underlying
methods directly — keep working. The whole 308-spec suite is green under full parallel load, and the
previously-red `mobile-minds` long-dialog spec (the catalogued BACKLOG-430) went green *because* the ambient
chatter that raced it is now frozen: the flake class this item targets is visibly gone. Test-only surface,
additive, no NPCBrain or save impact. Operator-injected, shipped ahead of 418 exactly as directed. Ships.

## Milestone bookkeeping

Milestone 2 "Places to belong": lore arc 2 (414) now `[x]`; arcs remaining — lore 340 (homesick), structure
418 (per-zone crops) + 428 (prosperity index). Not complete — milestone stays ACTIVE. (431 is off-milestone
infra; no arc to check.)
