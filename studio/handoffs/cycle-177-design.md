# Cycle 177 — Design

## Lore track — BACKLOG-391: guilty gobbler

**What the player sees.** Rex, the prickliest dino in the park, is starving; Sunny, his best friend and one of the
timidest dinos on the bowl, reaches the drop first. Rex shoulders past (😤, as before). Then, a beat later, a 😓
pops over Rex and the ticker says *😓 Rex felt bad about shoving past Sunny*. The next time Rex and Sunny meet,
Rex's bubble is not small talk: *"Sorry about the hatch, Sunny. I was starving."* — and the ticker says *🙇 Rex
said sorry to Sunny*. Shove past a stranger (Twitch, Pip) and none of that happens.

**Rules.**
- "Normally-warm" = warm *toward the one shoved*: the gobbler's bond with the ceding winner is at or above the
  book's one-heart friend bar (`ADMIRE_BAR`, 10 — reused, not a new number).
- On such a shove the gobbler files `you shoved past <friend> and wished you hadn't` (a regret), pops the regret
  mark, and logs the line. The regret is **not** a pecking beat: it does not match any `WEIGHTS` pattern, so the
  shove still counts as a won grab toward that dino.
- The regret is owed, not counted (derived from the ring, the 401/402 discipline): while it sits on the gobbler's
  ring, the gobbler's next meeting with that friend replaces its bubble with the apology; the regret is then
  `forget`-ed and replaced by `you said sorry to <friend> for the hatch`, and the friend remembers
  `<gobbler> said sorry for the hatch` (first-hand, so gossip can carry it). Either side of the meeting can be the
  apologiser.
- No save change (memories already persist). No bond change (the apology is words, not a repair mechanic).

**Acceptance criteria.**
1. Unit: `regretsShove(bond)` is true at/above `ADMIRE_BAR` and false below; builders round-trip through
   `hatchPattern`; the regret string matches none of the pecking `WEIGHTS` (a shove's disposition is unchanged).
2. Unit: `owedApology(memories, friend)` reads the regret off the ring; false once the regret is forgotten.
3. E2E: staged contest (Sunny wins, Rex gobbles, founding bond 30) → `__gobbleFood` names Rex, Rex's memory holds
   the regret, the ticker carries the 😓 line, `__lastRegret()` returns `{ gobbler: 'Rex', friend: 'Sunny' }`.
4. E2E: forcing a Rex↔Sunny meeting afterwards → Rex's bubble/`__lastConversation` text is the apology, ticker
   shows 🙇, Rex's ring no longer holds the regret and holds the sorry memory; Sunny remembers it.
5. E2E: the same shove under `strangers` files no regret and `__lastRegret()` is null.
6. Reachability register: the `regret` mark key is placed by the shipping world.

## Structure track — BACKLOG-577: standoffs count at the hatch

**What the player sees.** Mossback and Twitch, the founding feud, square off in the grass within the first minutes
(💢). After the second standoff, the book's 👊 pecking line reads *faced down Twitch* on Mossback's page and *wary
of Mossback* on Twitch's, and at the next drop Twitch gives Mossback a berth — all without either one ever having
fought over food.

**Rules.** `heldMemory` (+1) and `backedMemory` (−1) join `pecking.ts`'s `WEIGHTS` through `hatchPattern` — half a
stand/slink, because a stare-down is a bristle, not a meal. `PECKING_BAR`/`PECKING_MIN_BEATS` unchanged: one
standoff is never a history, two are.

**Acceptance criteria.**
1. Unit: one held standoff → `dispositionToward` null; two → `confident`; two backed → `wary` and `cowedBy` true;
   a stand + a held standoff → score 3.
2. Unit: `peckingLine` names the standoff rival.
3. E2E: two forced Mossback/Twitch standoffs on an as-shipped park → `__peckingLine('Twitch')`-style read (or the
   book line) says wary of Mossback.
4. No regressions in the 174 standoff / 175 cowed / 176 admire specs.
