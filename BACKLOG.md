# Backlog

Format: `- [ ] BACKLOG-NNN [tag] short title — one-line description`

Tags: `[core]` (essential), `[social]` (Stardew vibes), `[emergent]` (Project Sid vibes), `[pokemon]` (collection/progress), `[ai]` (NPC brain), `[art]` (Artist routine), `[infra]` (tooling)

Status: `[ ]` open, `[~]` in flight, `[x]` shipped, `[a]` abandoned

Designer pulls from the top. Lore-smith appends to the bottom.

---

## Structure Track

> **Owned by the Structure-smith (routine 1.5), not the Lore-smith.** This is the
> structural spine queue: world systems, the bigger map, persistent jobs/roles, the
> resources→crafting→building→governance arc, save/versioning, load-bearing infra.
> Each cycle the Structure-smith picks the **top unblocked** item here to build
> *alongside* the Lore-smith's social pick. Cap rule: it only brainstorms new
> structural items when fewer than **X=4** open items remain here (drain before invent).
> Ordered top = next. Full item text lives in the main body below; these are pointers.

- [~] BACKLOG-448 [emergent] Provider role — the dino that banks the most harvest into its zone's food store (446) emerges with a persistent `provider` role tag, derived from a per-dino harvest-bank tally the way the `hoarder` role reads feed tallies (064/032); who keeps the pantry full becomes a legible standing. Builds on 446 / 064 / 032.
- [ ] BACKLOG-449 [infra] One terrain per zone, as data — a zone's ground is currently a hand-written `*TileAt` function per zone plus an `if` chain in `zoneTileAt` and a hardcoded landmark helper beside it (`grovePondTile`), so a fourth zone means new functions in three places and every terrain-reading feature must special-case zone ids. Fold each zone's ground into one per-zone terrain descriptor (its tile-kind rule + its named landmark tiles) hanging off the existing `ZONES` table, and let `zoneTileAt` / the water + plot / landmark lookups read it generically. Adding a zone becomes a table row, not a code branch. Builds on 143 / 294 / 399 / 383.
- [ ] BACKLOG-450 [core] Scarcity moves the herd — migration (274/334) picks a destination off the adjacency table alone: nothing about a zone's *health* makes a dino leave it. Bias the migration decision with the prosperity index (428) and the zone's food store (446), so a resident of a poor, empty-pantry zone is likelier to walk out and likelier to head for the richer neighbour — population becoming a consequence of the economy instead of running beside it. The demand read (438) and the food flow (447) move goods toward need; this moves *mouths* toward plenty. Builds on 428 / 446 / 274 / 334.
- [ ] BACKLOG-454 [emergent] The granary — the building arc (146/286/315/417) and the food economy (446/444/447) have never touched: a zone's structures raise its prosperity tier and nothing else, while its pantry is capped at a flat `FOOD_STOCKPILE_CAP` no matter how much the residents have built. Let a zone that has raised enough landmarks put up a **granary** (its own recipe off the existing per-zone structure table), and let a standing granary lift that zone's food cap — so building becomes the way a zone earns the right to hold a bigger surplus, and the resource economy finally feeds the food economy. Builds on 446 / 417 / 377 / 428.
- [ ] BACKLOG-455 [core] A pantry that spoils — banked food (446) is immortal: a zone that banks a glut and never spends it sits on it forever, which quietly blunts every flow the milestone builds (447 ferries only toward a *lighter* neighbour, so two full zones deadlock). Give a food pile slow decay when it sits at/near cap across in-game days, so a hoard costs something and the pressure to ferry, spend (444), and eat stays live. Capped, gentle, deterministic — never enough to starve a zone that's actually circulating. Builds on 446 / 447 / 444.

---

## NPC depth

- [ ] BACKLOG-014 [ai] Reflection pass — at dusk, NPC summarizes day → memory
- [ ] BACKLOG-104 [emergent] Action-prompt layer — dinos *act* from their persona, not only reply (CHARTER "Living minds": minds act). A per-dino prompt path that turns persona + memory + world state into a chosen **action/intent** (where to go, what to do, how to react to an event), consumed by the world tick — not just dialogue. Spine for BACKLOG-012 (daily plan), -014 (reflection), -032 (roles persist). With Qwen3/3.5 thinking (BACKLOG-102), big choices can run in thinking mode, chitchat without. Start small: one persona-driven intent per dino per tick window, observable in-world. Deterministic fallback intent for no-model devices. Behind `NPCBrain`.

## Pokemon flavor

- [ ] BACKLOG-022 [pokemon] Befriend ritual — feed favorite item N times → "caught" → entered in book formally
- [ ] BACKLOG-023 [pokemon] Evolution / molt — NPC grows up after X in-game days, sprite swap, personality may shift
- [ ] BACKLOG-024 [pokemon] Rivalry duels — two NPCs with low affinity may stage a non-lethal duel; player can watch
- [ ] BACKLOG-025 [pokemon] Gym landmarks — three named locations run by veteran NPCs; visit grants flavor lore

## Stardew flavor

- [ ] BACKLOG-026 [social] Festivals — once per in-game season, NPCs gather at a landmark, dialog tree
- [ ] BACKLOG-027 [social] Romance + pair-bonding — high-affinity NPC pairs may pair up; visible in collection book
- [ ] BACKLOG-028 [social] Seasons + weather — spring/summer/fall/winter, rain/sun/storm tints + NPC dialog hooks

## Project Sid flavor (emergent)

- [ ] BACKLOG-029 [emergent] Inventory + crafting — NPCs gather, trade, craft simple items
- [ ] BACKLOG-030 [emergent] Religion seed — one NPC may spontaneously start preaching; affinity-weighted spread
- [ ] BACKLOG-031 [emergent] Governance — at threshold population, NPCs vote on a simple rule (e.g., quiet hours)

## Art (procedural vector pipeline — Artist fires per character)

> Medium is **code, not an image API** (CHARTER v2 / STYLE-GUIDE): flat-vector rigs in
> `game/src/art/`, baked to animated Canvas textures, one character per sub-agent. No keys.
> Stash-ahead rule (Idea Box, adopted cycle 91): the Artist may author a rig ahead of the
> system that displays it, but only when the rig renders standalone (a prop/sprite
> `bakePropArt` can resolve in a test); true terrain that needs a host stays deferred.


## Infra

- [ ] BACKLOG-037 [infra] GitHub Actions CI — npm run build, vitest, playwright on every push
- [ ] BACKLOG-038 [infra] Vitest scaffold — at least one passing unit test
- [ ] BACKLOG-039 [infra] Playwright scaffold — at least one passing e2e test (game loads)
- [ ] BACKLOG-430 [infra] Fix the mobile-minds dialog-paging e2e — `mobile-minds.spec.ts` "long dialogs page GBA-style: E forward, ◀ back, ✕ closes" fails at the ArrowLeft `prev()` page-back step, and **fails on a clean HEAD in isolation** (surfaced cycle 93 QA via a `git stash` reproduction), so it is *not* the catalogued parallel-load flake the cycle-92 verdict logged it as — a real break in the keeper-picker/dialog input path (`WorldScene.ts:448` `cursors.left → dialog.prev()`, or a body-tap `next()` undoing it). Off every recent feature diff; find where ArrowLeft's page-back stopped registering during the keeper picker and restore it, with the spec pinning both the keyboard and the ◀-chip twin. Infra hygiene — the full e2e run should read all-green so a genuine regression isn't lost in a standing red.

## Cycle 1 lore additions (2026-05-25)

- [ ] BACKLOG-043 [ai] Personality drift — over many in-game weeks, an NPC's personality traits can shift toward those of the NPC they spend most ticks adjacent to. Very slow (cap: one trait swap per in-game month).
- [ ] BACKLOG-044 [emergent] Lost-item lore — when the player drops an item and an NPC picks it up later, the NPC's brain may invent a story about its origin. Story is stored in NPC memory and may surface in unrelated dialog later.
- [ ] BACKLOG-045 [social] Catchphrase emergence — first non-trivial line an NPC speaks each in-game morning is logged. If the same line surfaces 3+ days running, it becomes that NPC's catchphrase, shown in the collection book.

## Cycle 25 lore additions — feeding (2026-05-31)

- [ ] BACKLOG-062 [emergent] Scramble standoff — two dinos reaching dropped food the same tick: the bolder wins, the loser sulks (memory + 😤), a low-bond pair loses a little bond.
- [ ] BACKLOG-063 [social] Begging at the glass — a long-unfed dino drifts to the front wall and looks up at the keeper (📣), nudging a food drop.
- [ ] BACKLOG-064 [emergent] Hoarder role — the dino that wins the food scramble most often emerges as the `hoarder` role tag, derived from feed tallies.
- [ ] BACKLOG-065 [pokemon] Feeding log in the book — per-dino "fed Nx · last Day M" line in the collection book.

## Cycle 27 lore additions — taste (2026-06-01)

- [ ] BACKLOG-066 [emergent] Taste talk — a dino that just ate its favorite can let it slip in dialogue/gossip ("oh, I love fish"); learn a palate by chatting, not only by the 😋. Builds on 061.
- [ ] BACKLOG-067 [social] Keeper-loaded hatch — choose which food to drop (cycle the loaded feed, shown in HUD) instead of a random handful; the mirror of the `[`/`]` gift selector, for the hatch.
- [ ] BACKLOG-068 [emergent] Acquired taste — a dino fed the same non-favorite food many times slowly warms to it (tiny capped preference drift in memory); palates aren't fixed forever.
- [ ] BACKLOG-069 [pokemon] Menu in the book — the collection book reveals each dino's favorite food, but only after you've fed it that food once. A "fill in the menu" sub-goal.
- [ ] BACKLOG-070 [emergent] Picky vs. gobble — prickly (low-agreeableness) dinos refuse non-favorite food and leave it; warm dinos eat anything. Personality shapes who'll settle, not just who rushes.

## Realtime fishbowl (2026-06-01 — operator: "make time realtime so I can just leave it running")

- [ ] BACKLOG-107 [ai] Inference budget for continuous life — realtime + persona-driven action (BACKLOG-104) means dinos would think 24/7 and peg the GPU. Add a global inference governor: sparse cadence, procedural actions by default, LLM reserved for notable beats / on-screen dinos / player interaction; pause/slow generation when the tab is idle or backgrounded (`visibilitychange`). Mandatory before continuous action ships — protects battery/thermals. Behind the `NPCBrain` boundary. *(progress: the governor SPINE shipped as operator work 2026-06-11 with the mobile minds policy (BACKLOG-190): pure `ai/governor.ts` — ambient dino↔dino chatter pauses on `visibilitychange`-hidden and battery <20%, convo cooldown 8→24 steps on coarse-pointer devices, player interaction never gated. Remaining 107 scope — per-beat budgeting, on-screen-only inference — lands when the 104 action layer exists to budget.)*

## Cycle 28 lore additions — realtime rituals (2026-06-01)

- [ ] BACKLOG-108 [emergent] Dawn stretch — at the in-game dawn boundary, idle dinos play a visible wake beat (a little ⤴ stretch + a "woke at dawn" memory). Turns realtime's slow day into a daily ritual you can catch. Builds on 105.
- [ ] BACKLOG-109 [emergent] Diurnal vs. nocturnal temperament — a dino's energy/curiosity seeds whether it's a day-dino or a night-owl; night-owls wander at night while the rest huddle, day-dinos doze. With a 24h realtime day, *who's up when* becomes a personality tell. Builds on 105 + huddles (041).
- [ ] BACKLOG-110 [social] Hour-aware greeting — a dino's first player line of the real day leans on the hour (a yawn near dawn, a sleepy note at night) layered onto the existing context prompt. Small living touch that realtime makes meaningful.
- [ ] BACKLOG-111 [pokemon] Real-age on the plaque — the plaque/book shows a lineage's age anchored to wall-clock days ("founded 3 days ago"), reading the realtime clock so leaving it running visibly accrues history.

## Cycle 29 lore additions — the keeper goes away (2026-06-02)

- [ ] BACKLOG-113 [emergent] Drift apart while away — the away fast-forward isn't all warmth: a low-bond pair that never huddles loses a little bond over a long absence (capped decay), so the homecoming digest can carry a falling-out, not just companionship. Builds on 106.
- [ ] BACKLOG-114 [pokemon] Away-log in the book — the collection book keeps the last "while you were away" digest so you can re-read what the bowl got up to. Builds on 106 + 021.
- [ ] BACKLOG-115 [emergent] Night-owl absence — once diurnal/nocturnal temperament (109) lands, feed it into the away fast-forward: night-owls rack up more shared nights while away, so *who* grew closer becomes a personality tell. Cross-links 106 + 109.
- [ ] BACKLOG-116 [social] Missed-you memory — a long absence leaves each dino a faint "the keeper was gone a while" memory that can color the very next greeting (layers onto 110's hour-aware line). Builds on 106.

## Cycle 30 lore additions — the keeper's comings and goings (2026-06-03)

- [ ] BACKLOG-119 [emergent] Goodbye glance — the inverse of the homecoming: as the tab leaves (`visibilitychange` → hidden) after a real session, the closest dino throws a brief 👀 toward the keeper before the bowl goes quiet. A living bookend to 112.
- [ ] BACKLOG-121 [emergent] Keeper-shaped routine — a very-high-friendship dino learns the real hour you usually come back (from save timestamps) and drifts to the glass front around then, anticipating you. Anticipation as emergence. Builds on 112 + realtime (105).
- [ ] BACKLOG-122 [pokemon] Homecoming streak — returning on consecutive real days builds a "visit streak" surfaced on the plaque; miss a day and it resets. A gentle Stardew daily pull.

## Cycle 31 lore additions — the keeper's little court (2026-06-04)

- [ ] BACKLOG-123 [emergent] Sulk shakeoff — a dino left sulking (😒 jealous / 😤 standoff loser) clears its funk after a short while *or* a kind keeper gesture (greet/feed), logging a "got over it" memory; negative moods resolve instead of sticking. Builds on 120 / 062.
- [ ] BACKLOG-124 [emergent] Homecoming chorus — when several dinos are near-tied at the top of player-friendship, the homecoming beat becomes a small staggered chorus (top 2–3 each throw a 👋), scaling the welcome with how many dinos you've truly befriended. Builds on 112.
- [ ] BACKLOG-126 [emergent] Eavesdropping envy — a low-friendship dino that *witnesses* another get a homecoming/favorite beat files a faint "the keeper likes them more" memory that can wistfully colour its next line; only fires when its own friendship is low. Distinctness through insecurity. Builds on 112 / 120.
- [ ] BACKLOG-127 [pokemon] Inner-circle ladder — the collection book ranks your top-3 closest dinos ("inner circle"), making the homecoming selection legible to the player and turning friendship into a visible standing. Builds on 112 / 016 / 021.

## Cycle 32 lore additions — the attention economy (2026-06-05)

- [ ] BACKLOG-128 [emergent] Forgiving heart — a dino repaired before (125) files "the keeper always makes it right"; next time it's the jealous runner-up, its sulk softens (quicker/warmer turn). Repaired bonds learn to trust. Builds on 125.
- [ ] BACKLOG-129 [emergent] Festering slight — a runner-up left un-repaired across multiple homecomings lets the slight harden into a tiny capped bond-cooling toward the *favored dino* (not the keeper), so chronic neglect curdles into dino-vs-dino rivalry. Builds on 120 / 125 / 113.
- [ ] BACKLOG-131 [pokemon] Fondest memory — the collection book surfaces each dino's single happiest logged beat (favorite eaten, repaired, homecoming): a "what this dino treasures" line. Builds on 011 / 021.

## Cycle 33 lore additions — the court consoles itself (2026-06-06)

> Next-up this cycle is the already-queued **BACKLOG-130** (comforting nuzzle, in the cycle-32 block);
> these items extend it once it lands.

- [ ] BACKLOG-133 [social] Walk-it-off — instead of leaving after a 🫂, the comforter nudges the sulker back toward the cluster/den so it isn't left alone at the edge; comfort becomes a tiny procession. Builds on 130 / 041.
- [ ] BACKLOG-134 [pokemon] Closest-friend line in the book — the collection book shows each dino's highest-bond peer ("thick as thieves with Mossback"), making the dino↔dino graph legible at last. Builds on 013 / 021.
- [ ] BACKLOG-136 [emergent] Comfort is for friends — a would-be comforter only crosses the bowl if its bond with the sulker clears a bar; a near-stranger ignores the sulk. Makes *who* comes (and who doesn't) a sharp read on the graph. Builds on 130.

## Cycle 34 lore additions — the bond graph wakes up (2026-06-07)

> Cycle 33 shipped BACKLOG-130 (comforting nuzzle) and cycle 34 ships **BACKLOG-132**
> (gratitude echo) — the first time a dino↔dino bond does something *back*. These extend
> reciprocity once the echo lands.

- [ ] BACKLOG-137 [emergent] Comfort circle — if a sulker has *several* grateful debtors present (132), a small group (top 2) drifts over instead of one; consolation scales with how many friends you've helped. Builds on 130 / 132 / 124.
- [ ] BACKLOG-138 [emergent] Debt cleared — once a debtor returns the favor (echoes a comfort, 132), the gratitude entry is consumed; kindness is a one-shot ledger, not a permanent claim, so reciprocity keeps cycling rather than locking one pair forever. Builds on 132.
- [ ] BACKLOG-139 [social] Thankful line — a comforted dino, next time the keeper greets it, may name who was there for it ("Twitch sat with me"); gratitude surfaces in dialogue, not just selection. Builds on 132 / 011 / 051.
- [ ] BACKLOG-140 [pokemon] Owes-one in the book — the collection book shows each dino's outstanding gratitude debts ("owes Twitch one"), making the reciprocity graph legible alongside the closest-friend line. Builds on 132 / 134 / 021.
- [ ] BACKLOG-141 [emergent] Pay-it-forward — a dino comforted very recently, if it then witnesses *another* dino sulk, is primed to be that one's comforter even without the usual bond floor; warmth received spreads outward. Builds on 130 / 132 / 136.

## Cycle 35 lore additions — the operator's six nudges, seeded (2026-06-08)

> First cycle the Idea Box was processed. All six standing operator nudges seeded as
> *incremental foundation beats* (arcs split, governance/automation deferred), plus two
> native follow-ups extending the dialogue-tones foundation. Next-up is BACKLOG-142.

- [ ] BACKLOG-147 [infra] HUD polish pass — the chrome-polish nudge: lift the HUD/plaque/hint typography and framing a notch (consistent type scale, softer panel framing, clearer world-vs-chrome hierarchy) without changing behavior. Pairs with the open [art] dialog-frame item (036). Lowest-priority of the six (CHARTER emergence bias). Idea Box (UI). Builds on 058 / 036. *(Scope note 2026-06-12: the bottom-bar layout collision is gone — BACKLOG-201 shipped the [?] help panel + short gift line; what remains here is the typography/framing pass.)*
- [ ] BACKLOG-148 [ai] Tone-aware reply — feed the remembered tone (142) into the dino's greeting/reply context so a teased dino ribs back, a warmly-treated one is fonder, an honestly-treated one is franker; the consequence surfaces in *what the dino says*, not just affinity. Behind the NPCBrain boundary, deterministic fallback line per tone. Builds on 142 / 051 / 055.
- [ ] BACKLOG-149 [emergent] Tone reputation — a dino's accumulated tone-history settles into a read on the keeper (trusts / wary / playful), surfaced in the collection book; how you've *mostly* treated a dino becomes a visible standing. Builds on 142 / 021.

## Cycle 69 structure additions — the split world grows a queue (2026-06-22)

> The Structure-smith refilled the structure queue (down to 2 open after cycle 68 abandoned 293, below
> cap X=4) while picking 308 this cycle. The next beats the zone-scoping work opens.

- [ ] BACKLOG-349 [core] Grove plot — the plantable plot (145) is gated bowl-only (308, fixed installation). Add a second plot in the grove so the second zone grows its own crop, the farming half of a genuinely separate per-zone economy (a step toward the grove being self-sufficient, not just a place dinos visit). Builds on 145 / 308 / 294.

## Cycle 36 lore additions — the night the sky lit up (2026-06-08)

> Cycle 36 ships the queued **BACKLOG-144** (world-scale night event) — the first time the
> *whole cast* reacts to one thing at once. These extend that collective beat into distinct,
> personality-shaded reactions and tie it back into the existing loops.

- [ ] BACKLOG-151 [emergent] Slept through the wonder — a low-energy dino (or one already deep in a huddle) may sleep through the sky event entirely and, next morning, only hear about it secondhand as gossip ("you should have SEEN the sky"). Distinctness through who-missed-it. Builds on 144 / 019 / 109.
- [ ] BACKLOG-152 [pokemon] Skywatch in the book — the collection book records which dinos witnessed the last sky event together ("watched the meteors with Sunny & Glade"); shared awe becomes legible standing. Builds on 144 / 021.
- [ ] BACKLOG-153 [emergent] Wish on a falling star — during a meteor shower a dino may make a quiet wish tied to its strongest want (a lonely one wishes for a friend, a long-unfed one for food); surfaces as a wistful line + a remembered "wished on a star" memory that can colour a later greeting. Builds on 144 / 011 / 051.
- [ ] BACKLOG-154 [social] Star-fragment keepsake — a rare sky event leaves a one-off collectible (a fallen ✨ "star fragment") on the ground the keeper can pick up and later gift; ties the cosmic beat back into the gifting loop as a treasured item every dino loves. Builds on 144 / 015.

## Cycle 37 lore additions — the watcher gets a face (2026-06-09)

> The operator's live-session steer: the player is a **time-traveling robot observer**, chosen from
> a small roster, each with its own history + a distinct ability. Seeded foundation-first per the
> operator's own steer. Cycle 37 ships **BACKLOG-155** (the select spine). GBA-pixel-style nudge
> declined (needs a CHARTER amendment, not a routine flip); seasons seeded foundation-only as 159.

- [ ] BACKLOG-156 [ai] Per-keeper persona authored from lore — give each selectable observer a real **persona/backstory** authored the way dino personas are (CHARTER "Living minds"): LLM-authored-from-lore where the device allows, deterministic procedural fallback otherwise, generate-once/cache/persist. Mirrors BACKLOG-103's pipeline for the keeper. Builds on 155 / 103.
- [ ] BACKLOG-157 [emergent] More keeper abilities — beyond the affinity-fit of 155, the distinct per-observer powers the operator floated: one scans/reads dino stats, one sees the bond graph, one nudges the weather/sky event. One ability per cycle, each a real read on which observer you chose. Builds on 155 / 144 / 021. *(progress: 1/3 — LUMEN-3's **Field Scan** shipped cycle 38 (B reads a dino's axes/mood/favorite/role; Aki/Vix refuse in character). Note for the next fire: "sees the bond graph" is already public for every keeper via the V bonds lens (cycle 21) — pick a different power for AETHER-1; the sky-nudge fits VANTA-9.)*

## Cycle 38 lore additions — the observer observed (2026-06-09)

> Cycle 37 gave the watcher a face; these make the *bowl* notice. The dinos have lived under a
> faceless square for 36 cycles — now that the keeper is someone, the cast should react to *who*.
> Next-up is the already-queued **BACKLOG-157** (the distinct per-observer abilities, one per
> cycle) — the operator's arc, and the beat that makes the choice of observer a real lens on play.

- [ ] BACKLOG-160 [ai] Dinos address the observer — the chosen keeper's designation/persona enters the dialogue context, so a high-friendship dino may name you ("strange lights in your chest, Vix") and shade its line by *which* watcher you are; deterministic fallback line per observer, LLM colour where the device allows. The keeper's identity surfaces in what dinos *say*, not just in the affinity math. Builds on 155 / 051 / 148.
- [ ] BACKLOG-162 [emergent] The bowl remembers its watchers — switching observers mid-save isn't free-floating: each dino files a faint "the watcher changed" memory, and a dino with high friendship under the *old* observer may glance around for it in a wistful line. Identity persistence becomes something the cast tracks, not just the save file. Builds on 155 / 011 / 116.
- [ ] BACKLOG-163 [pokemon] Observer dossier — the collection book gains a keeper page: your designation, era, backstory, ability, and running tallies under this observer (days watched, dinos befriended); the plaque adds "observed by VANTA-9". The chosen identity becomes legible standing, like everything else in the book. Builds on 155 / 021 / 058.

## Cycle 39 lore additions — the glass looks back (2026-06-09)

> Cycle 38 gave the keeper a power over the bowl (Lux reads minds); the bowl should answer.
> Next-up is the already-queued **BACKLOG-161** (first-contact inspection) — the first time the
> cast *reacts to who you chose*, seconds after you choose. These extend that returned gaze.

- [ ] BACKLOG-164 [emergent] Being scanned is a moment — a dino notices Lux's Field Scan and answers it in character: a bold one squares up and poses, a timid one skitters a step and eyes you sideways, and either way it files a "the watcher read me" memory that can colour a later line. The scan stops being free; knowledge has a social cost. Builds on 157 / 010 / 011.
- [ ] BACKLOG-165 [emergent] Gossip about the watcher — a dino that witnessed a watcher beat (the first-contact inspection, a scan, a switch) can pass it on through the existing gossip spine ("the new one has a glass eye"), so news of *you* travels the bowl the same way dino news does. Builds on 019 / 161 / 162.
- [ ] BACKLOG-166 [pokemon] Deep dossier — Lux's scan readout grows two relational lines: the dino's last remembered keeper-tone and any outstanding gratitude debt ("owes Twitch one"), making the scan the place where the social ledgers surface. Builds on 157 / 142 / 132.
- [ ] BACKLOG-167 [emergent] The unimpressed — the cast's *worst* personality-fit dino greets a freshly-picked observer with a flat, unimpressed beat (😐 + a "didn't see the fuss" memory) a moment after the best-fit one inspects; the same choice that delights one dino bores another, legibly. Builds on 161 / 155 / 010.

## Cycle 40 lore additions — the turning year (2026-06-09)

> Next-up is the operator-seeded **BACKLOG-159** (season foundation) — three keeper cycles in a
> row is enough inward gaze; give the bowl a year. These extend the seasons once the clock turns.

- [ ] BACKLOG-172 [pokemon] Season of hatching — every dino (and every future egg) gets a recorded hatch season shown in the collection book ("hatched in spring"); lineages start carrying birthdays the turning year makes meaningful. Builds on 042 / 021 / 159.
- [ ] BACKLOG-173 [ai] Season in the voice — the current season joins the dialogue context (like time-of-day in 051), so a dino can grumble about winter or savour spring without being asked. Deterministic fallback line per season. Builds on 051 / 159.

## Cycle 41 lore additions — the year keeps turning (2026-06-10)

> Cycle 40 hung the calendar; cycle 41 makes the season change what the cast *does*. Next-up is
> the already-queued **BACKLOG-170** (seasonal palates) — the year's first reach into the daily
> feeding loop. These extend the turning year into gossip, gifting, plaque, and the wander.

- [ ] BACKLOG-174 [pokemon] Year wheel on the plaque — the plaque/HUD spells the season legibly ("Spring · day 3 of 7") with a tiny 4-arc year wheel marking where in the year the bowl sits. Builds on 058 / 159.
- [ ] BACKLOG-175 [emergent] Turning-year gossip — the season-turn memory every dino files (159) becomes gossip: a dino can let the change of season slip to the next it meets ("smell that? fall's here"), so the year travels the bowl the way dino news does. Builds on 019 / 159.
- [ ] BACKLOG-176 [social] Seasonal gift cravings — the mirror of 170 for the gift loop: the same seasonal-craving nudge shifts which *gift* lands best, so generosity reads the calendar too (a flower means more in spring). Builds on 015 / 170.
- [ ] BACKLOG-177 [emergent] Equinox restlessness — on the single day a season turns, the whole cast wanders a touch wider for that one day, a quiet collective "something's changed" jitter — distinct from the sky-event gather (144). Builds on 159 / 018.
- [ ] BACKLOG-178 [emergent] Migrating warmth — winter raises the cluster-drift bias (the cast seeks company in the cold and the den fills earlier) while summer lowers it (they spread out and laze); the bowl's social density breathes with the year. Builds on 159 / 018 / 041.

## Cycle 42 lore additions — the year reaches the night (2026-06-10)

> Cycle 41 let the season change a verdict (which food wins); cycle 42 should let it change
> behaviour you can watch — the den packing at dusk in winter. Next-up is the already-queued
> **BACKLOG-171** (winter huddle pull); these extend the seasonal night once it lands.

- [ ] BACKLOG-180 [emergent] Odd bedfellows — when the winter den packs, two *low-bond* dinos who end up huddled the same cold night gain a small extra bond bump beyond the normal meet gain ("we kept each other warm"); the cold manufactures unlikely friendships the summer never would. Builds on 171 / 041 / 013.
- [ ] BACKLOG-182 [pokemon] Night ledger — the collection book counts shared den nights per dino ("most nights kept warm with Sunny"), the sleeping pile's history made legible alongside the closest-friend line. Builds on 041 / 021 / 134.

## Cycle 43 lore additions — the cold has a cost (2026-06-11)

> Cycle 42 made the winter den *pack* (171); cycle 43 grows the other half — the dino left
> standing outside it. Next-up is the already-queued **BACKLOG-179** (cold-night shiver), the
> spine these extend: a shiver you can see, a memory that follows the dino into the morning.

- [ ] BACKLOG-183 [emergent] Warmed-by-the-memory — a dino that shivered alone last winter night (179) drifts to the den *earlier* the next cold dusk, the cold teaching it to seek the pile sooner. Builds on 179 / 171.
- [ ] BACKLOG-186 [pokemon] Hardy in the book — the collection book counts cold nights each dino has toughed out ("weathered 3 cold nights alone"), the flip side of the night ledger (182): not who slept warm, but who slept hard. Builds on 179 / 021.
- [ ] BACKLOG-187 [emergent] Toughened hide — a dino that endures many cold nights slowly hardens (a tiny capped nudge toward higher resilience / lower sociability), so being repeatedly left out leaves a mark on temperament, not just memory. Very slow, capped. Builds on 179 / 043.

## Cycle 44 lore additions — the bowl finds its voice (2026-06-11)

> The operator spent a day giving the bowl a phone home, then dropped one nudge in the box:
> **sound**. The bowl has been silent for 44 cycles. Seeded foundation-first, and — per the
> Living-minds bias — the very first sounds are *per-dino voices*, not UI bleeps: a dino you
> can recognize with your eyes closed is distinctness in a register we've never used.

- [ ] BACKLOG-193 [social] Call and answer — greeting a high-bond dino gets an answering chirp before the text reply; the latency and eagerness of the answer scale with hearts, so you can *hear* how much a dino likes you before you read it. Builds on 191 / 016.
- [ ] BACKLOG-195 [pokemon] Cry in the book — the collection book plays a dino's chirp when you open its entry (the Pokédex cry, in the bowl's register); a hatchling's cry blends its parents' parameters the way its traits do. Builds on 191 / 021 / 042.

## Cycle 45 lore additions — the voice learns the day (2026-06-12)

> Cycle 44 gave each dino a voice; cycle 45 gives the bowl a *time* it uses them. Next-up is
> the already-queued **BACKLOG-192** (dawn chorus) — the first soundscape with a clock in it.
> These extend the audible day once the chorus lands: its closing bookend, the keeper joining
> in, the loner left out of it, and what a friendship sounds like.

- [ ] BACKLOG-196 [emergent] Night hush — the inverse bookend of the dawn chorus: at the night boundary the cast falls quiet, the last night-owl's chirp trailing off into the dark, so the day has a closing sound as well as an opening one. Builds on 192 / 109.
- [ ] BACKLOG-197 [social] Chorus you can join — tapping the glass (057) during the dawn chorus makes the nearest waking dino chirp back at the keeper, folding you into the morning call-and-answer. Builds on 192 / 057 / 193.
- [ ] BACKLOG-198 [emergent] Off-key loner — a dino with no bond above the loner floor (135) chirps a beat *after* the rest of the chorus, a lone voice hanging in the quiet; social isolation made audible. Builds on 192 / 013 / 135.
- [ ] BACKLOG-199 [pokemon] Chorus lead in the book — the collection book names which dino "leads the dawn chorus" (the earliest riser by energy) as a small standing. Builds on 192 / 021.
- [ ] BACKLOG-200 [emergent] Harmonized pair — two high-bond dinos that wake near each other chirp in near-unison (pips interleaved), so a strong friendship literally *sounds* different from two strangers. Builds on 192 / 013.

## Cycle 46 lore additions — sound becomes signal (2026-06-12)

> Cycles 44–45 gave the bowl voices and a morning; cycle 46 makes a voice *do* something —
> next-up is the already-queued **BACKLOG-194** (distress call), the first time sound moves a
> dino: a cry crosses the bowl and the bond graph answers. These extend the call once it lands.

- [ ] BACKLOG-202 [emergent] Answered across the bowl — the friend who turns toward a distress call (194) chirps back in its own voice before it moves: reassurance at distance, the bond audible in both directions. Builds on 194 / 191 / 013.
- [ ] BACKLOG-203 [emergent] Cry wolf — a dino that distress-calls constantly (very timid, startles at everything) slowly loses credibility: friends turn toward its calls less often (capped habituation), but a genuine cold-night cry always lands. Personality becomes social credibility. Builds on 194 / 010 / 057.
- [ ] BACKLOG-204 [social] Keeper hears trouble — a distress call posts a faint 📢 ticker line naming the caller, so a keeper out of view can find the dino in trouble; greeting/feeding it then rides the keeper-warmth repair shape (184). Builds on 194 / 184.
- [ ] BACKLOG-205 [pokemon] Peep in the shell — an egg on its final day faintly peeps, its parameters blended from its parents' chirps the way its traits will be; you can hear who's coming before the hatch. Foreshadows the book cry (195). Builds on 042 / 191 / 195.
- [ ] BACKLOG-206 [emergent] Sound has a place — chirp volume attenuates with distance from the keeper's avatar, so where you stand changes what you hear and a far-corner cry is faint; the bowl gains acoustic space. Builds on 191 / 194.

## Cycle 47 lore additions — kindness has a temperature (2026-06-12)

> Cycle 43 made the cold visible, cycle 46 made it audible; in both the keeper could only watch.
> Next-up is the already-queued **BACKLOG-184** (keeper's warmth) — the 125 repair shape brought
> to winter: a shiver you can mend with your own hands. These extend the mended morning.

- [ ] BACKLOG-207 [emergent] Hopeful shiver — when the keeper warms one cold dino (184), another still-shivering dino that witnessed it drifts toward the keeper at the glass, hoping it's next; mended kindness creates a queue. Builds on 184 / 063 / 126.
- [ ] BACKLOG-209 [pokemon] Mended in the book — the collection book counts how often the keeper has warmed each dino ("warmed through 3 cold mornings"), care made standing alongside the hardy-nights tally (186). Builds on 184 / 021 / 186.
- [ ] BACKLOG-210 [ai] Gratitude in the voice — a just-warmed dino's next reply leans grateful (deterministic thankful line per the 148 shape; LLM colour where the device allows, behind NPCBrain); the warmth surfaces in *what it says*, not just the affinity math. Builds on 184 / 148 / 139.
- [ ] BACKLOG-211 [emergent] Pass the warmth — a keeper-warmed dino is primed, for a while, to be the one who comforts the next sulker or shiverer it witnesses — even below the usual bond floor (the 141 pay-it-forward shape, now seeded by keeper care); kindness cascades from the keeper into the bond graph. Builds on 184 / 141 / 130.

## Cycle 48 lore additions — care made legible (2026-06-13)

> Cycle 47 gave the keeper hands to mend a shivering dino and deliberately left the dino
> *nobody* warmed standing in silence. Next-up is the already-queued **BACKLOG-208** (nobody
> came) — that silence given a memory: neglect as legible as care. These extend the geography
> of warmth, and answer the operator's drop-zone nudge for keepers who aren't all robots.

- [ ] BACKLOG-212 [core] Non-robot keeper archetype — the selectable roster gains its first watcher that *isn't* a time-traveling robot observer (Idea Box, 2026-06-12). One new `keepers.ts` entry with its own era/backstory + affinity-fit profile, picked at the `K` overlay and persisted like the rest; renders on the existing no-art fallback until an [art] fire draws it (exactly how the robot roster started at cycle 37). Foundation-first — one new archetype, the roster gains a *category* beyond robots; not a roster rewrite. Builds on 155 / 156.
- [ ] BACKLOG-213 [emergent] The warm spot — a dino warmed by the keeper on a cold morning (184) remembers the *tile* it was warmed on and drifts back to it on later cold dawns, a private comfort-place; the bowl grows little remembered geographies. Builds on 184 / 011.
- [ ] BACKLOG-214 [emergent] Imprint on the keeper — a dino warmed across several cold mornings (the 209 tally) forms an outsized keeper-bond and, for a while after each warming, trails the keeper avatar around the bowl like a duckling. Builds on 184 / 209.
- [ ] BACKLOG-215 [social] Spring thaw relief — when the season turns *out* of winter (159), any dino that toughed out cold nights (186) gets a one-off "made it through the winter" lift + a relieved line; the cruel season ending becomes its own small celebration. Builds on 159 / 179 / 186.
- [ ] BACKLOG-216 [pokemon] Coldest morning in the book — the collection book records the single loneliest morning each dino endured (the cold night it slept with the lowest bond present), a "darkest hour" line beside the hardy-nights tally. Builds on 179 / 186 / 021.

## Cycle 49 lore additions — the bowl starts talking (2026-06-14)

> Cycle 48 finished the cold arc's *private* half — care and neglect both leave a memory.
> Cycle 49 lets that memory off the leash: a dino that slept cold carries the word to the next
> it meets (the already-queued **BACKLOG-185**, next-up), so hardship becomes the bowl's first
> piece of travelling news. These extend the gossip channel into a living rumor mill — news that
> grows in the telling, lands differently in different hearts, reaches the keeper, and goes stale.

- [ ] BACKLOG-218 [emergent] Grows in the telling — a rumor passed hop to hop drifts from the truth: each retelling nudges the wording a notch (the cold gets colder, "slept alone" → "nearly froze"), so a multi-hop rumor visibly diverges from what happened and the bowl plays telephone. Capped drift. Builds on 019 / 185.
- [ ] BACKLOG-219 [pokemon] Rumor mill in the book — the collection book shows the rumors each dino is currently carrying and from whom ("heard from Twitch: Mossback slept cold"), making the gossip graph legible the way the bond graph is. Builds on 019 / 021 / 185.
- [ ] BACKLOG-220 [emergent] Same news, different heart — a warm/high-agreeableness dino that hears cold news feels for the sufferer (files a "felt for <name>" memory, warms a touch toward it); a prickly one shrugs it off. The listener's temperament, not the news, decides what the news does. Builds on 185 / 010 / 013.
- [ ] BACKLOG-221 [social] Word reaches the keeper — once cold news has spread to most of the cast, a faint 📢 ticker surfaces it to the keeper ("the bowl's all talking about Mossback's cold night"), turning gossip into a care signal that nudges a warming gesture (184). Builds on 185 / 204 / 184.
- [ ] BACKLOG-222 [emergent] Old news goes quiet — a rumor more than a couple in-game days old stops being worth retelling (a freshness gate on what gossip will pick up), so the bowl's talk stays current instead of echoing one ancient cold night forever. Builds on 019 / 185.

## Cycle 50 lore additions — the bowl acts on what it hears (2026-06-15)

- [ ] BACKLOG-224 [emergent] It came back to me — when a rumor about a dino's *own* cold night returns to it (it meets someone carrying word of its hardship), it reacts to being talked about: a wry/embarrassed 💬 line + a "so the whole bowl knows" memory, the sufferer learning its night became news. Builds on 185 / 219.
- [ ] BACKLOG-225 [social] Carrying sad news weighs on you — a dino currently holding fresh cold-word about a friend greets the keeper a touch subdued (a quieter colour on the hour-line, 110), the rumor it carries leaking into its own mood. Builds on 185 / 110 / 220.
- [ ] BACKLOG-226 [emergent] One visit per sorrow — the secondhand-sympathy visit (217) fires once per sufferer per cold spell: a dino won't keep "coming to find you" on every later meeting, so sympathy reads as a gesture, not a tic (a freshness gate like 222). Builds on 217 / 222.
- [ ] BACKLOG-227 [pokemon] Kindness tally in the book — the collection book counts the comfort-visits each dino has *made* ("crossed the bowl for 4 friends in need"), the giving side of care standing beside the keeper-warmed tally (209). Builds on 217 / 130 / 209.
- [ ] BACKLOG-228 [emergent] The bowl overheard — the keeper standing close to two gossiping dinos catches the rumor itself on a faint 💬 ticker ("you overhear: Mossback slept cold"), eavesdropping made a mechanic that turns the player into one more node on the gossip graph. Builds on 019 / 204 / 221.

## Cycle 51 lore additions — the bowl gossips both ways (2026-06-15)

> Cycle 49 taught the bowl to carry the cold; cycle 50 turned the heard word into a deed (the
> sympathy visit). Cycle 51's next-up is the already-queued **BACKLOG-223** (word of the warmth):
> the *bright* mirror of the cold word — a dino the keeper warmed lets the good news slip on the
> same gossip spine, so kindness travels by talk the way hardship does. These extend the channel
> once it carries two kinds of news — what a dino chooses to pass on, where good news leads, and
> how the bowl keeps its talk honest.

- [ ] BACKLOG-229 [emergent] Which word to lead with — a dino carrying both a warm rumor and a cold rumor leads with the one about the friend it's *closest* to (highest bond), so what a dino chooses to gossip becomes a read on who it cares about, not just what it last heard. Builds on 185 / 223 / 013.
- [ ] BACKLOG-230 [emergent] Hearing kindness spreads it — a dino that hears warm-word (223) is primed, for a while, to be the one who comforts the next shiverer or sulker it witnesses, even below the usual bond floor; kindness witnessed *by rumor* cascades the way keeper-warmth does (211). Builds on 223 / 211 / 141.
- [ ] BACKLOG-231 [social] Word of a kind keeper — as warm-word saturates the cast, a faint capped "they say the keeper's kind" colour lifts the next first-greeting of dinos who never saw a warming firsthand; a generous keeper's reputation precedes them. Builds on 223 / 184 / 221.
- [ ] BACKLOG-232 [pokemon] Warm word, cold word in the book — the rumor-mill book page (219) tags each carried rumor warm or cold, so the bowl's mood is legible at a glance by what it's passing around. Builds on 219 / 223.
- [ ] BACKLOG-233 [emergent] Both kinds of news age out — extend the freshness gate (222) to warm-word too, so a stale kindness stops being retold the same way a stale cold night does; the bowl's talk, good or bad, stays current. Builds on 222 / 223.

## Cycle 52 lore additions — the bowl keeps its talk honest (2026-06-15)

> Cycle 49 taught the bowl to carry the cold, 50 turned the word into a deed, 51 let the good
> news travel too. Cycle 52's next-up is the already-queued **BACKLOG-234** (the bowl self-corrects):
> when a carrier of a dino's cold word meets that dino and finds it warmed/recovered, it drops the
> now-false rumor with relief ("oh — you're alright now") instead of pitying it — and the stale
> sympathy visit (217) gives way to the all-clear. News that ends is as emergent as news that spreads.
> These extend the correction: relief that travels, the trust cost of a false rumor, and the two ways
> a rumor dies — by sight and by time.

- [ ] BACKLOG-236 [emergent] The doubter — a prickly (low-agreeableness) dino that meets a cold-rumor's subject looking perfectly fine starts discounting *that carrier's* news (a small capped credibility ding, like cry-wolf 203), so a bowl that spread a false alarm pays a quiet trust cost. Builds on 234 / 203 / 220.
- [ ] BACKLOG-237 [pokemon] Set the record straight in the book — the collection book marks a dino's cold night "since put right" once it's been warmed/recovered, so the rumor page (219) shows corrections, not only live worries. Builds on 234 / 219 / 186.
- [ ] BACKLOG-238 [emergent] Stubborn rumor — a rumor about a recovered dino whose carrier never meets it again can't be corrected by sight, so it goes stale on its own (the time-gate half, 222); correction-by-sight (234) and correction-by-time are the two ways a rumor dies. Builds on 234 / 222.
- [ ] BACKLOG-239 [social] The all-clear at the glass — once most carriers have dropped a sufferer's cold word, a faint 😌 ticker tells the keeper "the bowl's stopped worrying about Mossback," the calm counterpart to 221's alarm. Builds on 234 / 221.
- [ ] BACKLOG-240 [emergent] Premature all-clear — a dino corrected once ("you're fine now") that then sleeps cold *again* the next winter night surprises its carriers: the dropped rumor returns sharper ("I thought you were past this"), so recovery isn't always permanent. Builds on 234 / 179.

## Cycle 53 lore additions — the all-clear travels (2026-06-15)

> Cycle 49 taught the bowl to carry the cold, 50 turned the word into a deed, 51 let the good
> news travel, 52 let a carrier retract a false alarm on sight. Cycle 53's next-up is the
> already-queued **BACKLOG-235** (relief travels too): the retraction itself becomes news —
> a dino that just dropped a stale cold rumor carries the all-clear forward on the same gossip
> spine, so the bowl actively *un-tells* a thing no longer true, the way it once spread the worry.
> These extend the closed loop: the bowl's overall mood read, gratitude to whoever cleared your
> name, and good news going quiet once everyone already knows.

- [ ] BACKLOG-241 [emergent] The bowl's weather of feeling — distill the live warm/relief vs cold rumor counts into one faint park-mood read at the glass ("the bowl feels easy today" / "a worried hush"), the whole gossip graph boiled down to a single barometer. Builds on 235 / 221 / 239.
- [ ] BACKLOG-242 [emergent] Sheepish at your own rumor — a recovered dino that overhears its own cold word still circulating ducks its head ("oh — they're still on about that?"), a 😅 beat: being the subject of stale gossip you've already outlived. Builds on 234 / 185 / 220.
- [ ] BACKLOG-244 [emergent] Relief saturates — an all-clear the whole bowl already carries stops being retold (the freshness gate of 222/233 extended to relief), so good news goes quiet once everyone knows, the same way a stale worry does. Builds on 235 / 233 / 222.
- [ ] BACKLOG-245 [pokemon] The all-clear in the book — the rumor-mill book page (219/232) marks a sufferer's worry "cleared — and the word's gone round" once the relief has spread, closing the loop the page opened. Builds on 235 / 237 / 219.

## Cycle 54 lore additions — the debt of a cleared name (2026-06-16)

> Cycle 49 taught the bowl to carry the cold, 50 turned the word into a deed, 51 let the good news
> travel, 52 let a carrier retract a false alarm on sight, 53 let the retraction itself travel.
> Cycle 54's next-up is the already-queued **BACKLOG-243** (grateful to the one who cleared your
> name): the giving side of the relief arc — a recovered dino, meeting whoever carried its all-clear,
> warms to it a notch, the symmetric counterpart to the worry-visit (217). These extend the debt of
> a cleared name: a reciprocity ledger, gratitude in the voice, the good-news bearer's standing, the
> book's record of it, and what happens when the thanks was premature.

- [ ] BACKLOG-246 [emergent] A debt for the clearing — a cleared dino files *who* spread its all-clear (like the gratitude ledger, 132); later, when that clearer itself sleeps cold, the cleared dino is primed to be first to carry *its* relief forward. Reciprocity in the rumor register. Builds on 243 / 132 / 235.
- [ ] BACKLOG-248 [emergent] The town crier — a dino that has spread several all-clears (cleared many names) emerges with a small "good-news bearer" standing, the relief counterpart to the hoarder/gossip role tags derived from tallies. Builds on 235 / 020 / 064.
- [ ] BACKLOG-249 [pokemon] Who cleared my name in the book — the collection book shows, per dino, who set its record straight ("Twitch cleared my name"), the relief counterpart to the rumor-mill page. Builds on 243 / 219 / 021.
- [ ] BACKLOG-250 [emergent] Premature thanks — if a dino it thanked for clearing its name (243) spread the all-clear too early and the dino then sleeps cold *again* (240), the grateful bond cools a touch — the thanks didn't hold. Builds on 243 / 240 / 235.

## Cycle 55 lore additions — gratitude finds a voice (2026-06-17)

> Cycle 54 made the all-clear *earn* a friend (243); cycle 55's next-up is the already-queued
> **BACKLOG-247** (thanks in the voice) — that gratitude pulled up out of the bond math and into
> dialogue the player hears. These extend the spoken thanks: when it fades, who it's said to,
> how temperament colours it, what being thanked aloud does to the clearer, and how it can misfire.

- [ ] BACKLOG-252 [social] Thanks to their face — a just-cleared dino that next *meets its clearer* says a spoken 💛 thanks dino-to-dino, gratitude surfacing between dinos, not only to the keeper. Builds on 243 / 247.
- [ ] BACKLOG-254 [emergent] The named savior swells — when a dino names its clearer aloud in the clearer's earshot (252), the clearer gets a small pride beat (😌) + a tiny mutual bond nudge; being publicly thanked feels good. Builds on 252 / 243.
- [ ] BACKLOG-255 [emergent] Misremembered savior — a dino whose all-clear was spread by *two* carriers may thank the more recent/closer one, a small fallibility in gratitude; the bowl's memory isn't perfect. Builds on 247 / 243.

## Cycle 56 lore additions — gratitude finds its register (2026-06-18)

> Cycle 55 pulled gratitude up into a spoken line the keeper hears (247), but it shipped with a
> known wart flagged in its own verdict: the thanks surfaces on *every* greet for as long as the
> cleared-name memory rides the 6-entry ring — gratitude as a permanent script, not a passing
> feeling. Cycle 56's next-up is the already-queued **BACKLOG-251** (gratitude fades): close that
> deferred freshness gate before stacking more gratitude beats (252/254) on an ungated line. These
> new items extend the spoken-gratitude register once it reads as a feeling that comes and goes —
> the keeper catching it secondhand, regard that outlasts the words, thanks shaded by closeness,
> spoken pride priming more kindness, and the bowl's quiet hero made legible.

- [ ] BACKLOG-256 [emergent] Thanks overheard at the glass — when a dino says its dino-to-dino thanks (252) close to the keeper avatar, the keeper catches it on a faint 💬 ticker ("you overhear: Mossback thanks Twitch"), the eavesdrop mechanic (228) extended from cold gossip to gratitude. Builds on 252 / 228.
- [ ] BACKLOG-257 [emergent] Regard outlasts the thanks — after the spoken thanks-line quiets (251), a dino still carries a lasting "owes Twitch" regard that warms how it *gossips about* its clearer (leads with warm-word of that friend, 229), so gratitude becomes durable standing in the bond graph even once the line itself fades. Builds on 251 / 246 / 229.
- [ ] BACKLOG-258 [emergent] Thanks scales with closeness — a dino cleared by a near-stranger gives a clipped, formal thanks while one cleared by a close friend gushes; the warmth of the spoken line (and the bond it earns) reads the *prior* bond, so the same gesture lands differently depending on the relationship. Builds on 247 / 253 / 013.
- [ ] BACKLOG-259 [emergent] Pay the gratitude forward — a dino freshly thanked aloud in its earshot (254) is, for a while, quicker to carry the *next* dino's all-clear it could spread, the spoken pride priming generosity in the relief register the way keeper-warmth primes comfort (211/230). Builds on 254 / 246 / 230.
- [ ] BACKLOG-260 [pokemon] The bowl's quiet hero — the dino thanked aloud by the most others earns a "quiet hero" standing surfaced in the collection book/plaque, the spoken counterpart to the good-news bearer / town-crier tally (248) and a read on who the bowl is most grateful to. Builds on 254 / 248 / 020.

## Cycle 57 lore additions — gratitude in each dino's own voice (2026-06-18)

> Cycle 56 made the spoken thanks (247) a passing feeling instead of a permanent script (251). The
> register is now stable enough to *split by temperament* — the CHARTER's first-class "distinct
> minds" goal applied to gratitude itself. Cycle 57's next-up is the already-queued **BACKLOG-253**
> (grudging thanks): the same debt, said in five different voices. These extend that split — the
> effusive twin, proof the gruffness is only skin-deep, manners that wear smooth, and the manner
> made legible in the book and the scan.

- [ ] BACKLOG-262 [emergent] The debt is the same — a gruff thanks (253) files the *identical* grateful bond a warm one does: temperament colours the words, never the debt. A prickly dino means it under the grumbling — the bond bump (243) is unchanged whatever voice carries it. A pin against gratitude manner ever leaking into the bond math. Builds on 253 / 243.
- [ ] BACKLOG-263 [emergent] Grudging gratitude wears smooth — a prickly dino it has to thank the *same* clearer enough times softens a touch toward that one dino over time (a tiny capped warmth nudge in how it speaks to them, not a trait rewrite); even a gruff heart wears smooth against a friend who keeps showing up. Builds on 253 / 043.
- [ ] BACKLOG-264 [pokemon] Gratitude manner in the book — once you've heard a dino thank someone, the collection book notes *how* it thanks ("thanks through gritted teeth" / "thanks effusively" / "a quiet nod of thanks"), reading its agreeableness; the manner becomes legible standing beside hearts and role. Builds on 253 / 261 / 021.
- [ ] BACKLOG-265 [social] The scan reads the manner — LUMEN-3's Field Scan (157) dossier gains a "gratitude: gruff / warm / even" line off the same agreeableness read, so the observer who scans can tell a grudging thanker from an effusive one before ever hearing it. Builds on 253 / 157 / 038.

## Cycle 58 lore additions — gratitude in full voice (2026-06-19)

> Cycle 57 gave the prickly half of the cast a gruff thanks (253); cycle 58's next-up is the
> already-queued **BACKLOG-261** (effusive thanks) — the warm twin, so the same favour now lands
> *loud* from Sunny and Twitch and *gruff* from Rex. With both poles voiced, the manner axis is
> finally a real spectrum. These extend it: the measured middle, the gush overheard by who earned
> it, manner colouring the gossip a dino carries, warmth that grates on a cold heart, and the
> warmth a gush pulls toward the keeper.

- [ ] BACKLOG-266 [emergent] Even-keeled thanks — the middle agreeableness band (neither prickly nor warm) gets a measured register of its own ("a quiet nod — thanks, Twitch"), distinct from both the gush (261) and the grumble (253), so the manner is a three-way read rather than a binary. Completes the spectrum the founders skip but every blended hatchling can land in. Builds on 261 / 253 / 042.
- [ ] BACKLOG-267 [emergent] Caught mid-gush — when an effusive dino gushes its thanks (261) within earshot of the very clearer it names, that clearer gets a bashful pride beat (😊 + a small mutual bond nudge); being gushed about to your face feels good, the spoken-to-keeper twin of 254's named-savior swell. Builds on 261 / 254 / 252.
- [ ] BACKLOG-268 [emergent] Gossip in your own voice — a dino's agreeableness colours *how* it retells warm-word / relief (223 / 235): an effusive carrier embellishes the good news, a gruff one clips it to the bare fact, so the same rumor sounds like whoever's passing it. Builds on 261 / 223 / 235.
- [ ] BACKLOG-269 [emergent] Tired of the fuss — a prickly dino gushed at (261) by the *same* effusive thanker enough times quietly wearies of it (a tiny capped cooling in how it reads that gusher — "yes, yes, you said"); too much warmth grates on a cold heart, the sour mirror of grudging-gratitude-wears-smooth (263). Builds on 261 / 263 / 010.
- [ ] BACKLOG-270 [social] A gush you can feel — an effusive thanks spoken to the keeper lands a touch of extra warmth on *the keeper-bond* (gushing is bonding) where a gruff thanks holds it flat; the manner that colours the words also colours how close the gesture pulls the dino to you. Distinct from 262's pin (that's the dino↔dino grateful debt — this is the player-friendship ledger). Builds on 261 / 016 / 262.

## Cycle 59 lore additions — the keeper's absence is felt (2026-06-19)

> Gratitude has had its full voice (253/261/266). Cycle 59 turns to the keeper's *neglect*: a dino
> you never visit shouldn't greet you like a stranger off the street — it should show the ache of
> being passed over. The first cycle to run alongside the new **structure track** (the bigger world,
> 143). Next-up is **BACKLOG-271** (wistful greeting), the affection-pole opener these extend.

- [ ] BACKLOG-273 [emergent] The visit remembered — a dino greeted while neglected (271) files a faint "the keeper finally came by" memory, so its *next* greeting softens from wistful toward warming; attention received changes the next hello. The affection mirror of the gratitude-wears-smooth beats. Builds on 271 / 011 / 116.

## Cycle 60 lore additions — the relationship in the first words (2026-06-19)

> Cycle 59 gave the neglected pole a wistful hello (271). Cycle 60's next-up is the already-queued
> **BACKLOG-272** (fond greeting) — the warm twin, so a greeting's *first words* read the relationship
> the way the thanks register reads temperament. These extend the greeting-by-relationship arc.

- [ ] BACKLOG-275 [emergent] Snubbed and resigned — a dino greeted wistfully (271) yet still left at ≤1 heart across several visits hardens from wistful to a cooler, resigned opener ("oh. it's you."); hope curdles to indifference when attention never follows. Builds on 271 / 273 / 011.
- [ ] BACKLOG-277 [emergent] Greeting remembers the last gift — a dino opens by referencing the last thing you fed/gifted it ("still thinking about that fish"), pulled from its memory, when the memory is fresh. The gift loop surfacing in the greeting. Builds on 015 / 061 / 011.

## Cycle 61 lore additions — friendship earns your name (2026-06-20)

> Cycle 59/60 built the greeting ladder's two poles (271 wistful, 272 fond). Cycle 61's next-up is the
> already-queued **BACKLOG-276** (a fond dino names the observer) — the rung where deep friendship earns
> *your* name in the dino's mouth. These extend the greeting-by-relationship arc further.

- [ ] BACKLOG-279 [emergent] Greeting carries the hour — a fond dino's named hello leans on the time of day ("up early too, AETHER-1?"), layering 110's hour-aware idea onto the 272/276 greeting. Builds on 272 / 276 / 051.
- [ ] BACKLOG-280 [emergent] Who are you again? — switching observers (a real keeperId change) makes even a fond dino hesitate at the greeting ("…AETHER-1? you seem different") before warming, since the body it knew just changed; ties the keeper-swap into the first words. Builds on 276 / 161.
- [ ] BACKLOG-281 [social] Mentioned in the same breath — a fond dino with a strong dino-friend nearby greets you and names them too ("Twitch and I were just saying hi"), so the greeting reads the bond graph, not only your hearts. Builds on 272 / 013.
- [ ] BACKLOG-282 [pokemon] The first-words ladder in the book — the collection book shows each dino's current opening register (stranger / wistful / plain / fond / by-name), making the greeting ladder the arc has built legible at a glance. Builds on 271 / 272 / 276 / 021.

## Cycle 62 lore additions — the name shrinks to a nickname (2026-06-20)

> Cycle 61 shipped 276 (a fond dino names the observer by designation). Cycle 62's next-up is the
> already-queued **BACKLOG-278** — the deepest friendship drops the designation for the nickname. These
> extend the address arc once the nickname lands.

- [ ] BACKLOG-283 [social] Nickname only once it's earned aloud — a dino graduates to the nickname (278) only after it has first named you by designation (276) at least once, so the address visibly climbs designation→nickname over a friendship rather than jumping straight to intimate. Builds on 276 / 278.
- [ ] BACKLOG-284 [pokemon] Address shown in the book — the collection book shows how each dino currently addresses you (unnamed / by designation / by nickname), making the 276→278 escalation legible beside the first-words ladder (282). Builds on 276 / 278 / 282.

## Cycle 63 lore additions — same sky, five ways of looking up (2026-06-21)

> Cycle 63's next-up is the queued **BACKLOG-150** — the temperament-shaped reading of the cycle-36
> sky event (144). These extend that per-dino read once it lands: how a dino watches becomes how it
> leaves, who it watched beside, and a line in the book.

- [ ] BACKLOG-287 [emergent] Lingering gazer — when a sky event ends, the boldest gazer (the one that pressed right under it) hangs a beat under the fading sky before drifting back, filing a "couldn't look away" memory; the edge-watchers have already wandered off. Watching-style becomes leaving-style. Builds on 150 / 144.
- [ ] BACKLOG-289 [pokemon] Skywatcher in the book — the collection book notes how each dino takes in the sky (crowds under it / watches from the edge), surfacing the temperament read that 150 makes visible in-world. Builds on 150 / 021.

## Cycle 64 lore additions — what the sky leaves behind (2026-06-21)

> Cycle 64's next-up is the queued **BACKLOG-288** (stargazing companions) — the collective awe of
> 144/150 knits specific pairs. These extend the sky beat into the morning after: a mood that lingers,
> a remembered preference between the two skies, and a deliberate telling of the one who slept.

- [ ] BACKLOG-290 [emergent] Wonder afterglow — a dino that witnessed a sky event carries a brief warm-mood lift through the rest of that night (greets the keeper a notch fonder, files a "still buzzing from the sky" trace) that fades by dawn; awe is transient, and you can feel it cool. Builds on 144 / 150 / 011.
- [ ] BACKLOG-291 [social] Favorite sky — a dino that has witnessed both event kinds (meteors and aurora) forms a remembered preference and reacts a little harder to its favorite ("the lights, not the falling stars"); which sky moves which dino becomes a small per-dino tell. Builds on 144 / 011.
- [ ] BACKLOG-292 [emergent] You-missed-it nudge — the deliberate companion to 151's secondhand gossip: a dino that watched the sky seeks out a specific dino that slept through it the next morning and tells it to its face (a 💬 "you should've SEEN it" beat), turning ambient rumor into a one-to-one telling. Builds on 144 / 151 / 019.

## Cycle 65 lore additions — the bowl, legible (2026-06-21)

> Cycle 65's next-up is the operator-seeded **BACKLOG-295** (dino activity readout) — surface what each
> dino is *doing now*. These extend that legibility into character and the book once the readout lands.

- [ ] BACKLOG-299 [pokemon] Activity in the book — the collection book shows each dino's most-frequent activity ("usually gathering", "mostly naps"), a behavioural fingerprint accreted from running activity tallies. Builds on 295 / 021.
- [ ] BACKLOG-300 [social] Caught in the act — interacting (E) with a dino names what it was just doing in its greeting ("caught me mid-snack!", "you pulled me off the pile"), tying the live activity read into dialogue. Builds on 295 / 051.

## Cycle 66 lore additions — even nothing reads as character (2026-06-21)

> Cycle 65 made the bowl legible (you can now see what each dino is *doing* — 295). Cycle 66's
> next-up is the already-queued **BACKLOG-298** (idle fidgets): make the most common state — a
> goalless 🚶 wanderer — read as character, so five idle dinos aren't five identical squares. These
> extend the idle quirk into ripple, mood, and the book.

- [ ] BACKLOG-301 [emergent] Contagious fidget — a dino idling beside another mid-quirk (298) may briefly pick the quirk up itself (mirroring), so an idle tic can ripple between near neighbours; a one-shot borrow, not a permanent trait. Builds on 298 / 018.
- [ ] BACKLOG-302 [emergent] Mood-shaded fidget — the same dino's idle quirk darkens with its mood: a sulking / cold / jealous dino mopes or hunches where a content one paces breezily, so the fidget reads its feeling, not just its temperament. Builds on 298 / 123 / 179.

## Cycle 67 lore additions — the bowl at rest has tells now (2026-06-21)

> Cycle 66 made even *idleness* read as character (298 — each dino fidgets in its own way). Cycle 67's
> next-up is the already-queued **BACKLOG-303** (signature quirk in the dossier): name each dino's idle
> fidget in the collection book, so the bowl's resting tells become a legible per-dino fingerprint, not
> just a glance you have to catch live. These extend the resting-character beat outward.

- [ ] BACKLOG-304 [emergent] Restlessness builds — a dino left idle (wandering) too many ticks escalates its fidget and may break the idle on its own to seek company or a resource; boredom becomes a driver, not just a pose. Builds on 298 / 295.
- [ ] BACKLOG-305 [social] Kindred tics — when two dinos sharing the *same* signature quirk (298) idle near each other, a small 😄 recognition beat fires and nudges their bond; matching idle habits read as a quiet affinity. Builds on 298 / 013.
- [ ] BACKLOG-307 [emergent] Sleep murmur — a huddling/sleeping dino (041) occasionally mutters a one-word dream tied to its strongest trait or a recent memory (💤 "fish?"), so even sleep carries a personality tell. Builds on 041 / 011.

## Cycle 68 lore additions — the body language leaves the page (2026-06-22)

> Cycle 67 *named* each dino's idle fidget in the book (303); cycle 68 makes the welcome-back beat
> **perform** it — the returning dino greets the keeper in its own body language (306). The resting tell
> stops being a fingerprint you read and becomes something the bowl *does* at you. These extend that
> motion-as-character beat into mood, dialogue, the scan, and proximity.

- [ ] BACKLOG-311 [social] Greeting names the quirk — the keeper's greeting reply leans on whatever the dino's doing right then ("Rex looks up mid-pace, then —"), so the spoken beat reads the live fidget; deterministic fallback line per quirk, LLM colour behind the NPCBrain boundary. Builds on 298 / 051 / 148.
- [ ] BACKLOG-313 [emergent] Caught habit — a dino that spends many ticks beside another very slowly picks up its kindred tic (capped, one swap, the personality-drift shape of 043), so body language spreads through proximity the way traits do. Builds on 298 / 305 / 043.

## Cycle 70 lore additions — the motion reads the mood (2026-06-22)

> Cycle 68 made the fidget *perform* (homecoming, 306); cycle 69 put it in the scan (312).
> Cycle 70 makes the same motion read the dino's *right-now feeling*, not just its temperament:
> a sulking pacer mopes its own way. These extend mood-shaded body language into recovery,
> dialogue, the book, proximity, and the resting loop itself.

- [ ] BACKLOG-319 [social] Greeting reads the funk — the keeper's greeting of a dino in a mood leans on its *mood-shaded* fidget ("Rex paces, still sulking —"), layering 310 onto the spoken beat; deterministic fallback per mood, LLM colour behind the NPCBrain boundary. Builds on 310 / 311 / 051.
- [ ] BACKLOG-320 [emergent] Contagious posture — a dino idling within a tile of a sulking friend briefly mirrors the glum posture (a short one-shot echo), so funk leaks through proximity the way gossip and comfort already do. Builds on 310 / 130 / 019.
- [ ] BACKLOG-321 [pokemon] Mood in the book — the collection book's body-language line shows a dino's *current* mood-shaded fidget while a funk is active, falling back to its signature quirk when calm, so the book reads live feeling not just temperament. Builds on 310 / 303.
- [ ] BACKLOG-322 [emergent] Shake-it-out — a dino idle a long while occasionally breaks its signature quirk for a one-off different gesture (a stretch / a yawn) before settling back, so even the resting tell isn't perfectly looped. Builds on 298 / 108.

## Cycle 71 lore additions — the funk lifts (2026-06-22)

> Cycle 70 made the idle fidget read a dino's funk (310). Cycle 71 adds the recovery
> half (318 — the motion brightens when the funk lifts) and keeps extending mood-as-motion
> into empathy, the tone pick, the afterglow, the book, and temperament.

- [ ] BACKLOG-323 [emergent] Funk seen by a friend — a dino idling near a sulking/cold friend (310) files a faint "saw <name> down" memory that can wistfully colour its next line; empathy through proximity. Builds on 310 / 130 / 011.
- [ ] BACKLOG-324 [social] Mood in the tone pick — greeting a funked dino, the Warm/Tease/Honest menu hints its current mood ("Rex — sulking") so the keeper chooses knowing how it feels. Builds on 310 / 142.
- [ ] BACKLOG-326 [pokemon] Bounced-back in the book — the collection book notes "bounced back" on a dino that recently recovered from a funk, a fleeting positive tell beside its hearts. Builds on 318 / 131 / 021.
- [ ] BACKLOG-327 [emergent] Stubborn funk — a low-agreeableness dino's recovery flourish (318) is smaller / slower, so even bouncing back is in-character. Builds on 318 / 310 / 070.

## Cycle 72 lore additions — the afterglow (2026-06-22)

> Cycle 71 shipped the recovery flourish (318). Cycle 72 picks the afterglow (325 —
> a recovered dino stays perkier a while) and seeds its tail, its voice, and its spread.

- [ ] BACKLOG-330 [emergent] Afterglow fades — the lingering-lift (325) perk decays smoothly back to the signature quirk over a short window rather than snapping off, so recovery has a tail. Builds on 325 / 318.
- [ ] BACKLOG-331 [social] Greeting notes the bounce-back — greeting a just-recovered dino, its line carries a lighter note ("Rex — back on its feet —"); deterministic fallback, LLM colour behind the boundary. Builds on 318 / 051.
- [ ] BACKLOG-332 [emergent] Shared relief — a dino that witnesses a friend's recovery flourish (318) nearby catches a small mood lift of its own; gladness spreads like funk does (320). Builds on 318 / 320 / 130.

## Cycle 73 lore additions — the den dreams (2026-06-23)

> Cycle 73 picks **BACKLOG-181** (sleep murmurs) — a huddled dino murmurs a 💭 sleep-line
> drawn from its strongest memory of the day, deterministic core with LLM colour behind the
> boundary. These extend the den's new inner life: who overhears it, what the book keeps, how
> the bond graph dreams, and the keeper learning the den is for quiet. The grove-arrival beat
> rides this cycle's structure pick (334, visible crossing).

- [ ] BACKLOG-335 [emergent] Sleep-talk overheard — an awake dino near a murmuring sleeper (181) catches the murmur and lets it slip as morning gossip ("you were talking in your sleep about fish"). Builds on 181 / 019.
- [ ] BACKLOG-336 [pokemon] Dream in the book — the collection book records a dino's last sleep-murmur ("dreams of: …"), the night's inner life made legible alongside the closest-friend line. Builds on 181 / 021.
- [ ] BACKLOG-337 [emergent] Shared dream — two high-bond dinos huddled together may murmur echoing lines (one names the other), so the den's dreams reflect the bond graph the way the waking bowl does. Builds on 181 / 013.
- [ ] BACKLOG-338 [social] Don't wake them — tapping the glass (057) near the den while a dino murmurs *stirs* it (it shifts, a brief 👀) instead of the usual startle-bolt; the keeper learns the den is for quiet. Builds on 181 / 057.

## Cycle 74 lore additions — the grove becomes a place (2026-06-24)

> Cycle 73 made the crossing a walk you can watch (334) and gave the den a voice (181). Cycle 74
> picks **BACKLOG-339** (first steps in the grove) — arrival as a beat, the cast reacting to a new
> place — and seeds what the second zone *means* once dinos live in it: homesickness, a settling-in
> lean, news of the grove travelling the bowl, the pioneer's standing, and (riding the structure
> track's 315 shelter) the lean-to's pixel prop.

- [ ] BACKLOG-343 [pokemon] Pioneer in the book — the collection book marks the first dino ever to set foot in the grove ("first across") as a small standing, the grove's founding made legible. Builds on 339 / 021.

## Cycle 75 lore additions — the grove travels home (2026-06-24)

> Cycle 74 made the grove a place a dino arrives in (339) and builds in (315). Cycle 75 picks
> **BACKLOG-342** (tell of the grove) — news of the second zone travelling the bowl on the existing
> gossip spine — and seeds what that news *does* once it spreads: it pulls newcomers groveward (345),
> it becomes common ground between travelers (346), and it leaves a returning dino visibly grove-struck
> for a while (347).

- [ ] BACKLOG-347 [emergent] Grove-struck idle — a dino freshly back from the grove occasionally floats a wistful 🌿 idle bubble in the bowl (a glance back the way it came) for a short window after returning, so you can read who's just come home from over there. Builds on 339 / 334 / 325.
- [ ] BACKLOG-350 [social] Pond rivalry — two grove-visited dinos (339) who meet in the bowl each play up *their* discovery of the pond, a low-stakes status spat ("I saw it first") that warms or needles by temperament. Builds on 339 / 346 / 342.
- [ ] BACKLOG-351 [emergent] Reluctant returner — a dino pulled groveward by news (345) that arrives to find its closest friend (013) wasn't there shows a brief 😕 on arrival before settling, the gap between the place it imagined and the empty one it found. Builds on 345 / 340 / 013.
- [ ] BACKLOG-352 [pokemon] Traveler's mark — the collection book shows a small 🌿 beside any dino that has set foot in the grove (339), so the cast's wanderers are legible at a glance (broader than 343's "first across" standing). Builds on 339 / 021.

## Cycle 77 lore additions — the grove is common ground (2026-06-24)

> Cycle 76 made grove news *move a body* — a dino that only heard about the pond now gets pulled across to see it (345). Cycle 77's next-up is the already-queued **BACKLOG-346** (pond-swappers): once two dinos have *both* been over there, meeting in the bowl they trade pond notes — a small shared-place bond + a memory each, the second zone becoming the thing they have in common. These extend what the shared place *means* between travelers: legible in the book, coloured by temperament, and a pull it lends the news.

- [ ] BACKLOG-353 [pokemon] Pond-swap in the book — once two dinos have swapped pond notes (346), the collection book reads the tie ("compared groves with Twitch") beside the closest-friend line, so the second zone's social ties are legible, not just felt. Builds on 346 / 013 / 021.
- [ ] BACKLOG-354 [emergent] Pond note in their own voice — the line a dino leads with when it swaps pond notes (346) is coloured by temperament: a bold one brags up its find, a timid one murmurs it, a warm one gushes — the same favour, said like whoever's saying it (the gratitude-voice shape, 268, applied to scenery). Builds on 346 / 268 / 010.

## Cycle 78 lore additions — the grove is a place you can miss (2026-06-25)

> Cycle 77 made the grove common ground between two travelers who'd both seen it (346). Cycle 78's
> next-up is the already-queued **BACKLOG-355** (drew them across): being *told to your face* about
> the pond by a dino who's actually been there pulls a non-visited listener harder than ambient
> hearsay overheard secondhand — a direct telling jumps the migration queue ahead of a faint rumor.
> These four extend what the grove *is* once a dino knows it: a first sight worth more than the
> hundredth, a place two friends return to together, a tally of who keeps going back, and — the
> weirdest — a place a dino who came home can quietly come to miss.

- [ ] BACKLOG-360 [social] Pond pilgrimage — two pond-swap companions (346) may later cross to the grove *together* (a near-simultaneous migration) to revisit the place they bonded over, so shared-place friendship becomes shared travel, not just shared talk. Builds on 346 / 334 / 288.
- [ ] BACKLOG-361 [pokemon] Grove regulars in the book — the collection book tracks how many times each dino has crossed to the grove ("been to the pond 4×"), making homebody-vs-wanderer a legible standing rather than something you only feel. Builds on 334 / 021.
- [ ] BACKLOG-362 [emergent] Grove-struck homesickness — a dino back from the grove a long while files a faint "miss the pond" pull that re-primes it to migrate back, so the grove becomes a place a dino can *yearn* for, not somewhere it visits once and forgets. Builds on 334 / 342 / 116.

## Cycle 79 lore additions — the pond as a known place (2026-06-25)

> Cycle 79's lore pick is the already-queued **BACKLOG-359** (first sight of the pond), reframed to its
> non-duplicative core: the wonder lands when a dino finally reaches the *pond water* itself (NE of the
> grove), not when it first crosses the zone edge — 339 already owns the grove-entry beat. These four
> extend what a dino *does* once it's seen the water all the rumors were about.

- [ ] BACKLOG-363 [emergent] Pond reflection — a dino lingering alone at the pond water catches its own reflection and files a quiet reflective memory (💧 "saw myself in the water") that can wistfully colour its next line, so solitude at the pond becomes a distinct inner beat. Builds on 359 / 011.
- [ ] BACKLOG-364 [emergent] Showed them the pond — a dino that has *seen* the pond (359) and then tells a never-been dino about it files a small teacher/pride memory ("showed <other> the pond"), distinct from passively spreading grove news, so being the one who knew first becomes part of who a dino is. Builds on 359 / 342.
- [ ] BACKLOG-365 [pokemon] Pond firsts in the book — the collection book surfaces each dino's remembered "firsts" — first time across (339), first sight of the pond (359) — as a little keepsake list, making a dino's milestones legible. Builds on 359 / 339 / 021.
- [ ] BACKLOG-366 [social] Pondside meeting — two dinos that meet *at the pond* (both within sight of the water) share an extra-warm beat distinct from a meeting anywhere else, so where two dinos run into each other starts to matter. Builds on 359 / 346 / 288.

## Cycle 80 lore additions — the bowl gets needs (2026-06-26)

> Cycle 80's lore pick is the already-queued **BACKLOG-135** (the loner) — a distinctness beat off the
> dormant dino↔dino bond graph (013): a dino whose every bond sits below the floor withdraws to the edge
> and mopes, and the keeper's attention lands extra-hard on it. These extend it, and seed the *emergent*
> half of the operator's hunting/hunger nudge (the structural need-drive spine is the Structure-smith's,
> seeded as 360; death is routed to the operator as a CHARTER-level call — see IDEABOX).

- [ ] BACKLOG-370 [social] Lonely lean on the keeper — a loner (135) drifts to the glass front toward the keeper instead of a random edge when its keeper-friendship is high, so a dino with no dino-friends leans on you specifically; loneliness becomes a bid for the keeper's attention. Builds on 135 / 112.

## Cycle 82 lore additions — solace, per palate (2026-06-26)

> Cycle 82's lore pick is the already-queued **BACKLOG-374** (comfort food) — the emotional payoff of the
> need-drive (371) + loner (135/369) + favorites (061) arcs: a moping loner that eats *its* favorite food
> gets a quiet 😌 solace beat the plain meal never gives, so *who is soothed by what* becomes a per-dino tell.
> These extend it into recognition, refusal, and lingering — solace as something a dino learns, withholds, and savors.

- [ ] BACKLOG-379 [emergent] Comfort-food recognition — a dino soothed by its favorite (374) files *which* food eased it; the collection book later reveals "finds comfort in 🐟" once you've witnessed it, making each dino's solace legible alongside its favorite. Builds on 374 / 069 / 021.
- [ ] BACKLOG-380 [emergent] Picky when low — a moping loner (🥀) offered a *non-favorite* food turns away (😞, won't eat it) where a contented dino eats anything; when a dino is down, only the food that fits reaches it. Builds on 374 / 070 / 135.
- [ ] BACKLOG-382 [emergent] Savored seconds — a dino that just ate its comfort food (374) lingers contentedly a beat (a slow 😌 idle) before wandering off, so solace reads in the pause, not only the bite. Builds on 374 / 318.

## Cycle 83 lore additions — kindness shaped by need (2026-06-27)

> Cycle 83's lore pick is the already-queued **BACKLOG-375** (generous feeder) — the need-drive (371)
> reaching *between* dinos: a well-fed dino beside a hungrier high-bond friend yields the keeper's drop
> and lets the friend eat first, the first generosity that costs something. These extend it into
> reciprocity, acknowledgement, its selfish inverse, and a legible standing.

- [ ] BACKLOG-388 [pokemon] Kindest in the book — the collection book tracks how many times each dino has yielded a meal to a friend ("gave up 3 meals"), making generosity a legible standing. Builds on 375 / 021.

## Cycle 84 lore additions — generosity has an opposite (2026-06-28)

> Cycle 84's lore pick is the already-queued **BACKLOG-387** (greedy gobble) — the selfish inverse of
> last cycle's generous feeder (375): a hungry, prickly dino won't wait its turn and shoulders past a
> friend to a contested drop (😤), so giving way reads as a *trait*, not a universal. These extend the
> scramble into memory, defiance, regret, and a legible standing — the foil to the 385–388 kindness thread.

- [ ] BACKLOG-389 [emergent] Bullied dino remembers — a dino shouldered past at the hatch (387) files who grabbed its meal; repeated, it gives that gobbler a wider berth at future drops (drifts to a different food tile rather than contest it). Builds on 387 / 011.
- [ ] BACKLOG-391 [emergent] Guilty gobbler — a normally-warm dino that gobbled while very hungry (387) files a faint "I shoved past <friend>" regret that can soften its very next line to that friend; greed against a friend's nature leaves a trace. Builds on 387 / 374.
- [ ] BACKLOG-392 [pokemon] Greediest in the book — the collection book tracks how often each dino has shouldered past for food ("grabbed first 4×"), the foil to 388's "kindest", so the bowl's manners are legible at a glance. Builds on 387 / 388 / 021.

## Cycle 85 lore additions — the worm turns (2026-06-29)

> Cycle 85's lore pick is the already-queued **BACKLOG-390** (standing up to the gobbler) — the reply to
> cycle 84's greedy gobble (387): a *bold* dino shouldered past doesn't cede, it holds its tile and the
> gobbler backs down (😠), so bravery decides who gets pushed around. These extend the standoff into the
> bully's retreat, a witness's admiration, a legible spine, and a reputation that eventually cows the bully —
> the defiance half of the 389-392 scramble thread. Also seeds the operator's brain-decisions nudge (393).

- [ ] BACKLOG-395 [emergent] Witnessed backbone — a dino that watches a friend hold its ground against a gobbler (390) admires it: a small bond nudge toward the bold one and a "saw <bold> stand up to <gobbler>" that can travel as gossip. Courage is socially rewarded. Builds on 390 / 019 / 013.
- [ ] BACKLOG-396 [pokemon] Backbone in the book — the collection book tracks how often each dino has held its ground at the hatch ("held the line 3×"), the counter-standing to 392's "grabbed first", so defiance is legible too. Builds on 390 / 392 / 021.
- [ ] BACKLOG-397 [emergent] Reputation cows the bully — a gobbler that's been stood up to by the same bold dino before hesitates to shoulder it again (it skips that winner and waits its turn), so a bully learns who not to push. The grudge's mirror — the bully's caution. Builds on 390 / 389 / 394.

## Cycle 86 lore additions — the hatch remembers your face (2026-06-30)

> Cycle 86 turns the contested-drop trio (yield 375 / gobble 387 / stand 390) from three isolated
> moments into a *remembered* pecking order. The suggested pick is the already-queued **BACKLOG-394**
> (the backed-down gobbler slinks off, 😖) — the smallest clean reply that gives the failed grab a
> visible cost, completing the 390 standoff's emotional arc. The new seeds carry the thread further:
> the outcomes congeal into a per-dino disposition (401), become legible in the book (402) and the
> voice (404), grow a victor's-mercy grace note (403), and — off the feeding treadmill — let a dino
> alone too long invent a tic of its very own (405).

- [ ] BACKLOG-401 [emergent] Pecking-order memory — a dino carries a running sense of who it's yielded to (375), been gobbled by (387), and stood up to (390) at the hatch, so the trio's outcomes congeal into a per-dino disposition (a quiet wariness toward a dino that's out-grabbed it, a little confidence toward one it's faced down) it can read next time they meet at a drop. Builds on 375 / 387 / 390 / 011.
- [ ] BACKLOG-402 [pokemon] Hatch temperament in the book — the collection book shows each dino's table manner — generous / greedy / unbowed / timid — derived from its feeding tallies, a one-line "at the hatch: …" read that folds 388's "kindest", 392's "grabbed first", and 396's "held the line" into a single legible character note. Builds on 375 / 387 / 390 / 021.
- [ ] BACKLOG-403 [emergent] Victor's mercy — a dino that stood its ground (390) and ate, later seeing the same gobbler it denied still hungry, may let it have the *next* scrap (a magnanimous yield the bold/agreeable do and the petty don't), so defiance and grace can live in the same dino. Builds on 390 / 375 / 013.
- [ ] BACKLOG-404 [social] Mealtime mood in the voice — a dino's most recent hatch outcome tints its next dialogue line: a gobbler that just grabbed sounds smug, a dino that yielded sounds wistful, one that stood its ground sounds proud — layering the feeding trait (375/387/390) into speech the way mood and time-of-day already do (051). Builds on 375 / 387 / 390 / 051.

## Cycle 87 — the tic spreads

> The solitary tic (405) turns a lone dino's idleness into a signature ritual. These shade it outward:
> a friend can catch it and echo it (407), the keeper can catch a dino mid-ritual (408), the book names
> it (409), a stranger-zone deepens it (410), and being found lifts it (411).

- [ ] BACKLOG-407 [emergent] Shared tic — a dino that watches a close friend perform its solitary tic (405) enough times picks up a faint echo of it, so a personal ritual can *spread* between friends (mimicry as quiet bonding). Builds on 405 / 013.
- [ ] BACKLOG-409 [pokemon] Tics in the book — the collection book names each dino's signature tic ("paces a fixed little path"), a distinctness read the player collects at a glance. Builds on 405 / 021.
- [ ] BACKLOG-411 [emergent] Glad of the company — a dino pulled out of its tic by a friend wandering into range files a small "glad of the company" note, so being found mid-solitude leaves a warm trace it can lead its next greeting with. Builds on 405 / 011.

## Cycle 88 — the ritual, seen

> With the keeper about to catch a dino mid-tic (408), the private ritual meets the social world. These
> shade the catch and the tic itself: the same catch reads opposite by love (413), a bad moment drives a
> dino to it sooner (412), grief points it at a departed friend's edge (414), the book counts how *often*
> a dino keeps to itself (415), and two loners ticcing in sight of each other feel a wordless kinship (416).

- [ ] BACKLOG-412 [emergent] Self-soothing tic — a dino that's just had a bad moment at the hatch (slunk off 394, or lost a scrap) falls into its signature tic *sooner* than usual, so the private ritual reads as visible self-comfort after a sting, not only idle-time distinctness. Builds on 405 / 394 / 387.
- [ ] BACKLOG-415 [pokemon] Kept-to-itself read — the collection book shows how *often* each dino falls into its tic (a "keeps to itself" ↔ "always among others" temperament bar), a distinctness stat the player collects over time, distinct from naming the tic (409). Builds on 405 / 021.
- [ ] BACKLOG-416 [emergent] Not the only one — when two solitary dinos happen to tic within sight of each other (just past company range, so neither breaks), each files a faint "not the only one out here" — a wordless kinship between loners without contact or a bond change. Builds on 405 / 135.
- [ ] BACKLOG-420 [social] Caught again — greet a fond dino mid-tic (413) a second time in the same solitary stretch and its pleasure turns to playful teasing ("you again? spying on me?"), so a repeat catch reads different from the first warm one. Builds on 413 / 408.
- [ ] BACKLOG-421 [emergent] The ritual drifts — over many solitary stretches a dino's tic anchor slowly wanders its zone instead of pinning one tile, so its "little path" migrates and the ritual reads as a living habit, not a fixed loop. Builds on 405 / 421-none; 405.
- [ ] BACKLOG-422 [social] Warmed by the catch — a dino caught *fond* (413) gains a small lasting affinity for having been seen and glad of it (a one-time bond nudge, first catch per stretch), so the moment leaves a trace beyond the line. Builds on 413 / 016.
- [ ] BACKLOG-423 [ai] Tic-flavored voice — a caught dino's reply is prompt-nudged by which ritual it was at (a pacer sounds restless, a fusser distracted), enrichment-on-top with the deterministic bashful/fond frame (408/413) unchanged under stub/fallback. Builds on 408 / 413 / 393.
- [ ] BACKLOG-424 [emergent] Traces of your pacing — the re-shape of the unbuildable 407: a dino that arrives where another was *lately* ticcing files a faint "someone was pacing here" trace via memory (not live-watching, which 405 forbids by construction), so a ritual leaves a mark a friend can stumble on. Builds on 405 / 407 / 011.

## Cycle 106 lore additions — the chain moves as one (2026-07-20)

> Milestone 6 ("No zone stands alone") opens: the three zones stop being three parallel economies and
> become one that ferries plenty toward need. These are the milestone's **lore arcs** — the dino-feeling
> half of the structural spine the Structure-smith owns (447/450/448/449). Cap note: the lore body is well
> over the 12-item drain floor, but a milestone can't be drafted without arcs, so these three are seeded
> tightly milestone-anchored (not opportunistic backlog fill), per the milestone-duty override.

- [ ] BACKLOG-452 [emergent] Homecoming from the road — a dino that migrated to another zone and later crosses *back* to its original home zone plays a small "back where it belongs" resettle beat (a 🏡 bubble + a settling memory), and a resident still there greets its return; travel finally has a return, not just a one-way drift. Builds on 334 / 341 / 340.
- [ ] BACKLOG-453 [social] Word of the provider — once a `provider` role emerges (448), a dino can name it in gossip/greeting ("the Fernreach eats because of Sunny"), the pantry-keeper's standing surfacing in voice the way the quiet-hero (260) and hoarder do; deterministic fallback line, LLM colour behind the boundary. Builds on 448 / 260 / 020.

## Mobile (deferred, do not pick until charter clears)

- [ ] BACKLOG-100 [infra] Capacitor wrap — only after game is fun on desktop. Charter must clear.
- [ ] BACKLOG-101 [infra] Native LLM plugin swap on mobile

---


*Closed items + closed log live in `BACKLOG-archive.md`.*
