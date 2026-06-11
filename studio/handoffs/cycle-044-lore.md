# Cycle 44 — Lore Handoff

**Theme:** The bowl finds its voice. Forty-four cycles of total silence end this cycle if the
Designer agrees: the operator's sound nudge landed in the Idea Box the same day the bowl
learned to live on a phone, and the Living-minds bias reshapes it from "add audio" into
"give each dino a voice of its own" — distinctness in a register the park has never used.
A dino you can recognize with your eyes closed is a separate mind in a way no panel can show.

**Idea Box:** 1 entry processed — **sound** seeded as BACKLOG-191 (audio spine), reshaped
foundation-first: pure WebAudio synthesis authored as code (no assets, no keys, matching the
art pipeline's philosophy), autoplay-safe, persisted mute, and the first beats are per-dino
trait-pitched chirps + the tap-glass thunk. Ambient soundscape deferred until voices exist.
Moved to Resolved.

**Added to BACKLOG:**
- BACKLOG-191 [core] Audio spine — WebAudio chirp synth, trait-pitched per dino, greet chirp + glass thunk, autoplay-safe, persisted mute
- BACKLOG-192 [emergent] Dawn chorus — the cast greets the day each in its own voice, staggered by energy
- BACKLOG-193 [social] Call and answer — an answering chirp before the text reply, eagerness scaled by hearts
- BACKLOG-194 [emergent] Distress call — a shivering/startled dino calls out; its closest friend turns toward the sound
- BACKLOG-195 [pokemon] Cry in the book — the collection book plays a dino's chirp; hatchling cries blend their parents'

**Suggested next-up:** BACKLOG-191 — the spine everything above leans on, one-cycle sized
(one pure module + thin glue at two existing seams), and the operator will *hear* the cycle
land on his phone the same evening. The queued cold arc (183–187) is the strong alternative
if the Designer judges audio riskier than a fourth winter beat; 184 (keeper's warmth) is the
pick there.

**Note for the Coder via Designer:** the operator hardened the mobile/touch layer today
(BACKLOG-188/189/190 + Qwen3.5). Audio must join that world: resume the AudioContext on the
same first-interaction path the touch layer owns, and the mute toggle belongs in the More
sheet next to the minds row.
