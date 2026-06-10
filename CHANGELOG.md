# Changelog

Append-only. Validator adds an entry on APPROVED verdicts. Format:

```
## Cycle NNN — YYYY-MM-DD
- BACKLOG-NNN: <title> — <one-line outcome>
```

---

## Cycle 040 — 2026-06-09
- BACKLOG-159: Season foundation — the bowl gets a **turning year**. Seasons run a week of in-game days each (spring → summer → fall → winter, a 28-day year that wraps forever), shown on the clock HUD (`Day 9 — 08:00 ·1× · summer`) and washed over the world as a subtle per-season tint (≤ 0.12 alpha, depth 4) under the day/night overlay — the year colours the bowl, the sun still owns the light. When the year *actually turns* under a live tab, the bowl marks it once: a fading banner ("The season turns — winter pales the light in the bowl."), a 🍂 line in the Park News ticker, and **every dino files the memory** — so the turn is gossip fuel and prompt context the moment 173 lands. The season is **pure derived state** from the clock day the save already persists: the save format grew by nothing, and boot / restore / away fast-forward are all proven silent (restore re-derives, never beats). The Code-planner caught the trap that would have gutted the e2e: a 7-day `__advanceWall` takes the clock's MAX_CATCHUP `set()` branch and fires no listeners, so the test stages day 7 23:59 via a restore-semantics `__setClock` (which *cannot* fake a turn) and crosses midnight with a 2-minute live advance. Pure `world/seasons.ts`; WorldScene glue only. No new keys or deps. 7 new unit + 4 new e2e; 9/9 AC pass + a bonus restore-guard e2e; 283 unit / 99 e2e green, full e2e first try. Spine for festivals (026), weather (028), and the cycle-40 lore items (170–173).

## Cycle 039 — 2026-06-09
- BACKLOG-161: First-contact inspection — the bowl finally *answers* a keeper pick. The moment you switch observers, the dino whose temperament most resonates with the new watcher drops what it's doing and crosses the bowl for a long look: a 👀 beat at arrival plus a persisted "went to the glass for a long look at VANTA-9 'Vix'" memory it can carry into later lines. Who comes is a read on who you became — Vix draws Glade, Lux draws Rex, Aki draws Sunny — and an observer nobody resonates with draws *no one*, which is its own kind of telling (strictly-positive fit required, the comfort-floor grammar). Re-picking your current observer, booting, or restoring a save arms nothing: only a real change of watcher turns heads. Pure `keeper/firstContact.ts` (positive argmax over `keeperFit`, alpha tie-break, INSPECT_TTL 24 — the Code-planner caught that the design's 12 could expire before a worst-case ~19-tile walk, and a unit test now pins TTL ≥ 19); WorldScene glue only (changed-id arming in the picker, a one-dino beeline override in the movement loop, a once-per-step resolver on the `pendingRepair` one-shot pattern). No save-format change; no new keys or deps; NPCBrain boundary intact. 6 new unit + 4 new e2e; 9/9 AC pass; 276 unit / 95 e2e green — full e2e first try. Unblocks 165 (watcher gossip) / 167 (the unimpressed).

## Cycle 038 — 2026-06-09
- BACKLOG-157 (first of three abilities; item stays open): **Field Scan** — LUMEN-3 "Lux" earns its Scholar Lens. Playing Lux, press **B** beside a dino and a dossier opens: all five personality axes drawn as ▮▯ meters between their pole labels (cautious↔curious, prickly↔warm…), current mood, favorite food, and emergent role — the hidden state that until now only the code could see. Playing AETHER-1 or VANTA-9, the same key gets you a refusal *in that observer's own voice* ("A diplomat does not pry into a mind…") — who you chose now gates what you can know, not just who warms to you. Pure `keeper/scan.ts` (canScan / scanLines / scanRefusal — pure formatting over `AXES`, `moodFromTraits`, `favoriteFood`); WorldScene glue only (B toggle, panel, non-modal refusal bubble, dev hooks incl. a new `__warpTo` test warp). No save change; no new deps; NPCBrain boundary intact. 7 new unit + 4 new e2e; 10/10 AC pass; 270 unit / 91 e2e green (first-run failures were the documented cold-boot flake — green isolated + on the fresh full run). The Designer overrode the lore handoff's bond-sight suggestion on prior-art grounds (the V bonds lens already shows everyone the graph) — the chain catching its own duplicate. Remaining: Vix's and Aki's powers, one per cycle.

## Cycle 037 — 2026-06-09
- BACKLOG-155: Selectable keeper — the faceless yellow square becomes someone you *choose*. The player is now one of three **time-traveling robot observers** — AETHER-1 "Aki" (Empath Protocol), VANTA-9 "Vix" (Daredevil Drive), LUMEN-3 "Lux" (Scholar Lens) — each with its own era, a one-line backstory, and a distinct ability. Press **K** to open a picker (1/2/3 to choose, styled like the tone menu); the choice **persists** across reloads and into the exported save. The shipped ability is a personality **fit**: the chosen observer adds a small affinity bonus (0..+2) when greeting/gifting dinos whose temperament matches it, so *which* observer you are quietly decides *which dinos* warm to you fastest — the same choice reads differently against each distinct mind. Pure `keeper/keepers.ts` (`KEEPERS` roster + `keeperById`/`keeperFit`/`keeperBonus`, mirrors `social/tones.ts`); WorldScene glue only (the `K` picker overlay, a number-key dispatcher so 1/2/3 routes to the open overlay, the bonus applied at the `recordGreet`/`recordTone`/gift seams, a non-blocking fading first-time invite — no modal on boot). Additive `keeperId?` save (old saves + fresh games default to AETHER-1; no `SAVE_VERSION` bump); no new deps; NPCBrain boundary intact. 9 new unit + 4 new e2e; 12/12 AC pass; 263 unit / 87 e2e green. QA caught a stale tones assertion (the keeper bonus correctly colors the tone-pick greet) and fixed it in-session. First beat of the keeper arc (the operator's live-session ask); unblocks 156/157/158.

## Cycle 036 — 2026-06-08
- BACKLOG-144: World-scale night event — the bowl's first *collective* beat. For thirty-five cycles every reaction was pairwise; now, on a rare clear night, the sky lights up (a **meteor shower** or an **aurora**) and the **whole cast** abandons its wandering to drift to one spot near the centre of the bowl, gather, and gawp — each dino throwing a ✨ awe bubble and filing **one shared memory** ("the whole sky rained falling stars, and we all watched it together"). The spectacle fades a shimmer overlay over the night tint and ends when its duration elapses or night passes into dawn, after which ordinary life resumes. Pure `world/skyEvent.ts` (`SKY_EVENTS`, `pickSkyEvent`/`rollSkyEvent`, `atGather`, `skyExpired`, gather tile 10,7 — mirrors `comfort.ts`); WorldScene glue only (shimmer overlay at depth 7, a top-priority `stepSky` override in `forceStep`, dev hooks `__skyEvent`/`__triggerSky`/`__skyGazers`). The auto-trigger rolls on a **real-time cadence** (not in-game hours, so offline catch-up never conjures one) and is **capped at one per in-game day** — genuinely rare. No save-format change at all (the shared awe rides the existing persisted memory store); no new deps; NPCBrain boundary intact. 7 new unit + 4 new e2e; 9/9 AC pass; 254 unit / 83 e2e green. QA caught a cadence regression pre-ship (the roll was first on `onHour` and dragged the cast off the den in the huddle test); fixed in-session. Unblocks 150–154.

## Cycle 035 — 2026-06-08
- BACKLOG-142: Player dialogue tones — the first two-way beat in player↔dino dialogue. Greeting a dino (E/Z) now opens a **Warm / Tease / Honest** menu instead of an instant reply; 1/2/3 picks a tone, each dino weighs it from its name-seeded personality (warm dino loves Warm, bold-prickly enjoys Tease, timid bristles), so the same gesture lands differently per dino. The pick applies a personality-fit affinity delta (`loved +5 / liked +3 / neutral +1 / clashed −2`), files a `the keeper …` memory, and persists a **last-tone trace** the menu reads back to you next time ("Last time you were warm with them."). Pure `social/tones.ts` (mirrors `gifts.ts`: `TONES` + `toneScore` + `toneReaction` + `lastToneLine`); WorldScene glue only (`recordTone`, a repair-seam-preserving twin of `recordGreet`); reply path unchanged (tone-coloured replies deferred to BACKLOG-148); additive `lastTone` save field (no `SAVE_VERSION` bump). 9 new unit + 4 new e2e; 9/9 AC pass; 243 unit / 77 e2e green (isolated). Opens the dialogue-choices arc (148/149); first beat seeded from the Idea Box's first firing.

## Cycle 034 — 2026-06-07
- BACKLOG-132: Gratitude echo — the bond graph (BACKLOG-013) bends back the other way. A dino consoled in a comfort beat (BACKLOG-130) files *who* came for it in a persisted, additive `gratitude` ledger (`consoled → comforters`); on a later homecoming where that comforter is itself the sulking runner-up (BACKLOG-120), the dino it once consoled crosses the bowl **first** — past a stronger-bond peer, ignoring `COMFORT_BOND_FLOOR`. Reciprocity, not just proximity. Pure `world/comfort.ts` (`Gratitude`, immutable+deduped `recordGratitude`, a reciprocity override on `comforter` evaluated before the unchanged closest-friend scan with the same alpha tie-break); WorldScene glue only; `homecoming.ts` + the keeper-repair seam (125) untouched; reward currency stays the dino↔dino bond; additive save (no `SAVE_VERSION` bump). 15 new unit + 2 new e2e; 9/9 AC pass; 231 unit / 73 e2e green. Unblocks 137/138/139/140/141.

## Cycle 033 — 2026-06-06
- BACKLOG-130: Comforting nuzzle — the dino-to-dino half of the attention economy. When a homecoming makes a near-tied runner-up sulk `😒` (BACKLOG-120), the sulker's *closest friend* (highest pairwise bond, BACKLOG-013) crosses the bowl and consoles it: a floating `There there, <sulker>. 🫂`, the pair's bond grows by `COMFORT_BOND` (+2), and the slighted dino keeps a "<friend> came over to comfort me" memory. A poorly-integrated dino with no bond above `COMFORT_BOND_FLOOR` (8) gets no one — telling in itself. Pure `world/comfort.ts` (`comforter` w/ floor + alpha tie-break, `comfortLine`, `comfortMemory`); WorldScene glue only; `homecoming.ts` + the keeper-repair seam (125) untouched; reward currency is the dino↔dino bond, not player points; additive save. 7 new unit + 2 new e2e; 9/9 AC pass; 212 unit / 70 e2e green. First beat to read the long-dormant bond graph; unblocks 132/133/136.

## Cycle 032 — 2026-06-05
- BACKLOG-125: Greeting the runner-up — the repair half of the jealousy keystone. A homecoming's near-tied runner-up (the dino that sulks `😒` in BACKLOG-120) is marked pending-repair; greeting it flips the slight with an outsized bump (`greetGain` +6), a floating `You noticed me! 😊`, and a "the keeper noticed X after all" memory. One-shot per slight, transient (no save change). Pure additive `world/repair.ts`; WorldScene glue only; `homecoming.ts` untouched. 5 new unit + 3 new e2e; 9/9 AC pass; 202 unit / 67 e2e green. Closes the hurt→heal loop; unblocks 128/129.

## Cycle 031 — 2026-06-04
- BACKLOG-120: Jealous nuzzle — when a homecoming fires, a near-tied runner-up (within 10 pts / one heart of the closest) sulks `Hmph. 😒` alongside the 👋 and keeps a "the keeper fussed over X" memory. Pure additive `jealous` field on `homecoming.ts` (generalized `closest`→`topBy(exclude?)`, shared alpha tie-break); WorldScene glue only; no friendship-points change; additive save. 8 new unit + 2 new e2e; 9/9 AC pass; 193 unit / 63 e2e green. Keystone for 123/125/126.

## Cycle 030 — 2026-06-03

- BACKLOG-112: Homecoming nuzzle — APPROVED. After a long real absence, your *closest* dino (highest player-friendship) notices you came back: a heart-graded 👋 "welcome back" bubble floats over it on return, and it keeps a faint "the keeper came home" memory. Reads the BACKLOG-106 catch-up duration; gated at 6 in-game hours so an instant reload stages nothing. Pure `world/homecoming.ts` (max-friendship + alphabetical tie-break, three warmth bands) with WorldScene glue only (restore + `__catchUp` compute, `showBubble`, `remember`); reuses `friendship.heartsFromPoints` + `memory.remember`. No friendship-points change (hearts ACs untouched); additive save, boundary intact. 8 new unit + 2 new e2e; 185 unit / 61 e2e green. First personal beat on the cycle-29 spine; unblocks 119–122.

## Cycle 029 — 2026-06-02

- BACKLOG-106: Offline catch-up ("while you were away") — APPROVED. On load, reads the real gap since `savedAt` (× the saved scale) and fast-forwards the world cheaply — no per-tick loop, no LLM: bonded companion pairs drift closer (capped), each gets a "kept each other company" memory, and a "While you were away…" digest greets the player. Pure `world/away.ts` (`awayMinutes`, `fastForward`) + a new `advanceTime` clock export; span capped at 7 in-game days so a week away can't hang the load. Additive save (no version bump); old saves no-op the catch-up. 13 new unit + 2 new e2e; 170 unit / 58 e2e green. The payoff of cycle-28 realtime; spine for the 112–116 cluster.

## Cycle 028 — 2026-06-01

- BACKLOG-105: Wall-clock-anchored time + configurable scale — APPROVED. The clock no longer counts timer ticks; it reads the wall clock. `WorldClock` now anchors an epoch + an absolute in-game minute and derives the current `GameTime` from `(now() − anchor) × scale`, via an **injectable** `now()` source so it stays pure/Node-testable. `tick()` survives untouched as the one-minute boundary primitive — the new `update()` pump just calls it for each whole minute the wall clock has crossed — so every prior time-driven spec and `__advanceMinutes` keeps working. The payoff: a backgrounded tab (where Phaser throttles) catches up to true time on return instead of silently falling behind. Default is **1× realtime** (a full day/night = 24 real hours — the true fishbowl); **T** toggles 1×⇄60× (the old "1 real sec ≈ 1 game min" watching rate) and re-anchors so the time never jumps on toggle; the HUD shows the active rate (`Day 1 — 08:00 ·1×`). Catch-up is capped at one in-game day of per-minute fires — a longer gap jumps the clock without flooding listeners (rich offline catch-up is BACKLOG-106). `SaveData` gains additive `savedAt`/`scale` (the seed 106 needs); `SAVE_VERSION` stays 1 and old saves still load. Pure `world/clock.ts` + additive `world/saveGame.ts`; WorldScene glue only (T key, HUD, hooks). 9 new unit + 2 new e2e; full suite **157 unit / 56 e2e** green. Boundary clean (AI untouched). Unblocks BACKLOG-106 (offline catch-up) and the cycle-28 realtime rituals (108–111).

## Cycle 027 — 2026-06-01

- BACKLOG-061: Food favorites — APPROVED. The hatch feed has a flavor now and the dinos have opinions. **H** drops one of four foods (🍖 meat, 🌿 greens, 🐟 fish, 🍓 berries) and each dino quietly favors one — derived from its temperament with the *same* `giftScore` math the gift system uses (a food is a gift through the lid). When a dino snaps up *its* favorite it's extra-happy: a bigger bump (`FEED_GAIN_FAV=9` vs the plain `FEED_GAIN=5`), a 😋 (vs 🙂), and a "your favorite …!" memory it can later gossip about; it also rushes its favorite harder — a wider reach (`FEED_RANGE_FAV=12`) and a lower energy bar (`EAGER_FAV=0.15`) — so the keeper learns each palate by watching who comes running for what. Favorites vary (Rex/Glade → meat, Mossback/Sunny → berries, Twitch → greens). Pure `world/foods.ts` (`favoriteFood`, `foodReaction`) + an optional `isFavorite` on `feeding.ts`'s `reactionToFood` (default false → cycle-25 behavior byte-identical); WorldScene glue only. 9 new unit + 2 new e2e; full suite **148 unit / 54 e2e** green. Save unchanged (favorites re-derive from the name; food stays ephemeral). Opens the taste cluster: 066 taste talk, 067 keeper-loaded hatch, 068 acquired taste, 069 menu-in-the-book, 070 picky/gobble.

## Cycle 026 — 2026-05-31

- BACKLOG-060: Idle / ambient mode — APPROVED. The vivarium becomes a quiet desktop companion: after `IDLE_AFTER_MS=12s` with no input, the HUD eases down to `AMBIENT_ALPHA=0.12` over `FADE_MS=1.5s` and the camera starts a slow "breathing" zoom (1.0↔1.04, 6s yoyo) toward the centre of the bowl — leaving just the glass and its life. Any key, click, or held movement snaps everything back to full instantly. Held WASD counts as activity (movement polls `isDown` and doesn't refire keydown). Pure `world/idle.ts` (`isIdle`, `hudAlpha` — monotonic fade curve); WorldScene tracks `lastInputAt`, fades a set of always-on HUD texts, and runs the camera tween. Completes the fishbowl furniture (056 glass / 057 tap / 058 plaque / 059 feed / 060 idle). 5 new unit + 2 new e2e (fade + ambient flag on idle; real keypress wakes it); full suite **139 unit / 52 e2e** green. Save unchanged.

## Cycle 025 — 2026-05-31

- BACKLOG-059: Feeding hatch — APPROVED. The bowl's lid has a hatch now: press **H** and a 🍖 falls from the top into the upper-middle feeding zone, and the cast swarms it. Eager, in-range dinos (`energy ≥ 0.4` within 7 tiles) make a beeline; the calm and the far-off keep wandering. The first dino to reach the food snaps it up — 😋, a friendship bump (`FEED_GAIN=5`), and a "scrambled to the hatch and snapped up the food" memory that can ripple into gossip; the rest disperse. One piece at a time; the drop + eat both post to the Park News ticker. Reframes gifting (F, hand-to-one) as feeding the tank (H, broadcast-to-cast) — the keeper picks the input, the bowl picks the winner. Pure `world/feeding.ts` (`reactionToFood`/`feedStep` reusing `stepToward`/`reachedFood`/`foodLanding`); WorldScene glue only. 9 new unit + 2 new e2e; full suite **134 unit / 50 e2e** green, no flake. Save unchanged (food is ephemeral). Spine for 061 favorites / 062 scramble / 063 begging / 064 hoarder role / 065 feed-log.

## Cycle 024 — 2026-05-30

- BACKLOG-058: The Plaque — APPROVED. An engraved brass nameplate sits under the bowl — *"VIVARIUM · Pocket Cretaceous"* over a live stat line: `Day N · M specimens · G generations`. The generation count is a pure readout of the lineage the breeding loop produced: founders are gen 1, a hatchling is 1 + the deeper of its two parents, so the plaque deepens on its own as families breed across days. Pure `ui/plaque.ts` (`generationOf` memoized + cycle-guarded, `maxGeneration`, `plaqueLines` with pluralization); the scene renders it bottom-center, refreshed on the clock tick. 5 new unit + 1 new e2e (plaque reports population and ticks to 2 generations when an egg hatches); full suite **125 unit / 48 e2e** green. The bowl now wears its label.

## Cycle 023 — 2026-05-30

- BACKLOG-057: Tap the glass — APPROVED. The keeper can now rap the vivarium wall (click anywhere): a ripple ring expands at the tap and every dino within range reacts **by temperament** — the timid bolt away (❗), the bold creep closer to investigate (❓), the far-off don't notice. The reaction is decided by the dino's seeded `bravery` and its distance from the tap, and the scare is written into the dino's memory ("the glass shook and you bolted/crept closer") so it can ripple into gossip and dialogue. Pure `world/startle.ts` (`reactionFor`/`fleeStep`/`startleStep`, reusing `stepToward`); WorldScene adds a `pointerdown` handler, the ripple tween, and the ❗/❓ flash. 6 new unit + 2 new e2e; full suite **120 unit / 47 e2e** green. First time the keeper can *touch* the bowl.

## Cycle 022 — 2026-05-30

- BACKLOG-056: The Glass (vivarium frame) — APPROVED. Reframes the whole game per the operator's "mini dino fishbowl" idea: the world is now a **sealed glass vivarium** the player keeps and watches. Draws the bowl — an edge vignette (corners doubled for a deeper shadow), a crisp pale-cyan glass rim with a faint inner highlight, two reflection streaks, and a curved light-catch arc along the top lip. Pure geometry in `ui/glass.ts` (`cornerRadius`/`rimRects`/`edgeBands`/`glarePolys`/`toPoints`); the scene draws it at depth 8 (over the night tint + bond lines, under the HUD). No sim change — purely visual. New lore doc `studio/lore/vivarium.md` + a fishbowl backlog section (057 tap-the-glass, 058 plaque, 059 feeding hatch, 060 idle mode). 5 new unit + 1 new e2e; full suite **114 unit / 45 e2e**, green across two consecutive runs. Visually verified in a live preview.

## Cycle 021 — 2026-05-30

- BACKLOG-021 + BACKLOG-020: Observer lenses — APPROVED. One key (**V**) cycles the player through ways of *seeing* the emergent sim, each a pure readout of state the sim already produced (no new scripting): **📖 Collection Book** (every dino incl. hatchlings — species, hearts, strongest bond, emergent role, lineage "child of X + Y", rumors heard), **🔗 Bonds** (lines drawn between bonded pairs on the map, thicker = stronger), **🎭 Roles** (a role tag floats over each dino — `gossip`/`homebody`/`socialite`/`wanderer` **derived from behavior**, BACKLOG-020), **📰 Park News** (live ticker of births/hatches/gossip). Pure `ai/roles.ts` (`deriveRole`) + `ui/lenses.ts` (`nextLens`/`bondedPairs`/`tickerLines`/`bookLines`); `BornDino` gains a `parents` field for lineage (additive). WorldScene adds the lens layer + an event log. 14 new unit + 3 new e2e; full suite **109 unit / 44 e2e**, green across two consecutive e2e runs. Visually verified all four lenses in a live preview. Turns the invisible sim into something you watch — without ever authoring an outcome.

## Cycle 020 — 2026-05-30

- BACKLOG-019: Gossip propagation — APPROVED. When two dinos converse on meeting, the speaker passes a recent **first-hand** memory to the listener as second-hand news, planted in the listener's memory marked `told me:` so it won't re-spread (1 hop, no loops). Because memory already feeds the prompt as "Lately: …", a dino can now bring up things it only *heard* about — news ripples through the park as the cast mingles. Pure `social/gossip.ts` (`swapPronouns`/`isShareable`/`pickGossip`/`makeRumor`/`spreadGossip`), wired into the throttled `converse` path so it spreads at conversation cadence. 7 new unit + 2 new e2e; full suite **99 unit / 41 e2e**, green across two consecutive e2e runs.

## Cycle 019 — 2026-05-30

- BACKLOG-042: Egg phase — APPROVED. The park grows itself. When two dinos whose bond clears the threshold (`EGG_BOND_THRESHOLD=60`) share a sleeping huddle on a clear night, a 🥚 appears by the den; after `EGG_HATCH_DAYS=3` in-game days it hatches into a brand-new dino whose traits, color, and species are **blended from the two parents** (pure `breeding.ts`: `blendTraits`/`blendColor`/`childName`/`shouldLay`/`hatch`). Born dinos and pending eggs ride into the save (additive, version 1) and respawn on reload, so the family tree survives sessions. A hard `MAX_POPULATION=12` cap stops runaway breeding. Weather isn't in yet (BACKLOG-028) so every night counts as "clear". 12 new unit + 3 new e2e; full suite **92 unit / 39 e2e**, green across two consecutive e2e runs. Closes the social loop started by cycle-18 huddles: meet → bond → huddle → **breed**.

## Cycle 018 — 2026-05-30  (capstone)

- BACKLOG-013 + BACKLOG-041: Pairwise bonds + night sleeping huddles — APPROVED. Every NPC↔NPC meeting strengthens a symmetric pairwise **bond** (0–100, pure `bonds.ts`, persisted). A visible **den** sits lower-centre; at **night** any dino whose strongest bond ≥ threshold walks to the den instead of wandering, clusters with its friends (💤 over each), and the huddle adjacency keeps deepening the bond — then they disperse at dawn. Self-reinforcing: meeting builds bonds, bonds drive huddling, huddling builds bonds. 8 new unit + 2 new e2e; full suite 80 unit / 36 e2e, green across three consecutive runs.

## Cycle 017 — 2026-05-30

- BACKLOG-011: NPC memory store — APPROVED. Each dino keeps a small ring buffer of recent events (you greeting it, gifts + how it reacted, running into other dinos). The last few are woven into its prompt ("Lately: …") so it reacts to history, and the memory rides into the save — so a dino remembers you next session. At dawn each dino folds its events into a one-line reflection. Pure `memory.ts` (`remember`/`recall`/`reflect`); additive save field (version unchanged, old saves default to empty). 7 new unit + 1 new e2e.

## Cycle 016 — 2026-05-30

- BACKLOG-006: Device probe — APPROVED. The brain sizes the model to the device instead of hardcoding 0.5B: pure `pickTier` scores `navigator.deviceMemory` + the WebGPU adapter's max storage-buffer size into tiny (0.5B) / small (1.5B) / medium (3B), and `defaultLoader` loads that model; choice surfaced via `window.__modelLabel`/`__modelInfo`. (Browsers can't write `config.json` — selection is exposed instead.) 5 new unit + 1 new e2e.

## Cycle 015 — 2026-05-30

- BACKLOG-055: Livelier character voice — APPROVED. Diagnosed bland replies: the prompt threw away the vivid roster flavor (only dry trait adjectives reached the model), was negative-heavy, and the output was triple-truncated (one sentence + 60 tokens + first-sentence-only cleaner). Fix: the system prompt now leads with character and feeds BOTH the roster flavor ("loves rocks", "quick to bolt") and the trait adjectives, with a single light "never a chatbot or helper" clause and an invitation for "one or two vivid, specific sentences"; `cleanReply` keeps up to 2 sentences; generation is `max_tokens 100` / `temperature 0.9`. 66 unit / 32 e2e green.

## Cycle 014 — 2026-05-30

- BACKLOG-052: NPC↔NPC dialogue — APPROVED. Dinos now drift toward each other (~45% of steps via pure `stepToward`) so they actually cluster and meet, and on meeting one speaks a brain-generated line (`npc_meet`) in a floating speech bubble above it (🧠-tagged when model-written), throttled by a cooldown + in-flight guard to protect the single shared engine. Also added a WebGPU guard so the brain fails fast to the canned fallback (and skips a doomed worker) on browsers without WebGPU. 3 new unit + 2 new e2e.

## Cycle 013 — 2026-05-30

- BACKLOG-053: Sane controls — APPROVED. WASD movement (arrows kept), E to interact and F to give (Z/G kept as aliases), save-export moved off E to O, plus an on-screen controls hint. 2 new e2e.

## Cycle 012 — 2026-05-30

- BACKLOG-051: Richer dialogue context — APPROVED. The WebLLM prompt now carries the time of day (`dayPhase`), the dino's current mood (`moodFromTraits`), and the player's friendship level (hearts → `relationshipLabel`), and the greet line itself changes with the relationship (stranger → dear friend). Pure prompt enrichment reusing three existing signals; verifiable via the new `__greetPrompt` dev hook. 2 new unit + 2 new e2e; 7/7 AC pass. Directly targets the "mostly hellos" sameness.

## Cycle 011 — 2026-05-30

- BACKLOG-018: NPC movement + meeting spine — APPROVED. Dinos wander the map (pure `wanderStep`, clamped, driven off the world clock at a gentle throttle) and record a symmetric pairwise "meeting" tally when two end a step adjacent (pure `recordMeet` — the seed of pairwise affinity), flashing both labels. `nearestDino` reads live positions, so greeting/gifting follow a dino wherever it roams. LLM dino-to-dino dialogue deferred to BACKLOG-052. 5 new unit + 2 new e2e; 8/8 AC pass.

## Cycle 010 — 2026-05-30

- BACKLOG-049: WebLLM Web Worker offload + observability — APPROVED. Inference moved into a dedicated Web Worker via `CreateWebWorkerMLCEngine`, so model load/generation no longer block the render loop (build confirms web-llm split into its own worker chunk). Added a brain-status HUD (🧠 thinking… / ready / offline) and a per-reply `source` tag that prefixes 🧠 on lines the model actually generated — so the player can tell a real LLM line from the canned fallback. 2 new unit + 2 new e2e; smoothness/tag is a human WebGPU check.

## Cycle 009 — 2026-05-30

- BACKLOG-015: Gift system — APPROVED. Hold one of five items (shiny shell, wildflower, smooth rock, sparring stick, mossy snack), cycle with [ / ], press G near a dino to give it. A pure `giftReaction` scores the item's appeal against the dino's personality → loved / liked / neutral / disliked, and the affinity delta rides the existing friendship store + save. The reaction reads out in the dialog box. 7 new unit + 2 new e2e; 9/9 AC pass. Personality now changes what the player should do.

## Cycle 008 — 2026-05-30

- BACKLOG-048: In-character dino dialogue — APPROVED. Fixes the assistant-voice the live spot-check exposed: a hardened system prompt ("You are NOT an AI assistant…") with a one-shot in-character example, plus a pure `cleanReply` that strips wrapping quotes, drops assistant boilerplate, and keeps the first in-character sentence (falling back to a canned line if nothing survives). Deterministic guardrail means help-desk text can't reach the dialog box regardless of model output. 5 new/updated unit tests; voice-quality is a human re-greet follow-up.

## Cycle 007 — 2026-05-30

- BACKLOG-005: WebLLM-backed brain — APPROVED. `WebLLMBrain` runs Qwen2.5-0.5B in the browser via WebGPU, lazy-loaded on first greet behind the `NPCBrain` boundary (only `ai/webllmBrain.ts` imports `@mlc-ai/web-llm`, dynamic/code-split). Progressive + safe: instant canned fallback while loading or without WebGPU, never throws/blocks; one engine shared across all dinos. Prompt built from name/species/personality. 6 new/updated unit (incl. fake-engine generate path) + 2 new e2e; automatable AC pass. Live token generation deferred to a human spot-check (BACKLOG-047) — WebGPU confirmed available, but the verify harness couldn't drive a real greet.

## Cycle 006 — 2026-05-29

- BACKLOG-016: Friendship hearts — APPROVED. The first player-facing loop: greeting a dino raises affinity (0–100 points → 0–10 hearts), **C** toggles a collection panel listing all five dinos with heart bars, and the affinity persists in the IndexedDB save. Gain scaled by the dino's warmth/sociability (cycle-4 traits). Pure `friendship.ts`; additive save field (`SAVE_VERSION` unchanged, old saves default to empty). 7 new unit + 2 new e2e; 9/9 AC pass.

## Cycle 005 — 2026-05-29

- BACKLOG-017: Spawn 5 NPCs — APPROVED. A pure `ROSTER` (Rex, Mossback, Sunny, Twitch, Glade) with distinct species, spawn tiles, and colors; each dino's personality is seeded from its name (cycle 4). WorldScene spawns the cast via a loop reusing the `Dino` class; Rex anchored at `dinos[0]` for save/personality continuity. 4 new unit + 4 new e2e; 9/9 AC pass.

## Cycle 004 — 2026-05-29

- BACKLOG-010: NPC personality traits — APPROVED. 5 axes (curiosity, sociability, energy, agreeableness, bravery) seeded deterministically from a dino's name via `seededPersonality` (stable across reloads, not stored in save). `describePersonality` renders dominant poles into a brain-ready phrase. Traits flow through `NPCContext` (boundary intact) and the stub brain's mood now reflects them. 6 new unit + 2 new e2e; 9/9 AC pass.

## Cycle 003 — 2026-05-29

- BACKLOG-009: Save / load via IndexedDB — APPROVED. World survives a refresh: in-game time + player position restore on boot, auto-save fires each in-game hour, **E** exports a `dino-save.json`. Pure version-gated `serialize`/`deserialize` (`saveGame.ts`) split from raw-IndexedDB I/O (`saveStore.ts`); clock reused via new `set()`. 6 new unit + 5 new e2e; 9/9 AC pass. `version:1` seam left for BACKLOG-040 migration.

## Cycle 002 — 2026-05-29

- BACKLOG-008: Day/night palette shift — APPROVED. Full-map tint overlay lerps color + alpha across the day off the cycle-1 clock: midnight blue, warm dawn/dusk, clear noon. Pure `dayNight.ts` (`tintFor`, `dayPhase`); 6 new unit + 2 new e2e; 8/8 AC pass. Lights the runway for hour-keyed features (012 dawn plans, 014 dusk reflection, 041 night huddles).
- BACKLOG-046: Vite `host: true` — APPROVED. Fixed BUG-001 (IPv6-only bind); e2e now runs on the default Playwright config, retiring the cycle-1 `.qa-override` crutch.

## Cycle 001 — 2026-05-26

- BACKLOG-007: World tick clock — APPROVED. `WorldClock` class ships; 1 real second = 1 in-game minute; HUD `Day N — HH:MM` top-left; `onTick` / `onHour` listener API; 8/8 unit tests + 3/3 e2e green. Unblocks BACKLOG-008, -012, -041+.

## Cycle 000 — 2026-05-25 — Bootstrap

- Repo initialized
- CHARTER, BACKLOG, STYLE-GUIDE, CHANGELOG written
- Game scaffolded (Phaser 3 + TS + Vite, empty scene, placeholder dino)
- Studio scaffolded (7 routine prompts, state.json, chronicle, RE-ARM)
- CI workflow written
- Cron schedule created
