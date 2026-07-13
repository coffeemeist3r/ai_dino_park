# Cycle 100 — Lore-smith handoff

**Cycle bumped 99 → 100** (both prior tracks APPROVED). Idea Box empty.

**Milestone 3 "Enough to go around" SHIPPED cycle 99.** No milestone active → drafted **Milestone 4:
"The hunt has weight"** in `studio/MILESTONE.md`. The food web woke in M3 as a chase that always came up
empty; M4 gives it consequence — the hunt feeds, the slipped prey is rattled, fear turns personal, the
standing reads in the book.

## Lore pick: BACKLOG-440 — Rattled after the chase

Milestone 4 lore arc 1. When a hungry Twitch stalks and a herbivore bolts (367, cycle 99), the prey files
`you slipped ${hunter}'s hunt`. Today that memory does something: while it's still fresh (memory caps at 6,
so it ages out on its own), the prey's next greeting to the keeper leans rattled and **names its chaser**
— "…give me a sec, Twitch nearly had me." The food-web drama stops being a silent 💨 glyph and reaches the
dialog box, the same way hunger reached it in 368.

**Shape (mirrors BACKLOG-368 exactly):** a `rattledAside(hunter, traits)` in `ai/brain.ts` that composes
onto whatever register the greeting was already in (gratitude / wistful / fond / generic / hungry), temperament-
shaded (a prickly dino plays it down, a warm one makes a whole thing of it). WorldScene reads the fresh hunt
memory via a pure `recentHunter()` and passes `rattled: <name>` into `greet()`. Deterministic fallback is the
AC; LLM colour rides the existing 368 prompt path behind the NPCBrain boundary. No save change (memory is the
trace, and it ages out of `recall`'s 6-slot window by itself).

## Why 440, and why now

- **Emergence over polish (CHARTER bias):** a prey that *says* "Twitch nearly had me" is distinctness through
  fear — the food web made social, not one more chrome pass.
- **File-disjoint from the structure track (437):** 440 lives in `ai/brain.ts` + the greet-context wire
  (`WorldScene.pickTone` ~L3966) + a pure read; 437 lives in `world/foodweb.ts` + the hunt branch
  (`forceStep` ~L2514) + `needs.satisfy`. Different methods, no line overlap.
- **Reads state 367 already files** — no new event plumbing, purely additive.

## Milestone 4 runway seeded (BACKLOG.md)

- **BACKLOG-440** (this cycle) — Rattled after the chase.
- **BACKLOG-442** — The hunter's reputation (a prey grows warier of *that* carnivore specifically). Next-up.
- **BACKLOG-443** — Predator/prey in the book (catch/escape tallies).

Structure-smith picks the structure arc next (437 is top of its queue). 440 → [~].

phase → structure-pending
