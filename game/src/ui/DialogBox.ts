import Phaser from 'phaser';

const PAD = 12;
const HEIGHT = 88;
// Above every HUD layer (plaque/holding/hints top out at 13), below the touch
// control chips (20). Without this the bottom chrome painted over the dialog text.
const DEPTH = 15;
// 14px monospace lines render ~19px tall; three fit the 64px inner box. A fourth
// would collide with the hint — anything longer pages instead (GBA-style).
const LINES_PER_PAGE = 3;

export class DialogBox {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly border: Phaser.GameObjects.Rectangle;
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

    this.border = scene.add.rectangle(x, y, w, HEIGHT, 0x222244);
    this.bg = scene.add.rectangle(x, y, w - 4, HEIGHT - 4, 0xf0e8c8);
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
    for (const o of [this.border, this.bg, this.text, this.hint]) {
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
    this.border.setVisible(v);
    this.bg.setVisible(v);
    this.text.setVisible(v);
    this.hint.setVisible(v);
  }
}
