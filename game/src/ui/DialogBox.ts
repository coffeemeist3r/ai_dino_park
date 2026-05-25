import Phaser from 'phaser';

const PAD = 12;
const HEIGHT = 88;

export class DialogBox {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly border: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private visible = false;

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
    this.setVisible(false);
  }

  show(message: string): void {
    this.text.setText(message);
    this.setVisible(true);
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
