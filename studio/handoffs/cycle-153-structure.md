# Cycle 153 — Structure Handoff

**Intent:** Decide the number that means *this ground is still being looked after*, and wire it, so the
founder's stake stops being a nameplate with a hole in it and BACKLOG-518 stops being an art item held
hostage by a structural question nobody would answer in the structure lane.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-535** — the stake's undecided driver.

**Solo cycle:** not declared. `cycle - lastSoloCycle = 153 - 151 = 2`, so a declaration would be invalid
under CHARTER v8 condition 2 regardless, and nothing in the queue is asking for one.

---

## Why 535 and not 530, which is top of the queue

This is a judgement call and it should be recorded as one rather than buried.

BACKLOG-530 — the `__marks()` hook — is a good item, it is cheap, and it is top of the Structure Track
because three consecutive Validators put it there. It is also, honestly answered, an item whose reachability
bar answer is **"nothing; a player sees nothing"**. That is not a disqualification from being built. It is a
disqualification from being a **track**, and cycle 148 is the precedent that settled it: BACKLOG-515 sat
unpickable for four cycles for exactly this reason, and the resolution was to notice that the bar judges
tracks, so 515 shipped as a **rider** on a track that had its own answer. 530 should ship the same way.
It stays top of the Structure Track and it is the first thing to reach for the next time a track's own work
lands early.

BACKLOG-535 has the opposite shape, and the reason to take it now is that the thing it unblocks has been
waiting seven fires:

- The founder's stake ships three states and the item that would give it a fourth — 518, *the ground
  somebody keeps up* — has been held out of the Artist's hands since cycle 145 for one reason, and it is
  not an art reason. **No number in this park means "looked after."** 513 reads the pioneer record, 514
  reads the head count; the third axis has no source, and the cycle-145 amendment ("a drawn rig with no
  host is a red build") correctly keeps it queued until one exists.
- The Artist ran last night with a queue of **1**, and that 1 was 518. Every chronicle for three cycles has
  named this. It is a structural blockage presenting as an art shortage, which is exactly the kind of thing
  this routine exists to unstick.

## The driver: the upkeep ledger. Here is why the other two lost.

The item names three candidates and asks for the losers to be written down, so:

**Chosen — the upkeep ledger** (`standing > 0 && derelict === 0`). *Looked after* is not a synonym for
*rich*; it means somebody is keeping the place up, and after BACKLOG-528 that is a number that finally
**moves on a save nobody has played**. The founding Grove ships one fallen cairn and one standing lean-to,
so it boots **not** kept; a resident walks over within the first minute and mends the cairn, and the ground
becomes kept **while the player is standing there**. That is the strongest bar answer available to any of
the three: not a state that differs between grounds on frame one, but a state that *changes in front of
you*, driven by an errand the park already ships and pays for out of its own pile.

**Rejected — `pileStep` off the ground's bank (the candidate the last three chronicles kept naming).**
It is the obvious one and it is wrong for a reason that only shows up once you look at the map: BACKLOG-504
already draws the ground's bank as a heap that steps with the stockpile, standing on that same ground. A
bank-keyed stake would put two props on one screen saying one number in two alphabets. The whole argument
for the stake family is that it is *the park's cheapest health read* — a read that duplicates the heap is
not a second read, it is the same read twice. And it answers the wrong question: a ground can be piled high
because nobody has spent anything, which is closer to neglect than to care.

**Rejected — the prosperity index (428).** It is a composite, so a stake driven by it says *something about
this ground is going well* and the player cannot tell what. Four states in one family only pays off if each
state names one thing. Prosperity also already has a surface (the lens), and 428 reads *past* upkeep — so a
prosperity stake would be reporting a number that includes the one we actually mean, diluted with three
that we do not.

## Shape of the work

- `stakeUpkeepStep(standing, derelict)` — pure, beside `stake.ts`'s existing reads, no new save field
  (both counts are already derived from the landmark arrays, `standings.ts`'s doctrine).
- `stakeArtKey` grows a `kept` axis. Precedence: **hollowed > kept > kind.** A ground everybody left looks
  the same whether it was tended or not — that is what leaving does, and it is already the rule that
  hollowed beats kind.
- `syncStakes` reads it, and the mend's resolve path has to reach the sync, or the state changes on the next
  zone cross instead of on the mend. That is the one place this can quietly ship half-dead.
- A `played` entry in the reachability register (528's frame), so *the founding Grove's stake reads kept
  after one session* is a claim that breaks rather than a sentence in this handoff.
- `founder_stake_kept` is then a host with no rig, which is the safe direction (the glyph fallback covers
  it). The Artist fires later tonight with 518 finally drawable.
