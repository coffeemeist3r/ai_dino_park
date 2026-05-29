import Phaser from 'phaser';
import { makeBrain } from '../ai/brain';
import { Dino } from '../entities/dino';
import { DialogBox } from '../ui/DialogBox';
import { getWorldClock, type GameTime } from '../world/clock';
import { tintFor } from '../world/dayNight';

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
  private clockHud!: Phaser.GameObjects.Text;
  private nightOverlay!: Phaser.GameObjects.Rectangle;

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

    this.setupClock();
    this.setupDayNight();
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

  private setupClock(): void {
    const clock = getWorldClock();

    const fmt = (t: GameTime): string =>
      `Day ${t.day} — ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;

    this.clockHud = this.add
      .text(6, 4, fmt(clock.now()), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setDepth(10);

    clock.onTick((t) => {
      this.clockHud.setText(fmt(t));
      // any: dev-only Playwright hook — not exposed in production builds
      (window as any).__clockNow = clock.now.bind(clock);
    });

    // any: dev-only Playwright hook — not exposed in production builds
    (window as any).__clockNow = clock.now.bind(clock);

    clock.start(this);
  }

  private setupDayNight(): void {
    const clock = getWorldClock();

    // Full-map overlay between the grass (depth 0) and the HUD (depth 10).
    const initial = tintFor(clock.now());
    this.nightOverlay = this.add
      .rectangle((TILE * COLS) / 2, (TILE * ROWS) / 2, TILE * COLS, TILE * ROWS, initial.color, initial.alpha)
      .setDepth(5);

    clock.onTick((t) => {
      const tint = tintFor(t);
      this.nightOverlay.setFillStyle(tint.color, tint.alpha);
    });

    // any: dev-only Playwright hooks — mirror the __clockNow pattern, not in production builds
    (window as any).__readTint = () => ({
      color: this.nightOverlay.fillColor,
      alpha: this.nightOverlay.fillAlpha,
    });
    // any: dev-only Playwright hook — drive the live overlay to a given hour
    (window as any).__forceHour = (h: number) => {
      const tint = tintFor({ day: 1, hour: h, minute: 0 });
      this.nightOverlay.setFillStyle(tint.color, tint.alpha);
      return { color: this.nightOverlay.fillColor, alpha: this.nightOverlay.fillAlpha };
    };
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
