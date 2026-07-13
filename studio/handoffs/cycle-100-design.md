# Cycle 100 — Design handoff

Two file-disjoint tracks. 7 acceptance criteria each.

---

## Structure track — BACKLOG-437: The hunt feeds

**Goal.** A hungry carnivore's stalk (367) occasionally succeeds, deathlessly, and that success resolves the
hunter's hunger — so hunting becomes a real food source, not only the keeper's hatch. The prey always
survives.

**Design.**

`world/foodweb.ts` (pure, additive):
- `export const HUNT_SUCCESS_CHANCE = 0.3;`
- `export function huntSucceeds(roll: number, chance = HUNT_SUCCESS_CHANCE): boolean` → `roll < chance`.
  (WorldScene passes `Math.random()`; a pure fn so the rate is unit-pinned and callers can force outcomes in
  tests by passing 0 / 0.99.)

`scenes/WorldScene.ts` — the existing hunt branch at the `huntCaught(cur, preyTile)` block (~L2514). Replace
the single empty-hunt body with a success/empty fork:
- **caught → roll `huntSucceeds(Math.random())`:**
  - **success:** `this.needs = satisfy(this.needs, d.name, 'hunger')`; `this.flashFeed(d, '🍖')`;
    `this.logEvent('🦖 ' + d.name + ' made its catch — a lean meal')`; `remember(hunter, 'you brought down a
    meal')`; the prey still escapes: `this.flashFeed(prey, '💨')` + `remember(preyName, 'you slipped ' +
    d.name + "'s hunt")`. Set `huntCooldownUntil[d.name] = Date.now() + HUNT_COOLDOWN_MS`.
  - **empty:** unchanged from cycle 99 — 💨 on prey, `'🦖 the hunt came up empty — …'`, both existing
    memories, cooldown, hunger untouched.
- Both outcomes end the branch with `activityById[d.name] = 'stalking'` and `continue`, exactly as now.
- Deathless: neither outcome removes a dino or mutates the roster; the prey slips away in both.

**Acceptance criteria (437):**
1. `huntSucceeds(roll, chance)` returns `roll < chance`; `huntSucceeds(0)` true and `huntSucceeds(0.99)`
   false at the default chance; `HUNT_SUCCESS_CHANCE` is in (0,1). *(unit)*
2. On a successful catch the hunter's hunger is resolved — `pressingNeed(needs[hunter])` is no longer
   `'hunger'` after `satisfy`. *(unit on `satisfy`; review of the branch wiring)*
3. On success the prey is **not** removed and **not** harmed: roster length unchanged, prey still present,
   only a 💨 + memory. Deathless in both outcomes. *(review)*
4. Both outcomes put the hunter on the same `HUNT_COOLDOWN_MS` cooldown (no free re-hunt next step). *(review)*
5. The empty-hunt path is byte-unchanged from cycle 99 (same log line, same two memories, hunger
   unrelieved). *(review)*
6. The catch is modelled as a direct hunger `satisfy` — **no** ground FOODS item is spawned (nothing for the
   keeper-drop rush path to collide with). *(review)*
7. No save-schema change; `npm run build` + `tsc --noEmit` clean; WebLLM stays `ai/`-only. *(review/build)*

---

## Lore track — BACKLOG-440: Rattled after the chase

**Goal.** A herbivore that just slipped a hunt greets the keeper still shaken and **names its chaser** — the
food web reaches the dialog box, mirroring how hunger did (368). Deterministic fallback; LLM colour behind
the NPCBrain boundary.

**Design.**

`world/foodweb.ts` (pure, additive):
- `export function recentHunter(memories: readonly string[]): string | null` — scans memories newest-first for
  the pattern `slipped <name>'s hunt` and returns `<name>`, else null. (The 367 prey memory is exactly
  `you slipped ${hunter}'s hunt`; `recall` caps at 6, so "recent" is inherent and it ages out on its own.)

`ai/brain.ts`:
- `NPCContext` gains `rattled?: string` — the name of the hunter that just chased this dino.
- `export function rattledAside(hunter: string, traits?: Personality): string` — a space-led aside naming
  the hunter, temperament-shaded exactly like `hungryAside`: prickly (`agreeableness < PRICKLY_MAX`) plays it
  down, warm (`> EFFUSIVE_MIN`) makes a whole thing of it, even-tempered says it plain. Examples:
  - plain: `` …give me a sec, ${hunter} nearly had me.``
  - prickly: `` …${hunter} took a run at me. I'm fine. obviously.``
  - warm: `` oh, you should've SEEN it — ${hunter} nearly had me, I've never run so fast!``
- In `cannedReply`, after the hunger aside, compose the rattled aside when `ctx.rattled` is set:
  `if (ctx.rattled) reply = { ...reply, text: (reply.text + rattledAside(ctx.rattled, ctx.traits)).slice(0,
  280) }`. It composes onto whatever register (gratitude/wistful/fond/generic/hungry) — same rule as 368.

`scenes/WorldScene.ts` — the `pickTone` greet call (~L3966): add
`rattled: recentHunter(recall(this.memory, target.name)) ?? undefined,` to the `greet({...})` context object.

`ai/webllmBrain.ts` — mirror the 368 hungry prompt hint so the model gets the fact too (parity, behind the
boundary). One line alongside the existing hunger hint in `buildMessages`.

**Acceptance criteria (440):**
1. `recentHunter(['you slipped Twitch\'s hunt'])` → `'Twitch'`; `recentHunter([])` and
   `recentHunter(['ate berries'])` → null; newest matching memory wins when several are present. *(unit)*
2. `rattledAside(h, traits)` names the hunter and is temperament-shaded — prickly / warm / plain lines
   differ, each contains `h`, each leads with a space. *(unit)*
3. `cannedReply` with `rattled` set appends the aside to the base line, whatever the register (composes with
   hungry too, both asides present when both flags set); output stays within the length cap. *(unit)*
4. `cannedReply` with `rattled` **unset** is byte-identical to before this cycle (back-compat, no aside).
   *(unit)*
5. WorldScene passes `rattled` from the dino's fresh 367 memory into `greet()`; a dino with no such memory
   passes `undefined`. *(review)*
6. Deterministic path needs no model — the aside comes from `cannedReply`; the webllm hint is colour only.
   No save change (the memory is the trace, ages out of `recall`'s 6-slot window). *(review)*
7. `npm run build` + `tsc --noEmit` clean; WebLLM stays `ai/`-only. *(review/build)*

---

**Disjointness:** 437 touches `foodweb.ts` (new `huntSucceeds`) + the hunt branch + `needs`; 440 touches
`foodweb.ts` (new `recentHunter`) + `brain.ts` + `webllmBrain.ts` + the greet wire. The only shared file is
`foodweb.ts`, and each adds a *distinct new export* — no line overlap.

phase → codeplan-pending
