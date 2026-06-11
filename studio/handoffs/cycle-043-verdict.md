# Cycle 43 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-179 [emergent] Cold-night shiver — the dino left out of the winter den

## Rationale

Cycle 42 made the winter den *pack*; this cycle gives the packing an aftermath. When a night's
huddle window closes in the morning, the bowl now resolves who slept cold — and the read it uses
is the cleanest possible: a dino sleeps cold iff its strongest bond falls below the season's
huddle bar, the *exact same gate* cycle-171 used to decide who gets pulled to the den. So
"slept cold" is not a new rule bolted on; it is the precise inverse of "welcome in the den," and
the cycle-042 verdict's promised "who sleeps alone in winter" finally becomes a beat you watch:
the unbonded dino shivers 🥶 where it stands at dawn and files a "shivered through a cold night,
slept alone" memory that — riding the existing per-dino store — colours its very next greeting.
Only winter is cold enough to leave the mark; spring, summer, and fall mornings cost a sleeper
nothing, so the feature is inert exactly when the lore says it should be.

I scrutinised the Coder's one deviation and concur with QA that it was correctness, not
convenience. The codeplan tracked a positional `huddledTonight` set, but the bowl's central den
makes proximity-based `isHuddling` true for *every* dino, and `BOND_PER_MEET === 4` equals the
winter bar — so the positional design produced zero cold sleepers and would have warmed any loner
on a single meeting. Reading the bond graph at the morning edge fixes both and is the more
faithful model. `sleptCold`'s signature is untouched; the once-per-night window edge is intact.

Discipline matches the three cycles before it. One pure 28-line module (`world/cold.ts`, no
Phaser, no web-llm), ~34 lines of scene glue, and the save format grew by **nothing** for the
fourth cycle running — the cold memory is just another entry in the store that already persists
and already feeds `__greetPrompt`. The egg gate stays on `isClearNight`, the sky event keeps its
night-only override, and no movement or huddle-eligibility logic changed: the shiver is a read,
not a nudge. Diff is +200 lines, all additive, all in the four expected files.

9/9 acceptance criteria PASS. **320 unit / 116 e2e green in one full parallel run — no flake this
time, not even the catalogued cold-boot one.** Tight, faithful, and the bowl is colder and more
alive for it.

## Follow-ups (already seeded, not blocking)

- BACKLOG-183 (warmed-by-the-memory — the cold teaches a dino to seek the den earlier next time),
  184 (keeper's warmth — greet/feed clears the shiver), 185 (word of the cold — the night gossips
  onward), 186 (hardy in the book — cold nights toughed out), 187 (toughened hide — trait drift).
  All four lean on the `coldMemory` + `__coldSleepers` spine this cycle set.
- BACKLOG-115 — the away fast-forward is still season-blind; a long winter absence should accrue
  cold nights for the loosely-bonded once it reads this gate.
