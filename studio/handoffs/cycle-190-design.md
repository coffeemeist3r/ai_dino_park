# Cycle 190 — Design

Shared seam: both tracks hang off `moltDino` in `WorldScene.ts` — the lore track writes a field onto the growth record
the molt already writes; the structure track adds one beat after it. Pure helpers live in `world/growth.ts` (both) and
`world/term.ts` (the seat line, beside `turnoverLine`). Structure lands first (it touches `zoneCandidates`, which the
lore track never reads); lore second.

## Lore track — BACKLOG-313 (reshaped): the kept habit

**Item:** BACKLOG-313 — a grown dino that copied its guardian while young keeps that quirk, now and then.

**Why this cycle:** Milestone 31's second lore arc and the second half of its headline ("when it grows up you can see
what it kept"). Cycle 189 made the molt a clean break: Pip drops Bramble's quirk at 14:00 and never shows it again.
A habit that survives growing up is the most legible "whose was it" there is, and it makes each grown youngster
distinct from a founder with the same traits — its body language has a history.

**What ships:**
- At the molt, if the dino had a guardian (the `copied` read cycle 189 already takes), the growth record keeps
  `kept: { from, glyph, label }` — the guardian's name and its quirk, snapshotted then (so it survives the guardian's
  own later change or absence). Additive optional field; old saves have none and read exactly as before.
- After the molt, on its idle (wandering) mark, with no mood and no lift window: on **one step in four**
  (`keptBeat(worldSteps)`, `KEPT_EVERY = 4`) the mark is the kept glyph; otherwise its own quirk glyph. A sulk still
  shades 😒; the 325 flourish still shows first.
- The book's quirk line for a dino with `kept`: `<own label>, and still <From>'s <kept label> now and then`.

**Acceptance criteria:**
- [ ] `keptBeat(step)` true exactly when `step % 4 === 0`; `keptLine('paces', {from:'Bramble',label:'hums to itself',…})` reads `paces, and still Bramble's hums to itself now and then` (unit).
- [ ] Fresh save, after Pip molts: `__growth('Pip').kept.from === 'Bramble'` and `kept.glyph` equals Bramble's quirk glyph (e2e).
- [ ] After the molt (once the lift window passes), Pip's idle mark over ≥ 8 consecutive wandering steps shows **both** its own glyph and Bramble's glyph (e2e).
- [ ] Pip's book row quirk contains `and still Bramble's` after the molt (e2e).
- [ ] Reload after the molt: `kept` survives (`__growth('Pip').kept.from === 'Bramble'`) (e2e).
- [ ] A molt with no guardian writes no `kept`; founders' idle marks are unchanged (unit + existing specs).

**Out of scope:** keeping anything else (voice, tether, role); LLM prompt use of the kept habit; a book entry beyond the
quirk line.

**Constraints:** Render seams are `refreshActivityMarks` and the book `quirk:` field only. Additive save only (the
field rides the existing `growth` map). Overlaps the structure track in `moltDino` (different lines).

## Structure track — BACKLOG-609 (reshaped): a youngster holds no standing

**Item:** BACKLOG-609 — while young a dino holds no council seat and no provider claim; at the molt it steps into
what its tally earns.

**Why this cycle:** Milestone 31's second structure arc. Measured: no work read carries a per-dino weight, but the
Grove's founding council seat is Pip, a youngster. Seating a child on the ground's only ballot contradicts the stage
system the park just built, and moving the seat at the molt makes governance change hands *inside a sitting* on a
fresh save — the first live seat change the founding park shows before its first day boundary.

**What ships:**
- Pure `standingCandidate(c, young)`: a young dino reads to the standings fold as `role: 'wanderer', foodBanked: 0`
  (its stored tally is untouched). `zoneCandidates` applies it per dino by `stageNow`.
- Fresh save: the Grove's council is `['Bramble']` while Pip is young; the Grove's work/pantry call is voted by
  Bramble's temperament.
- At the molt, after the record is written: if the grown dino now sits on its ground's council (`councilFor`), the
  ticker logs `🗳️ <Name> takes a seat on the <Ground>'s council — grown now` (`grownSeatLine`, in `term.ts`,
  `theZone` wording). Fresh save: Pip takes the Grove's seat at 14:00.
- A held seating (after a day boundary's term) is left alone: the next term picks the grown dino up through the
  existing turnover beat. No save field.

**Acceptance criteria:**
- [ ] `standingCandidate` returns the candidate unchanged for an adult and zero-banked wanderer for a young one, without mutating the input (unit).
- [ ] `grownSeatLine('Pip','Grove')` reads `🗳️ Pip takes a seat on the Grove's council — grown now` (unit).
- [ ] Fresh save: `__councils().grove` is `['Bramble']` (e2e).
- [ ] After `__moltNow('Pip')`: `__councils().grove` is `['Pip']` and the ticker carries `Pip takes a seat on the Grove's council` (e2e).
- [ ] `cycle-137-ballot` stays green with Pip molted first (its 0.522 premise survives a `bolder` molt) (e2e).
- [ ] Build clean, full unit + e2e green; web-llm boundary holds.

**Out of scope:** half-heads (611); youth affecting the haul, gathering or pioneer claims; any term/turnover rule change.

**Constraints:** Do not touch `zoneCouncil`/`councilSeats` — the fix lives in the candidate builder only (482's one
comparator rule). Update the founding.ts council comment (it says the seat is Pip from boot). Shared file with lore:
`WorldScene.ts` (`zoneCandidates`, `moltDino`), `growth.ts`.
