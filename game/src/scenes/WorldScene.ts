import Phaser from 'phaser';
import { makeBrain, replyPrefix, type BrainKind, type NPCBrain } from '../ai/brain';
import { currentModel, isCoarsePointer, MODELS } from '../ai/deviceProbe';
import {
  MINDS_CONSENT_KEY,
  brainKind,
  allowAmbient,
  convoCooldownSteps,
  consentLines,
  mindsOffLines,
  mindsLabel,
  mindsStatusLine,
} from '../ai/governor';
import { loadProgress, hasCachedModel, deleteCachedModel } from '../ai/webllmBrain';
import { chirpParams, distressParams, type ChirpParams } from '../audio/chirp';
import { chorusOrder, DAWN_HOUR, type ChorusEntry } from '../audio/chorus';
import { unlockAudio, audioState, playChirp, playThunk, soundMuted, setSoundMuted } from '../audio/voice';
import { Dino } from '../entities/dino';
import { hasArt, hasKeeperArt, makeKeeperArt, bakeTileMap } from '../art/bake';
import { ROSTER } from '../entities/roster';
import { DialogBox } from '../ui/DialogBox';
import { getWorldClock, type GameTime } from '../world/clock';
import { fastForward } from '../world/away';
import { homecoming, type Homecoming } from '../world/homecoming';
import { repairGain, repairLine, repairMemory } from '../world/repair';
import { comforter, comfortLine, comfortMemory, recordGratitude, COMFORT_BOND, type Gratitude } from '../world/comfort';
import { tintFor, dayPhase } from '../world/dayNight';
import {
  rollSkyEvent,
  atGather,
  skyExpired,
  SKY_GATHER_TILE,
  SKY_EVENTS,
  SKY_ROLL_INTERVAL_MS,
  type SkyEvent,
  type SkyEventId,
} from '../world/skyEvent';
import { buildMessages } from '../ai/webllmBrain';
import { SAVE_VERSION, serialize, type SaveData } from '../world/saveGame';
import { loadFromDb, saveToDb } from '../world/saveStore';
import {
  bumpPoints,
  greetGain,
  heartString,
  heartsFromPoints,
  type Friendship,
} from '../social/friendship';
import { GIFTS, giftReaction, verdictPhrase, type GiftVerdict } from '../social/gifts';
import { TONES, toneById, toneReaction, lastToneLine, type ToneId } from '../social/tones';
import { KEEPERS, DEFAULT_KEEPER_ID, keeperById, keeperBonus, keeperFit } from '../keeper/keepers';
import { canScan, scanLines, scanRefusal, type ScanSubject } from '../keeper/scan';
import { INSPECT_TTL, inspector, inspectLine, inspectMemory } from '../keeper/firstContact';
import { seasonFor, seasonTurned, SEASON_TINT, turnLine, turnMemory, type Season } from '../world/seasons';
import { HUDDLE_THRESHOLD, huddleThreshold, inHuddleWindow } from '../world/huddle';
import { sleptCold, coldShiver, coldMemory, WARM_BONUS, warmGain, warmLine, warmMemory, neglectMemory, spreadColdWord, coldWordLine } from '../world/cold';
import { DISTRESS_STEPS, mostDistressed, hearLine, heardMemory } from '../world/distress';
import { wanderStep, stepToward } from '../world/movement';
import { recordMeet, pairKey, type Meetings } from '../social/meetings';
import { remember, recall, reflect, type MemoryStore } from '../ai/memory';
import { spreadGossip, RUMOR_MARK } from '../social/gossip';
import { nextLens, bondedPairs, tickerLines, bookLines, LENS_LABEL, type Lens, type BookRow } from '../ui/lenses';
import { deriveRole, ROLE_ICON, type Role } from '../ai/roles';
import { GLASS, cornerRadius, rimRects, edgeBands, glarePolys, toPoints } from '../ui/glass';
import { reactionFor, startleStep, type StartleReaction } from '../world/startle';
import { reactionToFood, feedStep, reachedFood, foodLanding } from '../world/feeding';
import { FOODS, favoriteFood, foodReaction, seasonCraving, type Food } from '../world/foods';
import { maxGeneration, plaqueLines } from '../ui/plaque';
import { HELP_CHIP, helpLines, holdingLine } from '../ui/controlsHelp';
import { hudAlpha, isIdle } from '../world/idle';
import {
  STICK,
  stickVector,
  inCircle,
  inRect,
  actionButtons,
  sheetRows,
  menuChips,
  type Vec2,
} from '../input/touch';
import { strengthen, bondPoints, type Bonds } from '../social/bonds';
import {
  shouldLay,
  makeEgg,
  isHatched,
  hatch,
  childName,
  EGG_BOND_THRESHOLD,
  MAX_POPULATION,
  type Egg,
  type BornDino,
} from '../social/breeding';

const TILE = 32;
const COLS = 20;
const ROWS = 15;

// Night sleeping huddle (BACKLOG-041): bonded dinos gather at the den after dark.
// The bond bar + window are season-conditional since BACKLOG-171 (see world/huddle.ts).
const HUDDLE_TILE = { tileX: 10, tileY: 11 };
const BOND_PER_MEET = 4;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  /** Anim key of the current keeper avatar, or null when the observer is still the amber square. */
  private keeperArtKey: string | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dinos: Dino[] = [];
  private dialog!: DialogBox;
  private dialogOpen = false;
  private clockHud!: Phaser.GameObjects.Text;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private heartsPanel!: Phaser.GameObjects.Text;
  private friendship: Friendship = {};
  private npcBrain!: NPCBrain;
  private giftHud!: Phaser.GameObjects.Text;
  private heldItemIndex = 0;
  /** Controls help (HUD overhaul): the [?] chip and the panel it toggles. */
  private helpChip!: Phaser.GameObjects.Text;
  private helpPanel!: Phaser.GameObjects.Text;
  private brainHud!: Phaser.GameObjects.Text;
  private meetings: Meetings = {};
  private memory: MemoryStore = {};
  private bonds: Bonds = {};
  private lastAwayDigest: string[] = [];
  private lastHomecoming: Homecoming | null = null;
  private liveBubbles = new Set<string>();
  /** The jealous runner-up awaiting a make-up greet (BACKLOG-125); transient, one-shot, not persisted. */
  private pendingRepair: string | null = null;
  /** The last dino-to-dino comfort beat (BACKLOG-130): who consoled whom, or null. Transient. */
  private lastComfort: { comforter: string; sulker: string } | null = null;
  /** Who each dino owes a consolation back to (BACKLOG-132); persisted, drives the gratitude echo. */
  private gratitude: Gratitude = {};
  /** Tone menu state (BACKLOG-142): open flag, the dino being greeted, and the live menu text. */
  private toneMenuOpen = false;
  private toneTarget: Dino | null = null;
  private toneMenuText = '';
  /** Each dino's last greeting tone (BACKLOG-142); persisted, surfaced as a remembered trace. */
  private lastTone: Record<string, ToneId> = {};
  /** The chosen observer (BACKLOG-155); persisted. Its affinity-fit bonus colours every player gain. */
  private keeperId: string = DEFAULT_KEEPER_ID;
  /** Keeper picker overlay state (BACKLOG-155): open via K, number keys 1/2/3 choose. */
  private keeperPickerOpen = false;
  /** Field Scan panel (BACKLOG-157): LUMEN-3's dossier readout. Transient, never persisted. */
  private scanPanel!: Phaser.GameObjects.Text;
  private scanOpen = false;
  /** First-contact inspection (BACKLOG-161): armed by a real keeper change. Transient, one-shot. */
  private pendingInspect: { name: string; ttl: number } | null = null;
  private lastInspection: { name: string; keeperId: string } | null = null;
  /** Seasons (BACKLOG-159): derived from the clock day — only the live-turn tracker is state. */
  private seasonOverlay!: Phaser.GameObjects.Rectangle;
  private lastSeasonDay = 1;
  private seasonTurns = 0;
  /** Dawn chorus (BACKLOG-192): transient — the last in-game day a dawn fired (0 = none yet). */
  private lastDawnDay = 0;
  private dawnCount = 0;
  private lastChorus: ChorusEntry[] | null = null;
  private eggs: Egg[] = [];
  private born: BornDino[] = [];
  private eggSprites = new Map<string, Phaser.GameObjects.Text>();
  private sleepMarks: Phaser.GameObjects.Text[] = [];
  /** Cold-night shiver (BACKLOG-179): the night's season, the morning-edge window tracker, and
   *  the last morning's cold sleepers (the dinos too loosely bonded for the den, for the hook). */
  private wasInHuddleWindow = false;
  private nightSeason: Season = 'spring';
  private lastColdSleepers: string[] = [];
  /** Keeper's warmth (BACKLOG-184): who still carries the cold funk (transient day-state,
   *  never persisted — like pendingRepair) and its 🥶 marks, index-aligned like sleepMarks. */
  private coldPending = new Set<string>();
  private coldMarks: Phaser.GameObjects.Text[] = [];
  /** Distress call (BACKLOG-194): the last cry (diegetic — recorded even muted) and the
   *  responder mid-walk toward the caller. Both transient, never persisted. */
  private lastDistress: { name: string; trigger: 'startle' | 'cold'; params: ChirpParams } | null = null;
  private pendingRespond: { name: string; caller: string; steps: number } | null = null;
  private roleTags: Phaser.GameObjects.Text[] = [];
  private lens: Lens = 'off';
  private bookPanel!: Phaser.GameObjects.Text;
  private bondGfx!: Phaser.GameObjects.Graphics;
  private tickerPanel!: Phaser.GameObjects.Text;
  private lensLabel!: Phaser.GameObjects.Text;
  private plaque!: Phaser.GameObjects.Text;
  private eventLog: string[] = [];
  private hudElements: Array<{ setAlpha: (a: number) => unknown }> = [];
  private lastInputAt = 0;
  private ambientActive = false;
  private ambientTween?: Phaser.Tweens.Tween;
  private readonly denCenter = { x: HUDDLE_TILE.tileX * TILE + TILE / 2, y: HUDDLE_TILE.tileY * TILE + TILE / 2 };
  private food: { tileX: number; tileY: number } | null = null;
  private foodKind: Food | null = null;
  private foodLanded = false;
  private foodSprite: Phaser.GameObjects.Text | null = null;
  private moveTicks = 0;
  /** The active world-scale night event (BACKLOG-144), or null. Transient — only its memory persists. */
  private activeSky: SkyEvent | null = null;
  private skyStartAbsMin = 0;
  /** In-game day of the last sky event — caps the spectacle at one per day. */
  private skyFiredDay = -1;
  private skyGazers = new Set<string>();
  private skyOverlay!: Phaser.GameObjects.Rectangle;
  private skyTween?: Phaser.Tweens.Tween;
  private convoCooldown = 0;
  private convoInFlight = false;
  private lastConversation: { speaker: string; text: string; source?: string } | null = null;
  /** Touch controls (BACKLOG-189): live drag vector, the dragging pointer, and the UI layer. */
  private touchEnabled = false;
  private touchVec: Vec2 = { x: 0, y: 0 };
  private stickPointerId = -1;
  private touchObjects: Phaser.GameObjects.GameObject[] = [];
  private stickThumb: Phaser.GameObjects.Arc | null = null;
  private stickGroup: Phaser.GameObjects.GameObject[] = [];
  private actionGroup: Phaser.GameObjects.GameObject[] = [];
  private sheetGroup: Phaser.GameObjects.GameObject[] = [];
  private chipGroups: Array<{ id: string; objs: Phaser.GameObjects.GameObject[] }> = [];
  private sheetOpen = false;
  /** Minds policy + inference governor (BACKLOG-107): which brain runs, and when ambient may think. */
  private coarsePointer = false;
  private brainKindNow: BrainKind = 'webllm';
  /** Which minds dialog is up: enable-consent, the off/keep/delete choice, or none. */
  private mindsConfirm: 'enable' | 'disable' | null = null;
  private tabHidden = false;
  private batteryLevel: number | undefined;
  private lastCacheAction: 'deleted' | 'error' | null = null;
  /** Audio spine (BACKLOG-191): last sound INTENT — recorded even when the context can't play. */
  private lastSound: { kind: 'chirp' | 'thunk'; name?: string; params?: ChirpParams } | null = null;

  constructor() {
    super('World');
  }

  create(): void {
    this.drawGrassMap();
    this.drawDen(); // drawn before dinos so they nap on top of it

    this.renderKeeperAvatar(); // the chosen observer's pixel rig, or the amber square if undrawn

    // One shared brain across all dinos — five WebLLM engines would mean five model downloads.
    // Phones boot on the canned stub unless the keeper opted in (governor policy): a GB-class
    // model download never starts itself on a phone.
    this.coarsePointer = isCoarsePointer();
    this.brainKindNow = brainKind({ coarse: this.coarsePointer, consent: this.readMindsConsent() });
    this.npcBrain = makeBrain(this.brainKindNow);
    this.setupGovernor();
    for (const spawn of ROSTER) this.spawnDino(spawn);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.dialog = new DialogBox(this);

    // E is the primary interact key; Z kept as an alias.
    this.interactKey.on('down', () => this.handleInteract());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z).on('down', () => this.handleInteract());

    // Arrow keys page an open dialog (movement is frozen while one is up anyway).
    this.cursors.right.on('down', () => { if (this.dialogOpen) this.dialog.next(); });
    this.cursors.left.on('down', () => { if (this.dialogOpen) this.dialog.prev(); });
    // any: dev-only Playwright hook — current dialog page/pages/text
    (window as any).__dialogPage = () => this.dialog.pageInfo();
    // dev-only: did the Gen3 pixel dialog frame bake? (BACKLOG-036)
    (window as any).__dialogFrameBaked = () => this.textures.exists('dialog_frame');

    // 1/2/3 pick a greeting tone (BACKLOG-142) — or, while the keeper picker is up (BACKLOG-155),
    // choose an observer. onNumberKey routes to whichever overlay is open.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE).on('down', () => this.onNumberKey(1));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO).on('down', () => this.onNumberKey(2));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE).on('down', () => this.onNumberKey(3));

    // K opens the keeper picker (BACKLOG-155): choose which time-traveling observer you are.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K).on('down', () => this.openKeeperPicker());

    // B is LUMEN-3's Field Scan (BACKLOG-157): read the nearest dino's mind — Lux only.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => this.toggleScan());

    // M toggles the bowl's sound (BACKLOG-191); the touch sheet has the same switch.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => setSoundMuted(!soundMuted()));

    this.addControlsHint();

    this.setupClock();
    this.setupDayNight();
    this.setupSeasons();
    this.setupSave();
    this.setupHearts();
    this.setupGifts();
    this.setupBrainHud();
    this.setupMovement();
    this.setupHuddle();
    this.setupLenses();
    this.setupGlass();
    this.setupTap();
    this.setupFeeding();
    this.setupSkyEvent();
    this.setupPlaque();
    this.setupScan();
    this.setupIdle();
    this.setupTouchControls();

    // Readiness flag: all dev hooks are now attached. e2e boot() waits on this to
    // avoid the parallel-load flake of reading a hook before create() finishes.
    (window as any).__ready = true;
  }

  /** Idle / ambient mode (BACKLOG-060): fade the HUD + breathe the camera after a still spell. */
  private setupIdle(): void {
    this.lastInputAt = this.time.now;
    // The always-on HUD that fades when the keeper steps away (panels toggled by keys are excluded).
    this.hudElements.push(this.clockHud, this.brainHud, this.giftHud, this.plaque, this.lensLabel);

    const markActive = () => {
      this.lastInputAt = this.time.now;
      if (this.ambientActive) this.exitAmbient();
      // Every keydown/pointerdown lands here — the one true first-gesture seam,
      // so this is where the AudioContext is allowed to exist (BACKLOG-191).
      unlockAudio();
    };
    this.input.keyboard!.on('keydown', markActive);
    this.input.on('pointerdown', markActive);

    // dev-only Playwright hooks
    (window as any).__idleAlpha = () => hudAlpha(this.time.now - this.lastInputAt);
    (window as any).__isAmbient = () => isIdle(this.time.now - this.lastInputAt);
    (window as any).__forceIdle = (ms: number) => {
      this.lastInputAt = this.time.now - ms;
      this.applyIdle();
      return hudAlpha(ms);
    };
    (window as any).__nudgeInput = () => {
      markActive();
      this.applyIdle();
      return hudAlpha(0);
    };
  }

  /** Fade the HUD to match how long we've been idle, and start/stop the camera breathing. */
  private applyIdle(): void {
    const idleMs = this.time.now - this.lastInputAt;
    const a = hudAlpha(idleMs);
    for (const el of this.hudElements) el.setAlpha(a);
    if (isIdle(idleMs)) this.enterAmbient();
  }

  private enterAmbient(): void {
    if (this.ambientActive) return;
    this.ambientActive = true;
    // Slow "breathing" zoom toward the centre of the bowl; yoyos forever until input.
    this.ambientTween = this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.04,
      duration: 6_000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private exitAmbient(): void {
    if (!this.ambientActive) return;
    this.ambientActive = false;
    this.ambientTween?.stop();
    this.ambientTween = undefined;
    this.cameras.main.setZoom(1);
    for (const el of this.hudElements) el.setAlpha(1);
  }

  /** The Plaque (BACKLOG-058): an engraved nameplate under the bowl with live vivarium stats. */
  private setupPlaque(): void {
    this.plaque = this.add
      .text((TILE * COLS) / 2, TILE * ROWS - 4, '', {
        fontFamily: 'serif',
        fontSize: '11px',
        color: '#f4d58d',
        align: 'center',
        backgroundColor: '#3a2a14e6',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11);
    this.refreshPlaque();
    getWorldClock().onTick(() => this.refreshPlaque());

    // dev-only Playwright hook — current plaque stats
    (window as any).__plaque = () => ({
      population: this.dinos.length,
      day: getWorldClock().now().day,
      generations: maxGeneration(this.born),
    });
  }

  private refreshPlaque(): void {
    if (!this.plaque) return;
    this.plaque.setText(
      plaqueLines({
        population: this.dinos.length,
        day: getWorldClock().now().day,
        generations: maxGeneration(this.born),
      }).join('\n'),
    );
  }

  /** Tap the glass (BACKLOG-057): a click raps the bowl; nearby dinos react by temperament. */
  private setupTap(): void {
    // Touches that land on the control layer (stick/buttons/chips) are input, not raps.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // The [?] chip / open help panel eats its tap: toggling help is not a rap.
      if (this.helpUiOwns(p.x, p.y)) {
        this.toggleHelp();
        return;
      }
      if (this.touchUiOwns(p.x, p.y)) {
        this.dispatchTouchTap(p.x, p.y);
        return;
      }
      this.tapGlass(p.worldX, p.worldY);
    });
    // dev-only Playwright hook — tap at a pixel, returns each dino's reaction
    (window as any).__tapGlass = (px: number, py: number) => this.tapGlass(px, py);
  }

  /** Rap the glass at a pixel; ripple, then every dino flees/approaches/ignores by bravery. */
  private tapGlass(px: number, py: number): Array<{ name: string; reaction: StartleReaction }> {
    if (!soundMuted()) {
      this.lastSound = { kind: 'thunk' };
      playThunk(); // the knock you'd hear from outside the bowl (BACKLOG-191)
    }
    this.spawnRipple(px, py);
    const tap = {
      tileX: Math.max(0, Math.min(COLS - 1, Math.round((px - TILE / 2) / TILE))),
      tileY: Math.max(0, Math.min(ROWS - 1, Math.round((py - TILE / 2) / TILE))),
    };

    const out: Array<{ name: string; reaction: StartleReaction }> = [];
    const bolters: Array<{ name: string; level: number }> = [];
    for (const d of this.dinos) {
      const cur = this.tileOf(d);
      const dist = Math.hypot(cur.tileX - tap.tileX, cur.tileY - tap.tileY);
      const reaction = reactionFor(d.traits.bravery, dist);
      out.push({ name: d.name, reaction });
      if (reaction === 'ignore') continue;
      if (reaction === 'bolt') bolters.push({ name: d.name, level: d.traits.bravery });

      // a startled dino jumps two tiles in its chosen direction
      let next = cur;
      for (let i = 0; i < 2; i++) next = startleStep(next, tap, reaction, COLS, ROWS);
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);

      this.flashStartle(d, reaction);
      this.memory = remember(
        this.memory,
        d.name,
        reaction === 'bolt' ? 'the glass shook and you bolted in fright' : 'the glass shook and you crept closer to look',
      );
    }
    // One tap, one cry (BACKLOG-194): the most frightened bolter calls out in distress.
    const crier = mostDistressed(bolters);
    if (crier) {
      const d = this.dinoByName(crier);
      if (d) this.cryDistress(d, 'startle');
    }
    return out;
  }

  private spawnRipple(px: number, py: number): void {
    const ring = this.add.circle(px, py, 6, 0xffffff, 0).setStrokeStyle(2, GLASS.rimColor, 0.9).setDepth(9);
    this.tweens.add({
      targets: ring,
      radius: TILE * 2,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private flashStartle(d: Dino, reaction: StartleReaction): void {
    const mark = this.add
      .text(d.x, d.y - TILE * 0.9, reaction === 'bolt' ? '❗' : '❓', { fontSize: '14px' })
      .setOrigin(0.5, 1)
      .setDepth(12);
    d.label.setColor(reaction === 'bolt' ? '#ff8080' : '#9fe8ff');
    this.time.delayedCall(700, () => {
      mark.destroy();
      d.label.setColor('#ffffff');
    });
  }

  /** Feeding hatch (BACKLOG-059): press H to drop food; the cast swarms it; first to reach eats. */
  private setupFeeding(): void {
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H).on('down', () => this.dropFood());

    // dev-only Playwright hooks. __dropFood lands the food immediately so tests
    // skip the real-time fall tween; the H press uses the tween for the visual.
    // An optional foodId forces the kind (random when omitted).
    (window as any).__dropFood = (col?: number, foodId?: string) => {
      const tile = this.dropFood(col, foodId);
      if (this.food) this.foodLanded = true;
      return tile;
    };
    (window as any).__food = () =>
      this.food ? { ...this.food, foodId: this.foodKind?.id ?? null } : null;
    (window as any).__favoriteFood = (name: string, season?: Season) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? { ...favoriteFood(d.traits, season ?? this.currentSeason()) } : null;
    };
  }

  /** The season the bowl is living in right now, off the live clock day (BACKLOG-170). */
  private currentSeason(): Season {
    return seasonFor(getWorldClock().now().day);
  }

  /** Drop one piece of food through the hatch. One at a time; returns its landing tile. */
  private dropFood(col?: number, foodId?: string): { tileX: number; tileY: number } {
    if (this.food) return this.food; // already a piece in play — ignore the drop
    const kind = foodId
      ? FOODS.find((f) => f.id === foodId) ?? FOODS[0]
      : FOODS[Math.floor(Math.random() * FOODS.length)];
    const landing = foodLanding(COLS, ROWS, col);
    this.food = landing;
    this.foodKind = kind;
    this.foodLanded = false;
    const px = landing.tileX * TILE + TILE / 2;
    const landY = landing.tileY * TILE + TILE / 2;
    this.foodSprite = this.add.text(px, TILE * 0.4, kind.emoji, { fontSize: '18px' }).setOrigin(0.5).setDepth(2);
    this.tweens.add({
      targets: this.foodSprite,
      y: landY,
      duration: 600,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.foodLanded = true;
      },
    });
    this.logEvent(`${kind.emoji} food dropped from the hatch (${kind.label})`);
    return landing;
  }

  /** First dino standing on (or beside) the landed food eats it. */
  private checkFeeding(): void {
    if (!this.food || !this.foodLanded) return;
    const eater = this.dinos.find((d) => reachedFood(this.tileOf(d), this.food!));
    if (eater) this.eatFood(eater);
  }

  private eatFood(d: Dino): void {
    const kind = this.foodKind;
    const r = foodReaction(kind!, d.traits, this.currentSeason());
    this.foodSprite?.destroy();
    this.foodSprite = null;
    this.food = null;
    this.foodKind = null;
    this.foodLanded = false;
    // A meal mends a cold funk too (BACKLOG-184): the food's gain plus the warm bonus.
    const warming = this.coldPending.has(d.name);
    this.friendship = bumpPoints(this.friendship, d.name, r.gain + (warming ? WARM_BONUS : 0));
    this.memory = remember(
      this.memory,
      d.name,
      r.favorite
        ? `you snapped up the food at the hatch — your favorite ${kind!.label}!`
        : 'you scrambled to the hatch and snapped up the food',
    );
    if (warming) {
      this.memory = remember(this.memory, d.name, warmMemory());
      this.clearColdFunk(d.name, true);
    }
    this.flashFeed(d, r.emoji);
    this.logEvent(
      `🍖 ${d.name} snapped up the food at the hatch${r.favorite ? ` — its favorite ${kind!.label}!` : ''}`,
    );
    this.refreshHeartsPanel();
    void this.saveGame();
  }

  private flashFeed(d: Dino, emoji = '😋'): void {
    const mark = this.add
      .text(d.x, d.y - TILE * 0.9, emoji, { fontSize: '14px' })
      .setOrigin(0.5, 1)
      .setDepth(12);
    d.label.setColor('#a8ff80');
    this.time.delayedCall(700, () => {
      mark.destroy();
      d.label.setColor('#ffffff');
    });
  }

  /** Absolute in-game minute (since Day 1 00:00) — sky-event timing reads the same clock e2e advances. */
  private absMinNow(): number {
    const t = getWorldClock().now();
    return (t.day - 1) * 24 * 60 + t.hour * 60 + t.minute;
  }

  /**
   * World-scale night event (BACKLOG-144): on a rare clear night the sky lights up and the whole
   * cast gathers to watch. The overlay shimmer lives here; the gather movement + shared memory are
   * folded into forceStep so the spectacle overrides ordinary wandering.
   */
  private setupSkyEvent(): void {
    // depth 7: above the night tint (5) + bond lines (6), below the glass rim (8) and HUD (10+).
    this.skyOverlay = this.add
      .rectangle((TILE * COLS) / 2, (TILE * ROWS) / 2, TILE * COLS, TILE * ROWS, SKY_EVENTS[0].color, 0)
      .setDepth(7)
      .setVisible(false);

    // Roll on a real-time cadence (NOT in-game hours): offline catch-up and per-minute clock
    // advances must not retroactively spawn events, and a short headless test never waits this long.
    this.time.addEvent({ delay: SKY_ROLL_INTERVAL_MS, loop: true, callback: () => this.maybeStartSky() });

    // dev-only Playwright hooks
    (window as any).__skyEvent = () => this.activeSky?.id ?? null;
    (window as any).__skyGazers = () => [...this.skyGazers];
    // Force-start an event (default first, or by id), bypassing the roll — drives the e2e flow.
    (window as any).__triggerSky = (id?: SkyEventId) => {
      const ev = SKY_EVENTS.find((e) => e.id === id) ?? SKY_EVENTS[0];
      this.startSky(ev);
      return this.activeSky?.id ?? null;
    };
  }

  private maybeStartSky(): void {
    if (this.activeSky) return;
    if (getWorldClock().now().day === this.skyFiredDay) return; // at most one spectacle per in-game day
    const ev = rollSkyEvent({
      isClearNight: this.isClearNight(),
      active: false,
      chanceRoll: Math.random(),
      pickRoll: Math.random(),
    });
    if (ev) this.startSky(ev);
  }

  private startSky(ev: SkyEvent): void {
    this.activeSky = ev;
    this.skyStartAbsMin = this.absMinNow();
    this.skyFiredDay = getWorldClock().now().day;
    this.skyGazers.clear();
    this.skyOverlay.setFillStyle(ev.color, 0.18).setVisible(true);
    this.skyTween?.stop();
    this.skyTween = this.tweens.add({
      targets: this.skyOverlay,
      fillAlpha: 0.34,
      duration: 1400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.logEvent(`✨ the sky lit up — ${ev.label} over the bowl`);
  }

  private endSky(): void {
    if (!this.activeSky) return;
    this.activeSky = null;
    this.skyTween?.stop();
    this.skyTween = undefined;
    this.skyOverlay.setVisible(false).setFillStyle(SKY_EVENTS[0].color, 0);
    // Persist the memories the gazers filed while watching.
    void this.saveGame();
  }

  /**
   * Drive the active sky event one world-step: end it if expired or dawn has come, else pull every
   * dino toward the shared gather tile and, as each arrives, file the one shared memory + a ✨ bubble.
   * Returns true while an event is running so forceStep skips ordinary wandering this step.
   */
  private stepSky(): boolean {
    if (!this.activeSky) return false;
    if (!this.isNight() || skyExpired(this.absMinNow() - this.skyStartAbsMin, this.activeSky)) {
      this.endSky();
      return false;
    }
    for (const d of this.dinos) {
      const next = stepToward(this.tileOf(d), SKY_GATHER_TILE, COLS, ROWS);
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);
      if (atGather(next) && !this.skyGazers.has(d.name)) {
        this.skyGazers.add(d.name);
        this.memory = remember(this.memory, d.name, this.activeSky.memory);
        this.showBubble(d, this.activeSky.bubble);
      }
    }
    return true;
  }

  /** The Glass (BACKLOG-056): draw the vivarium bowl — edge shadow, glass rim, reflections. */
  private setupGlass(): void {
    const W = TILE * COLS;
    const H = TILE * ROWS;
    const r = cornerRadius(TILE);

    // depth 8: over the night overlay (5) and bond lines (6), under the HUD/labels (10+)
    const g = this.add.graphics().setDepth(8);

    // edge vignette — darken the rim inward; corners double up for a deeper bowl shadow
    g.fillStyle(GLASS.vignetteColor, GLASS.vignetteAlpha);
    for (const b of edgeBands(W, H)) g.fillRect(b.x, b.y, b.width, b.height);

    // crisp glass rim + faint inner highlight
    const rims = rimRects(W, H);
    g.lineStyle(GLASS.rim, GLASS.rimColor, 0.7);
    g.strokeRoundedRect(rims[0].x, rims[0].y, rims[0].width, rims[0].height, r);
    g.lineStyle(1, GLASS.innerColor, 0.25);
    g.strokeRoundedRect(rims[1].x, rims[1].y, rims[1].width, rims[1].height, r - 3);

    // reflection streaks catching the light off the curved glass
    g.fillStyle(GLASS.glareColor, GLASS.glareAlpha);
    for (const poly of glarePolys(W, H)) g.fillPoints(toPoints(poly), true);

    // curved highlight along the top rim — the catch of light on a bowl's lip
    g.lineStyle(2, GLASS.rimColor, 0.4);
    g.beginPath();
    g.arc(W / 2, H * 0.16, W * 0.46, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335));
    g.strokePath();

    // dev-only Playwright hook — confirms the glass drew and reports its rim
    (window as any).__glass = () => ({ width: W, height: H, radius: r });
  }

  /** Spawn a dino (roster or born), keeping its 💤 sleep-mark index-aligned in `sleepMarks`. */
  private spawnDino(cfg: {
    name: string;
    species: string;
    personality: string;
    color: number;
    tileX: number;
    tileY: number;
    traits?: BornDino['traits'];
  }): Dino {
    const dino = new Dino(this, cfg.tileX * TILE + TILE / 2, cfg.tileY * TILE + TILE / 2, {
      name: cfg.name,
      species: cfg.species,
      personality: cfg.personality,
      color: cfg.color,
      traits: cfg.traits,
      brain: this.npcBrain,
    });
    this.dinos.push(dino);
    this.sleepMarks.push(
      this.add.text(0, 0, '💤', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.coldMarks.push(
      this.add.text(0, 0, '🥶', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.roleTags.push(
      this.add
        .text(0, 0, '', { fontFamily: 'monospace', fontSize: '9px', color: '#ffe0a0', backgroundColor: '#000000aa', padding: { x: 2, y: 1 } })
        .setOrigin(0.5, 1)
        .setDepth(12)
        .setVisible(false),
    );
    return dino;
  }

  private drawDen(): void {
    const g = this.add.graphics();
    g.fillStyle(0x4a3f5a, 0.55);
    g.fillEllipse(this.denCenter.x, this.denCenter.y, TILE * 3.4, TILE * 2.2);
    g.lineStyle(2, 0x6a5f7a, 0.7);
    g.strokeEllipse(this.denCenter.x, this.denCenter.y, TILE * 3.4, TILE * 2.2);
  }

  private setupHuddle(): void {
    // sleepMarks are created per-dino in spawnDino so born dinos get one too.

    // any: dev-only Playwright hooks
    (window as any).__bonds = () => ({ ...this.bonds });
    (window as any).__bondPair = (a: string, b: string, amount?: number) => {
      this.bonds = strengthen(this.bonds, a, b, amount ?? HUDDLE_THRESHOLD);
      return bondPoints(this.bonds, a, b);
    };
    (window as any).__huddlers = () => this.dinos.filter((d) => this.isHuddling(d)).map((d) => d.name);
    // dev-only: the live huddle verdict (BACKLOG-171) — season, bond bar, and window state now.
    (window as any).__huddleInfo = () => {
      const season = this.currentSeason();
      return {
        season,
        threshold: huddleThreshold(season),
        inWindow: inHuddleWindow(getWorldClock().now().hour, season),
      };
    };
    // dev-only: cold-night shiver (BACKLOG-179) — who slept cold at the last morning resolution.
    (window as any).__coldSleepers = () => [...this.lastColdSleepers];
    // dev-only: keeper's warmth (BACKLOG-184) — who still carries the cold funk.
    (window as any).__coldPending = () => [...this.coldPending];
    // dev-only: distress call (BACKLOG-194) — the last cry, the responder mid-walk, and a
    // staging trigger so e2e can fire the beat deterministically (the __triggerSky convention).
    (window as any).__lastDistress = () => (this.lastDistress ? { ...this.lastDistress } : null);
    (window as any).__distressResponder = () => (this.pendingRespond ? { ...this.pendingRespond } : null);
    (window as any).__cryDistress = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.cryDistress(d, 'startle');
      return this.lastDistress ? { ...this.lastDistress } : null;
    };

    // egg-phase hooks (BACKLOG-042)
    (window as any).__eggs = () => this.eggs.map((e) => ({ ...e }));
    (window as any).__population = () => this.dinos.length;
    // force a clutch from two parents (sets a high bond, then lays regardless of time)
    (window as any).__layEgg = (a: string, b: string) => {
      this.bonds = strengthen(this.bonds, a, b, EGG_BOND_THRESHOLD);
      return this.layEgg(a, b);
    };
    // hatch every pending egg now (independent of the clock)
    (window as any).__forceHatch = () => {
      for (const e of [...this.eggs]) this.hatchEgg(e);
      return this.dinos.length;
    };
  }

  /** A clear night for breeding. No weather yet (BACKLOG-028) — every night counts as clear. */
  private isClearNight(): boolean {
    return this.isNight();
  }

  private hasEggForPair(a: string, b: string): boolean {
    const key = pairKey(a, b);
    return this.eggs.some((e) => pairKey(e.parentA, e.parentB) === key);
  }

  /** Lay an egg from a bonded pair by the den. Returns the egg, or null if one is already pending. */
  private layEgg(a: string, b: string): Egg | null {
    if (this.hasEggForPair(a, b)) return null;
    const day = getWorldClock().now().day;
    const tile = { tileX: HUDDLE_TILE.tileX + 1, tileY: HUDDLE_TILE.tileY };
    const egg = makeEgg(a, b, day, tile);
    this.eggs.push(egg);
    this.drawEgg(egg);
    this.logEvent(`🥚 ${a} & ${b} nested by the den`);
    void this.saveGame();
    return egg;
  }

  private drawEgg(egg: Egg): void {
    const sprite = this.add
      .text(egg.tileX * TILE + TILE / 2, egg.tileY * TILE + TILE / 2, '🥚', { fontSize: '18px' })
      .setOrigin(0.5)
      .setDepth(2);
    this.eggSprites.set(egg.id, sprite);
  }

  /** Scan huddling pairs on a clear night; bonded enough → an egg appears by the den. */
  private maybeLayEggs(): void {
    if (!this.isClearNight()) return;
    const huddlers = this.dinos.filter((d) => this.isHuddling(d));
    for (let i = 0; i < huddlers.length; i++) {
      for (let j = i + 1; j < huddlers.length; j++) {
        const a = huddlers[i];
        const b = huddlers[j];
        if (
          shouldLay({
            bond: bondPoints(this.bonds, a.name, b.name),
            population: this.dinos.length + this.eggs.length,
            isClearNight: true,
            bothHuddling: true,
            hasEggForPair: this.hasEggForPair(a.name, b.name),
          })
        ) {
          this.layEgg(a.name, b.name);
        }
      }
    }
  }

  /** Hatch any egg whose day has come into a new blended dino. */
  private checkHatch(): void {
    const day = getWorldClock().now().day;
    for (const egg of [...this.eggs]) {
      if (isHatched(egg, day)) this.hatchEgg(egg);
    }
  }

  private hatchEgg(egg: Egg): void {
    // remove the clutch regardless of outcome so a missing parent can't wedge it forever
    this.eggs = this.eggs.filter((e) => e.id !== egg.id);
    this.eggSprites.get(egg.id)?.destroy();
    this.eggSprites.delete(egg.id);

    if (this.dinos.length >= MAX_POPULATION) return; // at cap — clutch is lost
    const pa = this.dinos.find((d) => d.name === egg.parentA);
    const pb = this.dinos.find((d) => d.name === egg.parentB);
    if (!pa || !pb) return; // a parent left the world

    const taken = new Set(this.dinos.map((d) => d.name));
    let name = childName(egg.parentA, egg.parentB);
    for (let i = 2; taken.has(name); i++) name = `${childName(egg.parentA, egg.parentB)}${i}`;

    const baby = hatch(
      egg,
      {
        traitsA: pa.traits,
        traitsB: pb.traits,
        speciesA: pa.species,
        speciesB: pb.species,
        colorA: pa.color,
        colorB: pb.color,
      },
      name,
    );
    this.born.push(baby);
    const dino = this.spawnDino(baby);
    this.showBubble(dino, `${name} hatches! 🐣`);
    this.logEvent(`🐣 ${name} hatched (${egg.parentA} + ${egg.parentB})`);
    void this.saveGame();
  }

  /** Strongest bond this dino has with any other. */
  private maxBond(name: string): number {
    let best = 0;
    for (const o of this.dinos) {
      if (o.name === name) continue;
      best = Math.max(best, bondPoints(this.bonds, name, o.name));
    }
    return best;
  }

  private isNight(): boolean {
    return dayPhase(getWorldClock().now().hour) === 'night';
  }

  private nearDen(d: Dino): boolean {
    return Math.abs(d.x - this.denCenter.x) <= TILE * 1.5 && Math.abs(d.y - this.denCenter.y) <= TILE * 1.5;
  }

  private isHuddling(d: Dino): boolean {
    return inHuddleWindow(getWorldClock().now().hour, this.currentSeason()) && this.nearDen(d);
  }

  private refreshSleepMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.sleepMarks[i];
      if (!mark) return;
      mark.setVisible(this.isHuddling(d)).setPosition(d.x, d.y - TILE);
    });
    this.refreshColdMarks();
  }

  /** The cold funk's 🥶 (BACKLOG-184) — above the 💤 slot so a dusk overlap can't stack glyphs. */
  private refreshColdMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.coldMarks[i];
      if (!mark) return;
      mark.setVisible(this.coldPending.has(d.name)).setPosition(d.x, d.y - TILE * 1.4);
    });
  }

  // ── Observer lenses (BACKLOG-021 + 020): cycle V through ways of seeing the sim ──

  private logEvent(line: string): void {
    this.eventLog = [...this.eventLog, line].slice(-12);
  }

  private dinoByName(name: string): Dino | undefined {
    return this.dinos.find((d) => d.name === name);
  }

  /** Total meetings this dino has been part of (summed over its pairs). */
  private meetingsOf(name: string): number {
    let n = 0;
    for (const key of Object.keys(this.meetings)) {
      if (key.split('|').includes(name)) n += this.meetings[key];
    }
    return n;
  }

  private rumorsOf(name: string): number {
    return recall(this.memory, name).filter((e) => e.includes(RUMOR_MARK)).length;
  }

  /** A dino's emergent role, derived from how it has actually behaved. */
  private roleOf(name: string): Role {
    return deriveRole({ meetings: this.meetingsOf(name), rumorsHeard: this.rumorsOf(name), topBond: this.maxBond(name) });
  }

  private bookRows(): BookRow[] {
    const parentsOf = new Map(this.born.map((b) => [b.name, b.parents] as const));
    return this.dinos.map((d) => ({
      name: d.name,
      species: d.species,
      hearts: heartsFromPoints(this.friendship[d.name] ?? 0),
      topBond: this.maxBond(d.name),
      role: this.roleOf(d.name),
      parents: parentsOf.get(d.name),
      rumorsHeard: this.rumorsOf(d.name),
    }));
  }

  private setupLenses(): void {
    this.bondGfx = this.add.graphics().setDepth(6).setVisible(false); // over the night overlay, under HUD
    this.bookPanel = this.add
      .text((TILE * COLS) / 2, 30, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        align: 'left',
        backgroundColor: '#000000e6',
        padding: { x: 10, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setDepth(13)
      .setVisible(false);
    this.tickerPanel = this.add
      .text(6, 36, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        align: 'left',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0, 0)
      .setDepth(13)
      .setVisible(false);
    this.lensLabel = this.add
      .text((TILE * COLS) / 2, 4, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffe0a0',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(13);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V).on('down', () => this.cycleLens());
    getWorldClock().onTick(() => this.refreshLens());

    // dev-only Playwright hooks
    (window as any).__lens = () => this.lens;
    (window as any).__cycleLens = () => {
      this.cycleLens();
      return this.lens;
    };
    (window as any).__events = () => [...this.eventLog];
    (window as any).__roles = () => {
      const out: Record<string, string> = {};
      for (const d of this.dinos) out[d.name] = this.roleOf(d.name);
      return out;
    };
    (window as any).__bookRows = () => this.bookRows();

    this.refreshLens();
  }

  private cycleLens(): void {
    this.lens = nextLens(this.lens);
    this.refreshLens();
  }

  private refreshLens(): void {
    const L = this.lens;
    this.lensLabel.setText(LENS_LABEL[L] ? `[V] ${LENS_LABEL[L]}` : '');
    this.bookPanel.setVisible(L === 'book');
    this.tickerPanel.setVisible(L === 'ticker');
    this.bondGfx.setVisible(L === 'bonds');

    // role tags float over each dino only in the roles lens
    this.roleTags.forEach((tag, i) => {
      const d = this.dinos[i];
      const show = L === 'roles' && !!d;
      tag.setVisible(show);
      if (show) {
        const r = this.roleOf(d.name);
        tag.setText(`${ROLE_ICON[r]} ${r}`).setPosition(d.x, d.y - TILE * 1.15);
      }
    });

    if (L === 'book') {
      this.bookPanel.setText(bookLines(this.bookRows()).join('\n'));
    } else if (L === 'ticker') {
      const news = tickerLines(this.eventLog);
      this.tickerPanel.setText(['— Park News —', ...(news.length ? news : ['(quiet so far…)'])].join('\n'));
    } else if (L === 'bonds') {
      this.bondGfx.clear();
      for (const p of bondedPairs(this.bonds, HUDDLE_THRESHOLD)) {
        const a = this.dinoByName(p.a);
        const b = this.dinoByName(p.b);
        if (!a || !b) continue;
        this.bondGfx.lineStyle(Math.max(1, Math.round(p.points / 18)), 0xff6fae, 0.6);
        this.bondGfx.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
  }

  private setupMovement(): void {
    getWorldClock().onTick(() => {
      // Wander every 5 in-game minutes so the park mills about without jittering.
      if (++this.moveTicks % 5 === 0) this.forceStep();
    });

    // any: dev-only Playwright hooks
    (window as any).__dinoPositions = () => this.dinos.map((d) => ({ name: d.name, x: d.x, y: d.y }));
    // any: dev-only Playwright hook — a dino's procedural-art anim key + whether it's playing
    (window as any).__dinoArt = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? { artKey: d.artKey, animating: d.isAnimating() } : null;
    };
    // any: dev-only Playwright hook — does a species have a procedural rig? The art e2e use
    // this for the rectangle-fallback control now that every cast member is drawn (BACKLOG-034).
    (window as any).__hasArt = (species: string) => hasArt(species);
    (window as any).__meetings = () => ({ ...this.meetings });
    (window as any).__stepWorld = () => {
      this.forceStep();
      return this.dinos.map((d) => ({ name: d.name, x: d.x, y: d.y }));
    };
    // At dawn each dino folds its recent events into a one-line reflection.
    getWorldClock().onHour((t) => {
      if (t.hour !== 6) return;
      for (const d of this.dinos) {
        const events = recall(this.memory, d.name);
        if (events.length) this.memory = remember(this.memory, d.name, reflect(events));
      }
      void this.saveGame();
    });

    (window as any).__memory = () => ({ ...this.memory });
    // dev-only: tone state (BACKLOG-142) — friendship points, last-tone map, and live menu.
    (window as any).__friendship = () => ({ ...this.friendship });
    (window as any).__lastTone = () => ({ ...this.lastTone });
    (window as any).__toneMenuOpen = () => this.toneMenuOpen;
    (window as any).__toneMenuText = () => (this.toneMenuOpen ? this.toneMenuText : null);
    // dev-only: open the tone menu for a named dino, then pick a tone — drives the flow
    // without positioning the player. Returns the pickTone promise.
    (window as any).__pickTone = (name: string, id: ToneId) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return Promise.resolve();
      this.openToneMenu(d);
      return this.pickTone(id);
    };
    // dev-only: just open the menu for a named dino (to read the remembered-trace header)
    (window as any).__openToneMenu = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d) this.openToneMenu(d);
      return this.toneMenuText;
    };
    // dev-only: spread one piece of gossip speaker→listener, returns the planted rumor
    (window as any).__spreadGossip = (a: string, b: string) => {
      const g = spreadGossip(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    // dev-only: word of the cold (BACKLOG-185) — a cold-slept speaker leads with the cold news.
    (window as any).__spreadColdWord = (a: string, b: string) => {
      const g = spreadColdWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    (window as any).__coldWord = (speaker: string) => coldWordLine(speaker);
    // dev-only: plant a first-hand cold memory without staging a winter night.
    (window as any).__rememberCold = (name: string) => {
      this.memory = remember(this.memory, name, coldMemory());
    };
    (window as any).__lastConversation = () => this.lastConversation;
    (window as any).__forceConverse = async () => {
      if (this.dinos.length >= 2) {
        this.convoCooldown = 0;
        this.convoInFlight = false;
        await this.converse(this.dinos[0], this.dinos[1]);
      }
      return this.lastConversation;
    };
  }

  private tileOf(d: Dino): { tileX: number; tileY: number } {
    return { tileX: Math.round((d.x - TILE / 2) / TILE), tileY: Math.round((d.y - TILE / 2) / TILE) };
  }

  private nearestOther(d: Dino): Dino | null {
    let best: Dino | null = null;
    let bestDist = Infinity;
    for (const o of this.dinos) {
      if (o === d) continue;
      const dist = Phaser.Math.Distance.Between(d.x, d.y, o.x, o.y);
      if (dist < bestDist) {
        best = o;
        bestDist = dist;
      }
    }
    return best;
  }

  /** One wander + meeting step for every dino (used by the throttled tick and the dev hook). */
  private forceStep(): void {
    if (this.convoCooldown > 0) this.convoCooldown--;

    // A world-scale night event (BACKLOG-144) overrides all wandering: the whole cast gathers to
    // gawp at the sky. When it ends (duration/dawn) stepSky returns false and ordinary life resumes.
    if (this.stepSky()) {
      this.refreshSleepMarks();
      return;
    }

    const season = this.currentSeason();
    const denTime = inHuddleWindow(getWorldClock().now().hour, season);
    for (const d of this.dinos) {
      const cur = this.tileOf(d);

      // First contact (BACKLOG-161): the armed inspector beelines for the new watcher,
      // ignoring food and friends until it gets its look (or loses interest — ttl below).
      if (this.pendingInspect?.name === d.name) {
        const step = stepToward(cur, this.playerTile(), COLS, ROWS);
        d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
        continue;
      }

      // Distress response (BACKLOG-194): the friend that heard the cry walks toward the
      // caller's LIVE tile (it may have bolted as it cried). Below inspection in priority.
      if (this.pendingRespond?.name === d.name) {
        const caller = this.dinoByName(this.pendingRespond.caller);
        if (caller) {
          const step = stepToward(cur, this.tileOf(caller), COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          continue;
        }
      }

      // Food on the ground pulls eager, nearby dinos toward it (BACKLOG-059) — overrides
      // wandering. A dino rushes its favorite harder: wider range, lower bar (BACKLOG-061).
      if (this.food && this.foodLanded) {
        const dist = Math.hypot(cur.tileX - this.food.tileX, cur.tileY - this.food.tileY);
        const isFav = !!this.foodKind && this.foodKind.id === favoriteFood(d.traits, this.currentSeason()).id;
        if (reactionToFood(d.traits.energy, dist, isFav) === 'rush') {
          const step = feedStep(cur, this.food, COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          continue;
        }
      }

      const other = this.nearestOther(d);
      let next;
      if (denTime && this.maxBond(d.name) >= huddleThreshold(season)) {
        // Huddle hours: bonded-enough dinos head for the den to sleep together.
        // Winter opens the window at dusk and lowers the bar; summer waits until late.
        next = stepToward(cur, HUDDLE_TILE, COLS, ROWS);
      } else if (other && Math.random() < 0.45) {
        // Day: ~45% of the time drift toward the nearest dino so the park clusters and converses.
        next = stepToward(cur, this.tileOf(other), COLS, ROWS);
      } else {
        next = wanderStep(cur, Math.floor(Math.random() * 5), COLS, ROWS);
      }
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);
    }

    for (let i = 0; i < this.dinos.length; i++) {
      for (let j = i + 1; j < this.dinos.length; j++) {
        const a = this.dinos[i];
        const b = this.dinos[j];
        if (Math.abs(a.x - b.x) <= TILE * 1.01 && Math.abs(a.y - b.y) <= TILE * 1.01) {
          this.meetings = recordMeet(this.meetings, a.name, b.name);
          this.bonds = strengthen(this.bonds, a.name, b.name, BOND_PER_MEET); // meeting (and huddling) deepens the bond
          this.flashMeet(a, b);
          // Governor (BACKLOG-107): ambient chatter yields when nobody watches or power is low.
          if (
            this.convoCooldown <= 0 &&
            !this.convoInFlight &&
            allowAmbient({ hidden: this.tabHidden, battery: this.batteryLevel })
          )
            void this.converse(a, b);
        }
      }
    }

    this.stepInspection();
    this.stepResponder();

    // Cold-night shiver (BACKLOG-179): note the season the night belongs to; when the night's
    // huddle window closes in the morning, resolve who slept cold. `denTime` is the live window.
    if (denTime) {
      // Dusk thaws any funk the keeper never mended (BACKLOG-184). Fires once, on the window's
      // opening edge. Nobody came (BACKLOG-208): each still-funked dino files the colder note
      // *before* the funk clears — neglect as legible as care; it compounds with the morning's
      // cold memory and tinges the next greeting. Silent in-world: a memory, not a beat.
      if (!this.wasInHuddleWindow && this.coldPending.size) {
        for (const name of this.coldPending) this.memory = remember(this.memory, name, neglectMemory());
        this.coldPending.clear();
        this.refreshColdMarks();
        void this.saveGame();
      }
      this.nightSeason = season;
    } else if (this.wasInHuddleWindow) this.resolveColdMorning();
    this.wasInHuddleWindow = denTime;

    this.refreshSleepMarks();
    this.checkFeeding();
    this.maybeLayEggs();
    this.checkHatch();
  }

  /**
   * The morning a night window closes: every dino too loosely bonded for the den — its strongest
   * bond below the season's huddle bar, the same gate cycle-171 used to *seek* the den — slept
   * cold (winter only; `sleptCold` is inert in the warm seasons). It shivers where it stands and
   * files a memory that rides the existing store into its next greeting. Once per night, on the edge.
   */
  private resolveColdMorning(): void {
    const bar = huddleThreshold(this.nightSeason);
    const cold: string[] = [];
    const lonely: Array<{ name: string; level: number }> = [];
    for (const d of this.dinos) {
      const best = this.maxBond(d.name);
      const huddled = best >= bar;
      if (!sleptCold(huddled, this.nightSeason)) continue;
      this.showBubble(d, coldShiver());
      this.memory = remember(this.memory, d.name, coldMemory());
      cold.push(d.name);
      lonely.push({ name: d.name, level: best });
    }
    this.lastColdSleepers = cold;
    // Every cold sleeper carries the funk until the keeper mends it or dusk thaws it (BACKLOG-184).
    this.coldPending = new Set(cold);
    this.refreshColdMarks();
    // The loneliest shiver finds a voice (BACKLOG-194): one cold cry per morning.
    const crier = mostDistressed(lonely);
    if (crier) {
      const d = this.dinoByName(crier);
      if (d) this.cryDistress(d, 'cold');
    }
    if (cold.length) void this.saveGame();
  }

  private playerTile(): { tileX: number; tileY: number } {
    return { tileX: Math.floor(this.player.x / TILE), tileY: Math.floor(this.player.y / TILE) };
  }

  /**
   * Resolve the armed first contact once per world step: arrival lands the 👀 beat + memory,
   * the ttl running out means the player outran a dino's curiosity. Runs after the movement
   * loop so the arrival check sees the inspector's new position.
   */
  private stepInspection(): void {
    if (!this.pendingInspect) return;
    const d = this.dinoByName(this.pendingInspect.name);
    if (!d) {
      this.pendingInspect = null;
      return;
    }
    if (Math.abs(d.x - this.player.x) <= TILE * 1.01 && Math.abs(d.y - this.player.y) <= TILE * 1.01) {
      const keeper = keeperById(this.keeperId);
      this.showBubble(d, inspectLine(d.name));
      this.memory = remember(this.memory, d.name, inspectMemory(keeper.name));
      this.lastInspection = { name: d.name, keeperId: keeper.id };
      this.pendingInspect = null;
      return;
    }
    this.pendingInspect = { ...this.pendingInspect, ttl: this.pendingInspect.ttl - 1 };
    if (this.pendingInspect.ttl <= 0) this.pendingInspect = null;
  }

  /**
   * Resolve the distress response once per world step (BACKLOG-194): adjacency to the
   * caller ends the walk; otherwise the step budget drains and the responder gives up.
   * Sits beside stepInspection, so a sky event freezes it the same way.
   */
  private stepResponder(): void {
    if (!this.pendingRespond) return;
    const friend = this.dinoByName(this.pendingRespond.name);
    const caller = this.dinoByName(this.pendingRespond.caller);
    if (!friend || !caller) {
      this.pendingRespond = null;
      return;
    }
    if (Math.abs(friend.x - caller.x) <= TILE * 1.01 && Math.abs(friend.y - caller.y) <= TILE * 1.01) {
      this.pendingRespond = null;
      return;
    }
    this.pendingRespond = { ...this.pendingRespond, steps: this.pendingRespond.steps - 1 };
    if (this.pendingRespond.steps <= 0) this.pendingRespond = null;
  }

  /** One dino remarks on meeting another — a floating speech bubble via the shared brain. */
  private async converse(a: Dino, b: Dino): Promise<void> {
    if (this.convoInFlight) return;
    this.convoInFlight = true;
    // Protect the single shared engine; phones chatter at a third the rate (governor).
    this.convoCooldown = convoCooldownSteps(this.coarsePointer);
    try {
      const now = getWorldClock().now();
      const reply = await this.npcBrain.respond(
        {
          name: a.name,
          species: a.species,
          personality: a.personality,
          traits: a.traits,
          timeOfDay: dayPhase(now.hour),
        },
        { kind: 'npc_meet', detail: `${b.name} the ${b.species} wanders up` },
      );
      this.lastConversation = { speaker: a.name, text: reply.text, source: reply.source };
      this.memory = remember(this.memory, a.name, `you ran into ${b.name} the ${b.species}`);
      // Gossip: the speaker passes news to the listener (BACKLOG-019). A dino that slept cold
      // leads with the word of the cold (BACKLOG-185), else the generic most-recent retelling.
      const cold = spreadColdWord(this.memory, a.name, b.name);
      const gossip = cold.rumor ? cold : spreadGossip(this.memory, a.name, b.name);
      this.memory = gossip.store;
      if (cold.rumor) this.logEvent(`🥶 ${b.name} heard about ${a.name}'s cold night`);
      else if (gossip.rumor) this.logEvent(`🗣️ ${b.name} heard news about ${a.name}`);
      this.chirpFor(a); // the speaker calls in its own voice (BACKLOG-191)
      this.showBubble(a, `${replyPrefix(reply.source)}${reply.text}`);
    } finally {
      this.convoInFlight = false;
    }
  }

  /** Fold the homecoming's memories into the store: the homecomer's, plus a near-tied runner-up's sulk (BACKLOG-120). */
  private applyHomecomingMemory(hc: Homecoming): void {
    this.memory = remember(this.memory, hc.name, hc.memory);
    if (hc.jealous) this.memory = remember(this.memory, hc.jealous.name, hc.jealous.memory);
  }

  /** Float the welcome-back line over the closest dino; if a near-tied rival is jealous, float its sulk too (BACKLOG-112/120). */
  private playHomecoming(): void {
    const hc = this.lastHomecoming;
    if (!hc) return;
    this.lastComfort = null;
    const dino = this.dinos.find((d) => d.name === hc.name);
    if (dino) this.showBubble(dino, hc.line);
    if (hc.jealous) {
      const rival = this.dinos.find((d) => d.name === hc.jealous!.name);
      if (rival) this.showBubble(rival, hc.jealous.line);
      // The slighted dino now waits for a make-up greet (BACKLOG-125).
      this.pendingRepair = hc.jealous.name;
      // ...and a friend crosses over to console it: a dino it once consoled comes first
      // (gratitude echo, BACKLOG-132), else its closest friend above the floor (BACKLOG-130).
      const who = comforter(hc.jealous.name, this.bonds, this.dinos.map((d) => d.name), this.gratitude);
      if (who) {
        const friend = this.dinos.find((d) => d.name === who);
        if (friend && rival) {
          // Nudge the friend a step toward the sulker so the 🫂 reads as consolation.
          const step = stepToward(this.tileOf(friend), this.tileOf(rival), COLS, ROWS);
          friend.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
        }
        if (friend) this.showBubble(friend, comfortLine(who, hc.jealous.name));
        this.bonds = strengthen(this.bonds, who, hc.jealous.name, COMFORT_BOND);
        this.memory = remember(this.memory, hc.jealous.name, comfortMemory(who));
        // The consoled dino files who came for it, so it can echo the favor later (BACKLOG-132).
        this.gratitude = recordGratitude(this.gratitude, hc.jealous.name, who);
        this.lastComfort = { comforter: who, sulker: hc.jealous.name };
      }
    }
  }

  private showBubble(d: Dino, text: string): void {
    const bubble = this.add
      .text(d.x, d.y - TILE * 1.4, text, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: TILE * 5 },
        backgroundColor: '#2a2a3acc',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(12);
    this.liveBubbles.add(text);
    this.time.delayedCall(3500, () => {
      bubble.destroy();
      this.liveBubbles.delete(text);
    });
  }

  private addControlsHint(): void {
    // Build stamp — short HH:MM:SS of the running build so a restart is visible in-game.
    const stamp = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__.slice(11, 19) : '?';
    const buildText = this.add
      .text(6, 20, `build ${stamp}`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#7fa',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setDepth(11);

    // The full key reference lives in a toggled panel: the old one-line hint was
    // wider than the canvas itself and ran under the gift HUD and the plaque.
    this.helpPanel = this.add
      .text((TILE * COLS) / 2, (TILE * ROWS) / 2, helpLines().join('\n'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'left',
        backgroundColor: '#000000e6',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(14)
      .setVisible(false);

    this.helpChip = this.add
      .text(TILE * COLS - 6, TILE * ROWS - 6, HELP_CHIP, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 1)
      .setDepth(11);

    // ? and / share a physical key on most layouts; 191 is that key's code.
    this.input.keyboard!.addKey(191).on('down', () => this.toggleHelp());

    // Fade these with the rest of the HUD in ambient mode.
    this.hudElements.push(buildText, this.helpChip);

    // any: dev-only Playwright hook — is the help panel up?
    (window as any).__helpOpen = () => this.helpPanel.visible;
  }

  private toggleHelp(): void {
    this.helpPanel.setVisible(!this.helpPanel.visible);
  }

  /** True when a screen point lands on the [?] chip or the open help panel. */
  private helpUiOwns(px: number, py: number): boolean {
    if (this.helpChip?.visible && this.helpChip.getBounds().contains(px, py)) return true;
    if (this.helpPanel?.visible && this.helpPanel.getBounds().contains(px, py)) return true;
    return false;
  }

  private flashMeet(a: Dino, b: Dino): void {
    for (const d of [a, b]) {
      d.label.setColor('#ffe066');
      this.time.delayedCall(400, () => d.label.setColor('#ffffff'));
    }
  }

  private setupBrainHud(): void {
    this.brainHud = this.add
      .text(TILE * COLS - 6, 4, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#cfe8ff',
        align: 'right',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setOrigin(1, 0)
      .setDepth(11);

    const label: Record<string, string> = {
      idle: '🧠 zzz',
      loading: '🧠 thinking…',
      ready: '🧠 ready',
      fallback: '🧠 offline',
    };
    const refresh = () => {
      if (this.brainKindNow === 'stub') {
        this.brainHud.setText('🧠 off'); // minds not enabled on this device (governor)
        return;
      }
      const s = this.npcBrain.status?.() ?? '';
      // A GB-class download must not read as a frozen "thinking…" — show the fetch %.
      const text =
        s === 'loading' && loadProgress() > 0
          ? `🧠 downloading ${Math.round(loadProgress() * 100)}%`
          : (label[s] ?? '🧠 —');
      this.brainHud.setText(text);
    };
    refresh();
    getWorldClock().onTick(refresh);

    // any: dev-only Playwright hook — the model tier picked for this device
    (window as any).__modelInfo = () => currentModel();
    // any: dev-only Playwright hook — source of the most recent reply
    (window as any).__lastReplySource = () =>
      (this.npcBrain as { lastReplySource?: () => unknown }).lastReplySource?.() ?? null;
    // any: dev-only Playwright hook — the enriched system prompt for a named dino
    (window as any).__greetPrompt = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return null;
      const now = getWorldClock().now();
      const msgs = buildMessages(
        {
          name: d.name,
          species: d.species,
          personality: d.personality,
          traits: d.traits,
          timeOfDay: dayPhase(now.hour),
          affection: heartsFromPoints(this.friendship[d.name] ?? 0),
          recentMemory: recall(this.memory, d.name),
        },
        { kind: 'player_greet' },
      );
      return msgs[0].content;
    };
  }

  // ────────────── Minds policy + inference governor (BACKLOG-107) ──────────────

  private readMindsConsent(): boolean | null {
    try {
      const v = localStorage.getItem(MINDS_CONSENT_KEY);
      return v === 'on' ? true : v === 'off' ? false : null;
    } catch {
      return null; // storage denied — treat as never-asked
    }
  }

  /** Visibility + battery listeners feeding the ambient gate, plus the dev hooks. */
  private setupGovernor(): void {
    document.addEventListener('visibilitychange', () => {
      this.tabHidden = document.hidden;
    });
    const nav = navigator as unknown as {
      getBattery?: () => Promise<{ level: number; addEventListener(ev: string, fn: () => void): void }>;
    };
    void nav.getBattery?.().then((b) => {
      this.batteryLevel = b.level;
      b.addEventListener('levelchange', () => (this.batteryLevel = b.level));
    });

    // The bowl's voicebox (BACKLOG-191): a dino calls in its own trait-derived voice.
    // Intent is recorded here (not in voice.ts) so headless tests never depend on playback.
    // any: dev-only Playwright hooks for the audio spine
    (window as any).__lastSound = () => this.lastSound;
    (window as any).__soundMuted = () => soundMuted();
    (window as any).__audioState = () => audioState();

    // any: dev-only Playwright hooks — which brain runs, and the live ambient verdict
    (window as any).__brainKind = () => this.brainKindNow;
    (window as any).__mindsConfirmOpen = () => this.mindsConfirm !== null;
    (window as any).__mindsConfirmMode = () => this.mindsConfirm;
    (window as any).__mindsCache = () => this.lastCacheAction;
    (window as any).__governor = () => ({
      coarse: this.coarsePointer,
      consent: this.readMindsConsent(),
      hidden: this.tabHidden,
      battery: this.batteryLevel,
      ambientAllowed: allowAmbient({ hidden: this.tabHidden, battery: this.batteryLevel }),
      cooldownSteps: convoCooldownSteps(this.coarsePointer),
    });
  }

  /** A dino speaks in its own voice — chirp params derived from its traits (BACKLOG-191). */
  private chirpFor(d: Dino): void {
    if (soundMuted()) return;
    const params = chirpParams(d.traits);
    this.lastSound = { kind: 'chirp', name: d.name, params };
    playChirp(params);
  }

  /**
   * A dino cries out in distress (BACKLOG-194) and its closest friend — picked by the
   * exact cycle-33/34 consolation rules — turns toward the sound. The cry is diegetic:
   * the dinos hear it whether or not the keeper's device is muted, so the social beat
   * (responder, bubble, memory, walk) always fires; mute gates only playback intent.
   */
  private cryDistress(d: Dino, trigger: 'startle' | 'cold'): void {
    const params = distressParams(d.traits);
    this.lastDistress = { name: d.name, trigger, params };
    if (!soundMuted()) {
      this.lastSound = { kind: 'chirp', name: d.name, params };
      playChirp(params);
    }
    const who = comforter(d.name, this.bonds, this.dinos.map((x) => x.name), this.gratitude);
    if (!who) return; // no friend over the floor — the cry hangs unanswered
    const friend = this.dinoByName(who);
    if (!friend) return;
    this.pendingRespond = { name: who, caller: d.name, steps: DISTRESS_STEPS };
    this.showBubble(friend, hearLine(d.name));
    this.memory = remember(this.memory, who, heardMemory(d.name));
  }

  /** Swap the shared brain in place; every dino picks it up on its next line. */
  private setBrain(kind: BrainKind): void {
    if (kind === this.brainKindNow) return;
    this.brainKindNow = kind;
    this.npcBrain = makeBrain(kind);
    if (kind === 'webllm') {
      // Start the download now, while the keeper is looking at the progress HUD —
      // not on the first greet minutes later. init is WebLLM-specific, hence optional.
      void (this.npcBrain as { init?: () => Promise<void> }).init?.();
    }
  }

  /**
   * The 🧠 row in the More sheet. Off → consent dialog (notes when the weights are
   * already cached). On → if weights are cached, the off/keep/delete choice
   * (phone storage is small — operator, 2026-06-11); nothing cached → straight off.
   */
  private async onMindsButton(): Promise<void> {
    this.sheetOpen = false;
    if (this.brainKindNow === 'webllm') {
      const status = mindsStatusLine(this.npcBrain.status?.(), loadProgress());
      if (await hasCachedModel()) {
        this.mindsConfirm = 'disable';
        this.dialogOpen = true;
        this.dialog.show(`${status}\n${mindsOffLines('tiny')}`);
        return;
      }
      // Consent is on but nothing is cached — the load failed or never ran.
      // Show what happened rather than silently flipping off (operator: "is it really on?").
      this.turnMindsOff();
      this.dialog.show(`${status}\n${mindsLabel(false)} — the dinos speak from memory now.`);
      this.dialogOpen = true;
      return;
    }
    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    const cached = await hasCachedModel();
    this.mindsConfirm = 'enable';
    this.dialogOpen = true;
    // Phones are clamped to the smallest model, so the consent dialog quotes exactly it.
    this.dialog.show(consentLines(MODELS.tiny.label, 'tiny', saveData, cached));
  }

  private turnMindsOff(): void {
    try {
      localStorage.setItem(MINDS_CONSENT_KEY, 'off');
    } catch { /* storage denied — the swap still applies this session */ }
    this.setBrain('stub');
  }

  private confirmMinds(): void {
    this.mindsConfirm = null;
    try {
      localStorage.setItem(MINDS_CONSENT_KEY, 'on');
    } catch { /* storage denied — enable for this session anyway */ }
    this.setBrain('webllm');
    this.dialog.show(`${mindsLabel(true)} — downloading. The 🧠 up top shows progress; lines upgrade when it lands.`);
    this.dialogOpen = true;
  }

  /** The off/keep/delete choice: [1] keep the cache, [2] free the storage. */
  private confirmMindsOff(deleteCache: boolean): void {
    this.mindsConfirm = null;
    this.turnMindsOff();
    if (!deleteCache) {
      this.dialog.show(`${mindsLabel(false)} — download kept, re-enable is instant.`);
      this.dialogOpen = true;
      return;
    }
    this.dialog.show(`${mindsLabel(false)} — deleting the download…`);
    this.dialogOpen = true;
    void deleteCachedModel().then((ok) => {
      this.lastCacheAction = ok ? 'deleted' : 'error';
      // Update the line only if the keeper is still looking at this dialog.
      if (this.dialogOpen && !this.mindsConfirm) {
        this.dialog.show(
          ok
            ? `${mindsLabel(false)} — download deleted, storage freed. (Fully unloads from memory on next launch.)`
            : `${mindsLabel(false)} — minds are off, but the delete failed. Clearing site data also removes it.`,
        );
      }
    });
  }

  private closeMindsConfirm(): void {
    this.mindsConfirm = null;
    this.dialog.hide();
    this.dialogOpen = false;
  }

  // ─────────────────── Touch controls (BACKLOG-189) ───────────────────

  /** Build the control layer on coarse-pointer devices; `__setTouch` lets e2e force it. */
  private setupTouchControls(): void {
    // pointer:coarse = the PRIMARY input is a finger (phone/tablet). Deliberately not
    // maxTouchPoints — a touch-capable laptop with a mouse keeps the desktop view.
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    if (coarse) this.enableTouch();

    // any: dev-only Playwright hooks — force the layer on/off, read the drag vector/layout
    (window as any).__setTouch = (on: boolean) => (on ? this.enableTouch() : this.disableTouch());
    (window as any).__touchEnabled = () => this.touchEnabled;
    (window as any).__touchOwns = (x: number, y: number) => this.touchUiOwns(x, y);
    (window as any).__touchVec = () => ({ ...this.touchVec });
    (window as any).__touchLayout = () => ({
      stick: { ...STICK },
      buttons: actionButtons(this.scale.width, this.scale.height),
      sheet: sheetRows(this.scale.width),
      chips: menuChips(this.scale.width, this.scale.height, true),
    });
  }

  private enableTouch(): void {
    if (this.touchEnabled) return;
    this.touchEnabled = true;
    this.input.addPointer(2); // stick + a button in the same moment

    const W = this.scale.width;
    const H = this.scale.height;
    const vis = (o: Phaser.GameObjects.GameObject) => o as unknown as { setVisible(v: boolean): void };

    // Stick: an oversized invisible grab ring so thumbs land easily, base + thumb visuals.
    const grab = this.add.circle(STICK.x, STICK.y, STICK.grab, 0xffffff, 0.001).setInteractive();
    const base = this.add.circle(STICK.x, STICK.y, STICK.r, 0x10241c, 0.4).setStrokeStyle(2, 0x8fd14f, 0.5);
    this.stickThumb = this.add.circle(STICK.x, STICK.y, STICK.thumb, 0x8fd14f, 0.55);
    this.stickGroup = [grab, base, this.stickThumb];

    grab.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.stickPointerId = p.id;
      this.dragStick(p.x, p.y);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.touchEnabled && p.id === this.stickPointerId) this.dragStick(p.x, p.y);
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.stickPointerId) return;
      this.stickPointerId = -1;
      this.touchVec = { x: 0, y: 0 };
      this.stickThumb?.setPosition(STICK.x, STICK.y);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // Buttons/sheet/chips carry NO per-object handlers: a per-object pointerdown
    // and the scene-level pointerdown both fire for one tap, and a handler that
    // mutates dialog state mid-tap makes the second dispatch misread the target
    // (the ◀ chip's prev() was instantly undone by a body-tap next()). All taps
    // resolve once, from pre-tap state, in dispatchTouchTap().
    this.actionGroup = [];
    for (const b of actionButtons(W, H)) {
      const c = this.add.circle(b.x, b.y, b.r, 0x10241c, 0.5).setStrokeStyle(2, 0x8fd14f, 0.6);
      const t = this.add
        .text(b.x, b.y, b.label, { fontFamily: 'monospace', fontSize: '18px', color: '#e8e8d6' })
        .setOrigin(0.5);
      this.actionGroup.push(c, t);
    }

    this.sheetGroup = [];
    for (const r of sheetRows(W)) {
      const rect = this.add.rectangle(r.x, r.y, r.w, r.h, 0x10241c, 0.85).setStrokeStyle(1, 0x8fd14f, 0.5);
      const t = this.add
        .text(r.x - r.w / 2 + 8, r.y, r.label, { fontFamily: 'monospace', fontSize: '13px', color: '#e8e8d6' })
        .setOrigin(0, 0.5);
      this.sheetGroup.push(rect, t);
    }

    this.chipGroups = [];
    for (const chip of menuChips(W, H, true)) {
      const rect = this.add
        .rectangle(chip.x, chip.y, chip.w, chip.h, 0x10241c, 0.85)
        .setStrokeStyle(2, 0x8fd14f, 0.7);
      const t = this.add
        .text(chip.x, chip.y, chip.label, { fontFamily: 'monospace', fontSize: '16px', color: '#e8e8d6' })
        .setOrigin(0.5);
      this.chipGroups.push({ id: chip.id, objs: [rect, t] });
    }

    this.touchObjects = [
      ...this.stickGroup,
      ...this.actionGroup,
      ...this.sheetGroup,
      ...this.chipGroups.flatMap((c) => c.objs),
    ];
    for (const o of this.touchObjects) {
      (o as unknown as { setScrollFactor(n: number): void }).setScrollFactor(0);
      (o as unknown as { setDepth(n: number): void }).setDepth(20);
    }
    for (const o of this.sheetGroup) vis(o).setVisible(false);

    // Keyboard chrome makes no sense under a thumb: hide the [?] chip + panel,
    // and move the held-item line out of the stick's bottom-left corner.
    this.helpChip?.setVisible(false);
    this.helpPanel?.setVisible(false);
    this.layoutGiftHud();

    this.syncTouchUi();
  }

  private disableTouch(): void {
    if (!this.touchEnabled) return;
    this.touchEnabled = false;
    this.stickPointerId = -1;
    this.touchVec = { x: 0, y: 0 };
    this.sheetOpen = false;
    for (const o of this.touchObjects) o.destroy();
    this.touchObjects = [];
    this.stickGroup = [];
    this.actionGroup = [];
    this.sheetGroup = [];
    this.chipGroups = [];
    this.stickThumb = null;
    this.helpChip?.setVisible(true);
    this.layoutGiftHud();
  }

  private dragStick(px: number, py: number): void {
    this.touchVec = stickVector(px, py);
    this.stickThumb?.setPosition(
      STICK.x + this.touchVec.x * (STICK.r - 8),
      STICK.y + this.touchVec.y * (STICK.r - 8),
    );
  }

  private onTouchButton(id: string): void {
    switch (id) {
      case 'talk': this.handleInteract(); break;
      case 'feed': this.dropFood(); break;
      case 'more': this.sheetOpen = !this.sheetOpen; this.syncTouchUi(); break;
      case 'minds': void this.onMindsButton(); break;
      case 'sound': setSoundMuted(!soundMuted()); break;
      case 'gift': this.giveGift(); break;
      case 'item': this.cycleItem(1); break;
      case 'lens': this.cycleLens(); break;
      case 'hearts': this.toggleHearts(); break;
      case 'keeper': this.sheetOpen = false; this.openKeeperPicker(); break;
      case 'scan': this.toggleScan(); break;
      case 'time': this.toggleScale(); break;
      case 'export': this.sheetOpen = false; this.exportSave(); break;
      case 'pick1': this.onNumberKey(1); break;
      case 'pick2': this.onNumberKey(2); break;
      case 'pick3': this.onNumberKey(3); break;
      case 'back': this.dialog.prev(); break;
      case 'close': this.dismissDialog(); break; // ✕ always closes, even mid-pages
    }
  }

  /**
   * Swap the layer with dialog state: stick + buttons while playing, [1][2][3][✕]
   * chips while a dialog is up (numbers only when a 1/2/3 menu is actually open).
   */
  private syncTouchUi(): void {
    if (!this.touchEnabled) return;
    const vis = (o: Phaser.GameObjects.GameObject) => o as unknown as { setVisible(v: boolean): void };
    const dialogUp = this.dialogOpen;
    for (const o of [...this.stickGroup, ...this.actionGroup]) vis(o).setVisible(!dialogUp);
    for (const o of this.sheetGroup) vis(o).setVisible(!dialogUp && this.sheetOpen);
    const numbered = this.toneMenuOpen || this.keeperPickerOpen || this.mindsConfirm !== null;
    const paged = dialogUp && this.dialog.pageInfo().page > 0;
    for (const { id, objs } of this.chipGroups) {
      const show = dialogUp && (id === 'close' || (id === 'back' ? paged : numbered));
      for (const o of objs) vis(o).setVisible(show);
    }
    // A dialog opening mid-drag releases the stick — update() stops moving the player anyway.
    if (dialogUp && this.stickPointerId !== -1) {
      this.stickPointerId = -1;
      this.touchVec = { x: 0, y: 0 };
      this.stickThumb?.setPosition(STICK.x, STICK.y);
    }
  }

  /** The currently-visible chip at (px,py), if any. */
  private chipIdAt(px: number, py: number): string | null {
    if (!this.touchEnabled || !this.dialogOpen) return null;
    const numbered = this.toneMenuOpen || this.keeperPickerOpen || this.mindsConfirm !== null;
    const paged = this.dialog.pageInfo().page > 0;
    const hit = menuChips(this.scale.width, this.scale.height, true).find(
      (c) => (c.id === 'close' || (c.id === 'back' ? paged : numbered)) && inRect(c, px, py),
    );
    return hit?.id ?? null;
  }

  /** Resolve a UI-owned tap to its action — ONCE, from pre-tap state. */
  private dispatchTouchTap(px: number, py: number): void {
    if (this.dialogOpen) {
      const chip = this.chipIdAt(px, py);
      if (chip) this.onTouchButton(chip);
      else this.dialog.next(); // a tap on the dialog body is the GBA A-button
      return;
    }
    const button = actionButtons(this.scale.width, this.scale.height).find((b) =>
      inCircle(b.x, b.y, b.r, px, py),
    );
    if (button) {
      this.onTouchButton(button.id);
      return;
    }
    if (this.sheetOpen) {
      const row = sheetRows(this.scale.width).find((r) => inRect(r, px, py));
      if (row) this.onTouchButton(row.id);
    }
    // Anything else owned (the stick grab ring) is handled by the stick's own listener.
  }

  /** Does a pointer at canvas (px,py) land on the control layer? Guards the glass tap. */
  private touchUiOwns(px: number, py: number): boolean {
    if (!this.touchEnabled) return false;
    // A dialog is modal on touch: EVERY tap belongs to the UI while one is up.
    // Taps on the dialog text (e.g. "[1] Warm") were falling through to the glass,
    // startling nearby dinos on every menu pick (operator phone session).
    if (this.dialogOpen) return true;
    if (inCircle(STICK.x, STICK.y, STICK.grab, px, py)) return true;
    if (actionButtons(this.scale.width, this.scale.height).some((b) => inCircle(b.x, b.y, b.r, px, py))) return true;
    return this.sheetOpen && sheetRows(this.scale.width).some((r) => inRect(r, px, py));
  }

  update(): void {
    // Runs before the dialog early-return: the chips/stick swap tracks dialog state.
    this.syncTouchUi();
    if (this.dialogOpen) return;

    const speed = 2;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    if (left) this.player.x -= speed;
    if (right) this.player.x += speed;
    if (up) this.player.y -= speed;
    if (down) this.player.y += speed;

    const touching = this.touchVec.x !== 0 || this.touchVec.y !== 0;
    if (touching) {
      this.player.x += this.touchVec.x * speed;
      this.player.y += this.touchVec.y * speed;
    }

    // Held movement keys don't refire keydown events, so count them as activity here.
    if (left || right || up || down || touching) {
      this.lastInputAt = this.time.now;
      if (this.ambientActive) this.exitAmbient();
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, TILE / 2, TILE * COLS - TILE / 2);
    this.player.y = Phaser.Math.Clamp(this.player.y, TILE / 2, TILE * ROWS - TILE / 2);

    this.applyIdle();
  }

  private handleInteract(): void {
    // GBA-style paging: with more text to read, E/Z turns the page first; the
    // dismiss/cancel below only fires from the last page. (The ✕ chip skips this.)
    if (this.dialogOpen && this.dialog.next()) return;
    if (this.dialogOpen) {
      this.dismissDialog();
      return;
    }

    const target = this.nearestDino();
    if (!target) return;

    // Greeting is now a choice (BACKLOG-142): open the tone menu; the reply comes after a pick.
    this.openToneMenu(target);
  }

  /** Open the Warm/Tease/Honest menu for a dino, showing the remembered last-tone trace. */
  private openToneMenu(target: Dino): void {
    this.toneTarget = target;
    this.toneMenuOpen = true;
    this.dialogOpen = true;
    const options = TONES.map((t, i) => `[${i + 1}] ${t.label}`).join('  ');
    const trace = lastToneLine(this.lastTone[target.name]);
    this.toneMenuText = `Greet ${target.name} — ${options}` + (trace ? `\n${trace}` : '');
    this.dialog.show(this.toneMenuText);
  }

  private closeToneMenu(): void {
    this.toneMenuOpen = false;
    this.toneTarget = null;
    this.toneMenuText = '';
    this.dialog.hide();
    this.dialogOpen = false;
  }

  /** Resolve a tone pick: apply the affinity delta + memory + trace, then show the reply. */
  private async pickTone(id: ToneId): Promise<void> {
    if (!this.toneMenuOpen || !this.toneTarget) return;
    const target = this.toneTarget;
    this.toneMenuOpen = false;
    this.toneMenuText = '';

    this.recordTone(target.name, id, target.traits);

    // Reply path is unchanged from the old greet flow (tone-coloured reply is BACKLOG-148).
    this.dialog.show(`${target.name}: ...`);
    const now = getWorldClock().now();
    const reply = await target.greet({
      timeOfDay: dayPhase(now.hour),
      affection: heartsFromPoints(this.friendship[target.name] ?? 0),
      recentMemory: recall(this.memory, target.name),
    });
    this.chirpFor(target); // it answers in its own voice (BACKLOG-191)
    this.dialog.show(`${replyPrefix(reply.source)}${target.name}: ${reply.text}`);
    this.toneTarget = null;
  }

  // --- Keeper select (BACKLOG-155) ---------------------------------------------------------

  /** Route 1/2/3: choose an observer while the keeper picker is open, else pick a greeting tone. */
  /** Close/cancel whatever dialog is up, regardless of remaining pages (✕ semantics). */
  private dismissDialog(): void {
    if (this.mindsConfirm) {
      this.closeMindsConfirm();
      return;
    }
    // While the keeper picker is up, this dismisses it (1/2/3 choose). BACKLOG-155.
    if (this.keeperPickerOpen) {
      this.closeKeeperPicker();
      return;
    }
    // While the tone menu is up, this cancels it (1/2/3 choose); a normal dialog closes.
    if (this.toneMenuOpen) {
      this.closeToneMenu();
      return;
    }
    this.dialog.hide();
    this.dialogOpen = false;
  }

  private onNumberKey(n: number): void {
    if (this.mindsConfirm === 'enable') {
      if (n === 1) this.confirmMinds();
      return; // 2/3 mean nothing to a yes/no dialog
    }
    if (this.mindsConfirm === 'disable') {
      if (n === 1) this.confirmMindsOff(false);
      if (n === 2) this.confirmMindsOff(true);
      return; // 3 means nothing here
    }
    if (this.keeperPickerOpen) {
      this.pickKeeperIndex(n - 1);
      return;
    }
    void this.pickTone((['warm', 'tease', 'honest'] as const)[n - 1]);
  }

  /** The chosen observer's affinity bonus for a dino's temperament — added to normal player gains. */
  private applyKeeperBonus(traits?: Dino['traits']): number {
    return keeperBonus(keeperById(this.keeperId), traits);
  }

  /** Open the "choose your observer" overlay (modeled on the tone menu). */
  private openKeeperPicker(): void {
    // The keeper picker and the tone menu are mutually exclusive — close any open greet first.
    if (this.toneMenuOpen) this.closeToneMenu();
    this.keeperPickerOpen = true;
    this.dialogOpen = true;
    const lines = KEEPERS.map(
      (k, i) => `[${i + 1}] ${k.name} — ${k.ability.label}: ${k.ability.desc}`,
    ).join('\n');
    const current = keeperById(this.keeperId).name;
    this.dialog.show(`Choose your observer  (now: ${current})\n${lines}`);
  }

  /** Commit a keeper choice from the picker: persist it and confirm. Out-of-range index is ignored. */
  private pickKeeperIndex(i: number): void {
    if (!this.keeperPickerOpen) return;
    const keeper = KEEPERS[i];
    if (!keeper) return;
    const changed = keeper.id !== this.keeperId;
    this.keeperId = keeper.id;
    if (changed) this.renderKeeperAvatar(); // swap to the new observer's face in place
    this.keeperPickerOpen = false;
    this.dialog.show(`You are ${keeper.name}, from ${keeper.era}.\n${keeper.ability.label}: ${keeper.ability.desc}`);
    this.dialogOpen = true; // a normal dialog the next E/Z closes
    void this.saveGame();
    // A real change of watcher draws first contact (BACKLOG-161); a re-pick or the save-restore
    // path (which assigns keeperId directly) never arms it.
    if (changed) this.armInspection();
  }

  /**
   * (Re)build the player avatar for the current observer (BACKLOG-158). Destroys the old object
   * and rebuilds in place — preserving position + depth — so a keeper switch or a save restore
   * swaps the sprite without disturbing movement. An undrawn observer renders the amber square.
   */
  private renderKeeperAvatar(): void {
    const x = this.player ? this.player.x : TILE * 3 + TILE / 2;
    const y = this.player ? this.player.y : TILE * 3 + TILE / 2;
    const depth = this.player ? this.player.depth : 0;
    if (this.player) this.player.destroy();
    const { obj, artKey } = makeKeeperArt(this, x, y, this.keeperId);
    this.player = obj;
    this.player.setDepth(depth);
    this.keeperArtKey = artKey;
  }

  /** Arm the first-contact beat: the best-fitting dino comes to size up the new observer. */
  private armInspection(): void {
    const name = inspector(keeperById(this.keeperId), this.dinos);
    this.pendingInspect = name ? { name, ttl: INSPECT_TTL } : null;
  }

  private closeKeeperPicker(): void {
    this.keeperPickerOpen = false;
    this.dialog.hide();
    this.dialogOpen = false;
  }

  /**
   * A non-blocking, one-time invite on a brand-new game: a fading line that says "press K to
   * choose your observer". It captures no input and sets no modal flag, so boot stays clean and
   * every existing interaction (and e2e spec) is unaffected.
   */
  private showKeeperInvite(): void {
    const t = this.add
      .text(TILE * COLS * 0.5, 24, 'A traveler arrives to watch the bowl — press K to choose your observer', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setDepth(12);
    this.tweens.add({ targets: t, alpha: 0, delay: 4000, duration: 2500, onComplete: () => t.destroy() });
  }

  // --- Field Scan (BACKLOG-157): LUMEN-3's distinct ability -------------------------------

  private scanSubject(d: Dino): ScanSubject {
    return { name: d.name, species: d.species, traits: d.traits, role: this.roleOf(d.name) };
  }

  /**
   * B toggles the dossier. Only LUMEN-3 carries the sensors: other observers get an in-character
   * refusal as a fading bubble (NOT a dialog — it must never set dialogOpen, or it would eat the
   * next E press).
   */
  private toggleScan(): void {
    if (this.scanOpen) {
      this.scanOpen = false;
      this.scanPanel.setVisible(false);
      return;
    }
    const target = this.nearestDino();
    if (!target) return;
    const keeper = keeperById(this.keeperId);
    if (!canScan(keeper)) {
      this.showBubble(target, scanRefusal(keeper));
      return;
    }
    this.scanPanel.setText(scanLines(this.scanSubject(target), this.currentSeason()).join('\n'));
    this.scanPanel.setVisible(true);
    this.scanOpen = true;
  }

  private setupScan(): void {
    this.scanPanel = this.add
      .text(6, 22, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'left',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0, 0)
      .setDepth(11)
      .setVisible(false);

    // any: dev-only Playwright hooks — Field Scan (BACKLOG-157)
    (window as any).__scanOpen = () => this.scanOpen;
    (window as any).__canScan = () => canScan(keeperById(this.keeperId));
    (window as any).__scanLines = (name?: string) => {
      const d = name ? this.dinoByName(name) : this.nearestDino();
      return d ? scanLines(this.scanSubject(d), this.currentSeason()) : [];
    };
    // any: dev-only Playwright hook — stand the player on a named dino (key-press tests; the
    // overlap keeps it nearest even if a wander tick fires between the warp and the key press)
    (window as any).__warpTo = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.player.setPosition(d.x, d.y);
      return !!d;
    };
  }

  /**
   * Tone-aware twin of recordGreet (BACKLOG-142): applies the personality-fit tone delta, files
   * a tone memory, and records the last-tone trace. The BACKLOG-125 repair seam wins over the
   * tone delta — a make-up greet still earns the outsized repair bump and its 😊 beat.
   */
  private recordTone(name: string, id: ToneId, traits?: Dino['traits']): void {
    const repairing = this.pendingRepair === name;
    // Warming a cold-funked dino (BACKLOG-184): the repair shape, repair itself still winning.
    const warming = !repairing && this.coldPending.has(name);
    const gain = repairing
      ? repairGain(traits)
      : warming
        ? warmGain(traits)
        : toneReaction(toneById(id), traits).delta + this.applyKeeperBonus(traits);
    this.friendship = bumpPoints(this.friendship, name, gain);
    this.memory = remember(
      this.memory,
      name,
      repairing ? repairMemory(name) : warming ? warmMemory() : toneById(id).memory,
    );
    this.lastTone = { ...this.lastTone, [name]: id };
    if (repairing) {
      this.pendingRepair = null;
      const dino = this.dinos.find((d) => d.name === name);
      if (dino) this.showBubble(dino, repairLine(name));
    }
    if (repairing || warming) this.clearColdFunk(name, warming);
    void this.saveGame();
    this.refreshHeartsPanel();
  }

  /** Raise a dino's affinity from a greet, persist, and refresh the panel. */
  private recordGreet(name: string, traits?: Dino['traits']): void {
    // A make-up greet to the jealous runner-up (BACKLOG-125): outsized bump, 😊, one-shot.
    const repairing = this.pendingRepair === name;
    // Warming a cold-funked dino (BACKLOG-184): the repair shape, repair itself still winning.
    const warming = !repairing && this.coldPending.has(name);
    const gain = repairing
      ? repairGain(traits)
      : warming
        ? warmGain(traits)
        : greetGain(traits) + this.applyKeeperBonus(traits);
    this.friendship = bumpPoints(this.friendship, name, gain);
    this.memory = remember(
      this.memory,
      name,
      repairing ? repairMemory(name) : warming ? warmMemory() : 'the human stopped by to say hello',
    );
    if (repairing) {
      this.pendingRepair = null;
      const dino = this.dinos.find((d) => d.name === name);
      if (dino) this.showBubble(dino, repairLine(name));
    }
    if (repairing || warming) this.clearColdFunk(name, warming);
    void this.saveGame();
    this.refreshHeartsPanel();
  }

  /** One-shot thaw (BACKLOG-184): drop the funk; a true warming also gets its 😊 beat. */
  private clearColdFunk(name: string, withBeat: boolean): void {
    if (!this.coldPending.delete(name)) return;
    this.refreshColdMarks();
    if (withBeat) {
      const dino = this.dinoByName(name);
      if (dino) this.showBubble(dino, warmLine(name));
    }
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

  private fmtClock(t: GameTime): string {
    const scale = getWorldClock().getScale();
    return `Day ${t.day} — ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')} ·${scale}× · ${seasonFor(t.day)}`;
  }

  // --- Seasons (BACKLOG-159): the turning year ---------------------------------------------

  private setupSeasons(): void {
    const clock = getWorldClock();
    const tint = SEASON_TINT[seasonFor(clock.now().day)];
    // Depth 4: above the grass, below the day/night overlay (5) — the sun still owns the light.
    this.seasonOverlay = this.add
      .rectangle((TILE * COLS) / 2, (TILE * ROWS) / 2, TILE * COLS, TILE * ROWS, tint.color, tint.alpha)
      .setDepth(4);
    this.lastSeasonDay = clock.now().day;

    clock.onHour((t) => this.checkSeasonTurn(t));
    // Dawn chorus (BACKLOG-192) — its own live-only onHour listener, separate from the season
    // turn and the hour-6 reflection so neither is disturbed. onHour never fires on clock.set().
    clock.onHour((t) => this.checkDawnChorus(t));

    // any: dev-only Playwright hooks — seasons (BACKLOG-159)
    (window as any).__season = () => seasonFor(getWorldClock().now().day);
    (window as any).__seasonCraving = (s: Season) => seasonCraving(s).id;
    (window as any).__seasonTint = () => ({
      color: this.seasonOverlay.fillColor,
      alpha: this.seasonOverlay.fillAlpha,
    });
    (window as any).__seasonTurns = () => this.seasonTurns;
    // any: dev-only Playwright hooks — dawn chorus (BACKLOG-192)
    (window as any).__lastChorus = () => this.lastChorus;
    (window as any).__dawnCount = () => this.dawnCount;
    (window as any).__dawnHour = () => DAWN_HOUR;
    (window as any).__chorusOrder = () => chorusOrder(this.dinos);
    // any: dev-only Playwright hook — stage the clock like a restore (sync, repaint, NO beat)
    (window as any).__setClock = (day: number, hour: number, minute: number) => {
      getWorldClock().set({ day, hour, minute });
      this.syncSeason();
      this.applyTint(getWorldClock().now());
      this.clockHud.setText(this.fmtClock(getWorldClock().now()));
      return getWorldClock().now();
    };
  }

  /** Re-derive the season from the clock without a beat — restore/away/jump paths. */
  private syncSeason(): void {
    const day = getWorldClock().now().day;
    this.lastSeasonDay = day;
    const tint = SEASON_TINT[seasonFor(day)];
    this.seasonOverlay.setFillStyle(tint.color, tint.alpha);
  }

  /** Live-observed turn only: a day boundary the clock actually ticked across. */
  private checkSeasonTurn(t: GameTime): void {
    const turned = seasonTurned(this.lastSeasonDay, t.day);
    this.lastSeasonDay = t.day;
    if (!turned) return;
    const tint = SEASON_TINT[turned];
    this.seasonOverlay.setFillStyle(tint.color, tint.alpha);
    this.clockHud.setText(this.fmtClock(t));
    this.logEvent(`🍂 ${turnLine(turned)}`);
    for (const d of this.dinos) this.memory = remember(this.memory, d.name, turnMemory(turned));
    this.seasonTurns++;
    const banner = this.add
      .text(TILE * COLS * 0.5, 24, turnLine(turned), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setDepth(12);
    this.tweens.add({ targets: banner, alpha: 0, delay: 4000, duration: 2500, onComplete: () => banner.destroy() });
    void this.saveGame();
  }

  /**
   * Dawn chorus (BACKLOG-192) — the cast greets the day each in its own voice, staggered by
   * energy. Live-only (onHour never fires on a restore/away clock.set) and at most once per
   * in-game day. Playback rides chirpFor, which self-guards mute + the unlocked context, so a
   * muted bowl still computes the order but stays silent.
   */
  private checkDawnChorus(t: GameTime): void {
    if (t.hour !== DAWN_HOUR) return;
    if (t.day === this.lastDawnDay) return; // once per day; a fresh day re-arms
    this.lastDawnDay = t.day;
    const order = chorusOrder(this.dinos);
    this.lastChorus = order;
    this.dawnCount++;
    this.logEvent('🌅 dawn');
    for (const { name, delayMs } of order) {
      this.time.delayedCall(delayMs, () => {
        const d = this.dinoByName(name);
        if (d) this.chirpFor(d);
      });
    }
  }

  /** Cycle the realtime multiplier: 1× (24 real-hour day) ⇄ 60× (active watching). */
  private toggleScale(): void {
    const clock = getWorldClock();
    clock.setScale(clock.getScale() === 1 ? 60 : 1);
    this.clockHud.setText(this.fmtClock(clock.now()));
  }

  private setupClock(): void {
    const clock = getWorldClock();

    // Wall-clock source with a dev-controllable offset so e2e can advance real
    // time deterministically (prod offset stays 0 → plain Date.now()).
    let wallOffset = 0;
    clock.setNowSource(() => Date.now() + wallOffset);

    this.clockHud = this.add
      .text(6, 4, this.fmtClock(clock.now()), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setDepth(10);

    clock.onTick((t) => {
      this.clockHud.setText(this.fmtClock(t));
      // any: dev-only Playwright hook — not exposed in production builds
      (window as any).__clockNow = clock.now.bind(clock);
    });

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T).on('down', () => this.toggleScale());

    // any: dev-only Playwright hook — not exposed in production builds
    (window as any).__clockNow = clock.now.bind(clock);
    // any: dev-only Playwright hook — current realtime multiplier
    (window as any).__clockScale = () => clock.getScale();
    // any: dev-only Playwright hook — the canvas-rendered clock HUD text
    (window as any).__clockHudText = () => this.clockHud.text;
    // any: dev-only Playwright hook — advance the wall clock n real ms, then pump
    (window as any).__advanceWall = (ms: number) => {
      wallOffset += ms;
      clock.update();
      return clock.now();
    };

    clock.start(this);
  }

  private setupDayNight(): void {
    const clock = getWorldClock();

    // Full-map overlay between the grass (depth 0) and the HUD (depth 10).
    const initial = tintFor(clock.now());
    this.nightOverlay = this.add
      .rectangle((TILE * COLS) / 2, (TILE * ROWS) / 2, TILE * COLS, TILE * ROWS, initial.color, initial.alpha)
      .setDepth(5);

    clock.onTick((t) => this.applyTint(t));

    // any: dev-only Playwright hooks — mirror the __clockNow pattern, not in production builds
    (window as any).__readTint = () => ({
      color: this.nightOverlay.fillColor,
      alpha: this.nightOverlay.fillAlpha,
    });
    // any: dev-only Playwright hook — drive the live overlay to a given hour
    (window as any).__forceHour = (h: number) => {
      this.applyTint({ day: 1, hour: h, minute: 0 });
      return { color: this.nightOverlay.fillColor, alpha: this.nightOverlay.fillAlpha };
    };
  }

  /** Paint the day/night overlay for a given time. Shared by the tick listener and save-restore. */
  private applyTint(t: GameTime): void {
    const tint = tintFor(t);
    this.nightOverlay.setFillStyle(tint.color, tint.alpha);
  }

  private currentSaveData(): SaveData {
    return {
      version: SAVE_VERSION,
      time: getWorldClock().now(),
      player: { x: this.player.x, y: this.player.y },
      friendship: this.friendship,
      memory: this.memory,
      bonds: this.bonds,
      gratitude: this.gratitude,
      lastTone: this.lastTone,
      keeperId: this.keeperId,
      eggs: this.eggs,
      born: this.born,
      savedAt: Date.now(),
      scale: getWorldClock().getScale(),
    };
  }

  private async saveGame(): Promise<void> {
    try {
      await saveToDb(this.currentSaveData());
    } catch (err) {
      // No silent failures (CHARTER §Quality bar) — surface to the console for the chronicle.
      console.error('[save] auto-save failed', err);
    }
  }

  private setupSave(): void {
    const clock = getWorldClock();

    // Restore on boot. create() has already built the HUD/overlay at the default
    // 08:00 and started the clock; loadFromDb resolves a beat later and overrides.
    void loadFromDb().then((save) => {
      if (!save) {
        // Brand-new game: keep the default observer, but invite a choice (non-blocking).
        this.showKeeperInvite();
        return;
      }
      // Resume at the saved rate, then fast-forward the world over the real gap
      // since the save (BACKLOG-106). clock.set re-anchors at now, so the live
      // pump counts forward from the post-catch-up moment — no double-advance.
      if (save.scale) clock.setScale(save.scale);
      const away = fastForward(
        { time: save.time, savedAt: save.savedAt, scale: save.scale, bonds: save.bonds, memory: save.memory },
        Date.now(),
      );
      clock.set(away.time);
      this.player.setPosition(save.player.x, save.player.y);
      this.friendship = save.friendship;
      this.memory = away.memory;
      this.bonds = away.bonds;
      this.gratitude = save.gratitude ?? {};
      this.lastTone = (save.lastTone ?? {}) as Record<string, ToneId>;
      this.keeperId = save.keeperId ?? DEFAULT_KEEPER_ID;
      this.renderKeeperAvatar(); // restore re-renders the saved observer at the restored position
      this.lastAwayDigest = away.digest;
      // Respawn dinos born in a previous session, then redraw any pending eggs.
      this.born = save.born ?? [];
      for (const b of this.born) this.spawnDino(b);
      this.eggs = save.eggs ?? [];
      for (const e of this.eggs) this.drawEgg(e);
      this.clockHud.setText(this.fmtClock(clock.now()));
      this.applyTint(clock.now());
      this.syncSeason(); // restore re-derives the season; never a turn beat (BACKLOG-159)
      this.refreshHeartsPanel();
      if (away.minutes > 0) {
        this.dialogOpen = true;
        this.dialog.show('While you were away…\n' + away.digest.join('\n'));
      }
      // After a long absence, your closest dino notices you came back (BACKLOG-112).
      // Friendship is assigned above, so the homecomer reads the restored hearts.
      this.lastHomecoming = homecoming(this.friendship, away.minutes);
      if (this.lastHomecoming) {
        this.applyHomecomingMemory(this.lastHomecoming);
        this.playHomecoming();
      }
    });

    clock.onHour(() => void this.saveGame());

    // Export moved off E (now the interact key) to O.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O).on('down', () => this.exportSave());

    // any: dev-only Playwright hooks — mirror the __clockNow pattern, not in production builds
    (window as any).__saveNow = async () => {
      const data = this.currentSaveData();
      await saveToDb(data);
      return data;
    };
    // any: dev-only Playwright hook — serialized current state
    (window as any).__exportSave = () => serialize(this.currentSaveData());
    // any: dev-only Playwright hook — advance the clock n in-game minutes (fires tick/hour listeners)
    (window as any).__advanceMinutes = (n: number) => {
      for (let i = 0; i < n; i++) clock.tick();
      return clock.now();
    };
    // any: dev-only Playwright hook — last "while you were away" digest
    (window as any).__awayDigest = () => [...this.lastAwayDigest];
    // any: dev-only Playwright hook — run offline catch-up for `realMs` of real time at the
    // current scale (savedAt 0 so elapsed === realMs, deterministic), apply + return the result.
    (window as any).__catchUp = (realMs: number) => {
      const away = fastForward(
        { time: clock.now(), savedAt: 0, scale: clock.getScale(), bonds: this.bonds, memory: this.memory },
        realMs,
      );
      clock.set(away.time);
      this.bonds = away.bonds;
      this.memory = away.memory;
      this.lastAwayDigest = away.digest;
      this.lastHomecoming = homecoming(this.friendship, away.minutes);
      if (this.lastHomecoming) {
        this.applyHomecomingMemory(this.lastHomecoming);
        this.playHomecoming();
      }
      this.refreshHeartsPanel();
      return {
        days: away.days,
        minutes: away.minutes,
        capped: away.capped,
        digest: away.digest,
        homecoming: this.lastHomecoming,
      };
    };
    // any: dev-only Playwright hook — last homecoming beat (or null)
    (window as any).__homecoming = () => this.lastHomecoming;
    // any: dev-only Playwright hook — strings of currently-alive speech bubbles
    (window as any).__bubbleTexts = () => [...this.liveBubbles];
    // any: dev-only Playwright hook — the jealous runner-up awaiting a make-up greet (or null)
    (window as any).__pendingRepair = () => this.pendingRepair;
    // any: dev-only Playwright hook — last dino-to-dino comfort beat {comforter, sulker} (or null)
    (window as any).__lastComfort = () => this.lastComfort;
    // any: dev-only Playwright hook — gratitude ledger (consoled → comforters it owes), BACKLOG-132
    (window as any).__gratitude = () => ({ ...this.gratitude });
    // any: dev-only Playwright hook — raw friendship points per dino (finer than hearts)
    (window as any).__friendshipPoints = () => ({ ...this.friendship });
    // any: dev-only Playwright hooks — keeper select (BACKLOG-155)
    (window as any).__keeper = () => this.keeperId;
    // any: dev-only — the baked anim key of the current observer avatar, or null (amber square)
    (window as any).__keeperArt = () => this.keeperArtKey;
    // dev-only: the keeper rectangle-fallback control (cycle 047-art) — with the whole roster
    // drawn, the undrawn-subject guarantee is pinned on a genuine no-art id (the pterodactyl
    // convention): hasKeeperArt(false) is what routes makeKeeperArt to the amber square.
    (window as any).__hasKeeperArt = (id: string) => hasKeeperArt(id);
    // any: dev-only — the Gen3 grass floor (BACKLOG-033). True once the ground texture is baked;
    // the size hook proves it spans the whole bowl (COLS×ROWS world tiles).
    (window as any).__groundReady = () =>
      this.textures.exists(`tilemap_grass_${COLS}x${ROWS}`);
    (window as any).__groundSize = () => {
      const t = this.textures.get(`tilemap_grass_${COLS}x${ROWS}`);
      const img = t.getSourceImage() as { width: number; height: number };
      return [img.width, img.height];
    };
    (window as any).__keepers = () =>
      KEEPERS.map((k) => ({ id: k.id, name: k.name, ability: k.ability.label }));
    (window as any).__keeperPickerOpen = () => this.keeperPickerOpen;
    (window as any).__openKeeperPicker = () => {
      this.openKeeperPicker();
      return this.keeperPickerOpen;
    };
    (window as any).__pickKeeper = (id: string) => {
      const i = KEEPERS.findIndex((k) => k.id === id);
      if (i < 0) return this.keeperId;
      this.keeperPickerOpen = true; // pickKeeperIndex guards on the open flag
      this.pickKeeperIndex(i);
      return this.keeperId;
    };
    // any: the current observer's affinity-fit bonus for a dino (0..+2)
    (window as any).__keeperBonus = (name: string) =>
      keeperBonus(keeperById(this.keeperId), this.dinos.find((d) => d.name === name)?.traits);
    // any: dev-only Playwright hooks — first-contact inspection (BACKLOG-161)
    (window as any).__inspection = () => (this.pendingInspect ? { ...this.pendingInspect } : null);
    (window as any).__lastInspection = () => (this.lastInspection ? { ...this.lastInspection } : null);
    // any: the current observer's raw personality fit for a named dino
    (window as any).__keeperFit = (name: string) => {
      const d = this.dinoByName(name);
      return d ? keeperFit(keeperById(this.keeperId), d.traits) : 0;
    };
    // any: dev-only Playwright hook — current player position
    (window as any).__playerPos = () => ({ x: this.player.x, y: this.player.y });
    // any: dev-only Playwright hook — first dino's seeded personality traits
    (window as any).__dinoTraits = () => this.dinos[0]?.traits;
    // any: dev-only Playwright hook — roster size + names
    (window as any).__dinoCount = () => this.dinos.length;
    // any: dev-only Playwright hook — every dino's name
    (window as any).__dinoNames = () => this.dinos.map((d) => d.name);
    // any: dev-only Playwright hook — shared NPC brain load status
    (window as any).__brainStatus = () => this.npcBrain.status?.() ?? 'n/a';
  }

  private setupHearts(): void {
    this.heartsPanel = this.add
      .text(TILE * COLS - 6, 22, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'right',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(11)
      .setVisible(false);
    this.refreshHeartsPanel();

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => this.toggleHearts());

    // any: dev-only Playwright hook — name → heart count for every dino
    (window as any).__hearts = () => {
      const out: Record<string, number> = {};
      for (const d of this.dinos) out[d.name] = heartsFromPoints(this.friendship[d.name] ?? 0);
      return out;
    };
    // any: dev-only Playwright hook — apply one greet's gain to a named dino
    (window as any).__greet = (name: string) => {
      const dino = this.dinos.find((d) => d.name === name);
      this.recordGreet(name, dino?.traits);
      return heartsFromPoints(this.friendship[name] ?? 0);
    };
    // any: dev-only Playwright hook — is the hearts panel showing
    (window as any).__heartsPanelVisible = () => this.heartsPanel.visible;
  }

  private toggleHearts(): void {
    this.heartsPanel.setVisible(!this.heartsPanel.visible);
    if (this.heartsPanel.visible) this.refreshHeartsPanel();
  }

  private refreshHeartsPanel(): void {
    if (!this.heartsPanel) return;
    const lines = this.dinos.map((d) => {
      const hearts = heartsFromPoints(this.friendship[d.name] ?? 0);
      return `${d.name.padEnd(9)} ${heartString(hearts)}`;
    });
    this.heartsPanel.setText(['— Friends —', ...lines].join('\n'));
  }

  private setupGifts(): void {
    this.giftHud = this.add
      .text(6, TILE * ROWS - 6, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0, 1)
      .setDepth(11);
    this.refreshGiftHud();

    const kb = this.input.keyboard!;
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET).on('down', () => this.cycleItem(1));
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET).on('down', () => this.cycleItem(-1));
    // F is the primary give key; G kept as an alias.
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.F).on('down', () => this.giveGift());
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.G).on('down', () => this.giveGift());

    // any: dev-only Playwright hooks — mirror the __clockNow pattern
    (window as any).__heldItem = () => GIFTS[this.heldItemIndex].id;
    (window as any).__cycleItem = () => {
      this.cycleItem(1);
      return GIFTS[this.heldItemIndex].id;
    };
    (window as any).__giveGift = (name: string) => {
      const target = this.dinos.find((d) => d.name === name);
      if (!target) return null;
      const verdict = this.applyGift(target.name, target.traits);
      return { verdict, hearts: heartsFromPoints(this.friendship[target.name] ?? 0) };
    };
  }

  private cycleItem(dir: number): void {
    this.heldItemIndex = (this.heldItemIndex + dir + GIFTS.length) % GIFTS.length;
    this.refreshGiftHud();
  }

  private refreshGiftHud(): void {
    if (!this.giftHud) return;
    this.giftHud.setText(holdingLine(GIFTS[this.heldItemIndex].label));
  }

  /** Bottom-left on desktop; tucked under the build stamp on touch (the stick owns bottom-left). */
  private layoutGiftHud(): void {
    if (!this.giftHud) return;
    if (this.touchEnabled) this.giftHud.setPosition(6, 34).setOrigin(0, 0);
    else this.giftHud.setPosition(6, TILE * ROWS - 6).setOrigin(0, 1);
  }

  /** Apply the held gift's reaction to a dino's affinity; returns the verdict. */
  private applyGift(name: string, traits?: Dino['traits']): GiftVerdict {
    const gift = GIFTS[this.heldItemIndex];
    const { verdict, delta } = giftReaction(gift, traits);
    this.friendship = bumpPoints(this.friendship, name, delta + this.applyKeeperBonus(traits));
    this.memory = remember(this.memory, name, `the human gave you a ${gift.label}, and you ${verdict} it`);
    void this.saveGame();
    this.refreshHeartsPanel();
    return verdict;
  }

  private giveGift(): void {
    if (this.dialogOpen) return;
    const target = this.nearestDino();
    if (!target) return;
    const gift = GIFTS[this.heldItemIndex];
    const verdict = this.applyGift(target.name, target.traits);
    this.dialogOpen = true;
    this.dialog.show(`${target.name} ${verdictPhrase(verdict)} the ${gift.label}!`);
  }

  private exportSave(): void {
    const blob = new Blob([serialize(this.currentSaveData())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dino-save.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private drawGrassMap(): void {
    // Gen3 pixel grass baked to one static ground texture (BACKLOG-033). Falls back to the flat
    // two-green checker if the tile rig is ever missing (STYLE-GUIDE: undrawn → flat).
    const key = bakeTileMap(this, 'grass', COLS, ROWS, TILE);
    if (key) {
      this.add.image(0, 0, key).setOrigin(0).setDepth(0);
      return;
    }
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
