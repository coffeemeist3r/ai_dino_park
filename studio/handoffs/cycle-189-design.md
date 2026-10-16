# Cycle 189 — Design

Shared seam: both tracks read one pure `guardianOf` in `world/growth.ts` — a youngster's guardian is the first of its
parents on its own ground, else its closest friend (`bestFriendOf`) on its own ground, else nobody. Specify it once;
the structure track owns it (it lands first in the Coder's fire), the lore track consumes it.

## Lore track — BACKLOG-320 (reshaped): the youngster copies

**Item:** BACKLOG-320 — a youngster copies its guardian's idle quirk; at the molt it finds its own.

**Why this cycle:** Milestone 31's first lore arc. Pip is young for the first ~6 real minutes of a fresh save, and in
that window it is a half-size adult — nothing on screen says it belongs to anyone. The idle mark (298) is the
park's most-watched per-dino tell; letting a youngster wear its guardian's makes "whose is that?" readable from
across the grass, and makes the molt a visible change of character, not only of size.

**What ships:**
- While a dino is young and has a guardian, its idle (wandering) mark shows the **guardian's** signature quirk glyph,
  not its own. A sulk still shades it 😒 (mood over motion, unchanged).
- The book's quirk line for that youngster reads `copies <Guardian> — <guardian's quirk label>`.
- At the molt: the grown dino shows its **own** relief flourish (the 325 `liftedUntil` window, reused) so its own
  quirk is the first thing it does as an adult; the ticker logs `<Name> stops copying <Guardian> — <own label> now`;
  it files the memory `you used to copy <Guardian> — <guardian's label>`. Only if it had a guardian at the molt.
- A youngster with no guardian (none on its ground) idles with its own quirk, exactly as today.

**Acceptance criteria:**
- [ ] `copiedQuirk(own, guardian)` / the youngster mark: a young dino with a guardian shows the guardian's quirk glyph; without one, its own (unit).
- [ ] Book line `copies Bramble — …` for Pip in a fresh save; Pip's own quirk differs from Bramble's (unit + e2e).
- [ ] Fresh save, before 14:00: Pip's rendered idle mark equals Bramble's quirk glyph (e2e, via a mark-text hook).
- [ ] After Pip molts: ticker has `Pip stops copying Bramble`, Pip carries the copy memory, and Pip's book quirk is its own label (e2e).
- [ ] Adults unchanged: every adult's idle mark is still its own `moodFidget` glyph (unit/e2e).

**Out of scope:** keeping the copied quirk after the molt (it finds its own — the "what it kept" half is arc 2);
copying tics (407 already covers rituals); any LLM prompt change.

**Constraints:** `refreshActivityMarks` and the book `quirk:` field are the only render seams; the molt hook goes in
`moltDino` before the traits shift (read the guardian first). No save field — guardian is derived. Overlaps the
structure track in `WorldScene.ts` (different methods) and `world/growth.ts` (structure adds `guardianOf` first).

## Structure track — BACKLOG-607: a youngster keeps to its guardian

**Item:** BACKLOG-607 — while young, a dino's wander is tethered within a few tiles of its guardian.

**Why this cycle:** Milestone 31's first structure arc, and the spine the lore track's copying needs: a youngster that
drifts across the ground is nobody's, whatever glyph it wears. A tether is the smallest world-step change that makes
youth positional.

**What ships:**
- `TETHER_TILES = 3`. A young dino with a guardian, on its ordinary idle wander (the last branch of the movement
  ladder), steps toward its guardian when it is more than `TETHER_TILES` away (Chebyshev), and otherwise wanders but
  never takes a step that would put it beyond the tether (it holds its tile instead).
- Every higher priority (inspection, distress, comfort, molt visits, migration, food rush, huddle, gather, tics,
  socializing, needs, rest) is unchanged — the tether is a leash on idle drift, not a compulsion.
- At the molt the tether releases: `stageOf` is adult, so the branch is plain `wanderStep` again.
- The wander-direction roll is still drawn for a tethered youngster, so the shared random stream advances the same
  number of times as before.
- A `__guardian(name)` hook returns the guardian name or null; a `__tether` read returns `TETHER_TILES`.

**Acceptance criteria:**
- [ ] `guardianOf`: parent on ground beats friend; friend on another ground → null; self never; no record → null (unit).
- [ ] `tetherStep`: beyond the tether → one step toward the guardian; within it → the wander step, or hold if that step leaves the tether (unit).
- [ ] Fresh save: `__guardian('Pip') === 'Bramble'` (e2e).
- [ ] Fresh save, stepped ~40 world steps before 14:00: Pip stays within `TETHER_TILES` of Bramble whenever it is on the idle branch (e2e: sample Chebyshev distance each step; allow transient excursions only while Pip's activity is not `wandering`).
- [ ] After the molt, `__guardian('Pip')` is null (adult) and Pip's wander is untethered (e2e).

**Out of scope:** the grown dino's "first far wander"; guardians who follow the youngster; cross-ground guardians; any
save field.

**Constraints:** pure logic in `world/growth.ts` (`guardianOf`, `TETHER_TILES`, `tetherStep`); the scene change is
the last `else` of the movement ladder plus one hook. Respect the cycle-188 lesson: assert on the rule (distance on
the idle branch), never on a rolled position.
