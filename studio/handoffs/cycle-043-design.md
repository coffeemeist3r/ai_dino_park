# Cycle 43 — Design

## Item

BACKLOG-179 [emergent] Cold-night shiver — a dino that spends a winter night outside the den
(never huddled) visibly shivers (🥶) and files a "cold night, slept alone" memory that can
colour its next-morning greeting.

## Why this cycle

Cycle 42 (BACKLOG-171) made the winter den *pack* — the bond bar drops to 4 and the window
opens at dusk, so the cold pulls bodies in. But a packed den only tells half the story; the
other half is the dino left standing at its edge. This cycle gives the cold a *consequence you
can read*: the morning after a winter night, every dino that never made it into the pile
shivers where it stands and carries the memory of it into its next greeting. It turns last
cycle's "who sleeps alone in winter" from a still picture into a beat with an aftermath — and
it's the spine the four cycle-43 lore items (183 earlier-to-den, 184 keeper warms, 185 word of
the cold, 186 hardy book) all lean on. Pure, deterministic, no model required.

## What ships

- During a winter night's huddle window, the bowl quietly tracks **which dinos actually
  huddled** (reached the den while the window was open).
- When the winter huddle window **closes in the morning** (the night ends), any dino that
  *never huddled that night* throws a brief **🥶 shiver bubble** where it stands and files a
  persisted **"shivered through a cold night, slept alone 🥶"** memory.
- That memory is woven into the dino's **next-morning greeting context** the same way every
  other memory is (it appears in the dino's `recentMemory`, so the greet prompt carries it).
- **Only winter** does this. A spring / summer / fall night that ends leaves no shiver and no
  cold memory — the warm seasons cost nothing.
- A dino that *did* huddle even once during the winter night is warm: no shiver, no memory.

## Acceptance criteria

- [ ] A new pure module `game/src/world/cold.ts` exports `sleptCold(huddledTonight, season)`,
      `coldShiver()`, `coldMemory()`, and `COLD_SEASON`, with **no Phaser import**.
- [ ] `sleptCold(false, 'winter') === true`; `sleptCold(true, 'winter') === false`.
- [ ] `sleptCold(false, s) === false` for `s` of `spring`, `summer`, and `fall` (warm nights
      never shiver, huddled or not).
- [ ] `coldShiver()` and `coldMemory()` are non-empty strings, both contain `🥶`, and they are
      distinct (the floated bubble and the stored memory are not the same string).
- [ ] After a full winter night in which dino A huddled and dino B did not, when the winter
      window closes (morning), the dev hook `__coldSleepers()` returns a list that **contains B
      and excludes A**.
- [ ] After that morning resolution, `__memory()` for B contains a `🥶` cold memory, and
      `__greetPrompt('B')` (the woven system prompt) contains that cold memory text — i.e. the
      cold night colours B's morning greeting context.
- [ ] After that morning resolution, A's memory contains **no** `🥶` cold memory.
- [ ] When a **summer** night's window closes with no one huddled, `__coldSleepers()` is empty
      and no dino gains a `🥶` memory (warm seasons are inert).
- [ ] `npm --prefix game run build` clean; `npx vitest run` green (new `cold.test.ts` included);
      `npx playwright test` green (new `cycle-043-cold-shiver.spec.ts` included).

## Out of scope

- The dino drifting to the den *earlier* on a later cold night (BACKLOG-183).
- The keeper clearing the shiver by greeting/feeding (BACKLOG-184).
- Gossiping the cold night onward (BACKLOG-185).
- The collection-book "cold nights toughed out" tally (BACKLOG-186) and trait drift (187).
- Any new shiver *animation* (art) — the beat is a floating bubble + a memory, like every other
  emergent beat (homecoming 👋, sky ✨, inspection 👀). No rig work.
- Weather (BACKLOG-028): every winter night is cold; there is no per-night clear/storm yet.

## Constraints

- **Additive save only.** No `SAVE_VERSION` bump — the cold memory rides the existing memory
  store (which already persists), exactly like the sky-event and inspection memories.
- Do **not** touch the egg gate (`isClearNight`/`maybeLayEggs`), the sky-event override, or the
  cycle-018/042 huddle behaviour. The shiver is a *read* of huddle participation resolved at
  morning; it must not change who huddles or when.
- Reuse the existing `inHuddleWindow`/`huddleThreshold`/`isHuddling`, `currentSeason()`,
  `remember`/`recall`, and `showBubble` — no new bubble or memory plumbing.
- The morning resolution must fire **once per night** (on the window's true→false transition),
  not every step, and must be driveable deterministically from the existing `__setClock` +
  `__stepWorld` hooks so the e2e needs no real timers.
- Keep the boundary intact — nothing new imports `@mlc-ai/web-llm`. `cold.ts` is pure logic.
