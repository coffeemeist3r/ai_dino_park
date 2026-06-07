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

- `[new]` (2026-06-07) **The UI could be better.** The current bowl/HUD reads as functional-but-plain — labels, plaque, hint bar all flat. Push the whole presentation up a notch: nicer typography, more polished HUD framing, better visual hierarchy between the world and the chrome. Not prescribing specifics — make it feel more finished. (Operator nudge; reshape freely.)

- `[new]` (2026-06-07) **A bigger world — connected maps.** Right now it's one bowl/screen. Think original Game Boy Pokémon: multiple distinct areas (zones/biomes) that connect via edges so you walk from one into the next, forming a larger world rather than a single fixed view. Dinos and the keeper move between areas. Long-horizon — likely a multi-cycle arc, so the studio should think about how to seed it incrementally (e.g. one extra connected zone first) rather than all at once. (Operator nudge; reshape & split freely.)

- `[new]` (2026-06-07) **Player dialogue choices that shape relationships over time.** Right now talking to a dino is mostly one-way (greet → reply). Make interactions branching and consequential: the player picks *what to say* or *how to act* in a moment, and that choice nudges the dino's memory/affinity/persona-read so future interactions evolve — a dino remembers you were kind/teasing/honest and reacts differently down the line. Stardew/RPG dialogue-tree flavor, but powered by the LLM brain + the existing memory store (BACKLOG-011) and relationship/affinity systems, so the consequences emerge rather than being hand-scripted. Cross-links the persona work (-103) and dialogue context (-051). Multi-cycle; could start small with one branching moment that leaves a remembered trace. (Operator nudge; reshape, split & sequence freely.)

- `[new]` (2026-06-07) **Farming.** Stardew-flavored growing layer that dovetails with the resources/crafting/civ nudge below: dinos (and/or the keeper) plant, tend, and harvest crops over in-game time — a renewable food/resource source feeding the gathering→crafting→settlement loop. Ties to the existing food/feeding systems (favorites BACKLOG-061, feeding hatch -059) and the realtime clock (-105) for grow cycles. Pairs naturally with seasons (-028). Multi-cycle; start small (one plantable plot/crop) before automation or dino-run farms. (Operator nudge; reshape, split & sequence freely.)

- `[new]` (2026-06-07) **Resources → crafting → building → community/politics.** A whole emergent civilization layer: dinos gather raw resources, craft items from them, and use those to build structures → settlements → expansion. On top of that, light governance: dinos vote for leaders and on ideas/rules for their communities. The exciting part is tying this to the AI collaboration — dinos *deciding together* via their LLM brains, not scripted. Big and Project-Sid-flavored (cross-links the existing emergent backlog: religion/governance BACKLOG-030/031, roles BACKLOG-032, crafting BACKLOG-029, inference governor BACKLOG-107). Definitely a multi-cycle arc — wants a deliberate breakdown into small shippable beats, foundations first (resources/gathering) before the governance payoff. (Operator nudge; reshape, split & sequence freely.)

## Resolved

_(none yet)_
