# Cycle 181 — Design

## Lore track — BACKLOG-148: tone-aware reply (Milestone 27 lore arc 1)

**Spec.** When the keeper greets a dino it has greeted before, the reply opens with what the dino made of the last
tone. The read is the dino's own: `toneReaction(lastTone, traits).verdict`.
- **Fond** (loved/liked) + same tone again → a pleased opener in that tone's register ("Ribbing me again? Good.").
- **Fond** + a different tone → it notices the change ("Not teasing today, then?").
- **Sour** (clashed) + same tone again → a dry opener ("Teasing again. Wonderful.").
- **Sour** + a different tone → relief ("That's better than last time.").
- **Neutral** → no opener. Some dinos do not care how you said hello, and that flatness is also a read.

The echo sits at the **bottom** of the existing one-or-none opener chain (caught → glad → missed → **echo**). A dino
mid-ritual, glad of company, or missing you leads with that instead. The echo reads the tone from *before* this greet
(captured before `recordTone` overwrites it). Deterministic, so every device has it. The model reply after it is
unchanged; the opener is a frame, like 408's, and does not cross the `NPCBrain` boundary.

**Acceptance criteria.**
1. `toneEcho(prev, now, traits)` is pure, returns `null` with no previous tone or a neutral verdict, and returns the
   four registers above for the four (fond|sour × same|changed) cases.
2. The same previous tone yields a fond opener for one founding dino and a sour one for another (distinctness).
3. In-game: a first greet has no echo; a second greet's dialog line contains the echo before the reply.
4. A caught/glad/missed opener still wins over the echo (one opener or none).
5. Build clean, unit + e2e green; no save change (`lastTone` is already persisted).

**Reachability (v7).** Fresh save, first minute: greet any dino, greet it again. The second reply opens with what it
made of the first, and two dinos given the same tone answer the second greet differently.

## Structure track — BACKLOG-592: an answer moves the mind (Milestone 27 structure arc 1)

**Spec.** In `answerNewcomer` each answering resident now *acts* on its answer:
- **Seek.** `answerSeek(kind)` maps bristle → `rival`, missed → `yesterday`, company → `friend`, curious → `stranger`,
  cold → null. A non-null answer sets the resident's `seeking` to the newcomer (`arrived: false`) and, if that is a new
  pick, logs the ordinary 👀 seek line. A cold answer clears a seek that was on the newcomer. The existing drift and
  `arriveIfSought` then walk it over and say the arrival line, with no new walking code. The next phase's
  `chooseSeek` replaces it, as with any pick.
- **Graphs.** `answerEffect(kind)` returns `{ bond, grudge, meet }`: missed +4 bond, company +4 bond, curious +2 bond
  and +1 meeting, bristle +3 grudge, cold nothing. Applied with the existing `strengthen` and the meetings map.
- **Mark.** Each answerer pops the welcome mark (`WELCOME_ART_KEY = 'welcome'`, glyph 🌿) — BACKLOG-593's host.

**Acceptance criteria.**
1. `answerSeek` and `answerEffect` are pure and cover all five kinds.
2. In-game: after Sunny crosses back to the bowl in the as-shipped park, Rex is seeking Sunny (`yesterday`), the
   ticker carries `👀 Rex goes looking for Sunny — for more of yesterday.`, and the Rex|Sunny bond rose by 4.
3. After Mossback crosses back, Twitch's grudge with Mossback rose by 3 and Twitch is seeking Mossback (`rival`).
4. A cold answerer that was seeking the newcomer is no longer seeking it.
5. Build clean, unit + e2e green; no save change (bonds, grudges, meetings already persist).

**Reachability (v7).** Fresh save, first few minutes: errands send Sunny and Glade off the bowl, 588's follow brings
them back, and the bowl answers. Now Rex says he is glad, the ticker says he goes looking for her, and he walks over
and says *"Sunny! Same again today?"*. On the Ridge at 20 s, Ember's "Who's this, then?" is followed by Ember going to
look at Bramble.
