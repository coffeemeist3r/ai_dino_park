import Phaser from 'phaser';
import { bakeDialogFrame, DIALOG_FRAME_SLICE } from '../art/bake';

const PAD = 12;
const HEIGHT = 88;
// Above every HUD layer (plaque/holding/hints top out at 13), below the touch
// control chips (20). Without this the bottom chrome painted over the dialog text.
const DEPTH = 15;
// 14px monospace lines render ~19px tall; three fit the 64px inner box. A fourth
// would collide with the hint — anything longer pages instead (GBA-style).
const LINES_PER_PAGE = 3;

export class DialogBox {
  /** The Gen3 pixel frame (BACKLOG-036) where it bakes, else the two flat rects (graceful fallback). */
  private readonly chrome: Array<Phaser.GameObjects.NineSlice | Phaser.GameObjects.Rectangle> = [];
  private readonly text: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private visible = false;
  /** GBA-style paging (operator, 2026-06-11): long messages chunk into pages. */
  private pages: string[] = [];
  private page = 0;

  constructor(scene: Phaser.Scene) {
    const w = scene.scale.width - PAD * 2;
    const x = scene.scale.width / 2;
    const y = scene.scale.height - HEIGHT / 2 - PAD;

    // Gen3 pixel message box (BACKLOG-036): a baked 9-slice stretched to the box, corners crisp.
    // If the bake ever fails, fall back to the legacy flat dark-border + cream-fill rectangles so
    // the dialog always renders (the STYLE-GUIDE fallback contract).
    const frameKey = bakeDialogFrame(scene);
    if (scene.textures.exists(frameKey)) {
      const s = DIALOG_FRAME_SLICE;
      this.chrome.push(scene.add.nineslice(x, y, frameKey, undefined, w, HEIGHT, s, s, s, s));
    } else {
      this.chrome.push(scene.add.rectangle(x, y, w, HEIGHT, 0x222244));
      this.chrome.push(scene.add.rectangle(x, y, w - 4, HEIGHT - 4, 0xf0e8c8));
    }
    this.text = scene.add.text(x - w / 2 + PAD, y - HEIGHT / 2 + PAD, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#1a1a1a',
      wordWrap: { width: w - PAD * 2 },
    });
    this.hint = scene.add.text(x + w / 2 - PAD, y + HEIGHT / 2 - PAD - 4, '[Z to close]', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#555555',
    });
    this.hint.setOrigin(1, 1);
    // Screen-space chrome: pin above the HUD and exempt from ambient camera drift.
    for (const o of [...this.chrome, this.text, this.hint]) {
      o.setDepth(DEPTH);
      o.setScrollFactor(0);
    }
    this.setVisible(false);
  }

  show(message: string): void {
    // Let Phaser's own word-wrap decide the line breaks, then chunk into pages —
    // long text used to overflow the box and read as cut off (operator phone session).
    const lines = this.text.getWrappedText(message);
    this.pages = [];
    for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
      this.pages.push(lines.slice(i, i + LINES_PER_PAGE).join('\n'));
    }
    if (this.pages.length === 0) this.pages = [message];
    this.page = 0;
    this.renderPage();
    this.setVisible(true);
  }

  /** Turn forward. False when already on the last page (callers close instead). */
  next(): boolean {
    if (!this.visible || this.page >= this.pages.length - 1) return false;
    this.page++;
    this.renderPage();
    return true;
  }

  /** Turn back. False when already on the first page. */
  prev(): boolean {
    if (!this.visible || this.page <= 0) return false;
    this.page--;
    this.renderPage();
    return true;
  }

  pageInfo(): { page: number; pages: number; text: string } {
    return { page: this.page, pages: this.pages.length, text: this.pages[this.page] ?? '' };
  }

  private renderPage(): void {
    this.text.setText(this.pages[this.page]);
    const more = this.page < this.pages.length - 1;
    this.hint.setText(more ? `▼ ${this.page + 1}/${this.pages.length} (E)` : '[Z to close]');
  }

  hide(): void {
    this.setVisible(false);
  }

  isVisible(): boolean {
    return this.visible;
  }

  private setVisible(v: boolean): void {
    this.visible = v;
    for (const o of this.chrome) o.setVisible(v);
    this.text.setVisible(v);
    this.hint.setVisible(v);
  }
}
