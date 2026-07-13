# Cycle 100 — Verdict

## BACKLOG-437 — The hunt feeds — **APPROVED** (structure track)

Milestone 4 structure arc 1. The food web woke in cycle 99 as a chase that could never land — every closed
stalk ended "came up empty," so the bowl's lone carnivore could stalk all day and only ever eat from the
keeper's hatch. 437 gives the hunt a resolution without giving up the deathless rule: `huntSucceeds(roll,
chance=0.3)` forks the catch, the quarry **always** slips away (the 💨, the "slipped X's hunt" memory, and the
30s cooldown are hoisted above the fork, so the prey is unharmed and the cooldown is shared no matter the
outcome), and only the hunter's luck differs — ~30% it lands a meal (`satisfy` resolves its hunger, 🍖, a
"made its catch" beat, a "brought down a meal" memory) and ~70% it comes up empty exactly as before. No dino
is removed, no ground food is spawned (the take is a direct `satisfy` — a clean simplification, ponytail-noted,
upgradeable to a real drop only if a take should be steal-able), and mortality stays the operator's CHARTER
call. Pinned by `huntSucceeds` unit tests + the green `cycle-080-needs` e2e (the same `satisfy`→need-cleared
path). Deathless, additive, no save change. Ships.

## BACKLOG-440 — Rattled after the chase — **APPROVED** (lore track)

Milestone 4 lore arc 1. The hunt had been a silent pair of glyphs (🎯/💨); now it reaches the dialog box. A
herbivore that just slipped a hunt carries the fright into its next hello and **names its chaser** — "…give me
a sec, Twitch nearly had me." It's built as the exact twin of the hunger tell (368): `recentHunter` reads the
chaser out of the memory 367 already files, `rattledAside` composes onto whatever register the greeting was in
(and composes *with* the hunger aside when a dino is both), temperament-shaded so a prickly dino waves it off
and a warm one makes a breathless saga of it. The deterministic aside is the feature; the WebLLM colour is a
parity hint behind the NPCBrain boundary, so a phone that declined the model still hears the fright. `rattled`
unset is byte-identical to the old greeting (regression-pinned), and there's no save field — the memory is the
trace and ages out of `recall`'s 6-slot window on its own. Pinned by 5 unit tests + the green
`cycle-097-hunger-voice` e2e (440's identical compose mechanism). Ships.

## Housekeeping

- **BACKLOG-439 closed as already-satisfied + cycle-99 error corrected.** The repo was never testless: 281
  committed test files, `playwright.config.ts`, `test`/`test:e2e` wired. The real gap — the root vitest include
  silently skipping the colocated `game/src/**/*.test.ts` — was fixed this cycle (124→127 files, 1108→1130
  tests). The harness now enforces the whole committed suite.
- CHANGELOG + BACKLOG-archive updated; 437/440/439 removed from the working backlog. Milestone 4 marked at
  1/3 lore + 1/3 structure.

## Quality bar

build clean · `tsc --noEmit` clean · `npx vitest run` **1130/1130 (127 files)** · e2e 15/15 warm on the
greet/needs/food-web siblings (first cold smoke was the documented cold-boot flake) · WebLLM `ai/`-only ·
saves additive/unchanged. Both tracks APPROVED. phase → artist-pending.
