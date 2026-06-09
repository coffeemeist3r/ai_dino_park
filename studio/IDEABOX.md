# Idea Box

Operator drop-zone for **nudges**, not orders. Drop a raw idea — any length, no format. The Lore-smith reads this at the start of every cycle and treats each entry as a **seed**: it may reshape the idea to fit the CHARTER, split it, defer it, or decline it. It is *not* a queue the Designer pulls from — it never skips the chain.

This is the lowest-influence channel. You steer attention; the studio keeps authorship. (For higher influence: edit `BACKLOG.md` to inject a real queued item, or `CHARTER.md` to change the rules.)

## How it works

1. You append an entry under **Open** below. Status `[new]`.
2. Each cycle the Lore-smith considers open entries and either:
   - converts it to a BACKLOG item (reshaped as it sees fit) → marks `[seeded BACKLOG-NNN]`, or
   - declines / defers it → marks `[declined: <one-line reason>]` or `[deferred: <reason>]`,
   and notes the call in that cycle's `cycle-NNN-lore.md`.
3. Resolved entries move to **Resolved** so nothing silently vanishes.

The Lore-smith owns the verdict. A decline is a legitimate outcome — that's what keeps this low-influence.

---

## Open

- `[new]` (2026-06-08) **Seasons — fall, winter, spring, summer.** A turning year, each season looking distinctly beautiful. Big art lift — hope the artist is ready to step it up and make the assets. (Note: relates to the existing seasons/weather backlog item -028.)

- `[new]` (2026-06-08) **Declare an official art style.** Operator leans GBA-era Pokémon sprite art (think Ruby/Sapphire/Emerald). Would pin a consistent visual target for all assets. Idea-box-level only — a nudge, not a decree; Lore-smith owns whether/how it becomes canon.

- `[new]` (2026-06-08) **Give the player a character.** Right now the player/keeper is faceless. Operator floats a time-traveling robot observer — a thing that watches the dinos across the eras, not a native of the park. Could explain *why* a modern keeper is among dinosaurs (time travel) and frame the player as observer-first. Identity/role only; how it ties to existing keeper mechanics is the Lore-smith's call.

- `[new]` (2026-06-08) **Selectable keepers — a cast, not one face.** Expanding the entry above: instead of a single keeper, let the player **choose** their observer at the start from a small roster, **each with its own backstory/history** and a **distinct ability** that shapes how they play (e.g. one scans/reads dino stats, one earns affinity faster, one sees the bond graph, one nudges the weather/sky). A real arc, not one cycle — Lore-smith to split into foundation beats: (1) character-select spine + persisted choice, (2) per-keeper LLM-authored persona/backstory with procedural fallback (mirrors the dino persona rules, CHARTER "Living minds"), (3) one keeper ability that touches play, then more. Identity + a gameplay system; sequence behind the existing keeper mechanics so nothing in the bowl breaks. (Captured from a live operator session, cycle 36.)

## Resolved

- `[seeded BACKLOG-147]` (2026-06-07) **The UI could be better.** Seeded as a focused HUD/chrome polish pass (typography + framing + hierarchy). Lowest of the six against the CHARTER emergence bias (UI polish < dino surprise), so queued but not prioritized; sits alongside the open `[art]` chrome items (036 dialog frame). — processed cycle 35.

- `[seeded BACKLOG-143]` (2026-06-07) **A bigger world — connected maps.** Reshaped to the *foundation beat* only: one adjacent zone reachable by walking off a bowl edge, with the cast/keeper transitioning between the two. The full multi-zone arc stays out of one cycle on purpose; 143 is the spine others build on. — processed cycle 35.

- `[seeded BACKLOG-144]` (2026-06-07) **World-scale events.** Reshaped to one rare *collective* beat the whole cast reacts to at once (a night-sky event — meteor shower / aurora — they gather and gawp at), kept distinct from the existing seasons/weather item (-028) so it's a discrete emergent moment, not a weather system. — processed cycle 35.

- `[seeded BACKLOG-142]` (2026-06-07) **Player dialogue choices that shape relationships over time.** Reshaped to the *first branching moment that leaves a remembered trace*: a greeting **tone** pick (Warm / Tease / Honest) that applies a personality-fit affinity delta and files a remembered tone-trace, read back on the next interaction. The LLM-coloured reply and the longer reputation arc are split off to 148/149 so the foundation ships deterministically (testable without a model). **Suggested next-up this cycle.** — processed cycle 35.

- `[seeded BACKLOG-145]` (2026-06-07) **Farming.** Reshaped to one plantable plot + one crop that grows over realtime-clock days and can be harvested into the existing food set (feeds the hatch/favorites loop). Automation and dino-run farms deferred. — processed cycle 35.

- `[seeded BACKLOG-146]` (2026-06-07) **Resources → crafting → building → community/politics.** Foundations-first, per the operator's own steer: seeded only the *gathering spine* (a raw resource appears in the bowl; a dino picks it up and carries it / banks it). Crafting, building, and governance stay deferred to the existing emergent backlog (029/030/031/032/107) until the gathering spine exists. — processed cycle 35.
