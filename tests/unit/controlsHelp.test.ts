import { describe, it, expect } from 'vitest';
import { HELP_CHIP, HELP_ROWS, helpLines, holdingLine } from '../../game/src/ui/controlsHelp';

describe('controls help (HUD overhaul)', () => {
  it('the holding line is short — no key explanations in the bottom bar', () => {
    expect(holdingLine('shiny shell')).toBe('Holding: shiny shell');
    expect(holdingLine('shiny shell')).not.toMatch(/switch|give|\[/);
  });

  it('the chip is a small fixed label', () => {
    expect(HELP_CHIP.length).toBeLessThanOrEqual(14);
  });

  it('panel lines start with a title and pad keys into one column', () => {
    const lines = helpLines();
    expect(lines[0]).toBe('— Controls —');
    expect(lines.length).toBe(HELP_ROWS.length + 1);
    // every action starts at the same column: pad + 2
    const pad = Math.max(...HELP_ROWS.map((r) => r.keys.length));
    for (const [i, row] of HELP_ROWS.entries()) {
      expect(lines[i + 1].slice(0, pad).trimEnd()).toBe(row.keys);
      expect(lines[i + 1].slice(pad + 2)).toBe(row.action);
    }
  });

  it('covers every key the scene binds', () => {
    const keys = HELP_ROWS.map((r) => r.keys).join(' ');
    for (const k of ['WASD', 'E', 'Z', 'F', '[ ]', 'H', 'C', 'V', 'K', 'B', 'M', 'T', 'O']) {
      expect(keys).toContain(k);
    }
  });

  it('no panel line is wider than the 640px canvas allows (~100 monospace chars)', () => {
    for (const line of helpLines()) expect(line.length).toBeLessThan(40);
  });
});
