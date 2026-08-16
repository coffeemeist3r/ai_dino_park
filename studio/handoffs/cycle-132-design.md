# Cycle 132 — Design

## Lore track — BACKLOG-412 Self-soothing tic

### Spec

A dino that comes away from a contested drop **empty** carries a sting for a while. While that sting is
fresh, its solitary-tic onset threshold drops: it needs far fewer undisturbed steps alone before it falls
into its signature ritual (405). The first tic it forms while stung files a distinct memory naming the
ritual and the fact that it was soothing itself — not the plain 405 "alone a long while" note.

**The two sting sites**, both inside `WorldScene.resolveContest`:

1. The denied gobbler that slinks off when a bold winner holds (394).
2. The winner that *cedes* — the gobbler shoulders past and eats (387); the winner is the one left with
   nothing.

Both are events already in hand; nothing re-reads a memory string (BACKLOG-483's debt is not to be grown).

**Freshness.** The sting is a window, not a permanent state. It is measured in the same unit the tic onset
already uses — the dino's own solitary/wander steps — and expires. A dino stung and then fed, or stung and
then in company for a long stretch, ends up back at the normal threshold. Not persisted: like `berthedThisDrop`
and `lastWorkCallByZone`, it is a live read of a live moment; a reload starts every dino unstung.

**Composition.** `tic.ts` already carries two onset shorteners (the 393 solitary-day threshold via
`ticAfterFor`, and `TIC_AFTER_STEPS_HOMESICK` for 410) and the caller takes the `Math.min`. The sting is a
third `Math.min` argument and must sit **below** the homesick threshold — a fresh wound reads faster than
unfamiliar ground.

### Non-goals (hard)

- No new glyph or emoji. The tic's own glyph plays as it always does.
- No bond change, no affinity change, no wander-pull, no mood system.
- No change to which tic a dino performs, its motion, or its anchor.
- No new memory-string parsing.
- No save-format change.

### Acceptance criteria — lore track

1. A pure exported constant for the stung onset threshold exists, strictly below `TIC_AFTER_STEPS_HOMESICK`
   and above zero.
2. A pure predicate answers whether a sting is still fresh given the steps elapsed since it, with an
   explicit expiry constant; expired stings answer false.
3. A pure builder returns the self-soothing memory, naming the tic's label, distinct from `ticMemory`.
4. `resolveContest`'s slink-off branch marks the denied gobbler as stung.
5. `resolveContest`'s cede branch marks the ceding winner as stung.
6. A stung dino's effective onset threshold is the stung constant; an unstung dino's is unchanged from
   today's value for the same inputs (byte-identical fallthrough).
7. The stung shortener composes by `Math.min` with the homesick and solitary-day shorteners — no branch
   overrides another.
8. The self-soothing memory is filed at most once per sting, on the step the tic forms.
9. A dev hook exposes each dino's sting state so the e2e can drive and read it.
10. An e2e spec drives a production contested drop to a loser, and observes that loser's tic forming on the
    shortened threshold with the self-soothing memory filed.
11. Unit specs cover 1–3 and 6–8. Save format untouched.

---

## Structure track — BACKLOG-484 The seat has a term

### Spec

A zone's council (479) stops being re-derived on every read. Instead:

- **A held seating.** WorldScene holds `zone → seated names` plus the in-game day they were seated. Every
  consumer (`councilFor`, `zoneCouncils` — and therefore the lens 👥, the book seat line, the 481 vote, the
  dev hook) reads the held seating.
- **The term.** On the in-game **day boundary**, the seating is re-derived from the live standings and
  replaces the held one. Its own `clock.onHour` listener, live-observed only, exactly as `checkSpoilage`
  (455) and `checkUpkeep` (480) are — so a restore or an away-jump `clock.set` never fires a term.
- **Fallthrough to live.** A zone with **no** held seating (fresh save; a zone that has never been seated)
  reads live, so boot and the first in-game day are bit-identical to today's behaviour and a park that never
  crosses a day boundary is unchanged.
- **The turnover beat.** When a re-derivation actually changes a ground's membership — as a *set*, not an
  ordering — a one-off ticker line names the ground and what changed. A ground first seated is not a
  turnover (the `checkCouncilCall` precedent: the first seating is recorded silently). A re-derivation that
  changes nothing logs nothing.
- **Persistence.** Two new optional save fields: the seating map and the seating day. Guarded like
  `pioneers`. Absent on an old save → the park reads live until its next day boundary, which is exactly the
  fresh-save path. Additive only.

### Ordering note

`zoneCouncil` orders most-banked first and the 481 tie-break relies on that order (`votes[0]`). A held
seating therefore holds the **order** too, not just the membership; the term freezes the tie-break with the
seats, which is the point — a tie must not flip mid-term either.

### Non-goals (hard)

- No change to `zoneCouncil`'s comparator or eligibility bar. 482's one-derivation promise stands.
- No new standing kind, no `Standing` shape change.
- No new glyph (🗳️ is the council's mark and the turnover line reuses it).
- The spend priority stays the provider's — that is 487, not this.
- No change to what the council *decides*.

### Acceptance criteria — structure track

1. A pure module owns: the held-seating type, the re-derivation, the membership diff, and the ticker wording.
2. The diff reports a turnover only when the seated **set** changes; an identical set in a different order is
   not a turnover, and neither is an unchanged set.
3. A ground moving from no seating to a seating is reported as a **first seating**, distinguishable from a
   turnover, and logs nothing.
4. `councilFor(zone)` and `zoneCouncils()` return the held seating when one exists for that zone, and the
   live derivation when none does.
5. The re-derivation runs on the in-game day boundary and only when the day advances past the last term day.
6. A restore or away-jump (`clock.set`) fires no term and no turnover beat.
7. A turnover logs exactly one ticker line naming the zone; an unchanged re-derivation logs none.
8. The seating and the term day round-trip through save/load; an old save without the fields loads clean and
   reads live.
9. Held order is preserved, so the 481 tie-break is stable across a term.
10. A dev hook exposes the held seating + term day and can force one term, so the e2e can drive it.
11. An e2e spec: boot, force a banking change that would reseat a ground, assert the seats do **not** move,
    force the day boundary, assert the seats move and the ticker line lands exactly once.
12. Unit specs cover 1–3, 5, 9. The full suite stays green; save format additive.
