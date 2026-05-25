import Phaser from 'phaser';
import { makeBrain } from '../ai/brain';
import { Dino } from '../entities/dino';
import { DialogBox } from '../ui/DialogBox';

const TILE = 32;
const COLS = 20;
const ROWS = 15;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dinos: Dino[] = [];
  private dialog!: DialogBox;
  private dialogOpen = false;

  constructor() {
    super('World');
  }

  create(): void {
    this.drawGrassMap();

    this.player = this.add.rectangle(TILE * 3 + TILE / 2, TILE * 3 + TILE / 2, TILE - 4, TILE - 4, 0xe8c878);
    this.player.setStrokeStyle(2, 0x6a4020);

    this.dinos.push(
      new Dino(this, TILE * 10 + TILE / 2, TILE * 7 + TILE / 2, {
        name: 'Rex',
        species: 'triceratops',
        personality: 'curious, friendly, loves rocks',
        brain: makeBrain('stub'),
      }),
    );

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    this.dialog = new DialogBox(this);

    this.interactKey.on('down', () => this.handleInteract());
  }

  update(): void {
    if (this.dialogOpen) return;

    const speed = 2;
    if (this.cursors.left.isDown) this.player.x -= speed;
    if (this.cursors.right.isDown) this.player.x += speed;
    if (this.cursors.up.isDown) this.player.y -= speed;
    if (this.cursors.down.isDown) this.player.y += speed;

    this.player.x = Phaser.Math.Clamp(this.player.x, TILE / 2, TILE * COLS - TILE / 2);
    this.player.y = Phaser.Math.Clamp(this.player.y, TILE / 2, TILE * ROWS - TILE / 2);
  }

  private async handleInteract(): Promise<void> {
    if (this.dialogOpen) {
      this.dialog.hide();
      this.dialogOpen = false;
      return;
    }

    const target = this.nearestDino();
    if (!target) return;

    this.dialogOpen = true;
    this.dialog.show(`${target.name}: ...`);
    const reply = await target.greet();
    this.dialog.show(`${target.name}: ${reply}`);
  }

  private nearestDino(): Dino | null {
    let best: Dino | null = null;
    let bestDist = TILE * 2;
    for (const d of this.dinos) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y);
      if (dist < bestDist) {
        best = d;
        bestDist = dist;
      }
    }
    return best;
  }

  private drawGrassMap(): void {
    const g = this.add.graphics();
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const shade = (x + y) % 2 === 0 ? 0x3a6a3a : 0x2f5e2f;
        g.fillStyle(shade, 1);
        g.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }
}
