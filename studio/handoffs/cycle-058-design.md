# Cycle 58 — Design

## Item
BACKLOG-261 [emergent] Effusive thanks — the warm twin of 253: a high-agreeableness dino over-thanks,
gushing about whoever cleared its name, so the same favour lands loud from Twitch and gruff from Rex.

## Why this cycle
Cycle 57 split the cleared-name thanks (247) by temperament for the *prickly* pole only — a prickly
dino (`agreeableness < PRICKLY_MAX`) grumbles, everyone else says the same plain cycle-55 line. That
left the warm pole flat: Twitch (agreeableness 0.929) and Sunny (0.622), the bowl's two warmest, thank
exactly the way an even-tempered dino does. BACKLOG-261 voices that pole — warmth colours gratitude as
much as prickliness does. It is the symmetric, one-branch completion of work that just shipped: the
same axis, the same two call sites (`thanksLine` + the `buildMessages` weave), no new state. A pure
distinct-minds win (CHARTER first-class goal) at the lowest possible cost.

## What ships
- A new warm/effusive thanks register. When a freshly-cleared dino is greeted (E / any tone), a
  **warm** dino (`agreeableness > EFFUSIVE_MIN`, the 0.6 high-pole cutoff `describePersonality` uses)
  gushes its thanks instead of the plain line — e.g. *"Twitch told the whole park I was alright —
  best friend a dino could ask for, I'll never forget it!"* — still naming the clearer.
- The three-way split is now real on the founders: greet a freshly-cleared **Rex/Mossback/Glade**
  (prickly) → the gruff line (cycle 57, unchanged); greet **Sunny/Twitch** (warm) → the new gush;
  any dino in the middle band (0.4 ≤ agreeableness ≤ 0.6) → the plain cycle-55 line (back-compat).
- The LLM path matches: a warm grateful dino's `buildMessages` system prompt picks up an *effusive*
  instruction (the warm counterpart of cycle 57's "say it grudgingly"), so a loaded brain gushes too;
  a prickly one still gets the grudging clause; an even one neither.

## Acceptance criteria
- [ ] `thanksLine(clearer, traits)` returns a gushing line (distinct from both the gruff and the plain line) when `traits.agreeableness > EFFUSIVE_MIN`, and still contains the clearer's name.
- [ ] `thanksLine(clearer, traits)` returns the plain cycle-55 line (`"… I owe them one."`) when `0.4 ≤ agreeableness ≤ 0.6` (the even band), and the gruff line when `agreeableness < 0.4` (cycle-57 regression).
- [ ] `EFFUSIVE_MIN` is exported and equals `0.6` (pinned to the `describePersonality` high-pole cutoff); the cutoff is **exclusive** — exactly `EFFUSIVE_MIN` is *not* effusive (lands in the even band, plain line).
- [ ] `thanksLine(clearer)` with no traits still returns the plain line (back-compat default — unchanged).
- [ ] `cannedReply` with a warm dino + `gratitude` set returns the gushing line via `source: 'canned'`.
- [ ] `buildMessages` adds an effusive instruction (and NOT the grudging one) for a warm grateful dino; the grudging clause still fires for a prickly grateful dino; neither fires for an even one. The `cleared your name` fact survives in all three.
- [ ] E2E: a freshly-cleared **Twitch** (warm founder), greeted headless (canned fallback), gushes — its reply carries the effusive marker, names the clearer, and contains neither the gruff phrase nor the plain `"I owe them one"`.
- [ ] No console errors on the e2e flow.
- [ ] `npm run build` clean; full `vitest` + `playwright` green in one fresh run.

## Out of scope
- The middle-band dino getting its *own* measured line (BACKLOG-266) — the even band keeps the plain
  cycle-55 line this cycle; only the warm pole gains a voice.
- Anything the gush *does* beyond the spoken line: no bond change (262 pins the debt is manner-blind),
  no clearer-side pride beat (267), no keeper-bond nudge (270), no book/scan readout (264/265).
- Dino-to-dino spoken thanks (252) — this is the keeper-greet thanks only, exactly like 247/253.

## Constraints
- **Two files of production code, mirroring cycle 57 exactly**: `game/src/ai/brain.ts` (the
  `thanksLine` branch + `EFFUSIVE_MIN` const) and `game/src/ai/webllmBrain.ts` (the prompt clause).
  No WorldScene / world / save change — both greet sites already feed `ctx.gratitude` + `ctx.traits`.
- The plain cycle-55 line and the cycle-57 gruff line must be **byte-identical** to today — only a new
  branch is added between them, so the cycle-055 / cycle-056 regression specs stay green untouched.
- **cycle-057 specs must be updated in this fire** (legitimate, not a regression): they currently assert
  a *warm* (agreeableness 0.9) dino gets the plain line — false once warm gushes. Soften those
  assertions to "a warm dino does not grumble" (still true) and let the new cycle-058 specs own the
  effusive assertion. Do not weaken the gruff-pole assertions.
- Keep the NPCBrain boundary: all dialogue text stays under `game/src/ai/`; no `ai → world` import.
- `EFFUSIVE_MIN > PRICKLY_MAX` (0.6 > 0.4) so the two branches can't overlap; pin it by comment to the
  `describePersonality` high cutoff the way `PRICKLY_MAX` is pinned to the low one.
