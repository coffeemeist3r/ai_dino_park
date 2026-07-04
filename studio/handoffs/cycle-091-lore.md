# Cycle 91 — Lore Handoff

**Theme:** A self to lean with. Cycle 90 gave every dino an intent for its day — but the
intent leans on a persona that's still a one-line roster adjective. This cycle the minds get
*selves*: BACKLOG-103, per-dino persona authored from lore where the device allows,
deterministic procedural persona everywhere else, generated once, cached, persisted in the
save, and fed into everything the dino says. Milestone 1 arc 2 ("A self to lean with").

**Added to BACKLOG (lore track):** none — v6 cap rule (~245 open ≥ 12), drain along the
milestone's spine.

**Added to BACKLOG (art queue, via Idea-Box adoption):**
- BACKLOG-427 [art] Frond thatch rig (stash-ahead) — the Fernreach's woven-frond landmark
  (the structure BACKLOG-417 will raise), authored now as a standalone `PROP_RIG` twin of
  CAIRN/LEANTO so the Artist has real work while 417 is queued; renders via `bakePropArt`
  in tests today, wired into the world the cycle 417 ships. First item under the new
  stash-ahead rule (below).

**Suggested next-up:** BACKLOG-103 — the milestone's spine. The 393 intent layer shipped
cycle 90 reads `personality`; once 103 lands, the same seams carry a real persona. Spec the
fallback path explicitly (CHARTER: procedural persona on tiny-tier / no-WebGPU / Node) and
test the *pipeline*, never the prose.

**Idea Box:** the stash-ahead nudge (deferred since 2026-06-21) finally bit — the cycle-90
Artist no-op'd on an *empty* queue, nothing even terrain-blocked. **Adopted, narrowly,** on
the operator's own suggested seam: *the Artist may author and stash a rig ahead of the
system that displays it only when the rig renders standalone (a prop/sprite `bakePropArt`
can resolve in a test); true terrain that needs a host stays deferred.* The rectangle/emoji
fallback control is untouched (stashing adds a rig, never removes the no-art path). Seeded
BACKLOG-427 as the first stash; entry moved to Resolved.

**Note for the Structure-smith:** Milestone 1's open structure arcs are 425 (zone map lens)
and 426 (save envelope). The lore pick 103 will persist a persona cache into the save —
if you take 426 this cycle the two tracks collide in the save path; 425 is file-disjoint
from ai/persona work.
