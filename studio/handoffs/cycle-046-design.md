# Cycle 46 — Design Handoff

**Item** — BACKLOG-194 [emergent] Distress call — a shivering (179) or startled (057) dino calls out in its own voice, and its closest friend (013) turns toward the sound from across the bowl; the bond graph gains an audible edge.

## Why this cycle

Two cycles of audio gave the bowl voices (191) and a clock to use them (192) — but so far sound is decoration: nothing in the bowl *listens*. This is the beat where a voice does work. A cry crosses the bowl and the bond graph answers — the first time sound moves a dino. It bridges the audio arc and the cold arc in one stroke (the shiver the operator can already see becomes a cry a friend can hear), and *who cries* and *who comes* are both personality/graph reads, per the Living-minds bias. Lore's suggested next-up; everything seeded this cycle (202–206) extends it.

## What ships

Two triggers, one beat:

1. **Startle cry (057):** Rap the glass. Among the dinos that *bolt* (the timid ones), exactly **one** cries out — the most frightened (lowest bravery, alpha tie-break). One tap, one cry: a yelp, not a cacophony. Which dino screams is itself a read on the cast.
2. **Cold cry (179):** The winter morning the huddle window closes, among the dinos that slept cold, exactly **one** cries out — the loneliest (lowest strongest-bond, alpha tie-break), its shiver finding a voice.

The cry is the dino's **own voice in a distress register**: a pure function derives it from the dino's 191 chirp — pitch raised, call clipped shorter, bend sharpened, a two-pip yelp — so Mossback's distress is still unmistakably low and Twitch's still a shriek; the register changes, the identity doesn't.

Then the bowl answers: the caller's **closest friend** — chosen by the *exact* cycle-33/34 consolation rules (`comforter`: gratitude debt first, else highest bond over the floor, alpha tie-break) — turns toward the sound: a 👂 bubble naming the caller, a "heard <caller> cry out and went to it" memory in the persisted store, and its next few wander steps overridden to walk **toward the caller** (below the sky-event and inspection overrides in priority). A dino with no friend above the floor cries **unanswered** — which is its own kind of telling, and exactly what the off-key-loner follow-up (198) will build on.

The cry is diegetic — the dinos hear it whether or not the keeper's device is muted. Mute silences *playback* only; the social beat (responder, bubble, memory, movement) fires regardless, mirroring how a muted bowl still computes the dawn-chorus order.

Dev hooks: `__lastDistress` (caller, trigger `'startle' | 'cold'`, params), `__distressResponder` (responder, caller, remaining steps — or null).

## Acceptance criteria

- [ ] Pure `distressParams(t)`: for any traits, pitch strictly above `chirpParams(t).pitchHz` (clamped ≤ 1100), length strictly below (clamped ≥ 60 ms), notes = 2; two dinos keep their relative pitch order in distress (Twitch's yelp stays above Mossback's).
- [ ] Pure caller pick (`mostDistressed`): lowest level wins, alpha tie-break on equal level, empty list → null.
- [ ] Tap the glass so at least one dino bolts → exactly one distress call fires, from the lowest-bravery bolter; `__lastDistress` records `{ name, trigger: 'startle' }`.
- [ ] A tap where nobody bolts (all investigate/ignore) → no distress call (`__lastDistress` unchanged).
- [ ] Winter cold morning (cycle-043 staging): alongside the existing 🥶 shivers, exactly one cold cry fires from the cold sleeper with the lowest strongest-bond; `__lastDistress` records `{ name, trigger: 'cold' }`. A warm-season morning fires none.
- [ ] The responder is `comforter(caller, bonds, names, gratitude)` — closest friend over the floor, gratitude override honored; it shows a 👂 bubble naming the caller and files a "heard <caller> cry out" memory (visible in `__memories`/greet context).
- [ ] Over the following world steps the responder's distance to the caller strictly decreases until adjacency or the step budget (≥ 4 steps) runs out; `__distressResponder` reports the countdown and clears.
- [ ] A caller whose every bond sits under the floor gets **no** responder (`__distressResponder` null) while the cry itself still fires.
- [ ] Muted device: the responder beat (bubble, memory, movement) still fires; no chirp intent/playback is recorded.
- [ ] No save-format change; huddle/egg/sky/chorus behavior untouched (existing cycle-018/019/044/045 + cycle-023 tap-glass and cycle-043 cold specs stay green); `@mlc-ai/web-llm` still only under `ai/`; `voice.ts` still the only WebAudio file.

## Out of scope

- 202 (answer-back chirp), 203 (cry-wolf habituation), 204 (keeper 📢 ticker), 205 (egg peep), 206 (distance attenuation).
- Distress on other negative beats (sulk, scramble loss) — startle + cold only.
- Any change to chirp synthesis in `voice.ts` (the distress register is parameters, not new synthesis), to the chorus, or to comfort/gratitude semantics.

## Constraints

- The responder *walk* must ride the existing wander/override machinery (the inspect/sky pattern) — no new movement system, and sky-event gather + first-contact inspection keep priority over it.
- `comforter()` is reused as-is — no fork, no second closest-friend implementation (CHARTER reuse bar).
- Trigger seams are the existing ones: `tapGlass` and `resolveColdMorning`. No new clock listeners.
- Pure logic in new Node-testable module(s); WorldScene glue thin. Hooks record intent so headless asserts never depend on audio playback.
- Don't break: tap-glass reactions (cycle-023), cold morning (cycle-043), comfort floor/gratitude (cycle-033/034), chorus (cycle-045).
