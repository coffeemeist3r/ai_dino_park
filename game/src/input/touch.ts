/**
 * Touch controls (BACKLOG-189) — pure geometry/layout for the phone control layer.
 * No Phaser. The scene draws what these describe and feeds pointer positions in.
 *
 * Scheme (operator-chosen, 2026-06-11): fixed virtual joystick bottom-left,
 * Talk/Feed/More action buttons bottom-right, a More sheet for the rest of the
 * keyboard surface, and numbered chips while a 1/2/3 menu (tone / keeper) is up.
 * Everywhere outside this layer a tap stays a tap on the glass.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface CircleButton {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
}

export interface RectButton {
  id: string;
  label: string;
  x: number; // center
  y: number; // center
  w: number;
  h: number;
}

/** Fixed stick: bottom-left, grab ring larger than the drawn base so thumbs land easily. */
export const STICK = { x: 84, y: 388, r: 52, grab: 84, thumb: 22, dead: 0.22 } as const;

/** Direction vector from stick base to pointer: deadzoned, clamped to unit length. */
export function stickVector(
  px: number,
  py: number,
  base: { x: number; y: number; r: number; dead: number } = STICK,
): Vec2 {
  const dx = (px - base.x) / base.r;
  const dy = (py - base.y) / base.r;
  const len = Math.hypot(dx, dy);
  if (len < base.dead) return { x: 0, y: 0 };
  const scale = len > 1 ? 1 / len : 1;
  return { x: dx * scale, y: dy * scale };
}

export function inCircle(cx: number, cy: number, r: number, px: number, py: number): boolean {
  return Math.hypot(px - cx, py - cy) <= r;
}

export function inRect(b: RectButton, px: number, py: number): boolean {
  return Math.abs(px - b.x) <= b.w / 2 && Math.abs(py - b.y) <= b.h / 2;
}

/** The always-on action cluster, bottom-right, loosely arced toward the thumb. */
export function actionButtons(width: number, height: number): CircleButton[] {
  return [
    { id: 'talk', label: 'E', x: width - 56, y: height - 84, r: 30 },
    { id: 'feed', label: '🍖', x: width - 124, y: height - 64, r: 24 },
    { id: 'more', label: '⋯', x: width - 184, y: height - 56, r: 20 },
  ];
}

/** The More sheet: one row per remaining action, right-aligned above the cluster. */
export function sheetRows(width: number): RectButton[] {
  const w = 168;
  const h = 30;
  const x = width - 12 - w / 2;
  const ids: Array<[string, string]> = [
    ['minds', '🧠 dino minds'],
    ['gift', '🎁 give gift'],
    ['item', '↻ next item'],
    ['lens', '👁 lens'],
    ['hearts', '❤ hearts'],
    ['keeper', '🤖 observer'],
    ['scan', '📡 scan'],
    ['time', '⏱ time ×'],
    ['export', '💾 export save'],
  ];
  return ids.map(([id, label], i) => ({ id, label, x, y: 96 + i * (h + 6), w, h }));
}

/**
 * Chips shown while a dialog is up: [◀] turns a paged dialog back, [1][2][3] when
 * a numbered menu (tone/keeper/minds) is open, always a [✕] to close. Centered
 * above the dialog box strip. (Forward paging is a tap on the dialog itself.)
 */
export function menuChips(width: number, height: number, numbered: boolean): RectButton[] {
  const w = 48;
  const h = 36;
  const y = height - 88 - 12 - h / 2 - 6; // just above the DialogBox (HEIGHT 88, PAD 12)
  const labels = numbered ? ['◀', '1', '2', '3', '✕'] : ['◀', '✕'];
  const total = labels.length * w + (labels.length - 1) * 10;
  return labels.map((label, i) => ({
    id: label === '✕' ? 'close' : label === '◀' ? 'back' : `pick${label}`,
    label,
    x: width / 2 - total / 2 + w / 2 + i * (w + 10),
    y,
    w,
    h,
  }));
}
