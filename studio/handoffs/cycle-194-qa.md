# Cycle 194 — QA

Board: `npm run build` clean; `npx vitest run` **3450 passed / 3 skipped** (339 files); `npx playwright test`
**940/940** on a fresh full run (9.1 min), no flakes. `@mlc-ai/web-llm` imports stay under `game/src/ai/`.

The coder's first full run was 939/940: `cycle-156-sulk-shakeoff` (make-up greet) failed deterministically, and isolated.
Cause: a homecoming-slighted Glade was then jilted, and the `jilted` funk replaced the sulk the greet repairs. Fixed in
the coder commit (a dino already in a funk keeps it). Not a flake: a real interaction between two feelings.

## Lore track — BACKLOG-621

- [x] 1. Unit: Rex+Sunny → Ember glad (friend Sunny, rival Rex); Mossback+Glade → Thornback glad, Murk jealous of
  Mossback; paired dinos and a sub-10 friend skipped. (`cycle-194-jilted.test.ts`)
- [x] 2. e2e: `__court('Rex','Sunny')` → `🥲 Ember is glad for Sunny and Rex`, Ember's memory, no funk on Ember.
- [x] 3. e2e: `__court('Mossback','Glade')` → Murk's 😒 ticker line, memory, `jilted` funk, book rival line names
  Mossback; Thornback's 🥲 line.
- [x] 4. No `rand()` in `jilted` / `jiltBeat` (read).

## Structure track — BACKLOG-622

- [x] 5. Unit: `isPairs` nest-less / good nest / bad nest; `shouldLay` paired at bond 0 yes, unpaired at 0 no;
  `berthOf` side by side, inward at the east edge.
- [x] 6. e2e: both entries carry the same bowl nest; `__nests()` one sprite at the nest tile, visible.
- [x] 7. e2e: at 23:00 both mates reach their berths within 20 steps.
- [x] 8. e2e: the egg lands at the nest tile, bond < 60, ticker `🥚 Glade & Mossback laid an egg in their nest`.
- [x] 9. e2e: one nest after reload.
- [x] 10. Reachability probe (not committed): as-shipped founding, only the clock and `__stepWorld` driven, 3 game
  minutes per step. Step 15 (08:42): `💕 Rex courts Sunny with a pretty stone. Sunny says yes.` and
  `🥲 Ember is glad for Sunny and Rex`. Nest at (11,10). By step 20 Rex (an owl, asleep until 13:00) lies on it.
  Step 39: `💕 Mossback courts Twitch with a fern` (see below) and `🥲 Thornback is glad for Mossback and Twitch`.
  Step 279 (21:54): `🥚 Mossback & Twitch laid an egg in their nest`.

**Observed, not a criterion:** Mossback and Twitch carry the founding feud (grudge 40), and on the probe they were each
other's closest friend by bond at 09:54 and paired. Courtship (618) reads bonds only, never grudges. No jealous beat
fired inside 300 steps on the probe; Murk's only fires if Glade pairs.

10/10 criteria pass.
