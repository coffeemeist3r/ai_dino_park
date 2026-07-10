# Cycle 97 — Verdict

## BACKLOG-368 — Hunger in the voice (lore) — **APPROVED**

The 🍖 that's floated over a hungry dino for seventeen cycles finally reaches its *mouth*. A dino over
its hunger threshold now lets the want slip into whatever it was going to say — grafted onto the line it
was already giving, not a new script that shoulders the old one aside. Greet a starving Rex who barely
knows you and you still get the wistful "you came to see *me*?" — with "…could eat, honestly" tacked on
the end. And the aside is in-character: a prickly dino grumbles it, a warm one turns it into a whole plea,
an even one just mentions it, cut on the exact agreeableness lines the thanks register already uses. It's
hunger-specific — a merely *thirsty* dino keeps its counsel — and it's deterministic to the byte, so it
lands identically on a phone that downloads no model; the LLM, when present, only colours the same fact.
Six of six criteria; +7 unit / 3 e2e.

## BACKLOG-429 — Zone carry pressure (structure) — **APPROVED**

The three zones stop hoarding in silence. Until now a crossing dino ferried one balancing resource and a
glutted larder just kept growing; now a zone past its soft cap, watching a lighter neighbour, *sheds* —
up to two of whatever it's most swimming in — so a pile that's overflowing in the frond-rich east actually
drains toward the zone that's scraping by. It's a lean, not a firehose (two units, and only ever toward a
*lighter* neighbour — resources never pour into an already-fuller zone), and it's byte-identical to the old
directed carry whenever a zone is under its cap, so nothing the existing carry specs pin so much as twitches.
All the pile math is pure and cap-safe — every shed unit re-checks the destination's ceiling, nothing is
ever lost or overfilled — and no save field changed. The first real economic *pressure* between the zones,
and the spine the milestone's "resources flow toward need" promise rests on. Six of six; +7 unit / 2 e2e.

## Milestone 3 "Enough to go around" — OPENED (1 lore / 1 structure arc of 3 each)

Milestone 2 made each zone a *place*; Milestone 3 makes the chain *feed itself*, and both its openers
landed together. The economy took its first step from piling to *providing* (429), and the dinos living
in it found a voice for want (368) — the humane, human-scale face of the same theme. Two of six arcs; the
food web waking (367, once the diet split 435 lands) and all-three-zones-farming (432) are next.

## Quality

Build clean · 1078/1078 unit · 322/322 e2e (zero flakes on the green run) · WebLLM under `ai/` only ·
saves additive, no version bump either track. One cold-boot timeout on the first parallel run (warmed and
passed) and a lone `cycle-065-gather-grace` parallel flake (passed isolated + on the clean full re-run, off
this diff) — both the catalogued parallel-load classes, not regressions.

Structure Track back to 4 open (432 / 433 / 435 / 436) — at cap, next Structure-smith drains. phase → lore-pending.
