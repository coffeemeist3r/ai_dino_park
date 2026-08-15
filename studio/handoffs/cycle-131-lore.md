# Cycle 131 — Lore Handoff

**Theme:** The hatch finally says it out loud. Milestone 13's lore half has spent two cycles moving the
contested-drop history *outward* — cycle 129 gave it feet (a shouldered-aside dino hangs back), cycle 130 gave
it grace (a dino that stood its ground can step off the next scrap). Both are things you *watch*. Tonight is
the third register and the one the milestone headline was actually promising: the thing you **hear**. A dino
that just gobbled a scrap out from under someone sounds smug on its next line; one that yielded sounds
wistful; one that stood its ground and ate sounds proud; one that slunk off empty sounds sore. The park has
had a mood-shaded voice since 051 and a feeding ledger since 375 — they have simply never met. Four counters
and four glyphs become four ways of talking, and the pecking order stops being something the collection book
reports and becomes something a dino tells you about itself, unprompted, in the ordinary business of being
greeted.

**Milestone duty:** Milestone 13 is ACTIVE (opened cycle 129). Lore arcs 1 (**389**) and 2 (**403**) are `[x]`.
This cycle takes arc 3 — **BACKLOG-404, mealtime mood in the voice** — on-milestone, no justification needed.
It is the arc deliberately held for last: it narrates the beats the first two arcs create, and it would have
had a thinner ledger to read from a cycle ago. **This closes the milestone's lore half.**

**Cap rule:** open lore-track items ≫ 12 (the body backlog runs to dozens), so **no new items brainstormed** —
themed and picked from the queue, per drain-before-invent.

**Added to BACKLOG:** none (cap rule).

**Suggested next-up:** **BACKLOG-404** — *mealtime mood in the voice*. The machinery is all shipped and all
pure: the four hatch outcomes already write memories (375 yield, 387 gobble, 390 stand, 394 slink-off),
`manner.ts` (402) already folds them into a table manner for the book, and the greeting line already takes a
mood/time colour (051). What is missing is *recency* — the book reads a dino's whole career, and a voice
should read its **last meal**. The distinctness lives in the crossing of the two: the same outcome should not
sound the same out of a prickly mouth and a warm one, so a gobbler that is also agreeable sounds pleased with
itself rather than gloating, and a timid dino that held its ground for once sounds startled by its own nerve.
Deterministic floor first — one line per (outcome × temperament band), LLM colour only as enrichment behind
`NPCBrain`, identical under stub/fallback, per CHARTER Living-minds.

**A note for the Structure-smith:** 404 reads the memory ring and touches the greeting/dialogue path
(`dino.ts` greet + the line-selection module), not the feeding branch itself — but it is the **third** module
to parse the four contested-drop memory strings back out of the ring, after `manner.ts` (402) and `pecking.ts`
(401). BACKLOG-483 ("the hatch's memory strings, as builders") is now a three-consumer problem and stops being
hygiene the moment a fourth reader lands; worth weighing against 482 if the standings fold can wait a cycle.
If 482 is picked as expected, note the collision surface: 402/404 both read the book-facing side of the same
tallies, so keep the standings fold to `pioneer`/`provider`/council and out of the feeding manner.

**Idea Box:** empty (no open entries).
