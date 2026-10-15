# Cycle 187 — Verdict

## Lore track — BACKLOG-023: APPROVED

**Verdict:** APPROVED
**Item:** BACKLOG-023 — the first molt.
**Rationale.** The tentpole's headline beat, deterministic and model-free. The molt reads the two graphs the park
already keeps — closest friend, worst rival — so what a youngster comes out as depends on what happened to it, and a
grudge outranks a friend because it is the louder thing a young dino carries. The shift is one axis by 0.15, small
enough not to rewrite the dino, large enough to move a threshold or two, and it persists in the growth record so the
grown temperament survives a reload. 910 e2e specs green on the first run: a nudge to Pip's agreeableness broke
nothing that was already reading it.

**Ten-minute question:** fresh save, six real minutes in, 14:00 on day one, on the Grove. Pip — until now drawn at
half the size of everyone else — pops up to full size and says *"🐚 All grown! I'm keeping Bramble close."* A husk
lies on the grass where it stood. The ticker posts *"🐚 Pip molted — came out softer"*, and the book, which said
*"🥚 young — grows up in ~6 h"* at boot, now says *"🐚 grew up on day 1 — came out softer"*. Before tonight nobody in
this park had ever been small, and nobody had ever changed.

## Structure track — BACKLOG-602: APPROVED

**Verdict:** APPROVED
**Item:** BACKLOG-602 — life stages.
**Rationale.** A stage is world state now: one additive save field, an absolute-minute record, and the rule that no
record means adult — so every founder but one and every pre-187 save read exactly as they did. The founding
calibration is pinned in a unit test against `ACTIVE_SCALE` and the festival window rather than eyeballed, which is
the v7 corollary applied up front: the founding park sits *above* the threshold, not under it. The half scale is
chosen so a 20-cell rig baked at ×2 lands on one screen pixel per cell — crisp, not smeared.

**Ten-minute question:** fresh save, frame one. Walk one edge east into the Grove and Pip is a little thing at half
size beside Bramble, and its chirp is half again as high as it will be after 14:00. Before tonight every dino in the
park was the same size from the first frame of its life.

**Noted, not blocking:** the callback cue and the distress cry still read raw traits, so a youngster pipes in its
chirp but not in those two calls; the husk is placed only if its tile is in view. Both are small and named in the
codeplan. Egg-born dinos still hatch adult — that is arc 2 (604), as designed.

## Milestone 30
Two of four arcs closed: the first molt (023) and life stages (602). Open: the park sees it grow up (605), egg-born
dinos grow up (604).

## Board
Build clean; unit 3365 green (325 files); e2e 910 passed + 1 pre-existing skip, first full run. Additive save
field only. web-llm boundary intact. CI going in: cycle 186-art `success`.
