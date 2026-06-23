# Cycle 73 — Verdict

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-334 — Visible zone crossing

**Rationale:** All 8 acceptance criteria PASS. The fix is exactly the seam cycle 72 left
open: `relocate`'s teleport is now reserved for the deterministic `__migrate` hook and the
restore path (so cycle-068/069/071 stay byte-identical), while the *ambient* roll starts a
visible walk — the migrant heads for its zone's linked edge via pure, unit-tested tile math
(`migrationStepTarget`/`atMigrationEdge`/`crossEntryTile`) and crosses to the far zone's
opposite edge on arrival. The e2e proves the walk is monotone (no jump) and that the home
zone flips only at the edge, so a bowl→grove migrant is visible leaving and a grove→bowl one
visible arriving. No save change (the in-flight Set is transient). `reworkCount` 0. The
forceStep branch sits below inspect/respond and above food/huddle exactly as specced, so a
committed journey isn't derailed by a snack but a startle can still pre-empt.

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-181 — Sleep murmurs

**Rationale:** All 8 acceptance criteria PASS. A pure `world/murmur.ts` (no Phaser, no AI
import) turns a dino's freshest day-memory into a 💭 fragment, stripping the leading event
glyph so the dream doesn't read as a copied log line; `maybeMurmur` floats it on a sparse
roll for a huddling, in-view dino and stays silent for an awake one. The deterministic line
is the shipped path, so the den has an inner life with **no model** — and because the
murmur module imports no backend, the `NPCBrain` boundary is intact (grep-verified:
`@mlc-ai/web-llm` only under `game/src/ai/`). The LLM-coloured murmur was deferred, which is
the right call: no AC required it, it would have meant a buildMessages change + a governed
night-time brain call, and the charter-relevant parts (boundary + no-model fallback) are
fully met. No save change. `reworkCount` 0.

**Cycle closes** — both tracks APPROVED. Phase → lore-pending; Lore-smith bumps to 74 next
run.

**Operator note:** dinos now *walk* to the grove instead of blinking there — sit in the
bowl and you'll see one drift to the east wall and cross (it'll vanish as it leaves your
zone), or appear at the east edge and amble in from the grove. And the night den dreams:
lean in while the cast huddles and a sleeper will murmur a 💭 fragment of its day. Press
**T** for 60× if you want the crossings to come faster.
