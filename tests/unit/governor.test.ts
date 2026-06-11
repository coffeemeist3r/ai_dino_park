import { describe, it, expect } from 'vitest';
import {
  MINDS_CONSENT_KEY,
  LOW_BATTERY,
  CONVO_COOLDOWN_DESKTOP,
  CONVO_COOLDOWN_COARSE,
  brainKind,
  allowAmbient,
  convoCooldownSteps,
  clampTier,
  consentLines,
  mindsOffLines,
  mindsLabel,
} from '../../game/src/ai/governor';

describe('brainKind — the minds opt-in policy', () => {
  it('desktops always get the model, consent never asked', () => {
    expect(brainKind({ coarse: false, consent: null })).toBe('webllm');
    expect(brainKind({ coarse: false, consent: false })).toBe('webllm');
    expect(brainKind({ coarse: false, consent: true })).toBe('webllm');
  });

  it('phones boot on the stub until the keeper explicitly opts in', () => {
    expect(brainKind({ coarse: true, consent: null })).toBe('stub');
    expect(brainKind({ coarse: true, consent: false })).toBe('stub');
    expect(brainKind({ coarse: true, consent: true })).toBe('webllm');
  });
});

describe('allowAmbient — when dino↔dino chatter may think', () => {
  it('runs in the open: visible tab, healthy or unknown battery', () => {
    expect(allowAmbient({})).toBe(true);
    expect(allowAmbient({ hidden: false, battery: 0.8 })).toBe(true);
    expect(allowAmbient({ battery: LOW_BATTERY })).toBe(true); // at the floor, not below
  });

  it('yields when nobody is watching the bowl', () => {
    expect(allowAmbient({ hidden: true })).toBe(false);
    expect(allowAmbient({ hidden: true, battery: 1 })).toBe(false);
  });

  it('yields on a dying battery', () => {
    expect(allowAmbient({ battery: 0.1 })).toBe(false);
  });
});

describe('cadence + tier', () => {
  it('phones chatter at a third the desktop rate', () => {
    expect(convoCooldownSteps(false)).toBe(CONVO_COOLDOWN_DESKTOP);
    expect(convoCooldownSteps(true)).toBe(CONVO_COOLDOWN_COARSE);
    expect(CONVO_COOLDOWN_COARSE).toBe(CONVO_COOLDOWN_DESKTOP * 3);
  });

  it('clampTier pins coarse devices to tiny and leaves desktops alone', () => {
    expect(clampTier('medium', true)).toBe('tiny');
    expect(clampTier('small', true)).toBe('tiny');
    expect(clampTier('tiny', true)).toBe('tiny');
    expect(clampTier('medium', false)).toBe('medium');
  });
});

describe('consent dialog copy', () => {
  it('quotes the model, its size, and the choices', () => {
    const s = consentLines('Qwen3.5 0.8B', 'tiny');
    expect(s).toContain('Qwen3.5 0.8B');
    expect(s).toContain('0.6 GB');
    expect(s).toContain('[1]');
    expect(s).toContain('[✕]');
    expect(s).not.toContain('Data Saver');
  });

  it('warns when Data Saver is on', () => {
    expect(consentLines('Qwen3.5 0.8B', 'tiny', true)).toContain('Data Saver');
  });

  it('a cached model skips the download warning — enable is instant and free', () => {
    const s = consentLines('Qwen3.5 0.8B', 'tiny', true, true);
    expect(s).toContain('already downloaded');
    expect(s).not.toContain('GB');
    expect(s).not.toContain('Data Saver'); // no download → no data concern
    expect(s).toContain('[1]');
  });

  it('the off dialog offers keep vs delete with the size on the line', () => {
    const s = mindsOffLines('tiny');
    expect(s).toContain('0.6 GB');
    expect(s).toContain('[1]');
    expect(s).toContain('[2]');
    expect(s).toContain('delete');
    expect(s).toContain('[✕]');
  });

  it('label and storage key are stable contracts', () => {
    expect(mindsLabel(true)).toBe('🧠 minds: on');
    expect(mindsLabel(false)).toBe('🧠 minds: off');
    expect(MINDS_CONSENT_KEY).toBe('dino.minds');
  });
});
