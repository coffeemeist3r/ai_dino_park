# Cycle 81 — Lore Handoff

**Theme:** The payoff cycle. Last cycle the bowl got *needs* (371) and the friendless dino got a face
(135) — but both ended on a held note: a loner's 🥀 had no way to *lift*, and hunger was only ever a mark
over a head. This cycle pays off the loner: the moment a dino on the outside grows its first real bond, the
mope clears and it files a quiet "not so alone now." Loneliness becomes a state a dino can leave. The new
seeds push the same direction — the need-drive into the *social* texture of food (shared, yielded, stirred).

**Added to BACKLOG:**
- BACKLOG-373 [emergent] Shared meal — two dinos eating the same hatch drop within a window bond over it.
- BACKLOG-374 [emergent] Comfort food — a moping dino eating its *favorite* perks up faster; solace per palate.
- BACKLOG-375 [social] Generous feeder — a sated dino yields a hatch drop to a hungrier high-bond friend.
- BACKLOG-376 [emergent] Woke hungry — a dino over the hunger threshold at dawn stirs hungry, not just stretches.

**Suggested next-up (lore track):** **BACKLOG-369 — the loner finds a friend.** Already queued (cycle-80
block); the direct payoff of the loner (135) that just shipped. The 🥀 already lifts on its own (it reads
the live bond graph), so the new work is the *beat*: detect the loner→friend transition the first time a
loner's bond clears the floor, file a "not so alone now" memory, and float a one-shot perk-up. Pure
`loner.ts` transition helper + a thin meet-site/`__bondPair` hook + memory/bubble — **file-disjoint** from
the structure track's directed-carry pick (resource.ts + `crossDino`), so the two-track fire stays clean.

**Idea Box:** the lone open entry (stash-ahead art policy) stays **deferred** — its revisit trigger is "an
art fire would otherwise no-op with nothing but terrain-blocked work left," but the `[art]` queue is fully
empty (cast 5/5, tiles 033, crop props 317, dialog frame 036 all shipped): nothing to stash *and* nothing
blocked, so the rule doesn't bite. No change.
