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

- `[deferred: 296 unblocks renderable art now; revisit the stash-ahead rule only if an art fire would otherwise no-op with nothing but terrain-blocked work left]` (2026-06-21) **Stash-ahead art policy.** Right now the Artist no-ops whenever the only open `[art]` work can't render yet (e.g. 033 path/water has no grove terrain to paint onto). Operator nudge: let the Artist *author and stash* a rig ahead of the system that will display it, when doing so is safe (doesn't break the rectangle-fallback control or the build). Drawing the cast forward instead of idling could bank art for later instead of burning the fire on a no-op. Lore-smith/Structure-smith: weigh against the discipline that benched path/water on purpose (a texture nothing blits risks the fallback tests) — maybe the rule should be "stash only when the rig renders standalone (a prop/sprite), defer only true terrain that needs a host." Note: BACKLOG-296 (resource/cairn pixel props) is the immediate renderable-now art this unblocks regardless.

## Resolved

- `[split: structure spine → BACKLOG-371 (Structure-smith, cycle 80); hunting → BACKLOG-367; hunger-in-voice → BACKLOG-368; death → ROUTED TO OPERATOR (CHARTER-level)]` (2026-06-25) **Hunting — and maybe hunger/thirst/death?** Operator nudge, dropped raw. Dinos could *hunt* — predator/prey, a carnivore stalks and a herbivore flees, the food web the cast currently doesn't have (everything eats from the keeper's hatch or the plots). And the bigger, less-sure question behind it: should dinos have **hunger and thirst** drives (a need that builds, pushes them toward food/water/the pond, goes bad if unmet) — and does unmet need eventually mean **death** (a dino can actually die, the bowl isn't deathless)? **Cycle-80 disposition (Lore-smith + Structure-smith):** split exactly along the operator's own seam. (1) The **need-drive spine** — hunger/thirst as trait-shaped values that build and resolve (eat → hunger 0; reach pond water → thirst 0), **no death, no spiral** — ships this cycle as **BACKLOG-371** (Structure-smith's pick); a gentle 🍖/💧 *tell* over a dino in want, deliberately NOT a wander-pull yet (that follow-up is 371's own seed). (2) **Hunting** (carnivore stalks / herbivore flees) seeded **BACKLOG-367**, blocked on 371. (3) **Hunger in the voice** seeded **BACKLOG-368**. (4) **Death is declined at the routine level and routed to the operator** — a CHARTER-level call (it touches breeding/eggs, the plaque lineage, save permanence, idle-mode 060's cozy vibe), exactly the GBA-pixel precedent (cycle 37): a constitution change, not a routine flip. To make a dino mortal, amend CHARTER.md (human-approved) and the next cycle obeys. The spine ships deathless on purpose so the operator can feel out mortality with the need-drive already in hand. — processed cycle 80.

- `[seeded BACKLOG-212]` (2026-06-12) **More character types for the player to choose from than just time-traveling robots.** Operator nudge, dropped the day the robot-observer roster finished its pixel avatars (158 complete). Raw idea: the keeper roster shouldn't be limited to one archetype — other kinds of watchers/characters to pick at the start. Seeded foundation-first as **BACKLOG-212**: one new *non-robot* archetype in the existing `keepers.ts` roster (own era/backstory + affinity-fit + persisted choice), renders on the no-art fallback until an [art] fire draws it — exactly how the robot roster bootstrapped at cycle 37. Not a roster rewrite; the spine that adds a *category* beyond robots, others follow. — processed cycle 48.

- `[seeded BACKLOG-191]` (2026-06-11) **Sound.** Seeded foundation-first as the **audio spine** (191): pure WebAudio synthesis authored as code (the art pipeline's philosophy in a new register — no assets, no keys), autoplay-safe, persisted mute. Reshaped per the Living-minds bias: the first sounds are **per-dino trait-pitched voices**, not UI bleeps — distinctness you can hear. The wider soundscape (ambient park noise, night crickets) stays deferred until the voices exist; follow-ups seeded as 192 (dawn chorus) / 193 (call and answer) / 194 (distress call) / 195 (cry in the book). — processed cycle 44.

- `[seeded BACKLOG-159]` (2026-06-08) **Seasons — fall, winter, spring, summer.** Seeded as the *foundation beat only* — a turning-year clock + per-season palette tint + a "season turned" beat — matching how every other arc was seeded foundation-first. The big four-season art lift + weather stay deferred to the existing -028. — processed cycle 37.

- `[declined: needs a CHARTER amendment, not a routine flip]` (2026-06-08) **Declare an official GBA-era pixel art style.** CHARTER v2 (2026-06-03) deliberately *retired* the Gen3-pixel mandate in favour of procedural flat-vector; re-instating a pixel mandate is a constitution change. Routed back to the operator: amend CHARTER.md + STYLE-GUIDE.md (human-approved) and the next cycle obeys. The art *medium* stays code either way. — processed cycle 37. **RESOLVED 2026-06-09: the operator ruled GBA pixel — CHARTER v4 + STYLE-GUIDE rewrite landed; restyle arc seeded as BACKLOG-168/169; art pipeline unblocked.**

- `[seeded BACKLOG-155]` (2026-06-08) **Give the player a character (time-traveling robot observer).** Folded into the selectable-keeper spine: the roster *is* a cast of time-traveling robot observers, so the identity nudge ships as BACKLOG-155. — processed cycle 37.

- `[seeded BACKLOG-155/156/157/158]` (2026-06-08) **Selectable keepers — a cast, each with backstory + a distinct ability.** Seeded as the arc the operator asked for, foundation-first: 155 (character-select spine + persisted choice + one affinity-fit ability, **this cycle**) → 156 (per-keeper LLM-authored persona) → 157 (the distinct abilities) → 158 (avatars). — processed cycle 37.

- `[seeded BACKLOG-147]` (2026-06-07) **The UI could be better.** Seeded as a focused HUD/chrome polish pass (typography + framing + hierarchy). Lowest of the six against the CHARTER emergence bias (UI polish < dino surprise), so queued but not prioritized; sits alongside the open `[art]` chrome items (036 dialog frame). — processed cycle 35.

- `[seeded BACKLOG-143]` (2026-06-07) **A bigger world — connected maps.** Reshaped to the *foundation beat* only: one adjacent zone reachable by walking off a bowl edge, with the cast/keeper transitioning between the two. The full multi-zone arc stays out of one cycle on purpose; 143 is the spine others build on. — processed cycle 35.

- `[seeded BACKLOG-144]` (2026-06-07) **World-scale events.** Reshaped to one rare *collective* beat the whole cast reacts to at once (a night-sky event — meteor shower / aurora — they gather and gawp at), kept distinct from the existing seasons/weather item (-028) so it's a discrete emergent moment, not a weather system. — processed cycle 35.

- `[seeded BACKLOG-142]` (2026-06-07) **Player dialogue choices that shape relationships over time.** Reshaped to the *first branching moment that leaves a remembered trace*: a greeting **tone** pick (Warm / Tease / Honest) that applies a personality-fit affinity delta and files a remembered tone-trace, read back on the next interaction. The LLM-coloured reply and the longer reputation arc are split off to 148/149 so the foundation ships deterministically (testable without a model). **Suggested next-up this cycle.** — processed cycle 35.

- `[seeded BACKLOG-145]` (2026-06-07) **Farming.** Reshaped to one plantable plot + one crop that grows over realtime-clock days and can be harvested into the existing food set (feeds the hatch/favorites loop). Automation and dino-run farms deferred. — processed cycle 35.

- `[seeded BACKLOG-146]` (2026-06-07) **Resources → crafting → building → community/politics.** Foundations-first, per the operator's own steer: seeded only the *gathering spine* (a raw resource appears in the bowl; a dino picks it up and carries it / banks it). Crafting, building, and governance stay deferred to the existing emergent backlog (029/030/031/032/107) until the gathering spine exists. — processed cycle 35.
