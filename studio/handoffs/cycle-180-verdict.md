# Cycle 180 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-589 — the ground answers a newcomer (Milestone 26 lore arc 3)

**Rationale:**
- All 6 criteria pass. Build clean, unit 3269 green, e2e 885/885 on the first full run.
- The module is pure (`ai/welcome.ts`), and its five rules read in order.
- Two of the five read yesterday's reflection directly: `missed` and `company`. So the arc's clause "yesterday's reflection is part of the answer" is literal, not decorative.
- The scene glue is one method at the end of `crossDino`. It excludes residents that 452/459 already had greet the newcomer, so no dino answers twice.
- No model, no save change.
- One honest limit: the instant `relocate` path does not answer. That is correct, because no player sees a teleport.

**Reachability (v7):** *In a fresh save, watched for ten minutes, what does the player see that they could not before?*
Errands start crossings at 20 seconds. The first one sends Bramble onto the Ridge, where Ember, curious and the only
resident, says *"Who's this, then?"*. A few minutes later Sunny or Glade comes back to the bowl after its companion, and
the bowl answers in four voices. When Sunny returns, Rex is glad to see her (he spent yesterday with her) and Twitch turns
its back. When Mossback returns, the same Twitch bristles. Same ground, same kind of moment, different answers, and
the ticker spells them out.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-588 — the model's hand on whom and where (Milestone 26 structure arc 3)

**Rationale:**
- All 6 criteria pass.
- The arc was cut so its floor ships whole, as CHARTER v9 requires. The floor change is that a sought companion on another ground is a reason to go there. One hop per migration tick, through the existing `startMigration`, so the walk, the carry and the arrival are all the old ones.
- `shouldFollow` is pure. It holds the last resident, a companion who is mid-crossing, and a mutual pair (only the first-named goes, so two friends never pass each other on the road).
- The model's half is shaped exactly like 393's intent:
  - optional `choose`, implemented only on the WebLLM brain;
  - ready engine only, behind `allowAmbient`, asked once per dino per phase;
  - parsed against two closed lists and folded only if the phase is unchanged.
- The model may name any dino in the park. The floor's follow then walks there, which is what joins whom and where into one decision.
- No save change. The boundary grep is clean.

**Reachability (v7):** No model is needed. In a fresh save:
1. At 20 s Bramble sets off on an errand, and at 40 s Glade does.
2. Glade arrives on the Grove. Glade spent yesterday with Mossback and is still looking for him, so on the next tick the
   ticker says *🧭 Glade sets off for Pocket Cretaceous — after Mossback.* and Glade walks back.
3. When Glade reaches the bowl, Mossback is glad it came (589).

The model's half is visible where a model is loaded, as a 🧠 seek line. The fake-brain e2e proves the fold.

## Milestone

**Milestone 26 (TENTPOLE): Minds that act and reflect — SHIPPED.** It ran three cycles and closed six arcs, with no
REWORK and no ABANDON. BACKLOG-104 and BACKLOG-014 are closed as delivered by it. Tentpole 1 is struck from the queue.
The next milestone (27) is a normal one under CHARTER v9: polish, voice and weave. Tentpole 2, Festivals, is Milestone 28.

## Notes for the next cycle

- Milestone 27 should give the new minds texture without inventing a new system. Candidates:
  - The model-line-said-twice limit from 585 (hold the floor bubble while a ready engine answers).
  - An answer that changes what the answerer does next. A `curious` answer could turn its next seek toward the newcomer.
  - 107's per-beat budgeting, which now has three ambient model calls per dino per phase to govern (`intend`, `choose`, and `reflect` at dusk).
- The Structure Track is at 3 (563, 578, 581). The tentpole no longer holds them back.
- Art: BACKLOG-590 (errand mark) is queued, and its host is live.
