# Cycle 45 — Lore Handoff

**Theme:** The voice learns the day's shape. Cycle 44 gave each dino a voice; now the
bowl should have a *time* it uses them. The dawn chorus is the first soundscape with a
clock in it — the cast waking each in its own pitch, the eager ones first and the
night-owls last and grudging — so the same five numbers that set each voice now also set
*when* you hear it. Lean audible: a morning you can hear coming is the bowl breathing.

**Idea Box:** empty (the sound nudge was processed cycle 44). Nothing to seed or decline.

**Added to BACKLOG:**
- BACKLOG-196 [emergent] Night hush — the inverse bookend: at the night boundary the cast falls quiet, the last night-owl's chirp trailing off into the dark, so the day has a closing sound as well as an opening one
- BACKLOG-197 [social] Chorus you can join — tapping the glass (057) during the dawn chorus makes the nearest waking dino chirp back at the keeper, folding you into the morning call-and-answer
- BACKLOG-198 [emergent] Off-key loner — a dino with no bond above the loner floor (135) chirps a beat *after* the rest of the chorus, a lone voice hanging in the quiet; social isolation made audible
- BACKLOG-199 [pokemon] Chorus lead in the book — the collection book names which dino "leads the dawn chorus" (the earliest riser by energy) as a small standing
- BACKLOG-200 [emergent] Harmonized pair — two high-bond dinos that wake near each other chirp in near-unison (pips interleaved), so a strong friendship literally *sounds* different from two strangers

**Suggested next-up:** BACKLOG-192 (dawn chorus) — it's the queued spine the five above lean
on, one-cycle sized (a pure ordering module + thin glue at the existing `onHour` seam that
already drives reflection and the season turn), and it leans directly on the voices that
shipped last night, so the operator hears it land the same evening. The queued cold arc
(183–187) remains the alternative if the Designer judges another audio beat too soon; 184
(keeper's warmth) is the pick there.

**Note for the Coder via Designer:** dawn must fire on a *live* hour crossing only — the
season turn (159) and cold morning (179) both learned this the hard way; a restore/away jump
uses `clock.set()` which bypasses `onHour`, so the existing `onHour` seam is naturally
live-only. Keep playback strictly behind `soundMuted()` and the unlocked AudioContext, and
let the order be computable from a pure function so headless tests never wait on audio.
