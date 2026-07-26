/**
 * Last one standing (BACKLOG-464) — the human read of the draining zone (460). 460 gives a scarcity exodus
 * momentum and a floor: a zone thins but never vanishes, at least one resident always stays. That last
 * resident is a *character*, not a counter. When a zone has hollowed to its final dino, that dino feels the
 * quiet — a wistful bubble + a memory of the emptiness that rides recall into its next greeting. The
 * emotional cost of the mouths-move-toward-plenty economy the milestone spent seven cycles building.
 *
 * Pure strings (no Phaser, NPCBrain boundary untouched — the memory colours the LLM line where a device
 * allows, exactly as 457/459's traces do). WorldScene scans for the lone-resident case and sounds the beat.
 */

/** The wistful bubble over the last dino left in a hollowed zone. */
export function lastoneLine(): string {
  return '🍂 Gone quiet around here…';
}

/** The ticker line naming who is the last one left, and where. */
export function lastoneEvent(name: string, zoneName: string): string {
  return `🍂 ${name} is the last one left in ${zoneName}`;
}

/** The trace the last resident keeps — rides recall into its next greeting (no leading article). */
export function lastoneMemory(zoneName: string): string {
  return `you're the last one left in ${zoneName}`;
}
