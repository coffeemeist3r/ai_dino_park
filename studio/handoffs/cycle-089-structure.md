# Cycle 89 — Structure Handoff

**Intent:** Make the gather economy a system a zone can *exhaust*. Since 146 the gather spine has been
infinite — every zone re-rolls its resource slot forever at a flat chance no matter how hard it's worked
(314 made it per-zone but still bottomless). BACKLOG-384 adds the first renewable constraint: each zone
carries a *yield* (fertility) that a pickup thins and time slowly restores, so over-gathering a zone stalls
its spawns until it rests. This is the load-bearing beat under everything the build arc does next — it turns
carry/barter (329/356/358) from a nicety into a *response to scarcity*: when one zone is worked out, ferrying
from a fresh one finally has an economic reason, not just a diverging-mix flavor reason.

**Added to Structure Track:** none — drained from queue (4 open = X=4; cap rule says pick, don't invent).

**Chosen this cycle:** **BACKLOG-384** [emergent] Resource regrowth — top unblocked item (its deps 314/309/348
all shipped). Ranks above the runners-up on the foundation bias: 398 (edge indicator) is pure UI legibility
with no downstream unblock; 417/418 are per-zone divergence polish. 384 is the spine the whole gather economy's
future scarcity mechanics build on. File-disjoint from lore 413 (384 lives in a new `world/regrowth.ts` +
`maybeSpawnResource`/`checkGather`; 413 lives in `tic.ts` + the greet methods — shared WorldScene.ts, different
methods).
