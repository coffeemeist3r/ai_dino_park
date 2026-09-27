# Cycle 170 — Structure Handoff

**Intent:** Give the voice a clock. Every deferred call in the park is a bespoke
`this.time.delayedCall` with the same two guards written inline — "the dino left the roster during
the gap" and "mute flipped during the gap" — and there are now **two** copies (193's answer, 202's
callback) plus the dawn chorus's loop, which carries only one of them. Tonight's lore arc (200/198)
is *entirely* about when calls happen, and its interleave cannot be expressed as whole-call
`delayedCall`s at all: it needs the pip stride that `playChirp` computes internally and nothing
else can reach. Flagged as next pick by the cycle-169 housekeeping, and the lore track is waiting
on it.

**The spine:**
- `audio/cue.ts` — pure: a beat becomes an ordered `Cue[]` (`{ atMs, who?, params, kind }`).
  `answerCues(hearts, traits)` is 193's identity case (hail at 0, answer at `answerDelayMs`).
- `chirp.ts` exports `pipStrideMs(p)` — the per-pip spacing `playChirp` already uses, pulled out so
  voice.ts and the cue math read one number.
- **One** scene-side `playCues(cues)` in `WorldScene` that owns both guards once; `hailAndAnswer`,
  `answerCry` and `checkDawnChorus` all route through it. The dawn chorus gains the roster guard it
  never had (a dino that left mid-roll is silent) — a behaviour fix, not only a refactor.

**Reachability:** the structure answer rides the lore arc's occasion — the chorus that plays as the
keeper walks onto a ground is a cue list played by this player, with an interleave that did not
exist before. On its own, 562 is a refactor whose audible change is one guard; paired with tonight's
lore track it is the reason the pair can sing *between* each other's pips. The Designer should
write a structure criterion that pins the interleave through `playCues`, not only the identity case.

**Added to Structure Track:** none — drained from queue (5 open ≥ X=4).

**Chosen this cycle:** BACKLOG-562 — the voice has no clock.

**Solo cycle:** not declared (cycle 170 − lastSoloCycle 151 = 19 would allow it; 562 does not
qualify — it was never passed over for scope, and it fits beside a lore track).
