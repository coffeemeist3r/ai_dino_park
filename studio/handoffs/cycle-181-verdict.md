# Cycle 181 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-148 — tone-aware reply (Milestone 27 lore arc 1)

**Rationale:**
- All 5 criteria pass. Criterion 4 (another opener wins over the echo) passes by inspection, and QA says so.
- `toneEcho` is pure and reuses `toneReaction`'s verdict. It does not invent a second idea of whether a dino liked a
  tone.
- The scene change is two lines. `prevTone` is read before `recordTone` overwrites it, and the echo is the last arm
  of the one-or-none opener chain, so every older opener keeps precedence.
- No save change: `lastTone` has been persisted since cycle 35. That is the point of the item. The park has stored
  the trace for 146 cycles and has now started saying it.
- Not shipped: the model's half (passing the last tone into the greet prompt). The opener is a deterministic frame,
  as 408's is, so every device has the arc whole. The prompt half can ride a later voice item.

**Reachability (v7):** *In a fresh save, watched for ten minutes, what does the player see that they could not before?*
In the first minute, greet a dino, then greet it again. The second reply opens with what it made of the first. Tease
the whole cast twice and the e2e shows both registers: some dinos rib back, and some sigh *"Teasing again.
Wonderful."*

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-592 — an answer moves the mind (Milestone 27 structure arc 1)

**Rationale:**
- All 5 criteria pass. Criterion 4 (a cold answer drops a seek on the newcomer) passes by inspection, and QA says so.
- Two pure tables (`answerSeek`, `answerEffect`) and one scene method, `actOnAnswer`.
- The walk and the arrival line are the old `soughtOnGround` / `arriveIfSought`. No new movement code.
- The graphs move through the existing `strengthen` and `recordMeet`.
- The next phase's `chooseSeek` replaces the pick, as with any other, so an answer leans on a dino's afternoon and
  does not take it over.
- Hosts the welcome mark (593).
- No save change.

**Reachability (v7):** No model is needed. Errands split the bowl's pairs in the first minute, and 588's follow brings
them back. When Sunny comes back, Rex says he is glad, then the ticker reads *👀 Rex goes looking for Sunny — for more
of yesterday.* and he walks to her. When Mossback comes back, Twitch bristles and goes looking for him, *spoiling for
it*, and the founding feud is fed instead of only cooling.

## Milestone

Milestone 27: two of four arcs closed (lore 1, structure 1). The remaining two arcs are placeholders, and the smiths
draft them next cycle. Not shipped.

## Notes for the next cycle

- Lore arc 2, from the queue: candidates 139 (thankful line) and 045 (catchphrase). Either one weaves a mind into
  dialogue that already exists.
- Structure arc 2: 107's per-beat budget still has three ambient model calls per dino per phase to govern, but it
  cannot pass v7 alone. Pair it with something a player sees, or take 578 with a reachable digest.
- `answerEffect`'s bristle grudge (+3) and `GRUDGE_DRIFT` now pull against each other. Watch whether the founding feud
  stays above `RIVAL_BAR` for a whole sitting. That is intended, but nobody has measured it yet.
