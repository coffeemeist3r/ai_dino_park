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
import { wokeHungry, wakeHungryLine, wakeHungryMemory } from '../world/wake';
import { unlockAudio, audioState, playChirp, playThunk, soundMuted, setSoundMuted } from '../audio/voice';
import { Dino } from '../entities/dino';
import { hasArt, hasKeeperArt, makeKeeperArt, bakeTileMap, bakeTerrainMap, bakePropArt, bakeRuinArt, hasPropArt, hasTileArt } from '../art/bake';
import { ROSTER } from '../entities/roster';
import { DialogBox } from '../ui/DialogBox';
import { getWorldClock, cooldownReady, ACTIVE_SCALE, AWAY_SCALE, type GameTime } from '../world/clock';
import { fastForward } from '../world/away';
import { homecoming, type Homecoming } from '../world/homecoming';
import { repairGain, repairLine, repairMemory } from '../world/repair';
import { comforter, comfortLine, comfortMemory, recordGratitude, COMFORT_BOND, type Gratitude } from '../world/comfort';
import { tintFor, dayPhase, type DayPhase } from '../world/dayNight';
import {
  rollSkyEvent,
  atGather,
  skyExpired,
  gazeRing,
  stargazingPairs,
  SHARED_WONDER_BOND,
  SKY_GATHER_TILE,
  SKY_EVENTS,
  SKY_ROLL_INTERVAL_MS,
  type SkyEvent,
  type SkyEventId,
} from '../world/skyEvent';
import { buildMessages } from '../ai/webllmBrain';
import { SAVE_VERSION, serialize, type SaveData } from '../world/saveGame';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, RIDGE_ID, ZONES, type Edge, atMigrationEdge, atWater, bareZone, crossEntryTile, crossing, edgeIndicators, linkedZone, migrationStepTarget, nearLinkEdge, occupiedZones, otherZone, setZone, theZone, zoneById, zoneChain, zoneNeighbors, zoneOf, zonePopulations, zoneTileAt, zoneTint, zoneWaterTile } from '../world/zones';
import {
  bumpTenure,
  resetTenure,
  tenureOf,
  isSettled,
  resistsMigration,
  SETTLED_MIGRATE_DAMP,
  settledLine,
  SETTLE_ROLLS,
  rememberRoot,
  isHomecoming,
  homecomingLine,
  homecomingEvent,
  homecomingMemory,
  welcomeMemory,
  welcomeEvent,
  WELCOME_BOND,
  type Tenure,
  type Roots,
} from '../world/belonging';
import { homesickDest, homesickMemory } from '../world/homesick';
import { INTENT_NOTES, forageCuriosity, fromDraft, rerollStay, socializeChanceFor, ticAfterFor, type DinoIntent, type IntentKind } from '../ai/intent';
import { activeIntent, planShape, proceduralPlan, type DayPlan } from '../ai/plan';
import { proceduralPersona, upgradePersona, type Persona } from '../ai/persona';
import { spreadGroveWord, groveNewsMemory, groveWordLine, pondSwap, pondSwapMemory, POND_BOND } from '../world/groveword';
import { travelsTogether, togetherMemory, togetherLine, togetherEvent, TOGETHER_BOND } from '../world/together';
import { FETCH_BOND, FETCH_STEPS, FETCH_GLYPH, fetchEventLine, fetchLine, fetchedMemory, fetcher, fetcherMemory, missingTheMeal, type Escort } from '../world/fetch';
import { grovePull } from '../world/curiosity';
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
import { KEEPERS, DEFAULT_KEEPER_ID, keeperById, keeperBonus, keeperFit, keeperAddress } from '../keeper/keepers';
import { canScan, scanLines, scanRefusal, type ScanSubject } from '../keeper/scan';
import { INSPECT_TTL, inspector, inspectLine, inspectMemory } from '../keeper/firstContact';
import { seasonFor, seasonTurned, SEASON_TINT, turnLine, turnMemory, seasonGrip, seasonGripLine, seasonThirst, slakeFloor, seasonThirstLine, seasonSocialBias, seasonalSocializeChance, type Season } from '../world/seasons';
import { HUDDLE_THRESHOLD, huddleThreshold, inHuddleWindow } from '../world/huddle';
// BACKLOG-109: not everybody keeps the same hours — a chronotype picks *which* window a dino rests in.
import {
  chronotypeOf,
  atRest,
  awakeAtNight,
  chronotypeLine,
  DOZE_GLYPH,
  ROUSE_GLYPH,
  DOZE_ART_KEY,
  ROUSE_ART_KEY,
  type Chronotype,
} from '../world/chronotype';
import { sleptCold, coldShiver, coldMemory, WARM_BONUS, warmGain, warmLine, warmMemory, neglectMemory, spreadColdWord, coldWordLine, spreadWarmWord, warmWordLine, sympathyVisit, sympathyLine, SYMPATHY_BOND, selfCorrect, reliefLine, spreadReliefWord, reliefMemory, clearedName, gratefulLine, GRATEFUL_BOND, gratefulMemory, whoClearedMyName } from '../world/cold';
import { DISTRESS_STEPS, mostDistressed, hearLine, heardMemory } from '../world/distress';
import { wanderStep, stepToward, pickNearest, type Tile } from '../world/movement';
import { isCarnivore, dietOf } from '../world/diet';
import { nearestPrey, fleeStep, huntCaught, huntSucceeds, recentHunter, fearsHunter, foodwebStanding, WARY_RANGE } from '../world/foodweb';
import { mannerLine, lastHatchOutcome } from '../world/manner'; // BACKLOG-402: the contested-drop trio read as one character note; BACKLOG-404: the latest of them, for the voice
import { dispositionToward, holdsAgainst, becauseOf, peckingLine, givesBerthTo, showsMercyTo, mercyMemory, sparedMemory, mercyLine } from '../world/pecking'; // BACKLOG-401: who it has faced down, who it cedes to; BACKLOG-389: who it keeps clear of; BACKLOG-403: who it lets eat
import { pickMurmurMemory, murmurLine, dreamBookLine } from '../world/murmur';
import { recordMeet, pairKey, type Meetings } from '../social/meetings';
import { remember, recall, reflect, forget, type MemoryStore } from '../ai/memory';
import { firstGroveArrival, groveArrivalMemory, groveArrivalLine, firstPondSight, pondSightMemory, pondSightLine } from '../world/arrival';
import { isLoner, LONER_FLOOR, LONER_BONUS, MOPE_GLYPH, MOPE_CHANCE, edgeTarget, perkUpLine, liftsLoner, foundFriendMemory, foundFriendLine, comfortsLoner, comfortFoodMemory, comfortFoodLine, leansOnKeeper, keeperEdgeTarget, leanMemory } from '../world/loner';
import { advanceNeeds, pressingNeed, satisfy, needSeeks, isStarving, NEED_GLYPH, type Needs, type NeedKind } from '../world/needs';
import { spreadGossip, RUMOR_MARK } from '../social/gossip';
import { recordCall, COUNCIL_CAUSE, BILL_CAUSE, type CauseLog } from '../world/gates';
import { nextLens, bondedPairs, tickerLines, bookLines, zoneMapModel, zoneWant, LENS_LABEL, type Lens, type BookRow, type ZoneMapEntry } from '../ui/lenses';
import { deriveRole, settleRole, ROLE_ICON, type Role, type ProviderCandidate } from '../ai/roles';
import { spreadProviderWord } from '../world/providerword';
import { spreadPolicyWord } from '../world/policyword';
import { GLASS, cornerRadius, rimRects, edgeBands, glarePolys, toPoints } from '../ui/glass';
import { reactionFor, startleStep, type StartleReaction } from '../world/startle';
import { HATCH_TILE, HATCH_ART_KEY, HATCH_GLYPH, HATCH_SCATTER } from '../world/hatch';
import { STAKE_TILE, STAKE_GLYPH, stakeArtKey } from '../world/stake';
import { foundingKind } from '../world/founding';
import { reactionToFood, feedStep, reachedFood, foodLanding, yieldFoodTo, gobblerAmong, slunkOffMemory, sharedMeal, SHARED_MEAL_BOND, SWARM_RADIUS } from '../world/feeding';
import { bankFood, takeFood, pickFoodToSpend, pickFoodCarry, courierMemory, courierLine, haulLine, haulMemory, storesFedLine, storesFedMemory, foodAtCap, foodPileTotal, type FoodPile } from '../world/foodstore';
import { zoneAppeal, richestNeighbor, poorestResidents } from '../world/scarcity';
import { type ZonePeaks, ZONE_FLOOR, DECLINING_MIGRATE_DAMP, bumpPeak, isDeclining, declineGlyph } from '../world/decline';
import { lastoneLine, lastoneEvent, lastoneMemory } from '../world/lastone';
import { greenerGroundMemory, greenerGroundLine } from '../world/greenerground';
import { spoilFood, spoilFoodOverDays, spoiledLine, SPOIL_MARGIN } from '../world/spoilage';
import { plentyWelcomeLine, plentyWelcomeEvent, plentyWelcomeMemory, plentyWelcomedMemory, PLENTY_WELCOME_BOND } from '../world/plentywelcome';
import { canBuildGranary, buildGranary, granaryFoodCap, GRANARY_GLYPH, GRANARY_AFTER_STRUCTURES, GRANARY_RECIPE } from '../world/granary';
// BACKLOG-480: a standing landmark costs its ground something, and one it can't pay for falls into
// reversible disrepair.
import {
  runUpkeep,
  runUpkeepOverDays,
  lapsedLine,
  patchedLine,
  DERELICT_ALPHA,
  REPAIR_COST,
  type Landmark,
} from '../world/upkeep';
// BACKLOG-488: the patch-up stops being arithmetic and becomes a job a resident walks to.
import {
  canMend,
  mendLine,
  mendMemory,
  mendEventLine,
  MEND_GLYPH,
  MEND_STEPS,
  MEND_COOLDOWN_MS,
  type Mend,
} from '../world/mending';
// CHARTER v7: a fresh park ships a ruin, so the disrepair systems are reachable on the save a new player opens.
import { FOUNDING_RUIN, FOUNDING_PILES, FOUNDING_BANKED, foundingPioneers } from '../world/founding';
import { votedSpend, votedWork, type SeatExperience } from '../world/ballot'; // BACKLOG-492
import { thawedThroughWinter, thawLine, thawMemory, THAW_LIFT } from '../world/thaw';
import {
  providerPriority,
  feedReserve,
  granaryDeferredForFeeding,
  governanceLine,
  providerWorkPriority,
  councilWorkPriority, // BACKLOG-481: the seats vote; the provider only breaks a tie
  councilSpendPriority, // BACKLOG-487: ...and the pantry call goes to the same seats
  spendCallMeaning, // BACKLOG-487: the pantry beat speaks the `[?]` legend's own words
  billLean, // BACKLOG-485: what a ground's own disrepair asks of it
  calledWork,
  billCallLine,
  workCallMeaning,
  landmarkDeferredForGathering,
  granaryGateFor,
  workRegrowth,
  type SpendPriority,
  type WorkPriority,
} from '../world/governance';
import { heldShort, soundsDiscontent, discontentLine } from '../world/discontent';
import { cropYield, harvestYieldLine, seasonCropLine } from '../world/cropseason';
import { handoverBeat } from '../world/handover';
import { spreadPlentyWord, plentyMemory, plentyTarget, PLENTY_TOKEN } from '../world/plentyword';
import { recordTrace, traceNear, traceMemory, traceKey, TRACE_GLYPH, type PaceTrace } from '../world/traces';
import { signatureTic, signatureAxis, ticAside, caughtRegister, caughtOpener, caughtRegisterMemory, undisturbed, inventsTic, ticStep, ticMemory, fondOfBeingCaught, griefEdge, griefAnchor, griefTicMemory, GRIEF_BOND_FLOOR, TIC_AFTER_STEPS, TIC_AFTER_STEPS_HOMESICK, TIC_AFTER_STEPS_STUNG, stingIsFresh, soothingTicMemory, TIC_COMPANY_RANGE, aloneInStrangeZone, TIC_BY_AXIS, ECHO_BOND_FLOOR, watchingTic, picksUpTic, echoedTic, echoTicMemory, echoedLine, ticBookLine, ECHO_FROM_UNKNOWN, kinshipMemory, kinshipLine, catchWarmth, catchWarmedLine, ticAnchorFor, hauntSeed, hauntWorthNoting, hauntDriftMemory, hauntDriftedLine, COMPANY_GLYPH, companyTraceIsFresh, foundByCompany, gladOfCompanyMemory, gladOfCompanyLine, gladOpener, type Haunts, type Tic } from '../world/tic';
import { zoneProsperity, prosperityTier, prosperityBadge, type ZoneSignals, type ProsperityTier } from '../world/prosperity';
import {
  noticeResource,
  resourceLanding,
  RESOURCE_SPAWN_CHANCE,
  pickKind,
  bankResource,
  atCap,
  stockpileLine,
  canCraft,
  CAIRN_GLYPH,
  SHELTER_GLYPH,
  THATCH_GLYPH,
  BEACON_GLYPH, // BACKLOG-503
  canBuildShelter,
  buildStructureFor,
  zoneStructure,
  structureRecipe,
  shortOnlyTithe,
  pressuredCarry,
  pileTotal,
  takeResource,
  barterSwap,
  resourceFetchable,
  RESOURCE_GRACE_STEPS,
  RESOURCE_GLYPH,
  type ResourceKind,
  type Stockpile,
} from '../world/resource';
import { rollResourceAt, depleteYield, YIELD_MAX } from '../world/regrowth';
import { dinoActivity, activityAside, ACTIVITY_GLYPH, type Activity } from '../world/activity';
import { BANK_TILE, bankStep, pileArtKey } from '../world/bank';
// BACKLOG-503: the quarry errand - the hard scarcity pull toward the one ground the black glass falls on.
import { quarryDest, quarryGround, quarryEvent, quarryMemory, shortfallLine } from '../world/quarry';
// BACKLOG-507: the ritual's worn ground, laid on the haunt 421 persists.
import { marksOn, type WornMark } from '../world/wear';
import { fidget, moodFidget, reliefFlourish, type Mood } from '../world/fidget';
import { recordPioneer, pioneerEvent, pioneerOf, type Pioneers } from '../world/pioneer';
// BACKLOG-482: pioneer / provider / council derived in one place, in one shape.
import { zoneStandings, providerOf, councilOf, standingLines, type Standing } from '../world/standings';
import { heldSeats, reseat, turnoverLine, type Seating } from '../world/term';
import { isUnsettled, isHollowed, unsettledNeighbor, settleMemory, settleLine, settleEvent, hollowedLine, UNSETTLED_BADGE, HOLLOWED_BADGE } from '../world/frontier';
import {
  markLeft,
  clearLeft,
  yearnThreshold,
  yearnedZone,
  yearnMemory,
  yearnLine,
  yearnEvent,
  yearnedFor,
  yearnBookLine,
  type LeftDays,
} from '../world/yearning';
import {
  isStruck,
  keepsakeGlyph,
  markCameFrom,
  struckBookLine,
  struckEvent,
  struckLine,
  struckMemory,
  type CameFrom,
} from '../world/struck';
import { hopToward } from '../world/distance';
import {
  recordCrossing,
  crossingsOf,
  originOf,
  reachOf,
  wanderStanding,
  wanderBookLine,
  type Crossings,
} from '../world/wandering';
import { zoneCapacity, isCrowded, crowdedAppeal, CROWDED_MIGRATE_DAMP } from '../world/capacity';
import {
  markSeen,
  teachableZone,
  taughtMemory,
  taughtWordLine,
  taughtLine,
  taughtEvent,
  taughtCount,
  taughtBookLine,
  TAUGHT_BOND,
  type SeenZones,
} from '../world/taught';
import { cropStage, plotAdjacent, cropOf, stageGlyph, ripeRigKey, PLOT_TILE_BY_ZONE, type CropStage } from '../world/plot';
import { FOODS, favoriteFood, foodReaction, seasonCraving, type Food } from '../world/foods';
import { maxGeneration, plaqueLines, zoneTallyLine, zoneStoresLine } from '../ui/plaque';
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
import { strengthen, bondPoints, closestFriend, type Bonds } from '../social/bonds';
import type { Personality } from '../ai/personality';
import { rand, seedRandom, isSeeded } from '../world/rng';
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

/**
 * A fresh per-zone plot map, keyed off `PLOT_TILE_BY_ZONE` (BACKLOG-472) rather than three zone-id
 * literals — a fourth ground with a plot is a row in that table, not an edit in three places here.
 */
function emptyPlots(): Record<string, { plantedDay: number } | null> {
  return Object.fromEntries(Object.keys(PLOT_TILE_BY_ZONE).map((z) => [z, null]));
}

function emptyPlotStages(): Record<string, CropStage | 'empty'> {
  return Object.fromEntries(Object.keys(PLOT_TILE_BY_ZONE).map((z) => [z, 'empty' as const]));
}

/**
 * Dino migration (BACKLOG-274) rolls on a real-time cadence (like the sky event), NOT in-game hours, so
 * offline catch-up / per-minute clock advances never retroactively migrate the cast, and a short headless
 * test never waits this long. Paced by a real-time cooldown (BACKLOG-333) — the old ≤1/in-game-day cap was
 * ≤1/24 real hr at the 1× default, so the grove never filled; tests drive migration via `__migrate`.
 */
/**
 * How often the ambient migration is rolled, how likely it is, and the floor between crossings.
 *
 * **Retuned by CHARTER v7.** The old triple was 90s / 15% / 60s, and against `SETTLED_MIGRATE_DAMP` (a
 * settled dino resists 60% of the time) that is ~6% per 90 seconds — about **25 real minutes of unbroken
 * watching for one body to cross one edge**, in a park with five grounds and every dino spawned into one of
 * them. The operator reported at cycle 106 that migration "reads as dead weight, not a system", and was
 * right; it was still true at cycle 135. These are the calibration knobs — tune here, never at a call site.
 */
const MIGRATE_ROLL_INTERVAL_MS = 20_000;
const MIGRATE_CHANCE = 0.35;
const MIGRATE_COOLDOWN_MS = 20_000; // BACKLOG-333: real-time floor between ambient migrations
const HUNT_COOLDOWN_MS = 30_000; // BACKLOG-367: after an empty hunt a carnivore rests before stalking again
const BARTER_COOLDOWN_MS = 45_000; // BACKLOG-358: real-time floor between edge-meet barters (paces the beat)
const EDGE_DWELL = 2; // BACKLOG-358: force-steps a dino must linger at the edge column to count as *meeting* (not transiting)

/**
 * Wander cadence (BACKLOG-333) — `forceStep` runs on this real-time timer instead of the in-game-minute
 * clock, so the bowl mills about at a watchable pace at any time scale (at 1× an in-game minute is 60 real
 * seconds, so the old "every 5 in-game minutes" was one step per ~5 real minutes — the park looked frozen).
 */
const WANDER_STEP_MS = 3_000;

/** How long a recovered dino's idle quirk reads perkier after a flourish (BACKLOG-325), in real ms. */
const LIFT_WINDOW_MS = 8_000;

// Night sleeping huddle (BACKLOG-041): bonded dinos gather at the den after dark.
// The bond bar + window are season-conditional since BACKLOG-171 (see world/huddle.ts).
const HUDDLE_TILE = { tileX: 10, tileY: 11 };
const BOND_PER_MEET = 4;
/** Bond a generous feeder gains with the friend it yields a meal to (BACKLOG-375) — kindness deepens the tie. */
const GENEROUS_BOND_BUMP = 5;

/** How often a sleeping dino murmurs a 💭 sleep-line per step (BACKLOG-181) — sparse, so the den isn't a wall of 💭.
 *  Untouched by BACKLOG-307: 307 widened *who* can murmur, and compensating for that with a rate cut here
 *  would be the v7 corollary in miniature — a system tuned back down to where it was unwatchable. */
const MURMUR_CHANCE = 0.2;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  /** Anim key of the current keeper avatar, or null when the observer is still the amber square. */
  private keeperArtKey: string | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dinos: Dino[] = [];
  /** The keeper's current zone (BACKLOG-143). Persisted; the grove starts empty (population is -274). */
  private zoneId: string = BOWL_ID;
  /** The single depth-0 floor image, re-textured/re-tinted per zone (BACKLOG-294). */
  private floorImage?: Phaser.GameObjects.Image;
  /** Flat-checker floor used only if the grass rig is missing (BACKLOG-294 fallback). */
  private floorFallback?: Phaser.GameObjects.Graphics;
  /** Which zone each dino lives in (BACKLOG-143 occupancy API). Defaults to the bowl; -274 migrates. */
  private dinoZones: Record<string, string> = {};
  /** Per-dino residence tenure in its current zone (BACKLOG-341) — rolls since it last crossed; settles a home. Persisted. */
  private tenure: Tenure = {};
  /** Per-zone population high-water mark (BACKLOG-460) — a zone below its peak reads declining. Transient (live per session, like a peak-of-run). */
  private zonePeaks: ZonePeaks = {};
  /** Wall-clock ms of the last ambient migration (BACKLOG-333) — paces it by a real-time cooldown. */
  private lastMigrationMs = 0;
  /** Wall-clock ms of the last edge-meet barter (BACKLOG-358) — paces the ambient trade by a real-time cooldown. */
  private lastBarterMs = 0;
  /** Consecutive steps each dino has lingered at a linking edge (BACKLOG-358) — a meet needs two *parked* dinos, not a crosser transiting through. Transient. */
  private edgeDwell: Record<string, number> = {};
  /**
   * Solitary-tic bookkeeping (BACKLOG-405). All transient (re-derived from live solitude, never saved):
   * how many consecutive force-steps a dino has been undisturbed, the tile it anchored its ritual on, the
   * ritual's step phase, and whether it has invented the tic this solitary stretch (so the memory files once).
   */
  private soloSteps: Record<string, number> = {};
  private ticAnchor: Record<string, { tileX: number; tileY: number }> = {};
  private ticPhase: Record<string, number> = {};
  private ticInvented = new Set<string>();
  /** BACKLOG-412: dino → the `worldSteps` count at which a contested drop left it with nothing, and the
   *  once-per-sting guard on the self-soothing memory. Neither is persisted: like `berthedThisDrop` and
   *  `lastWorkCallByZone`, a sting is a live read of a live moment, and a reload starts everyone unstung. */
  private stungAt: Record<string, number> = {};
  private soothedFiled = new Set<string>();
  /**
   * A ritual that spreads (BACKLOG-407). Unlike every other tic field above, **both of these are persisted**:
   * a ritual you learned off a friend is a fact about who you are now, not about this solitary stretch.
   *
   * `ticEchoes` holds the *axis key* rather than the `Tic` — a save that stored the glyph or the label would
   * rot the first time either was reworded, and `TIC_BY_AXIS` derives both from the key.
   * `ticWatches` is keyed `watcher>performer`, so a dino builds toward one friend's ritual at a time.
   */
  private ticEchoes: Record<string, keyof Personality> = {};
  private ticWatches: Record<string, number> = {};
  /**
   * The ritual in the book (BACKLOG-409). `ticInvented` above is a *per-stretch* flag — `resetTic` clears it
   * the moment company returns, so the ritual can form fresh later. This is the **lifetime** fact the book
   * asks about: has this dino's ritual ever actually happened in this park? Nothing clears it, and the book
   * shows no line for a dino that is not in here — the entry is earned by the sim, never derived from
   * `signatureTic(traits)`. `ticEchoFrom` remembers who a borrowed ritual was caught off; both persist.
   */
  private ticsFormed = new Set<string>();
  private ticEchoFrom: Record<string, string> = {};
  /** BACKLOG-414: the departed friend a dino is grieving this stretch (its tic aims at the edge they left by),
   *  or absent when the tic is a plain 405 in-place ritual. Transient, cleared by resetTic. */
  private ticGrief: Record<string, string | null> = {};
  /**
   * The ritual's haunt (BACKLOG-421) — dino → ground → the worn tile its tic returns to, and how far that
   * tile has walked since it was first laid. **Not** cleared by `resetTic`, unlike `ticAnchor` beside it:
   * the anchor is this stretch, the haunt is what the dino knows about the ground. Persisted, so a reloaded
   * park keeps the path it wore. `hauntNoted` is the once-per-(dino, ground) guard on the drift beat — the
   * lifetime shape `ticsFormed` uses, not the per-stretch shape `ticCaughtFiled` uses.
   */
  private ticHaunts: Haunts = {};
  private hauntNoted = new Set<string>();

  /**
   * The warm trace a found dino carries (BACKLOG-411) — who walked up on its ritual, and the world step it
   * happened on. Transient like the rest of the 405 stretch state, but deliberately **not** cleared by
   * `resetTic`: this is what the *ended* stretch left behind, so tearing it down with the stretch would
   * delete it the instant it is written. It expires by `companyTraceIsFresh` and is consumed by one greet.
   */
  private companyTrace: Record<string, { friend: string; at: number }> = {};
  /**
   * Traces of your pacing (BACKLOG-424). `worldSteps` is the monotonic ambient-step counter a trace is
   * stamped with (the same units 405's solitude threshold counts in). `paceTraces` holds one live mark per
   * pacer; `noticedTraces` is the `<finder>|<traceKey>` guard so a discovery fires once and does not become
   * a tic of the finder's own. All three transient — never saved, exactly like the rest of the 405 state.
   */
  private worldSteps = 0;
  private paceTraces: PaceTrace[] = [];
  private noticedTraces = new Set<string>();
  /** BACKLOG-431: when true, the wall-clock background timers (wander/sky/migration rolls) no-op — set by the
   *  `__pauseAmbient` dev hook from the e2e boot() so 300+ parallel specs don't race the ambient world tick.
   *  Never set in normal play (defaults false); explicit dev hooks (`__stepWorld` etc.) bypass it. */
  private ambientPaused = false;
  /**
   * BACKLOG-456: one level down from `ambientPaused`. That flag gates the wall-clock *timers*; this one
   * gates the ambient work that rides a **driven** `forceStep` — the pairwise meeting loop, resource spawn,
   * and gathering — for the length of a spec's driven crossing, so a pinned pile or a pinned bond graph
   * can't be mutated out from under an assert.
   *
   * It holds those three things and NOTHING else: movement, crossings, needs, feeding, plots, barter, eggs
   * and the governance hooks all still run, because every spec this exists for is *driving* one of those.
   * Do not widen it into a blanket freeze. Never set in normal play (defaults false).
   */
  private ambientHeld = false;
  /** Caught mid-tic (BACKLOG-408): the dino this greet caught mid-ritual (bashful reply), + a once-per-stretch
   *  memory guard. Both transient — cleared by resetTic (company/need ends the stretch) and on greet cancel. */
  private caughtTic: string | null = null;
  /** BACKLOG-420: `name` → catches so far *this* stretch, and the filed guard keyed `name:register` so each
   *  register leaves at most one memory. Both transient, cleared by `resetTic` with the rest of the stretch. */
  private ticCaughtFiled = new Set<string>();
  private ticCatches: Record<string, number> = {};
  /** BACKLOG-422: affinity earned from being found — `stretch` is per solitary stretch (transient, cleared
   *  by `resetTic` with the rest of the stretch state) and `total` is the **lifetime** ceiling, persisted so a
   *  reload cannot re-buy the same affection. The 409 `ticsFormed` shape: a per-stretch flag beside a
   *  lifetime fact, and the difference between them is the whole point of there being two. */
  private ticWarmthStretch: Record<string, number> = {};
  private catchWarmthTotal: Record<string, number> = {};
  /** BACKLOG-416: who has already filed its "not the only one" note this solitary stretch. `ticCaughtFiled`'s
   *  twin in every respect — per-stretch, not persisted, cleared by `resetTic`. */
  private kinFiled = new Set<string>();
  /**
   * BACKLOG-370: leaning loners that have already filed their "waited by the glass" memory. Transient,
   * and deliberately NOT cleared by resetTic: that guard tracks the *tic* stretch, which company breaks
   * every few steps while a loner at the wall is still very much waiting. The spell of waiting ends when
   * the dino stops being a loner at all (checkLonerLift) — one memory per bout of loneliness.
   */
  private leanFiled = new Set<string>();
  /** Dinos mid zone-crossing (BACKLOG-334): walking to their linked edge before the home zone flips. Transient. */
  private migrating = new Set<string>();
  /**
   * Each migrant's chosen crossing (BACKLOG-378): the destination zone + the edge it walks to, fixed when the
   * migration starts so a multi-neighbour zone (the grove now borders both the bowl and the Fernreach) doesn't
   * oscillate its target mid-walk. Keyed by name, cleared on arrival. Transient (companion to `migrating`).
   */
  private migrationCross: Record<string, { dest: string; edge: Edge; reason?: 'scarcity' }> = {};
  /** Each dino's settled, durable role (BACKLOG-032). Persisted; accrues via roleOf, never reverts to wanderer. */
  private roles: Record<string, Role> = {};
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
  /** The last recovery flourish fired (BACKLOG-318), for the dev hook; transient, not persisted. */
  private lastMoodLift: string | null = null;
  /** Per-dino wall-clock ms until which a recovered dino idles perkier (BACKLOG-325); transient. */
  private liftedUntil: Record<string, number> = {};
  /** The last dino-to-dino comfort beat (BACKLOG-130): who consoled whom, or null. Transient. */
  private lastComfort: { comforter: string; sulker: string } | null = null;

  /** The last comfort-food beat (BACKLOG-374): a loner soothed by its favorite, or null. Transient. */
  private lastComfortFood: { name: string; food: string } | null = null;
  /** The last generous-feed beat (BACKLOG-375): who gave up a meal to whom, or null. Transient. */
  private lastYield: { giver: string; eater: string } | null = null;
  /** The last greedy-gobble beat (BACKLOG-387): who shouldered past whom for a kept drop, or null. Transient. */
  private lastGobble: { winner: string; gobbler: string } | null = null;
  /** The last stand-up beat (BACKLOG-390): a bold winner that held its food against a gobbler, or null. Transient. */
  private lastStand: { winner: string; gobbler: string } | null = null;
  /** The last mercy beat (BACKLOG-403): a well-fed victor that gave a rival it had faced down the scrap. Transient. */
  private lastMercy: { victor: string; rival: string } | null = null;
  /** The last grateful-nuzzle beat (BACKLOG-386): who threw a 💛 at whom on a yield, or null. Transient. */
  private lastNuzzle: { from: string; to: string } | null = null;
  /** Who each dino remembers being fed by (BACKLOG-385): a live per-session ledger of generosity owed
   *  back, biasing a later yield toward a benefactor. The durable trace is the persisted memory (as 375). */
  private owesFood: Record<string, string[]> = {};
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
  /** A pantry that spoils (BACKLOG-455): transient — the last in-game day the spoilage pass ran (0 = none
   *  yet). Reset on restore/jump so a clock catch-up never fires a spurious pass (mirrors lastSeasonDay). */
  private lastSpoilDay = 0;
  /** BACKLOG-480: the day the last upkeep pass ran. Armed on boot/restore like `lastSpoilDay`, so a jump
   *  never fires a spurious live pass — the away days go through `runUpkeepPass(days)` instead. */
  private lastUpkeepDay = 0;
  /** Dawn chorus (BACKLOG-192): transient — the last in-game day a dawn fired (0 = none yet). */
  private lastDawnDay = 0;
  private dawnCount = 0;
  /** Woke hungry (BACKLOG-376): transient — who woke over the hunger bar at the last dawn. Never persisted. */
  private lastWokeHungry: string[] = [];
  private lastChorus: ChorusEntry[] | null = null;
  private eggs: Egg[] = [];
  private born: BornDino[] = [];
  private eggSprites = new Map<string, Phaser.GameObjects.Text | Phaser.GameObjects.Image>(); // BACKLOG-491: baked rig or emoji fallback
  /** BACKLOG-520: baked rig where one is drawn, the glyph where one is not — the same per-item fallback
   *  `dropFood` and `drawPlotSprite` use, so a mark never waits on its art. */
  private sleepMarks: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Image> = [];
  /** BACKLOG-109: the 👁 over a dino up while the park is dark — only ever an owl. Index-aligned like
   *  sleepMarks; mutually exclusive with the 💤 by construction, so it shares that slot's height. */
  private rouseMarks: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Image> = [];
  /** Per-dino current-activity glyph (BACKLOG-295), index-aligned with `dinos`; live-derived, not saved. */
  private activityMarks: Phaser.GameObjects.Text[] = [];
  private activityById: Record<string, Activity> = {};
  /** Cold-night shiver (BACKLOG-179): the night's season, the morning-edge window tracker, and
   *  the last morning's cold sleepers (the dinos too loosely bonded for the den, for the hook). */
  private wasInHuddleWindow = false;
  private nightSeason: Season = 'spring';
  private lastColdSleepers: string[] = [];
  /** Keeper's warmth (BACKLOG-184): who still carries the cold funk (transient day-state,
   *  never persisted — like pendingRepair) and its 🥶 marks, index-aligned like sleepMarks. */
  private coldPending = new Set<string>();
  private coldMarks: Phaser.GameObjects.Text[] = [];
  /** The loner (BACKLOG-135): the 🥀 mope mark, index-aligned like sleepMarks. Loner status itself is
   *  derived live from the bond graph (no persisted state — the bonds are already saved). */
  private mopeMarks: Phaser.GameObjects.Text[] = [];
  /** The loner finds a friend (BACKLOG-369): dinos that have already fired the one-shot "not so alone"
   *  beat. Transient — the memory it files is the persistent record, so a reload won't re-fire (the
   *  loner→friend transition can't recur once the bond is already saved above the floor). */
  private lonerFriended = new Set<string>();
  /** Need-drive spine (BACKLOG-371): each dino's hunger/thirst, persisted additively; the 🍖/💧 marks
   *  are index-aligned like sleepMarks. */
  private needs: Needs = {};
  /** Food web (BACKLOG-367): wall-clock ms until a carnivore may hunt again after an empty hunt. */
  private huntCooldownUntil: Record<string, number> = {};
  /** Food web (BACKLOG-367): the last forceStep's {hunter → prey} pairing — exposed via `__stalkTargets`. */
  private lastStalk: Record<string, string> = {};
  /** Food web (BACKLOG-442): the last forceStep's resolved {prey → hunter it flees} — active stalks plus
   *  personal-fear startles. Exposed via `__fleeFrom`. */
  private lastFlee: Record<string, string> = {};
  private needMarks: Phaser.GameObjects.Text[] = [];
  /** Distress call (BACKLOG-194): the last cry (diegetic — recorded even muted) and the
   *  responder mid-walk toward the caller. Both transient, never persisted. */
  private lastDistress: { name: string; trigger: 'startle' | 'cold'; params: ChirpParams } | null = null;
  private pendingRespond: { name: string; caller: string; steps: number } | null = null;
  /** Brought to the hatch (BACKLOG-381): the live escort — a friend walking out to a withdrawn loner and
   *  then walking it back to the food. One at a time, transient, never persisted (the `pendingRespond` shape). */
  private escort: Escort | null = null;
  /** Hands on the derelict (BACKLOG-488): the live mend errand — a resident walking to its ground's ruin.
   *  One at a time, transient, never persisted (the `escort` shape). `lastMendMs` paces dispatch off the
   *  wall clock (the 333 gate), so the cadence holds at either clock rate. */
  private mend: Mend | null = null;
  private lastMendMs = 0;
  /** Set by the `__clearFounding` spec hook. `loadFromDb()` resolves a beat *after* `__ready`, so a spec can
   *  clear the founding ruin before it has been seeded; this makes the clear win either way. */
  private foundingCleared = false;
  private roleTags: Phaser.GameObjects.Text[] = [];
  private lens: Lens = 'off';
  private bookPanel!: Phaser.GameObjects.Text;
  private bondGfx!: Phaser.GameObjects.Graphics;
  private tickerPanel!: Phaser.GameObjects.Text;
  /** Zone map lens (BACKLOG-425): boxes/connectors/keeper dot + one label per zone. */
  private mapGfx!: Phaser.GameObjects.Graphics;
  private mapLabels: Phaser.GameObjects.Text[] = [];
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
  private foodSprite: Phaser.GameObjects.Text | Phaser.GameObjects.Image | null = null; // BACKLOG-490: baked rig or emoji fallback
  /** One raw resource per zone (BACKLOG-314, was a single global slot 146/308). Each inhabited zone
   *  grows + holds its own; keyed by zone id. `zone` on the value mirrors the key for the 308 checks. */
  private resourceByZone: Record<string, { kind: ResourceKind; tileX: number; tileY: number; zone: string }> = {};
  private resourceSpriteByZone: Record<string, Phaser.GameObjects.Text | Phaser.GameObjects.Image> = {};
  /** World steps since each zone's resource spawned (BACKLOG-297/314) — gates the per-zone fetch grace. */
  private resourceAgeByZone: Record<string, number> = {};
  /** Per-zone gather yield (BACKLOG-384, 0..1) — a pickup thins it, each tick regrows it; scales the spawn roll.
   *  Transient (not persisted): absent → YIELD_MAX (a reload starts each zone fresh-full). */
  private yieldByZone: Record<string, number> = {};
  /** Per-dino gathered-resource tally (BACKLOG-146). Persisted; absent → 0. */
  private gathered: Record<string, number> = {};
  /** Per-zone per-kind stockpile gathering banks into (BACKLOG-285 shared → BACKLOG-328 per-zone). Persisted; absent → {}. */
  private stockpileByZone: Record<string, Stockpile> = {};
  /** The (lazily-created) pile for a zone — each zone banks, caps, and spends its own gathering (BACKLOG-328). */
  private pileFor(zone: string): Stockpile {
    return (this.stockpileByZone[zone] ??= {});
  }
  /**
   * The one seam every per-zone pile write goes through (BACKLOG-504).
   *
   * The pile was written in fifteen places — banking, crafting, building, the granary, a mend, the upkeep
   * bill, a carry, a pressured carry, both halves of a barter, and the dev hooks — and the heap standing on
   * the ground has to agree with all of them. Rather than fifteen chances to forget, there is nowhere else
   * to write a pile: assign, then sync that ground's bank.
   */
  private setPile(zone: string, pile: Stockpile): void {
    this.stockpileByZone[zone] = pile;
    this.syncBank(zone);
  }
  /** The feeding hatch (BACKLOG-510). **One** sprite, not one per zone: unlike the bank's heap, the hatch
   *  is the same object in the same place on every ground, so there is nothing to key by zone and nothing
   *  to show or hide on a crossing. */
  private hatchSprite?: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
  /** The heap standing on each ground's bank tile (BACKLOG-504), lazily created per zone. */
  private bankSprites: Record<string, Phaser.GameObjects.Text | Phaser.GameObjects.Image> = {};
  /** Grounds that have already announced an errand (BACKLOG-503). Transient — the ticker is a beat, not a
   *  ledger, and a ground trying again is a habit rather than news. */
  private quarryTold = new Set<string>();
  /** The worn ground under each haunt (BACKLOG-507), keyed `<dino>:<ground>`. Transient — never saved:
   *  the haunts are what persist (421), and these are one render of them. */
  private wearSprites: Record<string, Phaser.GameObjects.Image> = {};
  /** BACKLOG-501: the founder's mark on the ground the keeper is standing on. One sprite, retextured. */
  private stakeSprite: Phaser.GameObjects.Text | Phaser.GameObjects.Image | null = null;
  /** Crafted cairns (BACKLOG-286). Persisted; absent → []. `zone`: BACKLOG-308 (old saves → bowl). */
  private cairns: Landmark[] = [];
  private cairnSprites: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /** Dino-built shelters (BACKLOG-315) — the larger landmark beyond the cairn. Persisted; absent → []. Zone-scoped (308). */
  private shelters: Landmark[] = [];
  private shelterSprites: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /** Woven frond thatches (BACKLOG-417) — the Fernreach's own landmark. Persisted; absent → []. Zone-scoped (308). */
  private thatches: Landmark[] = [];
  private thatchSprites: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /** Obsidian beacons (BACKLOG-503) - the Ridge's own landmark, and the only structure in the park made of
   *  something that can only be gathered on one ground. Persisted; absent -> []. Zone-scoped (308). */
  private beacons: Landmark[] = [];
  private beaconSprites: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /** Granaries (BACKLOG-454) — the food-cap-lifting upgrade, one per zone. Persisted; absent → []. Zone-scoped (308). */
  private granaries: Landmark[] = [];
  private granarySprites: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /** Dinos that have ever set foot in the grove (BACKLOG-339). Persisted; absent → []. Gates the once-ever arrival beat. */
  private groveVisited: string[] = [];
  /** Dinos pausing to look around on a first grove arrival (BACKLOG-339) — transient, one forceStep hold. */
  private arriving = new Set<string>();
  /** Dinos that have ever seen the grove pond (BACKLOG-359). Persisted; absent → []. Gates the once-ever pond-sight beat. */
  private pondSeen: string[] = [];
  /** zone → the first dino ever to arrive there (BACKLOG-343). Persisted; absent → {}. First write wins. */
  private pioneers: Pioneers = {};
  /** Grounds whose hollowed beat has already been posted (BACKLOG-512); cleared when one repopulates. */
  private hollowedPosted = new Set<string>();
  /** Which grounds each dino has actually set foot on (BACKLOG-364) — the general form of `groveVisited`.
   *  Seeded with a dino's home zone at spawn; added to at both arrival seams. Persisted. */
  private seenZones: SeenZones = {};
  /** dino → zone → the in-game day it last crossed *out* of that ground (BACKLOG-362). The departure clock
   *  the yearning reads. Persisted; absent → {}. */
  private leftDays: LeftDays = {};
  /** dino → the ground it last crossed *out* of (BACKLOG-347). The near end of 362's clock: for a roll or
   *  two after arriving it is still full of that place. Persisted; absent → {}. */
  private cameFrom: CameFrom = {};
  /** dino → how many times it has ever arrived on a new ground (BACKLOG-361). The one dimension of the
   *  wander standing that has to be *kept*; reach is derived off `seenZones` every read. Persisted. */
  private crossings: Crossings = {};
  /** zone → how many mouths it can hold (BACKLOG-476). Derived from terrain and the grid, neither of which
   *  changes at runtime, so it is computed once in `create` rather than scanning 300 tiles per appeal read. */
  private zoneCaps: Record<string, number> = {};
  /** Dinos whose keepsake glance has already been logged this crossing (BACKLOG-347) — the ticker gets one
   *  line per crossing, not one per float. Not persisted: a reload is allowed to log it once more. */
  private struckTold = new Set<string>();
  /** The planted plot per zone (BACKLOG-145/349), or null when empty. Stores the in-game day it was planted. */
  private plotByZone: Record<string, { plantedDay: number } | null> = emptyPlots();
  private plotSpriteByZone: Record<string, Phaser.GameObjects.Text | Phaser.GameObjects.Image | null> = {};
  /** Lifetime crop harvest tally (BACKLOG-145). Persisted; absent → 0. Shared across both plots. */
  private harvested = 0;
  /** Per-zone crop harvest tally (BACKLOG-428) — the prosperity index's farming term. Persisted; absent → {}. */
  private harvestedByZone: Record<string, number> = {};
  /** Per-zone banked food (BACKLOG-446) — the food twin of `stockpileByZone`: a share of each harvest banks
   *  here by food id, capped, read on the zone-map lens. Persisted; absent → {}. */
  private foodPileByZone: Record<string, FoodPile> = {};
  /** The (lazily-created) food pile for a zone (BACKLOG-446) — twin of `pileFor`. */
  private foodStoreFor(zone: string): FoodPile {
    return (this.foodPileByZone[zone] ??= {});
  }
  /** Per-zone spend priority (BACKLOG-463), set by the zone's provider from its temperament. Persisted;
   *  a departed provider's policy lingers here until a new provider re-sets it. Absent → no policy. */
  private spendPriorityByZone: Record<string, SpendPriority> = {};
  /** The provider last seen holding each zone's say (BACKLOG-467). Persisted; when it changes to a new,
   *  non-null provider the handover lands a one-off logged beat. A departure leaves the last name here so
   *  no false handover fires if the same dino re-emerges. Absent → {} on load. */
  private lastProviderByZone: Record<string, string> = {};
  /** Per-zone provider-set work priority (BACKLOG-473) — the ground's second decision. Persisted and
   *  lingering exactly like `spendPriorityByZone`. Absent → no policy → today's behaviour at both hooks. */
  private workPriorityByZone: Record<string, WorkPriority> = {};
  /**
   * What a seat has lived on the ground it sits for (BACKLOG-492). All three reads already existed — this
   * only gathers them, so no new state and no new save field. `stake` is against the ground's *residents'*
   * banked total rather than the pile, because a ballot is about what this dino put in relative to its
   * neighbours and not about how full the pantry happens to be — and it is measured against an even split,
   * so the ordinary sole-banker ground reads 0 rather than handing that dino a free maximum nudge.
   */
  private seatExperience(name: string, zone: string): SeatExperience {
    const here = this.dinos.filter((d) => zoneOf(this.dinoZones, d.name, BOWL_ID) === zone);
    const bankedHere = here.reduce((n, d) => n + (this.foodBanked[d.name] ?? 0), 0);
    return {
      hunger: this.needs[name]?.hunger ?? 0,
      heldShort: (this.shortsByZone[zone] ?? 0) > 0,
      stake: bankedHere > 0 && here.length > 0 ? (this.foodBanked[name] ?? 0) / bankedHere - 1 / here.length : 0,
    };
  }
  /**
   * A zone's spend priority (BACKLOG-463): if it has a standing provider, the priority that provider
   * sets from its temperament (stored so it persists + reads legibly); else the last provider's lingering
   * policy, or null if the zone has never had a provider — null → today's behaviour (both hooks inert).
   */
  private spendPriorityFor(zone: string): SpendPriority | null {
    // BACKLOG-487: the ground's *older* call is the council's now too. Deliberately no `calledWork`-style
    // lean above it — the bill (485) leans a ground's labour, never its pantry, so there is nothing here to
    // override the decision with. This is the whole ladder.
    const provider = this.providerFor(zone);
    // Each seat votes the same agreeableness read the provider always used, so a council of one behaves
    // exactly as that one dino did alone and a shipping park is bit-identical. The provider only breaks a tie.
    const council = this.councilFor(zone);
    if (council.length) {
      // BACKLOG-492: each seat votes its temperament *shaded by what it has lived on this ground* — a bounded
      // nudge across the threshold, never a replacement for the trait. The tie-break is read lived too: the
      // provider is a seat, and a tie-break that ignored its history would be the one ballot in the room that
      // answers to nothing.
      const votes = council.map((n) => votedSpend(this.dinoByName(n)?.traits, this.seatExperience(n, zone)));
      const tieBreak = provider
        ? votedSpend(this.dinoByName(provider)?.traits, this.seatExperience(provider, zone))
        : null;
      const decided = councilSpendPriority(votes, tieBreak);
      if (decided) {
        this.spendPriorityByZone[zone] = decided;
        return decided;
      }
    }
    if (provider) {
      // BACKLOG-492 leaves this branch **unlived**, on purpose: a ground with no seats falls through to 463's
      // monarchy, the same dino reading the same trait the same way it always did. It is the live control
      // sitting beside the branch that changed — the 481 precedent, one layer along.
      const p = providerPriority(this.dinoByName(provider)?.traits);
      this.spendPriorityByZone[zone] = p;
      return p;
    }
    return this.spendPriorityByZone[zone] ?? null;
  }
  /**
   * A zone's work priority (BACKLOG-473) — the structural twin of `spendPriorityFor`: the standing
   * provider's call off its temperament, else the last provider's lingering call, else null (both hooks
   * inert, today's behaviour).
   */
  private workPriorityFor(zone: string): WorkPriority | null {
    // BACKLOG-485: the ground's own bill leans the answer, but never the *decision*. `decide()` below is the
    // pre-485 ladder untouched, including what it stores — so a ground that patches its skyline back up
    // returns to the call its council actually made rather than staying on the emergency footing.
    return calledWork(this.decideWork(zone), this.derelictIn(zone));
  }
  private decideWork(zone: string): WorkPriority | null {
    const provider = this.providerFor(zone);
    // BACKLOG-481: the ground's second call is the council's, not the provider's. Each seat votes its own
    // temperament; the provider only breaks a tie. A ground that seats nobody falls through to the rule
    // below untouched, which is what keeps a young park bit-identical to its pre-481 self.
    const council = this.councilFor(zone);
    if (council.length) {
      // BACKLOG-492: the labour ballot, shaded the same way — a hungry seat wants backs on the gathering, the
      // seat that filled the pile wants the pile to become something.
      const votes = council.map((n) => votedWork(this.dinoByName(n)?.traits, this.seatExperience(n, zone)));
      const tieBreak = provider
        ? votedWork(this.dinoByName(provider)?.traits, this.seatExperience(provider, zone))
        : null;
      const decided = councilWorkPriority(votes, tieBreak);
      if (decided) {
        this.workPriorityByZone[zone] = decided;
        return decided;
      }
    }
    if (provider) {
      // Unlived, for the reason recorded on `spendPriorityFor`'s twin branch: this is the control.
      const p = providerWorkPriority(this.dinoByName(provider)?.traits);
      this.workPriorityByZone[zone] = p;
      return p;
    }
    return this.workPriorityByZone[zone] ?? null;
  }
  /**
   * What each ground has last been heard to decide, and by whom (BACKLOG-481 / 487, re-seated on 489's gate).
   * Keyed `<zone>:work` / `<zone>:spend` so the two votes cannot collide on one ground, then by cause — which
   * is the whole of 489: a gate keyed by *place* alone cannot tell a ground that has never spoken from an
   * authority that has never spoken, and silences the second one.
   *
   * Deliberately **not persisted** — a live read of a live situation, the `shortsByZone` precedent. A reload
   * starts it empty, and the first council step after a reload therefore seeds rather than announces.
   */
  private callLog: CauseLog<string> = {};
  /** BACKLOG-484: the held council seating and the in-game day its term began. `null` seats means no term
   *  has been held yet — every ground reads live, exactly the pre-484 park. Persisted additively. */
  private councilSeats: Record<string, string[]> | null = null;
  private councilTermDay = 0;
  /** The berth (BACKLOG-389) — who has already hung back from *this* drop (so the hesitation reads once,
   *  not every step it stands there), and the last one for the dev hook. Both are per-drop and transient;
   *  neither is persisted, since the wariness they come from is derived from the memory ring that is. */
  private berthedThisDrop = new Set<string>();
  private lastBerth: { name: string; rival: string } | null = null;
  /**
   * The vote lands a beat (BACKLOG-481). Runs once per step from `forceStep`'s tail beside the handover
   * beat (467) — **never** from inside `workPriorityFor`, which several hooks call several times a tick and
   * which would announce the same vote four times a step.
   *
   * Only a *change* is news. The first seating a ground ever holds is not a turnover, so it is recorded
   * silently; every flip after it is announced in the legend's own words (`workCallMeaning`).
   */
  private checkCouncilCall(): void {
    for (const z of ZONES) {
      const seated = this.councilFor(z.id).length > 0;
      // BACKLOG-485: a ground with nothing derelict and nobody seated still announces nothing. A ground
      // whose walls are coming down has something to say whether or not it has seats to say it with.
      const lean = billLean(this.derelictIn(z.id));
      if (seated || lean) {
        const call = this.workPriorityFor(z.id);
        if (call) {
          // Who decided it. The bill is a distinct authority from the council, and 489 exists because that
          // distinction used to be invisible to the gate: a ground whose council had already called `gather`
          // and *then* lost a landmark said nothing at all, because the value had not changed — even though
          // the reason it now holds is that the walls are coming down, which is the part worth hearing.
          const cause = lean === call ? BILL_CAUSE : COUNCIL_CAUSE;
          const gate = recordCall(this.callLog, `${z.id}:work`, cause, call);
          this.callLog = gate.log;
          if (gate.announce) {
            // The bill's line, not the ballot's, when the bill is what decided it — no council voted for this.
            this.logEvent(
              cause === BILL_CAUSE ? billCallLine(z.name) : `🗳️ ${theZone(z.name)}'s council calls it: ${workCallMeaning(call)}`,
            );
          }
        }
      }
      // BACKLOG-487: the pantry call, announced the same way — but gated on the **council alone**. The lean
      // above is a labour concept (`calledWork` overrides the work call and nothing else), so letting a
      // derelict landmark open this door would have 485's bill announcing a decision it does not touch.
      if (!seated) continue;
      const spend = this.spendPriorityFor(z.id);
      if (!spend) continue;
      // The pantry has one authority today. It goes through the same gate anyway — that is the point of 489:
      // the day a second cause is added here, it will be heard rather than swallowed as a first record.
      const spendGate = recordCall(this.callLog, `${z.id}:spend`, COUNCIL_CAUSE, spend);
      this.callLog = spendGate.log;
      if (!spendGate.announce) continue;
      this.logEvent(`🗳️ ${theZone(z.name)}'s council calls it: ${spendCallMeaning(spend)}`);
    }
  }
  /**
   * The grumble's ledger (BACKLOG-471) — per zone, how many starving mouths the bank reserve (463) has held
   * short, and the in-game day this ground last sounded its discontent to the keeper. Deliberately **not
   * persisted**: a live read of a live situation, like the policy it reports. Feeding one of its own resets
   * the count; the day stamp is the once-a-day freshness gate.
   */
  private shortsByZone: Record<string, number> = {};
  private discontentDayByZone: Record<string, number> = {};
  /** Per-dino banked-food tally (BACKLOG-448) — units this dino put into some zone's store, by carrying
   *  (447) or hauling a harvest away. The `provider` role reads it. Persisted; absent → {}. */
  private foodBanked: Record<string, number> = {};
  /** Where each dino belongs (BACKLOG-452) — the zone it last settled in. Persisted; absent → {}. */
  private roots: Roots = {};
  /** Credit one banked food unit to a dino (BACKLOG-448) — the single write both sources go through. */
  private creditFoodBank(name: string): void {
    this.foodBanked[name] = (this.foodBanked[name] ?? 0) + 1;
  }
  /** The last dino to eat + when (BACKLOG-373) — the anchor a shared meal pairs against. Transient (a live
   *  moment, not saved state). */
  private lastMeal: { name: string; at: number } | null = null;
  /** Last plot stage drawn per zone — so the ripen note fires once, on the edge into ripe. */
  private plotStageShownByZone: Record<string, CropStage | 'empty'> = emptyPlotStages();
  /** The active world-scale night event (BACKLOG-144), or null. Transient — only its memory persists. */
  private activeSky: SkyEvent | null = null;
  private skyStartAbsMin = 0;
  /** In-game day of the last sky event — caps the spectacle at one per day. */
  private skyFiredDay = -1;
  private skyGazers = new Set<string>();
  /** Where each gazer settled to watch (BACKLOG-288) — pairs of adjacent watchers bond when the event ends. */
  private skyGazerTiles = new Map<string, { tileX: number; tileY: number }>();
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
  /** Active intent per dino (BACKLOG-393): the current day-phase's lean. Transient — re-derived when the phase or day turns. */
  private intents: Record<string, DinoIntent> = {};
  /** The day-phase the cached active intent was derived for (BACKLOG-012) — a new phase re-derives from the plan. */
  private intentPhase: Record<string, DayPhase> = {};
  /** Persona-shaped daily plan (BACKLOG-012): the day's shape per dino. Transient — recomputed each in-game day, never persisted. */
  private plans: Record<string, { day: number; plan: DayPlan }> = {};
  /** Generate-once personas (BACKLOG-103): cached selves, persisted in the save. */
  private personas: Record<string, Persona> = {};
  /** Edge indicators (BACKLOG-398): the current zone's neighbour labels, rebuilt per zone change. */
  private edgeLabelTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('World');
  }

  create(): void {
    // BACKLOG-476: each ground's carrying capacity, derived once from its own terrain.
    for (const z of zoneChain()) this.zoneCaps[z] = zoneCapacity(z, COLS, ROWS);
    this.drawFloor();
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
    this.setupPlot();
    this.setupSkyEvent();
    this.setupMigration();
    this.setupPlaque();
    this.setupScan();
    this.setupIdle();
    this.setupTouchControls();

    // BACKLOG-431: freeze/thaw the wall-clock ambient timers (wander/sky/migration rolls) so parallel e2e
    // specs don't race the background world tick. boot() pauses; ambient-beat specs step explicitly anyway.
    (window as any).__pauseAmbient = () => { this.ambientPaused = true; };
    (window as any).__resumeAmbient = () => { this.ambientPaused = false; };
    (window as any).__ambientPaused = () => this.ambientPaused;

    // BACKLOG-456: hold/release the ambient work that rides a driven forceStep (meetings, resource spawn,
    // gathering). A spec wraps its driven crossing in these so the pile/bond state it pinned stays pinned.
    (window as any).__holdAmbient = () => { this.ambientHeld = true; };
    (window as any).__releaseAmbient = () => { this.ambientHeld = false; };
    (window as any).__ambientHeld = () => this.ambientHeld;
    // BACKLOG-456: the save is fire-and-forget everywhere in play (`void this.saveGame()`), which is right
    // for the game and is exactly what races a spec's page.reload(). This hands the promise back so a spec
    // can await the write settling before it reloads. No production call site changed.
    (window as any).__flushSave = () => this.saveGame();

    // BACKLOG-522: pose the sleepers before the first frame is shown. Without this the park opens with
    // its one sleeping dino ambling on the spot for a world step, which is the exact read the pose exists
    // to remove — and "frame one" is where this item's reachability answer lives, not "after a tick".
    this.refreshSleepPoses();

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
      zone: zoneById(this.zoneId).name,
      stockpile: this.zoneStores(),
      zoneTally: this.zoneTally(),
    });
    // dev-only Playwright hooks — current zone + a jump (BACKLOG-143)
    (window as any).__zone = () => this.zoneId;
    (window as any).__setZone = (id: string) => {
      this.zoneId = id;
      this.refreshPlaque();
      this.applyZoneVisibility();
      this.applyObjectVisibility();
      this.drawFloor();
    };
    // dev-only hook — the current zone's rendered edge labels (BACKLOG-398), west→east order.
    (window as any).__edgeLabels = () => this.edgeLabelTexts.map((t) => t.text);
    // dev-only hooks — brain-biased intent (BACKLOG-393): read today's intent (authoring it on
    // first read, same path the step loop takes — deterministic either way); force one for e2e.
    (window as any).__intent = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.ensureIntent(d) : (this.intents[name] ?? null);
    };
    (window as any).__setIntent = (name: string, kind: IntentKind) => {
      const now = getWorldClock().now();
      this.intents[name] = { kind, note: INTENT_NOTES[kind], until: now.day };
      this.intentPhase[name] = dayPhase(now.hour); // pin the phase so ensureIntent honours the forced lean
      return this.intents[name];
    };
    // dev-only hook — daily plan (BACKLOG-012): read a dino's day shape (one lean per day-phase),
    // computing it on first read the same deterministic path the step loop takes.
    (window as any).__plan = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.ensurePlan(d, getWorldClock().now().day) : (this.plans[name]?.plan ?? null);
    };
    // dev-only hooks — persona (BACKLOG-103): read a dino's persona (authoring it on first read,
    // the same generate-once path every brain call site takes) + the whole cached store.
    (window as any).__persona = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.ensurePersona(d) : (this.personas[name] ?? null);
    };
    (window as any).__personas = () => ({ ...this.personas });
    // dev-only hook — which ground tiles the pixel pipeline draws (BACKLOG-033 path/water render check).
    (window as any).__hasTileArt = (name: string) => hasTileArt(name);
    // dev-only hook — the active floor render (BACKLOG-294): zone, texture key, and whether tinted.
    (window as any).__floorInfo = () => ({
      zone: this.zoneId,
      key: this.floorImage?.texture.key ?? null,
      tinted: this.floorImage?.isTinted ?? false,
    });
  }

  private refreshPlaque(): void {
    if (!this.plaque) return;
    this.plaque.setText(
      plaqueLines({
        population: this.dinos.length,
        day: getWorldClock().now().day,
        generations: maxGeneration(this.born),
        zone: zoneById(this.zoneId).name,
        stockpile: this.zoneStores(),
        zoneTally: this.zoneTally(),
      }).join('\n'),
    );
  }

  /** Per-zone population readout (BACKLOG-316): each zone's resident count, '▸' on the keeper's active zone. */
  private zoneTally(): string {
    return zoneTallyLine(
      zonePopulations(this.dinoZones, this.dinos.map((d) => d.name), BOWL_ID),
      this.zoneId,
    );
  }

  /** Both-zone stores readout (BACKLOG-357/378): each zone's pile glyphs, '▸' on the keeper's active zone, so the
   *  player can watch the economies diverge without crossing. Over every zone now (a third can hold a pile too);
   *  empty zones drop out (see zoneStoresLine). */
  private zoneStores(): string {
    return zoneStoresLine(
      Object.fromEntries(ZONES.map((z) => [z.id, stockpileLine(this.pileFor(z.id))])),
      this.zoneId,
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
    // BACKLOG-374: comfort food. Last comfort beat (a loner soothed by its favorite) or null; a named dino
    // eats the food in play (deterministic eater for the swarm race).
    (window as any).__lastComfortFood = () => (this.lastComfortFood ? { ...this.lastComfortFood } : null);
    (window as any).__eat = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d && this.food) this.eatFood(d);
    };
    // BACKLOG-375: the last generous-feed beat (who gave up a meal to whom) or null, + a deterministic
    // placement hook so a test can stand the winner + a hungry friend at chosen tiles before a drop.
    (window as any).__yieldFood = () => (this.lastYield ? { ...this.lastYield } : null);
    // BACKLOG-387: the last greedy-gobble beat (who shouldered past whom) + a trait setter so a test can
    // make a dino prickly/hungry-greedy deterministically (no existing trait-mutation hook).
    (window as any).__gobbleFood = () => (this.lastGobble ? { ...this.lastGobble } : null);
    // BACKLOG-390: the last stand-up beat (a bold winner that held its ground against a gobbler) or null.
    (window as any).__standFood = () => (this.lastStand ? { ...this.lastStand } : null);
    // BACKLOG-389: the last berth beat (who hung back from whom at this drop) or null.
    (window as any).__berth = () => (this.lastBerth ? { ...this.lastBerth } : null);
    // BACKLOG-403: the last mercy beat (a victor that let a rival it had faced down have the scrap) or null.
    (window as any).__mercy = () => (this.lastMercy ? { ...this.lastMercy } : null);
    // BACKLOG-401: run the *production* contested-drop resolution for a named pair (the branch checkFeeding
    // calls), so a spec can stage the moment instead of asserting a derivation the game never reached.
    (window as any).__forceContest = (winner: string, gobbler: string) => {
      const eater = this.dinos.find((d) => d.name === winner);
      // A contest is over a real drop — the resolution eats it. No food on the ground, no contest.
      if (!eater || !this.foodKind || !this.dinos.some((d) => d.name === gobbler)) return null;
      this.resolveContest(eater, gobbler);
      return { stand: this.lastStand, gobble: this.lastGobble };
    };
    // BACKLOG-401: the live per-opponent disposition, so a spec can read what the hatch will act on.
    (window as any).__disposition = (name: string, other: string) =>
      dispositionToward(recall(this.memory, name), other);
    // BACKLOG-386/385: the last grateful-nuzzle beat, and the live "who owes whom a meal back" ledger.
    (window as any).__nuzzle = () => (this.lastNuzzle ? { ...this.lastNuzzle } : null);
    (window as any).__owesFood = () => JSON.parse(JSON.stringify(this.owesFood)) as Record<string, string[]>;
    (window as any).__setTrait = (name: string, key: string, v: number) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d) (d.traits as any)[key] = v;
      return !!d;
    };
    (window as any).__placeDino = (name: string, tileX: number, tileY: number) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d) d.setPosition(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
      return !!d;
    };
    // BACKLOG-405: a dino's solitary-tic state — its solo-step count, whether it has invented the tic this
    // stretch, and its (deterministic) signature ritual — so a test can watch a lone dino fall into it.
    (window as any).__tic = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return null;
      // BACKLOG-410: `strange` = alone in a strange zone (fresh + no in-zone friend); reported so the e2e can
      // prove the shortened onset. Computed the same way the wander branch does (settled + zone-mate friend read).
      const strange = aloneInStrangeZone(
        isSettled(tenureOf(this.tenure, name)),
        closestFriend(name, this.bonds, this.zoneMates(d), GRIEF_BOND_FLOOR) !== null,
      );
      return { solo: this.soloSteps[name] ?? 0, invented: this.ticInvented.has(name), tic: this.ticFor(d), strange };
    };
    // BACKLOG-414: the grief a dino's tic carries — its computed grief (closest cross-zone friend + edge), the
    // anchor its ritual settled on, and the friend it's grieving this stretch — so the e2e can prove the aim.
    (window as any).__griefTic = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return null;
      return { grief: this.griefFor(d), anchor: this.ticAnchor[name] ?? null, grieved: this.ticGrief[name] ?? null };
    };
    // BACKLOG-408: force a dino into its invented-tic state (mid-ritual) so the caught-mid-tic greet is
    // deterministic — no 20-step solitude loop a stray wanderer could perturb. Mirrors what forceStep does.
    // BACKLOG-424: the live pacing traces, a forced mark at a dino's current tile, and one deterministic
    // pass of the notice scan — the e2e drives the beat without waiting on a 20-step solitude stretch.
    (window as any).__traces = () => this.paceTraces.map((t) => ({ ...t }));
    (window as any).__leaveTrace = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return false;
      this.leaveTrace(d);
      return true;
    };
    (window as any).__noticeTraces = () => this.noticeTraces();
    (window as any).__inventTic = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return false;
      this.soloSteps[name] = TIC_AFTER_STEPS;
      this.ticInvented.add(name);
      this.ticsFormed.add(name); // BACKLOG-409: the hook produces the same state performTic does
      this.ticAnchor[name] ??= this.anchorForTic(d); // BACKLOG-421: the hook lays a haunt exactly as production does
      return true;
    };
    // BACKLOG-407: the ritual a dino has picked up off a friend (null when it still performs its own), the
    // per-pair watch tally, and one deterministic pass of the watch scan — the `__noticeTraces` precedent, so
    // the spec and the game drive the same path rather than the spec driving a second one.
    (window as any).__ticCatches = (name: string) => this.ticCatches[name] ?? 0; // BACKLOG-420
    // BACKLOG-507: the worn marks actually drawn on the active ground (the sprites, not the pure read),
    // so a spec asserts what the player sees rather than what the model thinks.
    (window as any).__wornMarks = () =>
      Object.entries(this.wearSprites).map(([id, sprite]) => ({
        name: id.split(':')[0],
        tileX: Math.floor(sprite.x / TILE),
        tileY: Math.floor(sprite.y / TILE),
        visible: sprite.visible,
      }));
    // BACKLOG-421: the haunt this dino keeps on the ground it is standing on, plus this stretch's anchor.
    (window as any).__ticHaunt = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return null;
      const zone = zoneOf(this.dinoZones, name, BOWL_ID);
      return { zone, haunt: this.ticHaunts[name]?.[zone] ?? null, anchor: this.ticAnchor[name] ?? null };
    };
    // BACKLOG-422: the warmth ledgers — the per-stretch budget and the persisted lifetime ceiling.
    (window as any).__catchWarmth = (name: string) => ({
      stretch: this.ticWarmthStretch[name] ?? 0,
      life: this.catchWarmthTotal[name] ?? 0,
    });
    // BACKLOG-420: end a solitary stretch the way company or a need does, so a spec can prove the register
    // starts warm again rather than inferring it. Drives production's own `resetTic`, not a second path.
    (window as any).__resetTic = (name: string) => {
      this.resetTic(name);
      return this.ticCatches[name] ?? 0;
    };
    // BACKLOG-411: the warm trace a found dino carries, and one deterministic run of the stretch-ending
    // beat. `__breakTic` drives production's own `breakTic` (the `__resetTic` precedent, not a second
    // path); the optional `agedBy` backdates the trace so the fade can be tested without a clock hook.
    (window as any).__companyTrace = (name: string) => this.companyTrace[name] ?? null;
    (window as any).__breakTic = (name: string, agedBy = 0) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return null;
      this.breakTic(d);
      const t = this.companyTrace[name];
      if (t && agedBy) t.at -= agedBy;
      return t ?? null;
    };
    (window as any).__ticEcho = (name: string) => {
      const axis = this.ticEchoes[name];
      const d = this.dinos.find((x) => x.name === name);
      return axis && d ? { axis, tic: this.ticFor(d) } : null;
    };
    (window as any).__ticWatches = (watcher: string, performer: string) =>
      this.ticWatches[`${watcher}>${performer}`] ?? 0;
    (window as any).__watchTic = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.watchTic(d) : [];
    };
    // BACKLOG-416: one deterministic pass of the kinship scan — the `__watchTic` precedent, so the spec
    // drives the very method `performTic` calls rather than a second path of its own.
    (window as any).__kinTic = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.kinTic(d) : [];
    };
    // any: dev-only Playwright hooks — the resource in play / per-dino gather tally / deterministic spawn (BACKLOG-146)
    // BACKLOG-314: the active zone's resource, else any present one (so cross-zone queries still read).
    (window as any).__resource = () => {
      const r = this.resourceByZone[this.zoneId] ?? Object.values(this.resourceByZone)[0];
      return r ? { ...r } : null;
    };
    (window as any).__gathered = () => ({ ...this.gathered });
    (window as any).__yield = (zone: string) => this.yieldByZone[zone] ?? YIELD_MAX; // BACKLOG-384: a zone's gather yield

    (window as any).__stockpile = () => ({ ...this.pileFor(this.zoneId) }); // BACKLOG-328: the keeper's active-zone pile
    // BACKLOG-509: every ground's pile at once — the tithe is a claim about the whole park, not one zone.
    (window as any).__pilesByZone = () =>
      Object.fromEntries(zoneChain().map((z) => [z, { ...this.pileFor(z) }] as const));
    (window as any).__zoneStockpile = (z: string) => ({ ...this.pileFor(z) }); // BACKLOG-328: a named zone's pile
    // BACKLOG-504: the heap on a ground's bank tile — what the player can see, not what the lens reports.
    // BACKLOG-510: the hatch itself — where the drop comes from, not just where the piece ended up.
    (window as any).__hatch = () => ({
      tile: { ...HATCH_TILE },
      scatter: HATCH_SCATTER,
      visible: !!this.hatchSprite?.visible,
      art: !!(this.hatchSprite instanceof Phaser.GameObjects.Image),
    });
    (window as any).__bank = (z?: string) => {
      const zone = z ?? this.zoneId;
      return {
        tile: { ...BANK_TILE },
        step: bankStep(this.pileFor(zone)),
        total: pileTotal(this.pileFor(zone)),
        visible: !!this.bankSprites[zone]?.visible,
      };
    };
    (window as any).__zoneFoodPile = (z: string) => ({ ...this.foodStoreFor(z) }); // BACKLOG-446: a named zone's banked food
    // BACKLOG-444: seed a zone's banked food so the e2e can watch the stores feed a starving resident.
    (window as any).__setZoneFoodPile = (zone: string, pile: Record<string, number>) => {
      this.foodPileByZone[zone] = { ...pile };
      return { ...this.foodStoreFor(zone) };
    };
    // BACKLOG-455: run one in-game-day spoilage pass across all zones now (the same path the day hook drives),
    // so a test can prove a hoard at/near cap bleeds without waiting on the realtime clock.
    (window as any).__spoilFood = () => {
      this.runSpoilage();
      return Object.fromEntries(zoneChain().map((z) => [z, { ...this.foodStoreFor(z) }]));
    };
    // BACKLOG-215: run the spring-thaw relief pass directly (mirrors __spoilFood → runSpoilage) so e2e drives the
    // exact turn path deterministically.
    (window as any).__thawRelief = () => this.runThawRelief();
    // BACKLOG-463: a zone's provider-set spend priority ('feed' / 'bank' / null when no provider has emerged).
    (window as any).__spendPriority = (zone: string) => this.spendPriorityFor(zone ?? this.zoneId);
    (window as any).__workPriority = (zone: string) => this.workPriorityFor(zone ?? this.zoneId); // BACKLOG-473
    // BACKLOG-471: the grumble's ledger — mouths each ground has held short, and the day it last sounded.
    (window as any).__discontent = () => ({
      shorts: { ...this.shortsByZone },
      lastDay: { ...this.discontentDayByZone },
    });
    // BACKLOG-465: what a harvest of this crop banks right now, so a spec asserts the table the sim runs on.
    (window as any).__cropYield = (food: string, season?: Season) => cropYield(food, season ?? this.currentSeason());
    // BACKLOG-358: seed a zone's pile + run a barter between two named dinos deterministically (edge-meet trade).
    (window as any).__setZonePile = (zone: string, pile: Record<string, number>) => {
      this.setPile(zone, { ...pile });
      return { ...this.pileFor(zone) };
    };
    // BACKLOG-358: run the ambient edge-meet scan deterministically (like __maybeMigrate) — dwell accumulates
    // per call on the dinos' current tiles, so a test can park two at a shared edge and prove the scan fires.
    // BACKLOG-467: the keeper's Park News ticker (the eventLog), and who last held each zone's say — the
    // handover beat lands on the ticker, the tracked holder proves the one-off re-set.
    (window as any).__ticker = () => [...this.eventLog];
    (window as any).__providerHandover = () => ({ ...this.lastProviderByZone });
    (window as any).__maybeBarter = () => this.maybeBarter();
    (window as any).__edgeBarter = (a: string, b: string) => {
      const da = this.dinoByName(a);
      const db = this.dinoByName(b);
      if (!da || !db) return null;
      const za = zoneOf(this.dinoZones, a, BOWL_ID);
      const zb = zoneOf(this.dinoZones, b, BOWL_ID);
      const traded = this.doBarter(da, za, db, zb);
      return { traded, a: { ...this.pileFor(za) }, b: { ...this.pileFor(zb) } };
    };
    (window as any).__cairns = () => this.cairns.map((c) => ({ ...c })); // BACKLOG-286: crafted cairns
    (window as any).__canCraft = () => canCraft(this.pileFor(this.zoneId)); // BACKLOG-286
    (window as any).__shelters = () => this.shelters.map((s) => ({ ...s })); // BACKLOG-315: dino-built shelters
    // BACKLOG-344: the first shelter's baked texture key (or null if it fell back to the 🛖 glyph).
    (window as any).__shelterArt = () =>
      this.shelterSprites[0] instanceof Phaser.GameObjects.Image ? this.shelterSprites[0].texture.key : null;
    (window as any).__canBuildShelter = () => canBuildShelter(this.pileFor(this.zoneId)); // BACKLOG-315
    (window as any).__thatches = () => this.thatches.map((t) => ({ ...t })); // BACKLOG-417: woven frond thatches
    (window as any).__beacons = () => this.beacons.map((b) => ({ ...b })); // BACKLOG-503: the Ridge's obsidian beacons
    // BACKLOG-503: the next hop a named dino would take on a quarry errand, or null when it has no errand.
    (window as any).__quarryDest = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.quarryDestOf(zoneOf(this.dinoZones, d.name, BOWL_ID)) : null;
    };
    // BACKLOG-417: is the first thatch drawn from the stashed pixel rig (BACKLOG-427) rather than the 🥻 glyph?
    (window as any).__thatchIsArt = () =>
      this.thatchSprites.length > 0 && this.thatchSprites[0] instanceof Phaser.GameObjects.Image;
    (window as any).__zoneStructure = (z?: string) => zoneStructure(z ?? this.zoneId); // BACKLOG-377: the zone's landmark type
    // BACKLOG-454: granaries, whether a zone has one, and its live food cap (6, or 9 with a granary).
    (window as any).__granaries = () => this.granaries.map((g) => ({ ...g }));
    // BACKLOG-454: is the first granary drawn from the baked pixel rig rather than the 🏛️ glyph?
    (window as any).__granaryIsArt = () =>
      this.granarySprites.length > 0 && this.granarySprites[0] instanceof Phaser.GameObjects.Image;
    (window as any).__hasGranary = (z?: string) => this.hasGranary(z ?? this.zoneId);
    // BACKLOG-480: the raised read (incl. a derelict granary) — the one-per-zone build gate, not the cap lift.
    (window as any).__granaryRaised = (z?: string) => this.granaryRaised(z ?? this.zoneId);
    // BACKLOG-480: run the production upkeep pass (a live day, or `days` of away catch-up) and read the
    // per-zone standing/derelict counts. Mirrors __spoilFood — one path for the game and the spec.
    (window as any).__runUpkeep = (days = 1) => this.runUpkeepPass(days);
    // CHARTER v7 / BACKLOG-488: drop the founding ruin and its pile, restoring the pre-v7 empty-grounds
    // fixture. The `gatherToBowl` precedent (cycle 135): a spec whose subject is *not* the founding state
    // still needs the old fixture, and it should say so out loud rather than inherit it by accident.
    (window as any).__clearFounding = () => {
      this.foundingCleared = true;
      const i = this.cairns.findIndex(
        (c) => c.zone === FOUNDING_RUIN.zone && c.tileX === FOUNDING_RUIN.tileX && c.tileY === FOUNDING_RUIN.tileY,
      );
      if (i >= 0) {
        this.cairns.splice(i, 1);
        this.cairnSprites.splice(i, 1).forEach((sp) => sp.destroy());
      }
      for (const zone of Object.keys(FOUNDING_PILES)) this.setPile(zone, {});
      // BACKLOG-492/495: the founding council goes with the founding ruin. A spec that asks for the pre-v7
      // fixture means *all* of it — an empty council, an unset lens glyph, a null Grove policy — and letting
      // the bank ledger survive here would leave the same unnamed assumption this hook exists to name.
      for (const name of Object.keys(FOUNDING_BANKED)) delete this.foodBanked[name];
      // ...and the calls those tallies produced. `spendPriorityFor`/`decideWork` **store** every answer they
      // derive and fall back to the stored one when a ground seats nobody (the 463 lingering-policy rule), so
      // dropping the ledger alone would leave the Grove reading a policy it can no longer have voted for —
      // a ground that "has never decided anything" with a decision in it. Clearing the memo is what makes
      // this hook actually restore the pre-v7 park rather than approximately restore it.
      this.spendPriorityByZone = {};
      this.workPriorityByZone = {};
      this.callLog = {};
      this.mend = null;
      this.applyObjectVisibility();
      return this.cairns.length;
    };
    // BACKLOG-488: the live mend errand, and one deterministic resolve step, so a spec drives the
    // production path rather than waiting on frame timing (the `__noticeTraces` precedent).
    (window as any).__mend = () => (this.mend ? { ...this.mend } : null);
    (window as any).__stepMend = () => {
      this.checkMend();
      this.stepMend();
      return this.mend ? { ...this.mend } : null;
    };
    (window as any).__landmarks = (z?: string) =>
      this.landmarksIn(z ?? this.zoneId).map((l) => ({ ...l, derelict: !!l.derelict }));
    (window as any).__standing = (z?: string) => this.standingIn(z ?? this.zoneId);
    (window as any).__foodCap = (z?: string) => this.foodCapFor(z ?? this.zoneId); // BACKLOG-461: granary- + season-aware
    // dev-only: seed a zone's pile + landmark count so the granary build is reachable in a test without
    // gathering it out. Adds `n` cairns tagged to the zone and stocks the pile to the granary recipe.
    (window as any).__seedGranaryReady = (zone: string, landmarks = GRANARY_AFTER_STRUCTURES) => {
      for (let i = 0; i < landmarks; i++) this.cairns.push({ tileX: 1 + i, tileY: 1, zone });
      // BACKLOG-503: seed from the recipe rather than a copy of it. The hook's name is a promise that the
      // ground is *ready*, and the day the recipe grew an obsidian this hardcoded {branch:3, stone:3} took
      // five specs red at once — every one of them about upkeep or the bill call, not about the granary.
      this.setPile(zone, { ...this.pileFor(zone), ...GRANARY_RECIPE });
    };
    // dev-only: run the exact on-gather build decision for a named dino's zone (granary gate vs bias landmark).
    (window as any).__runBuild = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d) this.buildOnGather(d);
    };
    // dev-only: bank one unit of `food` into a zone's store at that zone's live cap (BACKLOG-454) — returns
    // the pile total after, so a test can prove a granary'd zone banks past the flat cap. Mirrors the harvest bank.
    (window as any).__bankFood = (zone: string, food: string) => {
      const cap = this.foodCapFor(zone); // BACKLOG-461: granary- + season-aware
      this.foodPileByZone[zone] = bankFood(this.foodStoreFor(zone), food, cap);
      return foodPileTotal(this.foodStoreFor(zone));
    };
    // BACKLOG-308: which world-object sprites are currently drawn — the zone-scoping render check.
    (window as any).__objVisible = () => ({
      resource: this.resourceSpriteByZone[this.zoneId]?.visible ?? false,
      plot: this.plotSpriteByZone[this.zoneId]?.visible ?? false,
      // BACKLOG-349: per-zone plot visibility — each zone's plot draws only while the keeper is in it.
      plotByZone: Object.fromEntries(
        Object.keys(this.plotSpriteByZone).map((z) => [z, this.plotSpriteByZone[z]?.visible ?? false]),
      ),
      cairns: this.cairnSprites.map((s) => s.visible),
      shelters: this.shelterSprites.map((s) => s.visible), // BACKLOG-315
    });
    // BACKLOG-339: which dinos have ever been to the grove / are pausing on a fresh arrival.
    (window as any).__groveVisited = () => [...this.groveVisited];
    (window as any).__arriving = () => [...this.arriving];
    // BACKLOG-359: which dinos have ever seen the pond; __seePond drives the once-ever beat for the e2e
    // by dropping a dino into the grove beside the pond water and running the check.
    (window as any).__pondSeen = () => [...this.pondSeen];
    (window as any).__pioneers = () => ({ ...this.pioneers }); // BACKLOG-343
    // BACKLOG-364: which grounds each dino has set foot on, and a direct drive of one telling.
    (window as any).__seenZones = () => JSON.parse(JSON.stringify(this.seenZones));
    (window as any).__crossings = () => JSON.parse(JSON.stringify(this.crossings)); // BACKLOG-361
    (window as any).__leftDays = () => JSON.parse(JSON.stringify(this.leftDays)); // BACKLOG-362
    (window as any).__yearnDest = (name: string) => {
      const d = this.dinoByName(name);
      return d ? this.yearnDestOf(d) : null;
    }; // BACKLOG-362
    // BACKLOG-475: the ground it wants vs. the neighbour it steps to on the way there — the same pair for
    // both pulls, so a two-hop longing/hearsay is observable from a spec.
    (window as any).__yearnTarget = (name: string) => {
      const d = this.dinoByName(name);
      return d ? this.yearnTargetOf(d) : null;
    };
    (window as any).__plentyDest = (name: string) => {
      const d = this.dinoByName(name);
      return d ? this.plentyDestOf(d) : null;
    };
    (window as any).__plentyTarget = (name: string) => {
      const d = this.dinoByName(name);
      return d ? this.plentyTargetOf(d) : null;
    };
    /** Drive the scarcity/hearsay/longing crossing decision for one named dino (BACKLOG-475), the twin of
     *  `__homesickMigrate`: production and test take the exact same path. Returns the destination it set. */
    (window as any).__scarcityMigrate = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.scarcityMigrate(d);
      return this.migrationCross[name]?.dest ?? null;
    };
    /** Seed the per-zone harvest tally (BACKLOG-433) directly — the demand read (438/475) is a pure function
     *  of it, and driving four harvests through the plot clock proves nothing this doesn't. */
    (window as any).__setHarvests = (harvests: Record<string, number>) => {
      this.harvestedByZone = { ...this.harvestedByZone, ...harvests };
      this.refreshPlaque();
      return { ...this.harvestedByZone };
    };
    /** The ground a named dino currently calls home — `__migrate` returns it, but a *walked* crossing had
     *  no read of its own (BACKLOG-347/475: both arcs need to watch a dino arrive somewhere). */
    (window as any).__homeZone = (name: string) => zoneOf(this.dinoZones, name, BOWL_ID);
    (window as any).__teach = (a: string, b: string) => this.teachBeat(a, b);
    // BACKLOG-474: which grounds nobody has ever lived on, in chain order.
    (window as any).__unsettled = () => zoneChain().filter((z) => this.isZoneUnsettled(z));
    // BACKLOG-516: found a ground from a test the way a real crossing does — through `foundZone`, so the
    // ticker beat and the first-write-wins guard are the ones production uses.
    (window as any).__found = (zone: string, name: string) => { const r = this.foundZone(name, zone); this.applyObjectVisibility(); return r; };
    // BACKLOG-501: what mark this ground is showing, or null for ground nobody has founded.
    (window as any).__stake = () => stakeArtKey(pioneerOf(this.pioneers, this.zoneId) ? foundingKind(this.pioneers, this.zoneId) : null, this.isZoneHollowed(this.zoneId));
    (window as any).__hollowed = () => { this.checkHollowed(); return zoneChain().filter((z) => this.isZoneHollowed(z)); }; // BACKLOG-512
    (window as any).__seePond = (name: string) => {
      const d = this.dinoByName(name);
      if (d) {
        setZone(this.dinoZones, name, GROVE_ID);
        d.setPosition(16 * TILE + TILE / 2, 5 * TILE + TILE / 2); // one tile south of the NE pond block
        this.checkPondSight();
      }
      return [...this.pondSeen];
    };
    (window as any).__spawnResource = (
      kind: ResourceKind,
      tileX: number,
      tileY: number,
      fresh = false,
      zone: string = this.zoneId, // BACKLOG-314: default the active zone (existing specs spawn in the bowl)
    ) => {
      // fresh=true starts the BACKLOG-297 grace at 0 (to test the linger); default → already fetchable,
      // so the existing gather/craft/stockpile e2e keep their immediate single-step pickup.
      this.spawnResource(kind, tileX, tileY, zone);
      this.resourceAgeByZone[zone] = fresh ? 0 : RESOURCE_GRACE_STEPS;
    };
    (window as any).__favoriteFood = (name: string, season?: Season) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? { ...favoriteFood(d.traits, season ?? this.currentSeason()) } : null;
    };
    // BACKLOG-296: pixel props. __hasPropArt = a rig exists; __resourceIsArt/__cairnIsArt = the live
    // sprite is the baked image (not the emoji fallback) — lets the e2e prove the swap without pixels.
    // BACKLOG-348: prove the production bundle wires the per-zone resource bias through pickKind.
    (window as any).__biasKind = (zone: string, r: number) => pickKind(() => r, zone);
    (window as any).__hasPropArt = (name: string) => hasPropArt(name);
    (window as any).__resourceIsArt = () =>
      this.resourceSpriteByZone[this.zoneId] instanceof Phaser.GameObjects.Image;
    (window as any).__cairnIsArt = () =>
      this.cairnSprites.length > 0 && this.cairnSprites[0] instanceof Phaser.GameObjects.Image;
    // BACKLOG-490/491: is the live sprite the baked rig rather than the emoji fallback? Same read as the
    // two above, so the spec proves the swap without comparing pixels.
    (window as any).__foodIsArt = () => this.foodSprite instanceof Phaser.GameObjects.Image;
    (window as any).__eggIsArt = () => {
      const first = this.eggSprites.values().next();
      return !first.done && first.value instanceof Phaser.GameObjects.Image;
    };
    // BACKLOG-494: which texture the first cairn is actually wearing, and at what opacity — so a spec can
    // prove disrepair swaps to the *ruin* rig at full alpha rather than fading the standing one.
    (window as any).__cairnArt = () => {
      const sp = this.cairnSprites[0] as Phaser.GameObjects.Image | undefined;
      if (!sp || !(sp instanceof Phaser.GameObjects.Image)) return null;
      return { texture: sp.texture.key, alpha: sp.alpha };
    };
  }

  /**
   * Plantable plot (BACKLOG-145): one fixed plot. Press P adjacent to plant a seed; it grows over
   * realtime-clock days; press P adjacent again once ripe to harvest the crop into the feeding loop.
   */
  private setupPlot(): void {
    for (const z of Object.keys(PLOT_TILE_BY_ZONE)) this.drawPlotSprite(z, 'empty');
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P).on('down', () => this.handlePlot());
    this.refreshPlot();

    // any: dev-only Playwright hooks (BACKLOG-145/349). Each takes an optional zone (default = the active
    // zone, so existing bowl-default calls are byte-identical). __plot reports stage off the live clock day.
    (window as any).__plot = (zone?: string) => {
      const p = this.plotByZone[zone ?? this.zoneId];
      return p ? { plantedDay: p.plantedDay, stage: cropStage(getWorldClock().now().day - p.plantedDay) } : null;
    };
    (window as any).__harvested = () => this.harvested;
    (window as any).__lastMeal = () => this.lastMeal; // BACKLOG-373: the last-eaten anchor a shared meal pairs against
    (window as any).__plantPlot = (zone?: string) => {
      this.plant(zone ?? this.zoneId);
      return (window as any).__plot(zone);
    };
    (window as any).__harvestPlot = (zone?: string) => {
      this.harvest(zone ?? this.zoneId);
      return this.harvested;
    };
    // BACKLOG-317: the baked crop texture key when a stage rig renders, else null (emoji fallback).
    (window as any).__plotArt = (zone?: string) => {
      const s = this.plotSpriteByZone[zone ?? this.zoneId];
      return s instanceof Phaser.GameObjects.Image ? s.texture.key : null;
    };
    // BACKLOG-418: the plot's glyph marker (a Text sprite), so the per-zone ripe crop marker is assertable.
    (window as any).__plotGlyph = (zone?: string) => {
      const s = this.plotSpriteByZone[zone ?? this.zoneId];
      return s instanceof Phaser.GameObjects.Text ? s.text : null;
    };
  }

  /** Draw a zone's plot sprite for a stage: a baked crop prop where a rig exists (BACKLOG-317), else the
   *  emoji glyph (graceful fallback). Recreated only on a stage change, so it's not rebuilt per tick. */
  private drawPlotSprite(zone: string, stage: CropStage | 'empty'): void {
    this.plotSpriteByZone[zone]?.destroy();
    const tile = PLOT_TILE_BY_ZONE[zone];
    const px = tile.tileX * TILE + TILE / 2;
    const py = tile.tileY * TILE + TILE / 2;
    // BACKLOG-317/418/434: seed/sprout share the soil-mound rig; the ripe stage bakes the zone crop's OWN
    // ripe rig (berries → `crop_ripe`, the grove's greens → `crop_ripe_greens`), falling back to the crop
    // glyph only when no rig is stashed for that crop yet — so a rig-less crop still reads as its own marker.
    const propKey = stage === 'empty' ? null : stage === 'ripe' ? ripeRigKey(cropOf(zone).food) : `crop_${stage}`;
    const tex = propKey && hasPropArt(propKey) ? bakePropArt(this, propKey) : null;
    this.plotSpriteByZone[zone] = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, stageGlyph(zone, stage), { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
  }

  /** P press: plant the active zone's empty plot, harvest its ripe one, or note a growing one — only
   *  when adjacent (BACKLOG-308/349: each zone has its own plot; a zone without one ignores P). */
  private handlePlot(): void {
    const z = this.zoneId;
    const tile = PLOT_TILE_BY_ZONE[z];
    if (!tile) return; // this zone has no plot
    if (!plotAdjacent(this.playerTile(), tile)) return;
    const plot = this.plotByZone[z];
    if (!plot) {
      this.plant(z);
    } else if (cropStage(getWorldClock().now().day - plot.plantedDay) === 'ripe') {
      this.harvest(z);
    } else {
      this.logEvent('🌿 the crop is not ready yet');
    }
  }

  /** Plant a seed in a zone's empty plot, stamping today as the planted day. */
  private plant(zone: string): void {
    if (this.plotByZone[zone]) return;
    this.plotByZone[zone] = { plantedDay: getWorldClock().now().day };
    this.logEvent('🌱 you planted a seed in the plot');
    this.refreshPlot();
    void this.saveGame();
  }

  /**
   * Harvest a zone's ripe plot: release the crop as a food drop at the plot column (reusing the feeding
   * hatch so the swarm + favorites loop apply), clear the plot, and bump the harvest tally.
   */
  private harvest(zone: string): void {
    const plot = this.plotByZone[zone];
    if (!plot || cropStage(getWorldClock().now().day - plot.plantedDay) !== 'ripe') return;
    const crop = cropOf(zone); // BACKLOG-418: each zone yields its own crop into the feeding loop
    this.dropFood(PLOT_TILE_BY_ZONE[zone].tileX, crop.food); // no-ops if a piece is already in play — retry later
    this.plotByZone[zone] = null;
    this.harvested++;
    this.harvestedByZone[zone] = (this.harvestedByZone[zone] ?? 0) + 1; // BACKLOG-428: per-zone farming term
    // BACKLOG-446: a share of the harvest banks into the zone's food store (capped) — the drop above still
    // feeds the loop; this is the stored surplus 444/447 spend and ferry, read on the zone-map lens.
    // BACKLOG-448: the share doesn't put itself away. The nearest resident of the zone hauls it to the
    // store and is credited for it — one of the two honest sources the `provider` role reads (the other is
    // the 447 carry). A pile already at cap banks nothing, so nobody is credited for hauling nothing.
    // BACKLOG-454: a standing granary lifts this zone's per-id cap, so a built-up ground banks a bigger surplus.
    // BACKLOG-461: the season shifts it too — a lean-season ground banks one less, a plenty-season ground one more.
    // BACKLOG-465: and the season shifts it *per crop* — this ground's own crop comes in thick in its good
    // season (two for the stores) and thin in its lean one (nothing to bank), so which ground thrives
    // rotates with the year. The drop above is untouched: the year shapes what a ground can bank, never
    // whether its dinos can eat what they just picked.
    const season = this.currentSeason();
    const cap = this.foodCapFor(zone);
    for (let i = 0; i < cropYield(crop.food, season); i++) {
      if (foodAtCap(this.foodStoreFor(zone), crop.food, cap)) break;
      this.foodPileByZone[zone] = bankFood(this.foodStoreFor(zone), crop.food, cap);
      this.creditHauler(zone);
    }
    this.logEvent(`${crop.ripe} you harvested the crop`);
    const yieldLine = harvestYieldLine(crop.ripe, crop.food, season);
    if (yieldLine) this.logEvent(yieldLine);
    this.refreshPlot();
    void this.saveGame();
  }

  /**
   * The resident that hauls a banked harvest share to its zone's store (BACKLOG-448): the dino living in
   * that zone nearest the plot (ties by name, so the pick is deterministic). It wears a 🧺, keeps the
   * memory, and its tally rises. A zone with nobody home banks the share unattributed, as before.
   */
  private creditHauler(zone: string): void {
    const plot = PLOT_TILE_BY_ZONE[zone];
    const residents = this.dinos
      .filter((d) => zoneOf(this.dinoZones, d.name, BOWL_ID) === zone)
      .map((d) => ({ name: d.name, dist: this.chebyTiles(this.tileOf(d), plot) }));
    const name = pickNearest(residents);
    if (!name) return;
    const hauler = this.dinoByName(name)!;
    this.creditFoodBank(name);
    const zoneName = zoneById(zone).name;
    this.memory = remember(this.memory, name, haulMemory(zoneName));
    this.flashFeed(hauler, '🧺');
    this.logEvent(haulLine(name, zoneName));
  }

  /**
   * The founding ruin (CHARTER v7). A brand-new save — and only a brand-new save — starts with one fallen
   * cairn in the Grove and enough stone in the Grove's pile to raise it. `upkeep.ts` calibrated the founding
   * park to sit inert beneath its own system and said so in its header as a virtue; v7's corollary makes that
   * the defect. A derelict landmark owes no upkeep, so the ruin costs the ground nothing — it is purely the
   * invitation that makes 480/485/488 things a new player can watch rather than facts about a save file.
   *
   * Writes ordinary `cairns` / `stockpileByZone` entries, so it round-trips through the existing save fields
   * with no version bump. Called from the `!save` branch of `setupSave`, after the sprite arrays exist.
   */
  private seedFounding(): void {
    if (this.foundingCleared) return; // a spec restored the pre-v7 empty grounds before the DB read resolved
    if (this.cairns.length) return; // one-shot: never seed a second founding ruin over an existing skyline
    const ruin: Landmark = { ...FOUNDING_RUIN, derelict: true };
    this.cairns.push(ruin);
    this.drawCairn(ruin);
    for (const [zone, pile] of Object.entries(FOUNDING_PILES)) {
      this.setPile(zone, { ...pile, ...(this.stockpileByZone[zone] ?? {}) });
    }
    // BACKLOG-492: and a bank ledger, so the Grove seats a council from the first frame. Without this the
    // whole of governance — two votes, a term, a turnover beat, two lens glyphs — is unreachable on a fresh
    // save, because `zoneCouncil` seats bankers and nobody has banked. `??=` so a restored tally always wins.
    for (const [name, units] of Object.entries(FOUNDING_BANKED)) this.foodBanked[name] ??= units;
    this.seedFoundingPioneers(); // BACKLOG-512: every ground the roster wakes on records who founded it
    this.syncBanks(); // BACKLOG-504: the founding Grove's heap stands on the ground from the first frame
    this.drawHatch(); // BACKLOG-510: and the hatch is on the ground before the player presses H
    this.applyObjectVisibility(); // the 480 alpha pass — the ruin reads as disrepair from the first frame
  }

  /**
   * Dispatch a mend (BACKLOG-488). Once per world step, for the ground the player is **looking at**: if it
   * carries a ruin, its pile can pay, and the wall-clock gate has elapsed, its nearest resident is sent to the
   * oldest derelict landmark (`pickNearest` — the 448 tie-break, so the pick is deterministic).
   *
   * In-view only, and deliberately: this is a beat, and a beat nobody is present for is the thing CHARTER v7
   * was written about. A ground the player has left keeps its ruin until somebody comes to watch it mended —
   * or, if the park is closed entirely, until the away catch-up settles it arithmetically (`runUpkeepPass(days)`).
   */
  private checkMend(): void {
    if (this.mend) return; // one errand at a time
    if (!cooldownReady(Date.now(), this.lastMendMs, MEND_COOLDOWN_MS)) return;
    const zone = this.zoneId;
    const ruin = this.landmarkRecords(zone).find((r) => r.rec.derelict);
    if (!ruin) return;
    if (!canMend(pileTotal(this.pileFor(zone)), REPAIR_COST)) return;
    const residents = this.dinos
      .filter((d) => zoneOf(this.dinoZones, d.name, BOWL_ID) === zone)
      .map((d) => ({ name: d.name, dist: this.chebyTiles(this.tileOf(d), ruin.rec) }));
    const fixer = pickNearest(residents);
    if (!fixer) return; // a ground with nobody home keeps its ruin — it does not patch itself
    this.lastMendMs = Date.now();
    this.mend = { fixer, zone, tileX: ruin.rec.tileX, tileY: ruin.rec.tileY, steps: MEND_STEPS };
  }

  /**
   * Resolve the mend once per world step (BACKLOG-488), built like `stepEscort` (381): adjacency ends it,
   * the step budget is the safety valve. The pile is spent **on arrival, never on dispatch** — an errand that
   * runs out of steps, or whose fixer leaves the ground, costs its ground nothing and the next pass retries.
   *
   * The spend goes through `runUpkeep(pile, 0, 1)`: zero standing landmarks means zero bill, so the only thing
   * that call does is the repair spend — by the same largest-kind rule upkeep has always used, through the
   * exact function that has always done it. (`spendOne` is module-private and `upkeep.ts` is not ours to edit.)
   */
  private stepMend(): void {
    if (!this.mend) return;
    const fixer = this.dinoByName(this.mend.fixer);
    if (!fixer || zoneOf(this.dinoZones, fixer.name, BOWL_ID) !== this.mend.zone) {
      this.mend = null; // it left the ground — nobody is walking to this ruin any more
      return;
    }
    // The walk lives here rather than in the movement branch so that one call — production's world step or
    // the `__stepMend` hook — advances and resolves the errand identically.
    const at = this.tileOf(fixer);
    if (this.chebyTiles(at, this.mend) > 1) {
      const step = stepToward(at, this.mend, COLS, ROWS);
      fixer.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
    }
    if (this.chebyTiles(this.tileOf(fixer), this.mend) <= 1) {
      const zone = this.mend.zone;
      const hit = this.landmarkRecords(zone).find(
        (r) => r.rec.derelict && r.rec.tileX === this.mend!.tileX && r.rec.tileY === this.mend!.tileY,
      );
      this.mend = null;
      if (!hit) return; // the ruin resolved some other way while it walked — spend nothing
      const pile = this.pileFor(zone);
      const plan = runUpkeep(pile, 0, 1);
      if (plan.repaired === 0) return; // the pile emptied during the walk — nothing spent, try again later
      this.setPile(zone, plan.pile);
      hit.rec.derelict = false;
      const zoneName = zoneById(zone).name;
      this.applyObjectVisibility(); // it stands back up where it fell
      this.showBubble(fixer, mendLine(fixer.name, hit.glyph));
      this.flashFeed(fixer, MEND_GLYPH);
      this.memory = remember(this.memory, fixer.name, mendMemory(zoneName, hit.glyph));
      this.logEvent(patchedLine(zoneName, hit.glyph)); // 480's line: the ground patched something up
      this.logEvent(mendEventLine(fixer.name, zoneName, hit.glyph)); // ...and this is who did it
      void this.saveGame();
      return;
    }
    this.mend = { ...this.mend, steps: this.mend.steps - 1 };
    if (this.mend.steps <= 0) this.mend = null;
  }

  /** Redraw each zone's plot marker for its current stage; log the ripen note once, on the edge into ripe.
   *  Each plot draws only in its own zone (BACKLOG-308/349). */
  private refreshPlot(): void {
    for (const z of Object.keys(PLOT_TILE_BY_ZONE)) {
      const plot = this.plotByZone[z];
      const stage: CropStage | 'empty' = plot ? cropStage(getWorldClock().now().day - plot.plantedDay) : 'empty';
      if (stage !== this.plotStageShownByZone[z]) this.drawPlotSprite(z, stage); // BACKLOG-317: swap to the stage's prop
      this.plotSpriteByZone[z]?.setVisible(this.zoneId === z);
      if (stage === 'ripe' && this.plotStageShownByZone[z] !== 'ripe') {
        this.logEvent(`${cropOf(z).ripe} the crop ripened — press P beside the plot to harvest`); // BACKLOG-418
      }
      this.plotStageShownByZone[z] = stage;
    }
  }

  /** forceStep tail: advance each plot's visible stage as realtime days pass (BACKLOG-145/349). */
  private checkPlot(): void {
    // BACKLOG-472: every zone that has a plot, not the first two by name.
    if (Object.keys(PLOT_TILE_BY_ZONE).some((z) => this.plotByZone[z])) this.refreshPlot();
  }

  /**
   * First sight of the pond (BACKLOG-359): a grove dino that comes within sight of the pond water for
   * the first time ever stops wide-eyed — a 💧 memory + bubble, once per dino. Distinct from the
   * grove-entry beat (339): keyed on pond proximity + its own `pondSeen` set, not zone entry.
   */
  private checkPondSight(): void {
    for (const d of this.dinos) {
      const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
      if (firstPondSight(this.pondSeen, d.name, zone, this.tileOf(d), COLS, ROWS)) {
        this.pondSeen.push(d.name);
        this.memory = remember(this.memory, d.name, pondSightMemory());
        this.showBubble(d, pondSightLine());
        void this.saveGame();
      }
    }
  }

  /** The season the bowl is living in right now, off the live clock day (BACKLOG-170). */
  private currentSeason(): Season {
    return seasonFor(getWorldClock().now().day);
  }

  /**
   * A zone's food cap right now (BACKLOG-461): the granary-aware base cap (454), shifted by the season's grip
   * — the lean season holds one less, plenty one more. The single source every food-cap read routes through
   * (banking, ferry accept-cap, spoilage) so a pile can never bank above what spoilage will bleed. Floored at
   * 1 so a lean season can never drop the cap to 0.
   */
  private foodCapFor(zone: string): number {
    return Math.max(1, granaryFoodCap(this.hasGranary(zone)) + seasonGrip(this.currentSeason()).capDelta);
  }

  /** Spoilage's near-cap band right now (BACKLOG-461): the flat `SPOIL_MARGIN` widened by the lean season and
   *  narrowed by plenty, floored at 0. */
  private spoilMarginFor(): number {
    return Math.max(0, SPOIL_MARGIN + seasonGrip(this.currentSeason()).spoilMarginDelta);
  }

  /** Drop one piece of food through the hatch. One at a time; returns its landing tile. */
  private dropFood(col?: number, foodId?: string): { tileX: number; tileY: number } {
    if (this.food) return this.food; // already a piece in play — ignore the drop
    const kind = foodId
      ? FOODS.find((f) => f.id === foodId) ?? FOODS[0]
      : FOODS[Math.floor(rand() * FOODS.length)];
    const landing = foodLanding(COLS, ROWS, col);
    this.food = landing;
    this.foodKind = kind;
    this.foodLanded = false;
    this.berthedThisDrop.clear(); // BACKLOG-389: a new drop is a fresh chance to hang back
    this.lastBerth = null;
    const px = landing.tileX * TILE + TILE / 2;
    const landY = landing.tileY * TILE + TILE / 2;
    // BACKLOG-510: the piece comes *out of the hatch*. It used to be spawned at y = TILE * 0.4 — above the
    // top of the world — and dropped straight down onto whatever column the roll picked, which is why food
    // has always looked like it materialised out of the sky onto bare grass.
    const fromX = HATCH_TILE.tileX * TILE + TILE / 2;
    const fromY = HATCH_TILE.tileY * TILE + TILE / 2;
    // BACKLOG-490: a baked pixel rig per food id where one is drawn, the emoji glyph where one is not —
    // the same graceful per-item fallback `drawPlotSprite` uses for a rig-less crop, so a partial roster ships.
    const foodKey = `food_${kind.id}`;
    const foodTex = hasPropArt(foodKey) ? bakePropArt(this, foodKey) : null;
    this.foodSprite = foodTex
      ? this.add.image(fromX, fromY, foodTex).setOrigin(0.5).setDepth(2)
      : this.add.text(fromX, fromY, kind.emoji, { fontSize: '18px' }).setOrigin(0.5).setDepth(2);
    this.tweens.add({
      targets: this.foodSprite,
      x: px,
      y: landY,
      duration: 600,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.foodLanded = true;
      },
    });
    this.logEvent(`${kind.emoji} food dropped from the hatch (${kind.label})`);
    this.startEscort(landing, kind);
    return landing;
  }

  /**
   * Brought to the hatch (BACKLOG-381) — on a drop, look for the dino the meal is going to miss.
   *
   * A withdrawn loner (135) at the wall is exactly the dino that won't rush: it's too far, or too listless,
   * and nothing in the park has ever been able to reach it. So the closest thing it has to a friend goes
   * and gets it. The rush read here is the *same* `reactionToFood` call `stepDinos` makes, so the gate can
   * never disagree with what the dino actually does. If nobody clears the floor, no escort starts and the
   * loner stands at the edge while the park eats — which is the read the whole beat is for.
   */
  private startEscort(landing: { tileX: number; tileY: number }, kind: Food): void {
    if (this.escort) return; // one escort at a time — a second drop doesn't restart it
    const inView = this.dinos.filter((d) => this.inView(d));
    const rushes = (d: Dino): boolean => {
      const dist = Math.hypot(this.tileOf(d).tileX - landing.tileX, this.tileOf(d).tileY - landing.tileY);
      const isFav = kind.id === favoriteFood(d.traits, this.currentSeason()).id;
      return reactionToFood(d.traits.energy, dist, isFav) === 'rush';
    };
    const names = this.dinoNames();
    // Deterministic pick (lexicographic, the topBy convention) — no RNG, so the beat is testable.
    const stranded = inView
      .filter((d) => missingTheMeal(isLoner(this.bonds, d.name, names, LONER_FLOOR), rushes(d)))
      .map((d) => d.name)
      .sort()[0];
    if (!stranded) return;
    const friend = fetcher(stranded, this.bonds, inView.map((d) => d.name).filter((n) => n !== stranded));
    if (!friend) return; // nobody comes
    this.escort = { friend, loner: stranded, phase: 'to-loner', steps: FETCH_STEPS };
  }

  /**
   * Where the pair is headed (BACKLOG-381): the food still on the ground, or — once the swarm has eaten it —
   * the hatch it landed at. The errand deliberately outlives the meal. A fetch takes ~20 steps and the cast
   * clears a drop in about three, so cancelling on an empty ground would mean the nudge almost never fired
   * and the beat would exist only on paper. The loner still gets walked in from the wall; it just may find
   * the food gone. Being brought to the hatch was never a guarantee of a meal — only of a chance at one.
   */
  private escortTarget(): { tileX: number; tileY: number } {
    return this.food ?? { tileX: Math.floor(COLS / 2), tileY: Math.floor(ROWS * 0.45) };
  }

  /**
   * Resolve the escort once per world step (BACKLOG-381), beside `stepResponder` and built the same way:
   * adjacency ends the outward leg, arrival or the step budget ends everything.
   *
   * Note it never re-reads `isLoner`. The nudge strengthens the pair's bond, which can lift the loner out
   * of loner status at the moment of contact — re-checking would cancel the beat exactly when it lands.
   */
  private stepEscort(): void {
    if (!this.escort) return;
    const friend = this.dinoByName(this.escort.friend);
    const loner = this.dinoByName(this.escort.loner);
    if (!friend || !loner) {
      this.escort = null; // a dino left the zone — nobody left to walk with
      return;
    }
    if (this.escort.phase === 'to-loner') {
      if (Math.abs(friend.x - loner.x) <= TILE * 1.01 && Math.abs(friend.y - loner.y) <= TILE * 1.01) {
        this.showBubble(friend, fetchLine(friend.name, loner.name));
        this.logEvent(fetchEventLine(friend.name, loner.name));
        this.memory = remember(this.memory, loner.name, fetchedMemory(friend.name));
        this.memory = remember(this.memory, friend.name, fetcherMemory(loner.name));
        this.bonds = strengthen(this.bonds, friend.name, loner.name, FETCH_BOND);
        this.flashFeed(loner, FETCH_GLYPH);
        this.escort = { ...this.escort, phase: 'to-food' };
      }
    } else if (reachedFood(this.tileOf(loner), this.escortTarget())) {
      this.escort = null; // it made it in — the errand is done, the meal is its own affair
      return;
    }
    this.escort = { ...this.escort, steps: this.escort.steps - 1 };
    if (this.escort.steps <= 0) this.escort = null;
  }

  /** First dino standing on (or beside) the landed food eats it. */
  private checkFeeding(): void {
    if (!this.food || !this.foodLanded) return;
    const food = this.food;
    const eater = this.dinos.find((d) => this.inView(d) && reachedFood(this.tileOf(d), food));
    if (!eater) return;
    // BACKLOG-375: a well-fed winner standing beside a hungrier high-bond friend in the swarm gives up
    // the meal and lets the friend eat first — the need-drive (371) shaping kindness between dinos.
    const eaterHunger = this.needs[eater.name]?.hunger ?? 0;
    const candidates = this.dinos
      .filter((d) => this.inView(d) && this.chebyTiles(this.tileOf(d), food) <= SWARM_RADIUS)
      .map((d) => ({
        name: d.name,
        hunger: this.needs[d.name]?.hunger ?? 0,
        bond: bondPoints(this.bonds, eater.name, d.name),
        agreeableness: d.traits.agreeableness,
      }));
    // BACKLOG-385: the winner repays a benefactor it remembers being fed by at a relaxed bond bar.
    const friendName = yieldFoodTo(eater.name, eaterHunger, candidates, new Set(this.owesFood[eater.name] ?? []));
    if (friendName) {
      const friend = this.dinos.find((d) => d.name === friendName)!;
      this.lastYield = { giver: eater.name, eater: friendName };
      this.lastGobble = null;
      this.lastStand = null;
      this.lastMercy = null;
      this.bonds = strengthen(this.bonds, eater.name, friendName, GENEROUS_BOND_BUMP); // kindness deepens the tie
      this.memory = remember(this.memory, eater.name, `you stepped back and let ${friendName} eat first`);
      this.flashFeed(eater, '🤝');
      this.logEvent(`🤝 ${eater.name} let ${friendName} eat first`);
      // BACKLOG-385: if this very yield repays a debt (the friend once fed the winner), the ledger closes —
      // a one-shot, so kindness keeps cycling rather than locking one pair forever.
      if ((this.owesFood[eater.name] ?? []).includes(friendName)) {
        this.owesFood[eater.name] = this.owesFood[eater.name].filter((n) => n !== friendName);
        this.memory = remember(this.memory, eater.name, `you repaid ${friendName}'s kindness at the hatch`);
      }
      // ...and the fed friend now remembers the winner as a benefactor to repay later.
      this.owesFood[friendName] = [...new Set([...(this.owesFood[friendName] ?? []), eater.name])];
      // BACKLOG-386: the fed friend throws a grateful 💛 toward its benefactor as it eats.
      this.lastNuzzle = { from: friendName, to: eater.name };
      this.flashFeed(friend, '💛');
      this.logEvent(`💛 ${friendName} nuzzled ${eater.name} in thanks`);
      this.eatFood(friend);
      return;
    }
    this.lastYield = null;
    this.lastNuzzle = null;
    // BACKLOG-403: before the contest is even reached, the *victor's* half of the pecking order gets its
    // say. A well-fed, magnanimous winner that faced one of these dinos down here before, finding it still
    // hungry, steps off the scrap. Ahead of `gobblerAmong` on purpose: the grace is offered, not extracted
    // — a magnanimous victor never reaches the standoff it would win again.
    const rivalName = showsMercyTo(
      recall(this.memory, eater.name),
      eaterHunger,
      eater.traits.agreeableness,
      candidates,
      eater.name,
    );
    if (rivalName) {
      const rival = this.dinos.find((d) => d.name === rivalName)!;
      this.lastMercy = { victor: eater.name, rival: rivalName };
      this.lastStand = null;
      this.lastGobble = null;
      this.memory = remember(this.memory, eater.name, mercyMemory(rivalName));
      this.memory = remember(this.memory, rivalName, sparedMemory(eater.name));
      this.flashFeed(eater, '🤲');
      this.logEvent(mercyLine(eater.name, rivalName));
      this.eatFood(rival); // the rival eats — `eatFood` flashes its own reaction and sates *its* hunger
      return;
    }
    this.lastMercy = null;
    // BACKLOG-387: the winner is keeping its food — but a hungry, prickly dino beside it in the swarm
    // won't wait its turn and shoulders past to eat first (the selfish inverse of the 375 yield).
    const gobblerName = gobblerAmong(eater.name, eaterHunger, candidates);
    if (gobblerName) {
      this.resolveContest(eater, gobblerName);
    } else {
      this.lastStand = null;
      this.lastGobble = null;
      this.eatFood(eater);
    }
  }

  /**
   * The contested drop, resolved (387/390/394 — extracted intact in cycle 128 so the e2e can drive the
   * *production* decision rather than a hook that re-implements it).
   *
   * BACKLOG-401: who holds and who cedes is no longer bravery alone. The winner reads its own recent
   * history with *this* gobbler — a stand it won, a grab it lost — and that per-pair disposition outranks
   * temperament when there is one. With no history `holdsAgainst` is exactly `standsGround(bravery)`, so a
   * fresh park behaves as it did before this existed.
   */
  private resolveContest(eater: Dino, gobblerName: string): void {
    const disposition = dispositionToward(recall(this.memory, eater.name), gobblerName);
    const because = disposition ? becauseOf(disposition, gobblerName) : ''; // no silent change
    if (holdsAgainst(eater.traits.bravery, disposition)) {
      // BACKLOG-390: the winner holds its tile and the gobbler backs down (😠), so who gets pushed around
      // at the hatch is a bravery read (the timid cede, the bold don't) — now shaded by who it is facing.
      this.lastStand = { winner: eater.name, gobbler: gobblerName };
      this.lastGobble = null;
      this.memory = remember(this.memory, eater.name, `you stood your ground and kept your food from ${gobblerName}`);
      this.flashFeed(eater, '😠');
      this.logEvent(`😠 ${eater.name} held its ground against ${gobblerName}${because}`);
      // BACKLOG-394: the denied gobbler slinks off (😖) and remembers who wouldn't budge — the failed grab
      // has a visible cost. The bold winner still eats; no bond change (395 owns the social ripple).
      const gobbler = this.dinos.find((d) => d.name === gobblerName)!;
      this.memory = remember(this.memory, gobblerName, slunkOffMemory(eater.name));
      this.flashFeed(gobbler, '😖');
      this.logEvent(`😖 ${gobblerName} slunk off — ${eater.name} wouldn't budge`);
      this.sting(gobblerName); // BACKLOG-412: it came away with nothing, and takes to its ritual sooner for it
      this.eatFood(eater);
    } else {
      const gobbler = this.dinos.find((d) => d.name === gobblerName)!;
      this.lastStand = null;
      this.lastGobble = { winner: eater.name, gobbler: gobblerName };
      this.memory = remember(this.memory, gobblerName, `you shouldered past ${eater.name} and snatched the food first`);
      this.flashFeed(gobbler, '😤');
      this.logEvent(`😤 ${gobblerName} shouldered past ${eater.name} to the food${because}`);
      this.sting(eater.name); // BACKLOG-412: the ceding winner is the one left with nothing here
      this.eatFood(gobbler);
    }
  }

  /**
   * Take the sting (BACKLOG-412) — a dino came away from a contested drop with nothing. Recorded from the
   * *event*, never re-read out of a memory string: three modules already parse the four hatch strings back
   * out (BACKLOG-483) and a fourth parser here would deepen exactly the debt this park keeps flagging.
   */
  private sting(name: string): void {
    this.stungAt[name] = this.worldSteps;
    this.soothedFiled.delete(name); // a fresh sting earns a fresh note
  }

  /** Is this dino still smarting (BACKLOG-412)? A dino never stung has no entry and reads false. */
  private stungNow(name: string): boolean {
    const at = this.stungAt[name];
    return at !== undefined && stingIsFresh(this.worldSteps - at);
  }

  /** Chebyshev distance in tiles (king's-move). Used by the feeding swarm (BACKLOG-375). */
  private chebyTiles(a: { tileX: number; tileY: number }, b: { tileX: number; tileY: number }): number {
    return Math.max(Math.abs(a.tileX - b.tileX), Math.abs(a.tileY - b.tileY));
  }

  private eatFood(d: Dino): void {
    const kind = this.foodKind;
    const r = foodReaction(kind!, d.traits, this.currentSeason());
    this.foodSprite?.destroy();
    this.foodSprite = null;
    this.food = null;
    this.foodKind = null;
    this.foodLanded = false;
    this.needs = satisfy(this.needs, d.name, 'hunger'); // BACKLOG-371: a meal sates hunger
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
    // BACKLOG-374: a moping loner soothed by its *favorite* food gets a quiet solace beat a plain meal never
    // gives. The 🥀 itself only lifts when a real bond forms (369) — this is a momentary per-palate comfort.
    const comforted = comfortsLoner(r.favorite, isLoner(this.bonds, d.name, this.dinoNames(), LONER_FLOOR));
    this.lastComfortFood = comforted ? { name: d.name, food: kind!.id } : null;
    if (comforted) {
      this.memory = remember(this.memory, d.name, comfortFoodMemory(kind!.label));
      this.showBubble(d, comfortFoodLine(d.name));
    }
    this.logEvent(
      `🍖 ${d.name} snapped up the food at the hatch${r.favorite ? ` — its favorite ${kind!.label}!` : ''}`,
    );
    // BACKLOG-373: two *different* dinos eating within a short window shared a meal — communal feeding warms
    // the pair a notch and each remembers it. A gentle tie (SHARED_MEAL_BOND < a meet). `lastMeal` re-anchors
    // on every meal so the next eater pairs against this one.
    const now = Date.now();
    if (sharedMeal(this.lastMeal, d.name, now)) {
      const other = this.lastMeal!.name;
      this.bonds = strengthen(this.bonds, other, d.name, SHARED_MEAL_BOND);
      this.memory = remember(this.memory, d.name, `you ate alongside ${other}`);
      this.memory = remember(this.memory, other, `you ate alongside ${d.name}`);
      this.flashFeed(d, '🍽');
      this.logEvent(`🍽 ${other} and ${d.name} ate together`);
    }
    this.lastMeal = { name: d.name, at: now };
    this.refreshHeartsPanel();
    void this.saveGame();
  }

  /** Mood lifts the motion (BACKLOG-318): a recovering dino flashes a brightened flourish of its
   *  signature quirk — a beat parallel to the repair/warm bubble, so recovery reads in motion. */
  private liftMood(d: Dino): void {
    this.lastMoodLift = reliefFlourish(d.traits);
    this.flashFeed(d, this.lastMoodLift);
    this.liftedUntil[d.name] = Date.now() + LIFT_WINDOW_MS; // BACKLOG-325: idle perkier for a while after
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

  /** The distinct zones with resident dinos (BACKLOG-314) — each rolls + holds its own resource. */
  private residentZones(): string[] {
    return occupiedZones(this.dinoZones, BOWL_ID, this.dinos.map((d) => d.name));
  }

  /**
   * A raw resource appears now and then (BACKLOG-146), now once per inhabited zone (BACKLOG-314): each
   * occupied zone rolls into its own empty slot, so the grove grows resources even while the keeper is
   * in the bowl (waiting, grace already elapsed, when you cross over).
   */
  private maybeSpawnResource(): void {
    for (const zone of this.residentZones()) {
      // BACKLOG-384: a zone's yield regrows a little each tick (even while a resource waits or the keeper's away),
      // and the spawn roll is scaled by it — a worked-out zone spawns rarer until it rests, a full zone unchanged.
      // BACKLOG-473: scaled by the ground's work priority — a gather-first ground is worked and tended so it
      // recovers faster; a build-first one has its backs on the walls. `null` is `regrowYield` to the bit.
      this.yieldByZone[zone] = workRegrowth(this.workPriorityFor(zone), this.yieldByZone[zone] ?? YIELD_MAX);
      if (this.resourceByZone[zone] || !rollResourceAt(RESOURCE_SPAWN_CHANCE, this.yieldByZone[zone])) continue;
      // BACKLOG-297: a natural spawn starts the fetch-grace clock; announce only the keeper's own zone.
      const landing = resourceLanding(COLS, ROWS);
      const kind = pickKind(rand, zone); // BACKLOG-348: each zone leans its own resource mix
      this.spawnResource(kind, landing.tileX, landing.tileY, zone);
      this.resourceAgeByZone[zone] = 0;
      if (zone === this.zoneId) this.logEvent(`${RESOURCE_GLYPH[kind]} a ${kind} fell`);
    }
  }

  /** Place a resource in a zone and draw its glyph. Shared by the roll + the dev hook (deterministic). */
  private spawnResource(kind: ResourceKind, tileX: number, tileY: number, zone: string = this.zoneId): void {
    // BACKLOG-308/314: a resource belongs to its zone, drawn + gatherable only there; one slot per zone.
    this.resourceByZone[zone] = { kind, tileX, tileY, zone };
    this.resourceSpriteByZone[zone]?.destroy();
    const px = tileX * TILE + TILE / 2;
    const py = tileY * TILE + TILE / 2;
    // BACKLOG-296: a baked pixel prop where one exists, else the emoji glyph (graceful fallback).
    const tex = bakePropArt(this, kind);
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, RESOURCE_GLYPH[kind], { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(zone === this.zoneId); // only the keeper's zone shows its resource
    this.resourceSpriteByZone[zone] = sprite;
  }

  /** The first dino to reach the active zone's resource picks it up — its tally rises, it's gone. */
  private checkGather(): void {
    const res = this.resourceByZone[this.zoneId]; // BACKLOG-308/314: only the active zone's is in play
    if (!res || !resourceFetchable(this.resourceAgeByZone[this.zoneId] ?? 0)) return; // 297: respect grace
    const taker = this.dinos.find((d) => this.inView(d) && reachedFood(this.tileOf(d), res));
    if (!taker) return;
    const kind = res.kind;
    this.resourceSpriteByZone[this.zoneId]?.destroy();
    delete this.resourceSpriteByZone[this.zoneId];
    delete this.resourceByZone[this.zoneId];
    // BACKLOG-384: working this zone thins its yield — over-gathering here slows its future spawns until it regrows.
    this.yieldByZone[this.zoneId] = depleteYield(this.yieldByZone[this.zoneId] ?? YIELD_MAX);
    this.gathered[taker.name] = (this.gathered[taker.name] ?? 0) + 1;
    // BACKLOG-328: a dino banks into its *own* home zone's pile (split from the old shared park total).
    const zone = zoneOf(this.dinoZones, taker.name, BOWL_ID);
    // BACKLOG-309: at the per-kind cap (now per zone), the pickup is consumed but banks nothing — the
    // first economy constraint. The stall surfaces as a beat so the pressure to spend (craft) reads in-world.
    if (atCap(this.pileFor(zone), kind)) {
      this.logEvent(`${RESOURCE_GLYPH[kind]} stores full — ${taker.name} drops the ${kind}`);
    } else {
      this.setPile(zone, bankResource(this.pileFor(zone), kind)); // BACKLOG-328: into this zone's pile
    }
    this.refreshPlaque();
    this.flashFeed(taker, RESOURCE_GLYPH[kind]);
    this.logEvent(`${RESOURCE_GLYPH[kind]} ${taker.name} picked up a ${kind}`);
    // BACKLOG-377/417: the dino that just banked builds the structure its *zone's* bias (348) favors,
    // spending its zone's pile — the stone-rich bowl stacks 🗿 cairns (286), the branch-rich grove raises
    // 🛖 lean-tos (315), the frond-rich Fernreach weaves 🥻 thatches (417). Each zone builds one landmark
    // type, so all three skylines diverge. `buildStructureFor` spends whatever `structureRecipe(zone)`
    // costs (cairn/shelter math byte-identical), then place by kind — else the pile is still climbing.
    this.buildOnGather(taker);
    void this.saveGame();
  }

  /**
   * The ground's bank (BACKLOG-504) — the heap on `BANK_TILE` stepped to match this zone's banked total.
   *
   * Same sprite-or-glyph shape the cairn, lean-to, thatch and granary all use: the baked pixel rig where
   * one exists (BACKLOG-506 draws `pile_1`/`pile_2`/`pile_3`), else the graceful fallback — the stone glyph
   * once per step, which reads as a heap that grows and borrows the park's own resource vocabulary. Step 0
   * banks nothing and shows nothing.
   */
  private syncBank(zone: string): void {
    const step = bankStep(this.pileFor(zone));
    const key = pileArtKey(step);
    const tex = key && hasPropArt(key) ? bakePropArt(this, key) : null;
    const px = BANK_TILE.tileX * TILE + TILE / 2;
    const py = BANK_TILE.tileY * TILE + TILE / 2;
    let sprite = this.bankSprites[zone];
    // A rig that appears (or vanishes) between steps changes which kind of object this is, so drop the old
    // one rather than trying to retexture a Text — the same care `showLandmarks` takes over its arrays.
    const wantsImage = !!tex;
    const isImage = sprite instanceof Phaser.GameObjects.Image;
    if (sprite && wantsImage !== isImage) {
      sprite.destroy();
      sprite = undefined as unknown as Phaser.GameObjects.Text;
      delete this.bankSprites[zone];
    }
    if (!sprite) {
      sprite = tex
        ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
        : this.add.text(px, py, '', { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
      this.bankSprites[zone] = sprite;
    }
    if (tex && sprite instanceof Phaser.GameObjects.Image) sprite.setTexture(tex);
    else if (sprite instanceof Phaser.GameObjects.Text) sprite.setText(RESOURCE_GLYPH.stone.repeat(step));
    sprite.setVisible(step > 0 && zone === this.zoneId); // BACKLOG-308: a heap shows only on its own ground
  }

  /** Sync every ground's bank — after setup, and after a save restore replaces the whole pile map. */
  private syncBanks(): void {
    for (const z of zoneChain()) this.syncBank(z);
  }

  /**
   * The feeding hatch on the ground (BACKLOG-510).
   *
   * Same rig-or-glyph fallback as every prop the park draws (490/494/496/504): the baked pixel rig once
   * BACKLOG-502 has drawn one, the opening glyph until then — so the wiring never waits on the art and the
   * art never waits on the wiring. Built once and left alone: `HATCH_TILE` is the same tile on every ground,
   * so a crossing changes nothing about it. Depth 1 — under the food (2) that comes out of it, and under
   * every dino that walks over it.
   */
  private drawHatch(): void {
    if (this.hatchSprite) return;
    const px = HATCH_TILE.tileX * TILE + TILE / 2;
    const py = HATCH_TILE.tileY * TILE + TILE / 2;
    const tex = hasPropArt(HATCH_ART_KEY) ? bakePropArt(this, HATCH_ART_KEY) : null;
    this.hatchSprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(1)
      : this.add.text(px, py, HATCH_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(1);
  }

  /**
   * The ritual's worn ground (BACKLOG-507) — a patch under every haunt on the ground the keeper is
   * standing on.
   *
   * The mark belongs to the *haunt*, not to the stretch: worn grass does not un-wear when a dino walks
   * off, and 421's haunt is precisely the place it keeps coming back to. When the haunt drifts the mark
   * moves with it — one sprite per dino per ground, moved, never accumulating — which is what turns four
   * drifts into a visible little path.
   *
   * Only the active ground draws, the same `zone === this.zoneId` rule the heap, the resource glyph and
   * every landmark use; the off-ground sprites are torn down rather than hidden, because a haunt that
   * drifted while you were elsewhere would otherwise come back at its old tile.
   *
   * A kind with no rig draws nothing. `fuss` is undrawn on purpose (496's per-kind fallback control) and
   * two of the five personality axes map to it, so this branch is live on essentially every save.
   */
  private syncWear(): void {
    const marks = this.wornMarks();
    const wanted = new Set<string>();
    for (const m of marks) {
      const tex = hasPropArt(m.key) ? bakePropArt(this, m.key) : null;
      if (!tex) continue; // no rig for this ritual — the ground stays as it was
      const id = `${m.name}:${this.zoneId}`;
      wanted.add(id);
      const px = m.tileX * TILE + TILE / 2;
      const py = m.tileY * TILE + TILE / 2;
      let sprite = this.wearSprites[id];
      if (!sprite) {
        // Depth 1: it is ground. Resources, landmarks and the heap all stand on it at depth 2.
        sprite = this.add.image(px, py, tex).setOrigin(0.5).setDepth(1);
        this.wearSprites[id] = sprite;
      }
      sprite.setTexture(tex);
      sprite.setPosition(px, py);
      sprite.setVisible(true);
    }
    for (const id of Object.keys(this.wearSprites)) {
      if (wanted.has(id)) continue;
      this.wearSprites[id].destroy();
      delete this.wearSprites[id];
    }
  }

  /**
   * The founder's mark on this ground (BACKLOG-501's repair, rigs 513/514).
   *
   * One sprite, retextured per ground rather than one per zone: the mark sits on the same tile everywhere,
   * so there is never more than one on screen. A ground with a founder shows the upright post; one that has
   * emptied shows the canted, bleached twin; one nobody has ever founded shows nothing at all, which is the
   * Saltpan and is the correct picture of unclaimed ground.
   *
   * Called from `applyObjectVisibility`, which the zone cross, the founding pass and the save restore all
   * already come through — the same single call site `syncWear` takes, for the same reason.
   */
  private syncStakes(): void {
    const founder = pioneerOf(this.pioneers, this.zoneId);
    const key = stakeArtKey(founder ? foundingKind(this.pioneers, this.zoneId) : null, this.isZoneHollowed(this.zoneId));
    if (!key) {
      this.stakeSprite?.destroy();
      this.stakeSprite = null;
      return;
    }
    const px = STAKE_TILE.tileX * TILE + TILE / 2;
    const py = STAKE_TILE.tileY * TILE + TILE / 2;
    const tex = hasPropArt(key) ? bakePropArt(this, key) : null;
    // A rig swap changes the object type (text glyph vs image), so a state change rebuilds rather than
    // retextures. It happens on a zone cross or a ground emptying, not per frame.
    const wantsImage = !!tex;
    const isImage = !!this.stakeSprite && typeof (this.stakeSprite as Phaser.GameObjects.Image).setTexture === 'function';
    if (this.stakeSprite && wantsImage !== isImage) {
      this.stakeSprite.destroy();
      this.stakeSprite = null;
    }
    if (!this.stakeSprite) {
      this.stakeSprite = tex
        ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
        : this.add.text(px, py, STAKE_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    } else if (tex) {
      (this.stakeSprite as Phaser.GameObjects.Image).setTexture(tex);
    }
    this.stakeSprite.setPosition(px, py);
    this.stakeSprite.setVisible(true);
  }

  /** The marks this ground should be showing (BACKLOG-507) — the pure read, over the live cast. A haunt
   *  whose dino is no longer in the park resolves to no kind and leaves no ghost. */
  private wornMarks(): WornMark[] {
    return marksOn(this.ticHaunts, this.zoneId, (name) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.ticFor(d).kind : null;
    });
  }

  /** Draw a cairn glyph at a tile (BACKLOG-286). Same depth/shape as a resource glyph. */
  private drawCairn(c: { tileX: number; tileY: number; zone: string }): void {
    const px = c.tileX * TILE + TILE / 2;
    const py = c.tileY * TILE + TILE / 2;
    // BACKLOG-296: a baked pixel cairn where one exists, else the 🗿 glyph (graceful fallback).
    const tex = bakePropArt(this, 'cairn');
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, CAIRN_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(c.zone === this.zoneId); // BACKLOG-308: a cairn shows only in its own zone
    this.cairnSprites.push(sprite);
  }

  /** Record + render a freshly crafted cairn and mark the moment on the crafter (BACKLOG-286). */
  private placeCairn(tile: { tileX: number; tileY: number }, crafter: Dino): void {
    // BACKLOG-308: the cairn belongs to the zone the crafter built it in.
    const c = { ...tile, zone: zoneOf(this.dinoZones, crafter.name, BOWL_ID) };
    this.cairns.push(c);
    this.drawCairn(c);
    this.flashFeed(crafter, CAIRN_GLYPH);
    this.memory = remember(this.memory, crafter.name, 'stacked the first cairn from gathered branches and stones');
    this.logEvent(`${CAIRN_GLYPH} ${crafter.name} stacked a cairn`);
  }

  /** Draw a shelter at a tile (BACKLOG-315). Mirror of drawCairn — a baked lean-to prop (BACKLOG-344) where
   *  the rig exists, else the 🛖 glyph (graceful fallback). */
  private drawShelter(s: { tileX: number; tileY: number; zone: string }): void {
    const px = s.tileX * TILE + TILE / 2;
    const py = s.tileY * TILE + TILE / 2;
    const tex = bakePropArt(this, 'shelter'); // BACKLOG-344: pixel lean-to where one exists
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, SHELTER_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(s.zone === this.zoneId); // BACKLOG-308: a shelter shows only in its own zone
    this.shelterSprites.push(sprite);
  }

  /** Record + render a freshly raised lean-to and mark the moment on the builder (BACKLOG-315). */
  private placeShelter(tile: { tileX: number; tileY: number }, crafter: Dino): void {
    // BACKLOG-308: the shelter belongs to the zone the crafter raised it in — a landmark of that zone.
    const s = { ...tile, zone: zoneOf(this.dinoZones, crafter.name, BOWL_ID) };
    this.shelters.push(s);
    this.drawShelter(s);
    this.flashFeed(crafter, SHELTER_GLYPH);
    this.memory = remember(this.memory, crafter.name, 'raised a lean-to from gathered branches and stones');
    this.logEvent(`${SHELTER_GLYPH} ${crafter.name} raised a lean-to`);
  }

  /** Draw a thatch at a tile (BACKLOG-417). Mirror of drawShelter — the baked 🥻 frond-thatch prop
   *  (stashed BACKLOG-427) where the rig exists, else the 🥻 glyph (graceful fallback). */
  private drawThatch(t: { tileX: number; tileY: number; zone: string }): void {
    const px = t.tileX * TILE + TILE / 2;
    const py = t.tileY * TILE + TILE / 2;
    const tex = bakePropArt(this, 'thatch'); // BACKLOG-427: the stashed frond-thatch rig
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, THATCH_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(t.zone === this.zoneId); // BACKLOG-308: a thatch shows only in its own zone
    this.thatchSprites.push(sprite);
  }

  /** Record + render a freshly woven frond thatch and mark the moment on the weaver (BACKLOG-417). */
  private placeThatch(tile: { tileX: number; tileY: number }, crafter: Dino): void {
    // BACKLOG-308: the thatch belongs to the zone the crafter wove it in — the Fernreach's own landmark.
    const t = { ...tile, zone: zoneOf(this.dinoZones, crafter.name, BOWL_ID) };
    this.thatches.push(t);
    this.drawThatch(t);
    this.flashFeed(crafter, THATCH_GLYPH);
    this.memory = remember(this.memory, crafter.name, 'wove a frond thatch from gathered fronds');
    this.logEvent(`${THATCH_GLYPH} ${crafter.name} wove a frond thatch`);
  }

  /**
   * The build decision on a fresh gather (BACKLOG-377/417/454): a zone that has raised enough base landmarks
   * and has no granary yet *saves toward one* — it stops auto-draining its pile on bias landmarks so the pile
   * can climb to GRANARY_RECIPE, then puts up the granary (a food-cap lift). Once it stands, the zone resumes
   * building its bias landmark. Mirrors the old SHELTER_AFTER_CAIRNS escalation seam: a cheap auto-build can't
   * be allowed to drain the pile below the richer recipe it's meant to reach.
   */
  private buildOnGather(taker: Dino): void {
    const zone = zoneOf(this.dinoZones, taker.name, BOWL_ID);
    // BACKLOG-473: a 'build'-priority ground reaches its granary one base landmark sooner. The gate is
    // passed to `canBuildGranary` too — it re-checks internally, so shaving only this `if` would be
    // half-applied and would read as a flake rather than as a policy.
    const work = this.workPriorityFor(zone);
    const gate = granaryGateFor(work, GRANARY_AFTER_STRUCTURES);
    // BACKLOG-480: the *raised* read here, never the maintained one — a rotting granary still fills the
    // ground's one slot, or a zone would rebuild beside its own ruin every time it recovered a pile.
    if (this.baseLandmarks(zone) >= gate && !this.granaryRaised(zone)) {
      // BACKLOG-463: a 'feed'-priority provider holds off the granary while the store is thin (mouths before
      // walls); a 'bank' one (or no provider) builds as soon as the recipe is affordable.
      const deferred = granaryDeferredForFeeding(this.spendPriorityFor(zone), foodPileTotal(this.foodStoreFor(zone)));
      if (!deferred && canBuildGranary(this.pileFor(zone), this.baseLandmarks(zone), this.granaryRaised(zone), gate)) {
        const spent = buildGranary(this.pileFor(zone));
        if (spent) {
          this.setPile(zone, spent);
          this.placeGranary(this.tileOf(taker), taker);
          this.refreshPlaque();
        }
      }
      return;
    }
    // BACKLOG-473: a 'gather'-priority ground holds off its bias landmark while the pile is thin, so the
    // pile visibly climbs instead of being auto-drained on every affordable cairn.
    if (landmarkDeferredForGathering(work, pileTotal(this.pileFor(zone)))) return;
    const built = buildStructureFor(this.pileFor(zone), zone);
    if (built) {
      this.setPile(zone, built);
      const kind = zoneStructure(zone);
      if (kind === 'thatch') this.placeThatch(this.tileOf(taker), taker);
      else if (kind === 'shelter') this.placeShelter(this.tileOf(taker), taker);
      else if (kind === 'beacon') this.placeBeacon(this.tileOf(taker), taker); // BACKLOG-503
      else this.placeCairn(this.tileOf(taker), taker);
      this.refreshPlaque();
    }
  }

  /** Draw a beacon at a tile (BACKLOG-503). Mirror of drawThatch - the baked obsidian-beacon rig once
   *  BACKLOG-508 draws it, with the glyph as the graceful fallback until then. Shows only in its own zone (308). */
  private drawBeacon(b: { tileX: number; tileY: number; zone: string }): void {
    const px = b.tileX * TILE + TILE / 2;
    const py = b.tileY * TILE + TILE / 2;
    const tex = bakePropArt(this, 'beacon');
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, BEACON_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(b.zone === this.zoneId);
    this.beaconSprites.push(sprite);
  }

  /** Record + render a freshly raised beacon and mark the moment on the builder (BACKLOG-503). */
  private placeBeacon(tile: { tileX: number; tileY: number }, crafter: Dino): void {
    const b = { ...tile, zone: zoneOf(this.dinoZones, crafter.name, BOWL_ID) };
    this.beacons.push(b);
    this.drawBeacon(b);
    this.flashFeed(crafter, BEACON_GLYPH);
    this.memory = remember(this.memory, crafter.name, 'set black glass upright on the ridge');
    this.logEvent(`${BEACON_GLYPH} ${crafter.name} raised a beacon of black glass`);
  }

  /** Draw a granary at a tile (BACKLOG-454). Mirror of drawThatch — the baked pixel granary (GRANARY_RIG
   *  has existed since 454; this comment claimed otherwise until cycle 121-art), with the 🏛️ glyph as the
   *  graceful fallback. Shows only in its own zone (308). */
  private drawGranary(g: { tileX: number; tileY: number; zone: string }): void {
    const px = g.tileX * TILE + TILE / 2;
    const py = g.tileY * TILE + TILE / 2;
    const tex = bakePropArt(this, 'granary'); // BACKLOG-454: the baked pixel granary where the rig exists, else the 🏛️ glyph
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, GRANARY_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(g.zone === this.zoneId);
    this.granarySprites.push(sprite);
  }

  /** Record + render a freshly raised granary and mark the moment on the builder (BACKLOG-454). */
  private placeGranary(tile: { tileX: number; tileY: number }, crafter: Dino): void {
    const g = { ...tile, zone: zoneOf(this.dinoZones, crafter.name, BOWL_ID) };
    this.granaries.push(g);
    this.drawGranary(g);
    this.flashFeed(crafter, GRANARY_GLYPH);
    this.memory = remember(this.memory, crafter.name, 'raised a granary — the zone can hold a bigger surplus now');
    this.logEvent(`${GRANARY_GLYPH} ${crafter.name} raised a granary in ${zoneById(g.zone).name}`);
  }

  /** Base landmarks a zone is *keeping up* (cairns + lean-tos + thatches) — the granary gate counts these,
   *  not granaries themselves (BACKLOG-454). BACKLOG-480: derelict landmarks don't count, so a ground must
   *  hold three up to earn the fourth; a skyline it can't maintain doesn't buy it a granary. */
  private baseLandmarks(zone: string): number {
    return [...this.cairns, ...this.shelters, ...this.thatches, ...this.beacons].filter((s) => s.zone === zone && !s.derelict)
      .length;
  }

  /** Every landmark in a zone, maintained or not (BACKLOG-480) — the four arrays as one list. */
  private landmarksIn(zone: string): Landmark[] {
    return [...this.cairns, ...this.shelters, ...this.thatches, ...this.beacons, ...this.granaries].filter((s) => s.zone === zone);
  }

  /** How many of a zone's landmarks are standing (BACKLOG-480) — what upkeep is owed on. */
  private standingIn(zone: string): number {
    return this.landmarksIn(zone).filter((s) => !s.derelict).length;
  }

  /** How many of a zone's landmarks have fallen into disrepair (BACKLOG-480). */
  private derelictIn(zone: string): number {
    return this.landmarksIn(zone).filter((s) => s.derelict).length;
  }

  /**
   * Does this zone have a granary *in working order* (BACKLOG-454)? Feeds the food-cap lift only.
   *
   * BACKLOG-480 split this in two on purpose. It used to answer two different questions with one call —
   * *does this ground get the +3 cap?* and *has this ground already used its one granary slot?* — and the
   * moment a granary can fall into disrepair those answers diverge. A maintained-only read on the build
   * gate would let a ground raise a second granary beside its rotting first; that gate reads
   * `granaryRaised` instead.
   */
  private hasGranary(zone: string): boolean {
    return this.granaries.some((g) => g.zone === zone && !g.derelict);
  }

  /** Has this zone ever raised a granary, derelict or not (BACKLOG-480)? The one-per-zone build gate. */
  private granaryRaised(zone: string): boolean {
    return this.granaries.some((g) => g.zone === zone);
  }

  /** The zones that currently have a granary (BACKLOG-454) — the lens marker + the raised food cap read off this. */
  private granaryZones(): string[] {
    return [...new Set(this.granaries.map((g) => g.zone))];
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
    this.time.addEvent({ delay: SKY_ROLL_INTERVAL_MS, loop: true, callback: () => { if (!this.ambientPaused) this.maybeStartSky(); } }); // BACKLOG-431

    // dev-only Playwright hooks
    (window as any).__skyEvent = () => this.activeSky?.id ?? null;
    (window as any).__skyGazers = () => [...this.skyGazers];
    // BACKLOG-150: each dino's gaze ring + its current tile, so the e2e can assert it halts at its ring.
    (window as any).__skyRings = () =>
      this.dinos.map((d) => ({ name: d.name, ring: gazeRing(d.traits), ...this.tileOf(d) }));
    // BACKLOG-288: which gazers settled side by side (read before the event ends, when tiles are still held).
    (window as any).__skyCompanions = () =>
      stargazingPairs([...this.skyGazerTiles].map(([name, t]) => ({ name, ...t, zone: zoneOf(this.dinoZones, name, BOWL_ID) })));
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
      chanceRoll: rand(),
      pickRoll: rand(),
    });
    if (ev) this.startSky(ev);
  }

  private startSky(ev: SkyEvent): void {
    this.activeSky = ev;
    this.skyStartAbsMin = this.absMinNow();
    this.skyFiredDay = getWorldClock().now().day;
    this.skyGazers.clear();
    this.skyGazerTiles.clear();
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
    this.knitStargazers(); // BACKLOG-288: adjacent watchers come away a little closer
    // Persist the memories the gazers filed while watching + the companion bonds just knit.
    void this.saveGame();
  }

  /**
   * BACKLOG-288: when a sky event ends, every pair of gazers that settled side by side (Chebyshev ≤ 1)
   * gains a one-time shared-wonder bond bump and each files a "watched the sky together" memory naming
   * the other. A lone edge-watcher with no neighbour gets nothing. Clears the tiles so a second endSky
   * (idempotent guard) knits nothing.
   */
  private knitStargazers(): void {
    const gazers = [...this.skyGazerTiles].map(([name, t]) => ({ name, ...t, zone: zoneOf(this.dinoZones, name, BOWL_ID) }));
    for (const [a, b] of stargazingPairs(gazers)) {
      this.bonds = strengthen(this.bonds, a, b, SHARED_WONDER_BOND);
      this.memory = remember(this.memory, a, `watched the sky together with ${b}`);
      this.memory = remember(this.memory, b, `watched the sky together with ${a}`);
    }
    this.skyGazerTiles.clear();
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
      // BACKLOG-150: each dino presses in only to its own ring — bold/curious crowd under the spectacle
      // (ring 0), timid ones halt at the cluster's edge (ring 2). Same event, a different read per dino.
      const ring = gazeRing(d.traits);
      const cur = this.tileOf(d);
      const next = atGather(cur, SKY_GATHER_TILE, ring) ? cur : stepToward(cur, SKY_GATHER_TILE, COLS, ROWS);
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);
      if (atGather(next, SKY_GATHER_TILE, ring) && !this.skyGazers.has(d.name)) {
        this.skyGazers.add(d.name);
        this.skyGazerTiles.set(d.name, next); // BACKLOG-288: remember where it settled to watch
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
    zone?: string; // CHARTER v7: the ground this dino wakes up on; absent → the bowl
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
    // CHARTER v7: a roster entry may name the ground it wakes up on; absent → the bowl (every pre-v7 entry).
    this.dinoZones[cfg.name] ??= cfg.zone ?? BOWL_ID;
    // BACKLOG-364: a dino has plainly seen the ground it lives on. Seeded here so a fresh save starts every
    // dino knowing the bowl; the load path re-seeds from restored home zones for a save written before this.
    markSeen(this.seenZones, cfg.name, this.dinoZones[cfg.name]);
    dino.sprite.setVisible(this.inView(dino));
    dino.label.setVisible(this.inView(dino));
    this.sleepMarks.push(this.makeHourMark(DOZE_ART_KEY, DOZE_GLYPH));
    this.rouseMarks.push(this.makeHourMark(ROUSE_ART_KEY, ROUSE_GLYPH));
    this.activityMarks.push(
      this.add.text(0, 0, '', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.coldMarks.push(
      this.add.text(0, 0, '🥶', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.mopeMarks.push(
      this.add.text(0, 0, MOPE_GLYPH, { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.needMarks.push(
      this.add.text(0, 0, '', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.needs[cfg.name] ??= { hunger: 0, thirst: 0 };
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
      const before = this.bonds;
      this.bonds = strengthen(this.bonds, a, b, amount ?? HUDDLE_THRESHOLD);
      this.checkLonerLift(a, before); // BACKLOG-369: drive the loner→friend beat deterministically in tests
      this.checkLonerLift(b, before);
      return bondPoints(this.bonds, a, b);
    };
    (window as any).__huddlers = () => this.dinos.filter((d) => this.isHuddling(d)).map((d) => d.name);
    // BACKLOG-109: who is down right now, and each dino's chronotype — the two reads the hours spec needs.
    // BACKLOG-522: which dinos are showing their sleeping pose (not merely resting — an undrawn species
    // rests without one, which is the fallback this hook lets a spec assert).
    (window as any).__downPose = () => this.dinos.filter((d) => d.isDown()).map((d) => d.name);
    (window as any).__resting = () => this.dinos.filter((d) => this.isResting(d)).map((d) => d.name);
    (window as any).__roused = () => this.dinos.filter((d) => this.isRoused(d)).map((d) => d.name);
    (window as any).__chronotypes = () =>
      Object.fromEntries(this.dinos.map((d) => [d.name, this.chronoOf(d)] as const));
    (window as any).__activity = (name: string) => this.activityById[name] ?? null; // BACKLOG-295
    // BACKLOG-298: a dino's signature idle quirk, and the glyph currently rendered above it.
    (window as any).__fidget = (name: string) => {
      const d = this.dinoByName(name);
      return d ? { ...fidget(d.traits) } : null;
    };
    // BACKLOG-310: the signature quirk shaded by a transient mood (sulk/cold). No mood → signature.
    (window as any).__moodFidget = (name: string, mood?: Mood) => {
      const d = this.dinoByName(name);
      return d ? { ...moodFidget(d.traits, mood) } : null;
    };
    // BACKLOG-318: the recovery flourish a dino would throw, and the last one actually fired.
    (window as any).__moodLift = (name: string) => {
      const d = this.dinoByName(name);
      return d ? reliefFlourish(d.traits) : null;
    };
    (window as any).__lastMoodLift = () => this.lastMoodLift;
    // BACKLOG-325: is a dino in its post-recovery perk window, and a hook to force one for tests.
    (window as any).__lifted = (name: string) => Date.now() < (this.liftedUntil[name] ?? 0);
    (window as any).__liftMood = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.liftMood(d);
      return this.lastMoodLift;
    };
    (window as any).__activityMark = (name: string) => {
      const i = this.dinos.findIndex((d) => d.name === name);
      return i >= 0 && this.activityMarks[i] ? this.activityMarks[i].text : null;
    };
    // dev-only: the live huddle verdict (BACKLOG-171) — season, bond bar, and window state now.
    (window as any).__huddleInfo = () => {
      const season = this.currentSeason();
      return {
        season,
        threshold: huddleThreshold(season),
        inWindow: inHuddleWindow(getWorldClock().now().hour, season),
      };
    };
    // dev-only: sleep murmurs (BACKLOG-181) — the deterministic line a dino would dream now, and a hook
    // to force a murmur past the sparse roll (returns the line shown, or null if no eligible sleeper).
    (window as any).__murmur = (name: string) =>
      murmurLine(pickMurmurMemory(recall(this.memory, name)), this.dinoByName(name)?.traits);
    (window as any).__forceMurmur = (name?: string) => {
      const d = name ? this.dinoByName(name) : this.pickMurmurer();
      // BACKLOG-307: the same asleep test `pickMurmurer` uses. This was a second copy of the huddle
      // gate, so leaving it behind would have kept the hook refusing the one dino the item is about.
      if (!d || !this.asleep(d) || !this.inView(d)) return null;
      const line = murmurLine(pickMurmurMemory(recall(this.memory, d.name)), d.traits);
      this.showBubble(d, line);
      return line;
    };
    // dev-only: cold-night shiver (BACKLOG-179) — who slept cold at the last morning resolution.
    (window as any).__coldSleepers = () => [...this.lastColdSleepers];
    // dev-only: keeper's warmth (BACKLOG-184) — who still carries the cold funk.
    (window as any).__coldPending = () => [...this.coldPending];
    // dev-only: the loner (BACKLOG-135) + need-drive spine (BACKLOG-371).
    (window as any).__loners = () =>
      this.dinoNames().filter((n) => isLoner(this.bonds, n, this.dinoNames(), LONER_FLOOR));
    (window as any).__isLoner = (name: string) => isLoner(this.bonds, name, this.dinoNames(), LONER_FLOOR);
    (window as any).__needs = () => JSON.parse(JSON.stringify(this.needs));
    (window as any).__pressingNeed = (name: string) => pressingNeed(this.needs[name]);
    // BACKLOG-367 (food web): the last forceStep's {hunter → prey} pairing, and a dino's diet.
    (window as any).__stalkTargets = () => ({ ...this.lastStalk });
    (window as any).__fleeFrom = () => ({ ...this.lastFlee }); // BACKLOG-442: prey → the hunter it flees
    (window as any).__diet = (species: string) => dietOf(species);
    (window as any).__advanceNeeds = (steps = 1) => {
      // BACKLOG-466: threaded, so the hook drives the *production* seasonal rate rather than the default.
      this.needs = advanceNeeds(
        this.needs,
        this.dinos.map((d) => ({ name: d.name, traits: d.traits })),
        steps,
        seasonThirst(this.currentSeason()),
      );
      this.refreshNeedMarks();
      return JSON.parse(JSON.stringify(this.needs));
    };
    (window as any).__setNeed = (name: string, which: 'hunger' | 'thirst', v: number) => {
      const base = this.needs[name] ?? { hunger: 0, thirst: 0 };
      this.needs = { ...this.needs, [name]: { ...base, [which]: v } };
      this.refreshNeedMarks();
      return this.needs[name];
    };
    // Run the needs tick in place (advance + drink-at-pond) without moving any dino — lets the e2e drop
    // a thirsty dino at the pond (via __seePond) and watch it drink deterministically.
    (window as any).__checkNeeds = () => {
      this.checkNeeds();
      return JSON.parse(JSON.stringify(this.needs));
    };
    // BACKLOG-436: where a pressing need leans this dino (hatch/pond), or null (no pressing need, or thirst
    // with no reachable water). __needStep applies one forced seek step (bypassing the lean gate) so the
    // e2e can watch the body pulled toward relief deterministically.
    (window as any).__needTarget = (name: string) => {
      const d = this.dinoByName(name);
      if (!d) return null;
      const need = pressingNeed(this.needs[name]);
      return need ? this.needTargetFor(d, need) : null;
    };
    (window as any).__needStep = (name: string) => {
      const d = this.dinoByName(name);
      if (!d) return null;
      const need = pressingNeed(this.needs[name]);
      const target = need ? this.needTargetFor(d, need) : null;
      if (target) {
        const nxt = stepToward(this.tileOf(d), target, COLS, ROWS);
        d.setPosition(nxt.tileX * TILE + TILE / 2, nxt.tileY * TILE + TILE / 2);
      }
      return this.tileOf(d);
    };
    // dev-only: distress call (BACKLOG-194) — the last cry, the responder mid-walk, and a
    // staging trigger so e2e can fire the beat deterministically (the __triggerSky convention).
    (window as any).__lastDistress = () => (this.lastDistress ? { ...this.lastDistress } : null);
    (window as any).__distressResponder = () => (this.pendingRespond ? { ...this.pendingRespond } : null);
    // BACKLOG-381: the live escort — who is fetching whom, and which leg of the walk.
    (window as any).__escort = () => (this.escort ? { ...this.escort } : null);
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
    // BACKLOG-491: the baked egg rig where one exists, the emoji otherwise (the 490 fallback, same shape).
    const px = egg.tileX * TILE + TILE / 2;
    const py = egg.tileY * TILE + TILE / 2;
    const tex = hasPropArt('egg') ? bakePropArt(this, 'egg') : null;
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, '🥚', { fontSize: '18px' }).setOrigin(0.5).setDepth(2);
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

  /** One hour-mark (BACKLOG-520): the baked rig if it exists, the emoji if it does not. */
  private makeHourMark(key: string, glyph: string): Phaser.GameObjects.Text | Phaser.GameObjects.Image {
    const tex = hasPropArt(key) ? bakePropArt(this, key) : null;
    const mark = tex
      ? this.add.image(0, 0, tex)
      : this.add.text(0, 0, glyph, { fontSize: '12px' });
    return mark.setOrigin(0.5, 1).setDepth(12).setVisible(false);
  }

  /** This dino's chronotype (BACKLOG-109) — derived from the name-seeded traits, never persisted. */
  private chronoOf(d: Dino): Chronotype {
    return chronotypeOf(d.traits);
  }

  /**
   * Is this dino down right now (BACKLOG-109)? Distinct from `isHuddling`, and the distinction is the
   * point: huddling is about the *den* (and still gates on a bond), resting is about *sleep*. An owl asleep
   * at eight in the morning out in the open is exactly the frame-one read this item ships, and it is
   * nowhere near the den.
   */
  private isResting(d: Dino): boolean {
    return atRest(getWorldClock().now().hour, this.chronoOf(d), this.currentSeason());
  }

  /** Up while the park is dark (BACKLOG-109) — by construction only ever an owl. Host for BACKLOG-520. */
  private isRoused(d: Dino): boolean {
    return awakeAtNight(getWorldClock().now().hour, this.chronoOf(d), this.currentSeason());
  }

  /**
   * BACKLOG-522: the sleeping pose follows the same `asleep()` read the murmur and the 💤 mark use, so a
   * dino cannot be lying down and murmuring on different rules. Idempotent per dino (`setAsleep` flips only
   * on the edge), and a species with no down pose is untouched.
   */
  private refreshSleepPoses(): void {
    for (const d of this.dinos) d.setAsleep(this.asleep(d));
  }

  private refreshSleepMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.sleepMarks[i];
      if (!mark) return;
      // BACKLOG-109: the 💤 is about sleep, not about the den — so it reads on any resting dino, which is
      // what puts it over an owl standing in the open at 08:00 on the first frame of a fresh save.
      mark.setVisible(this.isResting(d) && this.inView(d)).setPosition(d.x, d.y - TILE);
    });
    this.refreshRouseMarks();
    this.refreshColdMarks();
  }

  /**
   * The night-owl's 👁 (BACKLOG-109) — the "only thing moving" read. Shares the 💤 slot: a dino cannot be
   * resting and awake-at-night in the same frame, so the two can never stack.
   */
  private refreshRouseMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.rouseMarks[i];
      if (!mark) return;
      mark.setVisible(this.isRoused(d) && this.inView(d)).setPosition(d.x, d.y - TILE);
    });
  }

  /** The cold funk's 🥶 (BACKLOG-184) — above the 💤 slot so a dusk overlap can't stack glyphs. */
  private refreshColdMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.coldMarks[i];
      if (!mark) return;
      mark.setVisible(this.coldPending.has(d.name) && this.inView(d)).setPosition(d.x, d.y - TILE * 1.4);
    });
    this.refreshMopeMarks();
    this.refreshNeedMarks();
  }

  private dinoNames(): string[] {
    return this.dinos.map((d) => d.name);
  }

  /** The loner's 🥀 (BACKLOG-135): live off the bond graph, beside the cold slot (rarely co-occurs). */
  private refreshMopeMarks(): void {
    const names = this.dinoNames();
    this.dinos.forEach((d, i) => {
      const mark = this.mopeMarks[i];
      if (!mark) return;
      const lonely = isLoner(this.bonds, d.name, names, LONER_FLOOR);
      mark.setVisible(lonely && this.inView(d)).setPosition(d.x, d.y - TILE * 1.4);
    });
  }

  /**
   * The loner finds a friend (BACKLOG-369): if strengthening a bond just lifted `name` out of loner status
   * (its first bond over the floor, per the pre-strengthen snapshot `before`), file the one-shot "not so
   * alone now" memory + float a 🌱 perk-up. The 🥀 stops drawing on its own (refreshMopeMarks reads the
   * live graph). Fires once ever per dino.
   */
  private checkLonerLift(name: string, before: Bonds): void {
    if (this.lonerFriended.has(name)) return;
    if (!liftsLoner(before, this.bonds, name, this.dinoNames(), LONER_FLOOR)) return;
    this.lonerFriended.add(name);
    this.leanFiled.delete(name); // BACKLOG-370: the waiting is over — a later bout can be remembered afresh
    this.memory = remember(this.memory, name, foundFriendMemory());
    const d = this.dinoByName(name);
    if (d) this.showBubble(d, foundFriendLine(name));
  }

  /** The need-drive 🍖/💧 (BACKLOG-371): the more pressing need, above the cold/mope slot. */
  private refreshNeedMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.needMarks[i];
      if (!mark) return;
      const need = pressingNeed(this.needs[d.name]);
      mark.setText(need ? NEED_GLYPH[need] : '').setVisible(!!need && this.inView(d)).setPosition(d.x, d.y - TILE * 1.7);
    });
  }

  /**
   * Need-drive spine (BACKLOG-371) — forceStep tail. Every dino's hunger/thirst builds one step at its
   * trait-shaped rate; a dino at its own zone's water drinks (thirst → 0). Deathless: needs only
   * ever build and resolve, nothing dies. Hunger resolves at the hatch (see `eatFood`).
   *
   * BACKLOG-445: the drink check is per-zone now — the bowl's waterhole and the Fernreach's creek slake
   * thirst the same way the grove pond always has. (`nearPond` stays grove-only for the 359 sight beat.)
   */
  private checkNeeds(): void {
    // BACKLOG-466: the season's grip on drinking — thirst builds faster in the dry season, and a drink taken
    // in it doesn't hold (it settles at a floor rather than 0). Spring and fall are 1.0 / 0: no change.
    const season = this.currentSeason();
    this.needs = advanceNeeds(
      this.needs,
      this.dinos.map((d) => ({ name: d.name, traits: d.traits })),
      1,
      seasonThirst(season),
    );
    for (const d of this.dinos) {
      const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
      if (atWater(zone, this.tileOf(d), COLS, ROWS)) {
        this.needs = satisfy(this.needs, d.name, 'thirst', slakeFloor(season));
      }
    }
    this.feedFromStores();
    this.refreshNeedMarks();
  }

  /**
   * A carrier feeds the hungry (BACKLOG-444) — the zone's banked food (446) spent on its own starving
   * resident. The last resort, not the competition: a keeper drop in play always wins (a dino mid-rush to
   * real food is never intercepted), and only a dino past STARVING (well above the 🍖 tell's 0.6, so the
   * band 376/436 live in survives) is fed. A zone with an empty store feeds no one — which is the read.
   * Deathless: an unfed dino just stays starving. Takes from the dino's *home* zone, not the viewed one.
   */
  private feedFromStores(): void {
    if (this.food) return;
    for (const d of this.dinos) {
      if (!isStarving(this.needs[d.name])) continue;
      const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
      const pile = this.foodStoreFor(zone);
      const priority = this.spendPriorityFor(zone);
      const favorite = favoriteFood(d.traits, this.currentSeason()).id;
      // BACKLOG-463: a 'bank'-priority provider keeps a reserve banked; a 'feed' one (or no provider) spends to zero.
      const id = pickFoodToSpend(pile, favorite, feedReserve(priority));
      if (!id) {
        // BACKLOG-471: and when the reserve is the *only* reason this mouth goes unfed, the ground has made
        // a decision that cost somebody. Enough of those and the keeper hears about it — once a day, so it
        // reads as a standing rather than a per-step tic.
        if (heldShort(pile, favorite, priority)) {
          this.shortsByZone[zone] = (this.shortsByZone[zone] ?? 0) + 1;
          const day = getWorldClock().now().day;
          if (soundsDiscontent(this.shortsByZone[zone], this.discontentDayByZone[zone] ?? null, day)) {
            this.discontentDayByZone[zone] = day;
            this.logEvent(discontentLine(zoneById(zone).name));
          }
        }
        continue;
      }
      const emoji = FOODS.find((f) => f.id === id)?.emoji ?? NEED_GLYPH.hunger;
      const zoneName = zoneById(zone).name;
      this.shortsByZone[zone] = 0; // BACKLOG-471: a ground that feeds its own has nothing to grumble about
      this.foodPileByZone[zone] = takeFood(pile, id);
      this.needs = satisfy(this.needs, d.name, 'hunger');
      this.memory = remember(this.memory, d.name, storesFedMemory(zoneName));
      this.flashFeed(d, emoji);
      this.logEvent(storesFedLine(zoneName, d.name, emoji));
      void this.saveGame();
    }
  }

  /**
   * Where a pressing need leans a dino (BACKLOG-436): hunger → the hatch feeding zone (centre column, the
   * `foodLanding` row where dropped food settles), thirst → its own zone's water. Until BACKLOG-445 the
   * thirst arm returned null anywhere but the grove — the need-pull was a no-op in two zones out of three.
   * Every zone answers for itself now (an unknown zone id still returns null and the dino just wanders).
   */
  private needTargetFor(d: Dino, need: NeedKind): { tileX: number; tileY: number } | null {
    if (need === 'hunger') return { tileX: Math.floor(COLS / 2), tileY: Math.floor(ROWS * 0.45) };
    return zoneWaterTile(zoneOf(this.dinoZones, d.name, BOWL_ID), COLS, ROWS);
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

  /**
   * A dino's role: derived from how it has actually behaved, then *settled* so an emerged role is
   * durable (BACKLOG-032) — once found it never reverts to wanderer. The settled role is the single
   * source for the lens, the book, and `__roles`, and is persisted in the save.
   */
  private roleOf(name: string): Role {
    const derived = deriveRole({
      meetings: this.meetingsOf(name),
      rumorsHeard: this.rumorsOf(name),
      topBond: this.maxBond(name),
      foodBanked: this.foodBanked[name] ?? 0, // BACKLOG-448: the economic read, checked first
    });
    const settled = settleRole(this.roles[name], derived);
    this.roles[name] = settled;
    return settled;
  }

  /**
   * Who keeps this zone's pantry full (BACKLOG-453) — the settled `provider` living here with the biggest
   * banked tally. Goes through `roleOf` so the answer can never disagree with the roles lens or the book.
   */
  private providerFor(zoneId: string): string | null {
    return providerOf(this.standings(), zoneId);
  }

  /** Every per-zone standing on every ground (BACKLOG-482) — pioneer, provider and council, derived in one
   *  place off the one roster. Every consumer below goes through this, so the book, the lens, the handover
   *  beat and the greeting aside can never disagree about who holds what. Derived per read, never stored. */
  private standings(): Standing[] {
    return zoneStandings(this.zoneCandidates(), this.pioneers);
  }

  /** The roster as the standings reads see it — where each dino lives, what it settled into, what it has
   *  banked. One builder so `providerFor` (453) and `councilFor` (479) can never drift apart. */
  private zoneCandidates(): ProviderCandidate[] {
    return this.dinos.map((d) => ({
      name: d.name,
      zoneId: zoneOf(this.dinoZones, d.name, BOWL_ID),
      role: this.roleOf(d.name),
      foodBanked: this.foodBanked[d.name] ?? 0,
    }));
  }

  /** Each zone's council (BACKLOG-479) — the map lens's 👥 read and the book's seat line, keyed by zone id.
   *  Twin of `zoneSpends` / `zoneWorks`; a ground where nobody has banked seats nobody. Derived per read,
   *  never stored, so a reload re-derives the same seats from the same banked tallies. */
  /** One ground's seated council (BACKLOG-479), for the callers that want a single zone rather than the
   *  whole chain — the vote (481) reads this on the regrowth tick, so it builds the roster once and no
   *  per-zone loop. Same `zoneCouncil` the lens and the book go through; the seats can't drift. */
  private councilFor(zoneId: string): string[] {
    // BACKLOG-484: a ground with a held seating reads it; one without (a fresh save, before its first day
    // boundary) reads live, so boot and the first in-game day are exactly the pre-484 park.
    return heldSeats(this.seating(), zoneId) ?? councilOf(this.standings(), zoneId);
  }

  /** The held seating (BACKLOG-484), or null before the first term. */
  private seating(): Seating | null {
    return this.councilSeats ? { seats: this.councilSeats, day: this.councilTermDay } : null;
  }

  private zoneCouncils(): Record<string, string[]> {
    const held = this.seating();
    const out: Record<string, string[]> = {};
    let all: Standing[] | null = null; // derived at most once, and only if some ground falls through to live
    for (const z of zoneChain()) {
      const seats = heldSeats(held, z);
      if (seats) {
        out[z] = seats;
        continue;
      }
      all ??= this.standings();
      out[z] = councilOf(all, z);
    }
    return out;
  }

  /**
   * The term (BACKLOG-484) — re-derive every ground's council and hold it until the next in-game day.
   * Live-observed only: registered as its own `clock.onHour` listener beside `checkSpoilage` (455) and
   * `checkUpkeep` (480), and `onHour` never fires on a restore/away `clock.set`, so a jump never holds a
   * term against a day it did not watch.
   */
  private checkTerm(t: GameTime): void {
    if (t.day <= this.councilTermDay) return;
    this.runTerm(t.day);
  }

  /** Run one term. Logs a beat per ground whose membership actually moved — never for a ground seated for
   *  the first time, which is recorded silently (the `checkCouncilCall` precedent). */
  private runTerm(day: number): void {
    const all = this.standings();
    const fresh: Record<string, string[]> = {};
    for (const z of zoneChain()) fresh[z] = councilOf(all, z);
    const { seating, changes } = reseat(this.seating(), fresh, day);
    this.councilSeats = seating.seats;
    this.councilTermDay = seating.day;
    for (const c of changes) {
      if (c.kind === 'turnover') this.logEvent(turnoverLine(zoneById(c.zone).name, c.seated));
    }
    void this.saveGame();
  }

  /**
   * The say changes hands (BACKLOG-467) — the governance turnover beat. Run at the tail of `forceStep`
   * (after this step's banking has settled). For each zone whose standing provider (448) has changed to a
   * *new, non-null* dino — the first one a young zone crowns, or one out-banking the incumbent — log a
   * one-off ticker beat and record the new holder. `spendPriorityFor` re-reads (and persists) the incoming
   * provider's policy, so the 463 re-set that was silent is now marked. A departure (no provider now) leaves
   * `lastProviderByZone` untouched, so the say falls vacant without a false handover and no beat fires until
   * a genuinely different dino takes it.
   */
  private checkProviderHandover(): void {
    for (const z of ZONES) {
      const cur = this.providerFor(z.id);
      if (cur && cur !== this.lastProviderByZone[z.id]) {
        const beat = handoverBeat(
          this.lastProviderByZone[z.id] ?? null,
          cur,
          z.name,
          this.spendPriorityFor(z.id)!,
          // BACKLOG-473: the beat reports both of the ground's calls. Since 481 the work call is the
          // *council's* rather than the incoming provider's — still this ground's current call, so the
          // line stays true; only whose mouth it came out of changed.
          this.workPriorityFor(z.id) ?? undefined,
        );
        if (beat) this.logEvent(beat);
        this.lastProviderByZone[z.id] = cur;
      }
    }
  }

  /** The provider a dino would name to the keeper — never itself (BACKLOG-453). */
  private providerAsideFor(name: string): { name: string; zoneName: string } | undefined {
    const zoneId = zoneOf(this.dinoZones, name, BOWL_ID);
    const provider = this.providerFor(zoneId);
    return provider && provider !== name ? { name: provider, zoneName: zoneById(zoneId).name } : undefined;
  }

  /**
   * First across (BACKLOG-343): record the founding footfall of a ground nobody has ever entered, and post
   * the one-off beat. Called from *both* arrival seams so no route into a zone slips past unrecorded.
   *
   * Returns whether this footfall founded the ground (BACKLOG-474) — the fact it has always computed, now
   * handed back so the settling beat rides the same first-write-wins guard instead of re-deriving it.
   */
  private foundZone(name: string, zoneId: string): boolean {
    if (!recordPioneer(this.pioneers, zoneId, name)) return false;
    this.logEvent(pioneerEvent(zoneId, name));
    return true;
  }

  /**
   * The unsettled ground (BACKLOG-474): the first dino ever to arrive on a ground makes it a *settlement*,
   * not just a founding — a bubble, a memory it keeps (rides recall into a later greeting), and a ticker
   * line under 343's flag. One dino, once, per ground, forever; gated by `foundZone`'s return so the two
   * arrival seams can never disagree about who was first.
   */
  private settleZone(d: Dino, zoneId: string): void {
    const zoneName = zoneById(zoneId).name;
    this.memory = remember(this.memory, d.name, settleMemory(zoneName));
    this.showBubble(d, settleLine());
    this.logEvent(settleEvent(d.name, zoneName));
  }

  /** Is this ground unsettled (BACKLOG-474) — nobody living there and nobody has ever founded it? */
  private isZoneUnsettled(zoneId: string): boolean {
    // BACKLOG-512: no origin exemption any more. Every ground the roster wakes on records a founder
    // (`seedFoundingPioneers`), so "nobody has ever lived here" is a fact about the history rather than
    // about which id the save calls home.
    return isUnsettled(this.zoneHeads()[zoneId] ?? 0, pioneerOf(this.pioneers, zoneId));
  }

  /** Is this ground hollowed (BACKLOG-512) — emptied, but somebody founded it? The other half of empty. */
  private isZoneHollowed(zoneId: string): boolean {
    return isHollowed(this.zoneHeads()[zoneId] ?? 0, pioneerOf(this.pioneers, zoneId));
  }

  /** Which grounds currently read hollowed — the map lens's read, and the `__hollowed` hook. */
  private hollowedZones(): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const z of zoneChain()) out[z] = this.isZoneHollowed(z);
    return out;
  }

  /**
   * Record a founding as a founding (BACKLOG-512). Seeds the pioneer map from the shipping roster, through
   * `recordPioneer` so first-write-wins holds: a ground that already recorded an *arrival* keeps that name,
   * and only the never-recorded founding grounds are filled.
   *
   * Deliberately **not** routed through `foundZone` — that posts 343's arrival beat, and five founding
   * announcements in the boot ticker would be a worse lie than the one this fixes. The founders are a fact
   * the park has always been true to; they were simply never written down.
   */
  private seedFoundingPioneers(): void {
    for (const [zone, name] of Object.entries(foundingPioneers())) recordPioneer(this.pioneers, zone, name);
  }

  /**
   * The ground everybody left (BACKLOG-512). Posts once the first time a founded ground reads empty, naming
   * the dino who settled it. The posted set clears for a ground that regains a head, so a place that
   * repopulates and empties again can sound afresh — the `checkLastOne` dedup discipline, one step further
   * out: that beat fires at one resident, this one at none.
   */
  private checkHollowed(): void {
    for (const z of zoneChain()) {
      if (!this.isZoneHollowed(z)) { this.hollowedPosted.delete(z); continue; }
      if (this.hollowedPosted.has(z)) continue;
      this.hollowedPosted.add(z);
      this.logEvent(hollowedLine(zoneById(z).name, pioneerOf(this.pioneers, z) ?? ''));
    }
  }

  /** Which grounds currently read unsettled — the map lens's read, and the `__unsettled` hook. */
  private unsettledZones(): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const z of zoneChain()) out[z] = this.isZoneUnsettled(z);
    return out;
  }

  private bookRows(): BookRow[] {
    const parentsOf = new Map(this.born.map((b) => [b.name, b.parents] as const));
    const standings = this.standings(); // BACKLOG-482: derived once per open, not once per dino
    return this.dinos.map((d) => ({
      name: d.name,
      species: d.species,
      hearts: heartsFromPoints(this.friendship[d.name] ?? 0),
      topBond: this.maxBond(d.name),
      role: this.roleOf(d.name),
      parents: parentsOf.get(d.name),
      rumorsHeard: this.rumorsOf(d.name),
      quirk: fidget(d.traits).label, // BACKLOG-303: signature idle quirk, in step with the live mark
      hours: chronotypeLine(this.chronoOf(d)), // BACKLOG-109: which hours this dino keeps
      dream: dreamBookLine(d.traits), // BACKLOG-307: what it dreams with no day behind it yet
      tic: this.ticBookEntry(d), // BACKLOG-409: the ritual, once it has actually formed
      intent: this.intents[d.name]?.note, // BACKLOG-393: today's lean, the mind made legible
      plans: planShape(this.ensurePlan(d, getWorldClock().now().day)), // BACKLOG-012: the day's shape, dawn→night
      home: isSettled(tenureOf(this.tenure, d.name)) // BACKLOG-341: where it's settled, once it belongs
        ? settledLine(zoneById(zoneOf(this.dinoZones, d.name, BOWL_ID)).name)
        : undefined,
      foodweb: foodwebStanding(dietOf(d.species, d.name), recall(this.memory, d.name)) ?? undefined, // BACKLOG-443
      manner: mannerLine(recall(this.memory, d.name)) ?? undefined, // BACKLOG-402: how it behaves at a contested drop
      // BACKLOG-401: the same beats read per opponent — who it has faced down and who has beaten it.
      pecking: peckingLine(recall(this.memory, d.name), this.dinos.map((o) => o.name)) ?? undefined,
      // BACKLOG-482: the council seat (479) and the founding (343) both come out of the one standings read,
      // wording and order owned by `standingLines` rather than by a closure in here.
      standings: standingLines(standings, d.name),
      taught: (() => {
        const t = taughtCount(recall(this.memory, d.name)); // BACKLOG-364: what it has shown others
        return t ? taughtBookLine(t.zoneName, t.count) : undefined;
      })(),
      yearn: (() => {
        const z = yearnedFor(recall(this.memory, d.name)); // BACKLOG-362: the ground it has been away from too long
        return z ? yearnBookLine(z) : undefined;
      })(),
      struck: (() => {
        // BACKLOG-347: read live (cameFrom + tenure), never parsed back out of the memory ring — the ring
        // keeps the memory long after the window, so a parse would strand this line on forever (the 251 wart).
        const s = this.struckOf(d);
        return s ? struckBookLine(zoneById(s.from).name) : undefined;
      })(),
      wander: (() => {
        // BACKLOG-361: the lifetime read — crossings kept, reach derived off `seenZones` every open, so a
        // re-linked map re-reads instead of carrying a stale number. Shows on every dino, always.
        const seen = this.seenZones[d.name];
        const origin = originOf(seen) ?? zoneOf(this.dinoZones, d.name, BOWL_ID);
        const crossings = crossingsOf(this.crossings, d.name);
        const reach = reachOf(seen, origin);
        return wanderBookLine(wanderStanding(crossings, reach), crossings, reach, zoneById(origin).name);
      })(),
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
    // Zone map lens (BACKLOG-425): boxes + connectors + keeper dot, one floating label per zone.
    this.mapGfx = this.add.graphics().setDepth(13).setVisible(false);
    this.mapLabels = ZONES.map(() =>
      this.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(14)
        .setVisible(false),
    );
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
    // dev-only Playwright hook — the zone map model (BACKLOG-425): chain order, counts, keeper flag
    (window as any).__zoneMap = () => this.zoneMapEntries();
    // BACKLOG-477: the *drawn* box text, so an e2e can prove the rendered governance row and not just the model.
    (window as any).__zoneMapText = () => {
      this.drawZoneMap(); // draw on demand so the hook reads the live box text whatever lens is up
      return this.mapLabels.map((t) => t.text);
    };
    // BACKLOG-460: the draining-zone reads — each zone's high-water peak, whether it currently reads
    // declining, a manual peak-bump pass (seed a peak deterministically), and BACKLOG-464's last-one scan.
    (window as any).__zonePeaks = () => ({ ...this.zonePeaks });
    (window as any).__zoneDeclining = () => this.decliningZones();
    (window as any).__bumpPeaks = () => { this.bumpPeaks(); return { ...this.zonePeaks }; };
    (window as any).__checkLastOne = () => this.checkLastOne();
    // BACKLOG-428: a zone's prosperity read — the folded signals, score, and tier the map lens shows.
    (window as any).__zoneProsperity = (zone: string) => {
      const signals = this.zoneSignals(zone);
      const score = zoneProsperity(signals);
      return { signals, score, tier: prosperityTier(score) };
    };
    // BACKLOG-486 (rework): seed the world's dice so a spec asserts over a fixed sequence rather than a coin.
    // Production never calls this — unseeded, `rand()` is `Math.random()`. `null` hands the dice back.
    (window as any).__seedRandom = (seed: number | null) => {
      seedRandom(seed);
      return isSeeded();
    };
    (window as any).__bookRows = () => this.bookRows();
    // dev-only hook — the rendered collection-book text (BACKLOG-303: the quirk line shows here)
    (window as any).__bookText = () => bookLines(this.bookRows()).join('\n');
    // dev-only Playwright hook — the persisted settled-role store (BACKLOG-032)
    (window as any).__roleStore = () => ({ ...this.roles });
    // BACKLOG-448: the per-dino banked-food tally the provider role reads.
    (window as any).__foodBanked = () => ({ ...this.foodBanked });
    // BACKLOG-412: each dino's sting state — steps since it came away empty, or null if it never has.
    // Called with a name, it stings that dino, so a spec can drive the aftermath without staging a standoff.
    (window as any).__sting = (name?: string) => {
      if (name) {
        this.sting(name);
        return true;
      }
      const out: Record<string, number | null> = {};
      for (const d of this.dinos) {
        const at = this.stungAt[d.name];
        out[d.name] = at === undefined ? null : this.worldSteps - at;
      }
      return out;
    };
    // BACKLOG-479: each ground's seated council — derived, never stored, so this is a live read.
    (window as any).__councils = () => this.zoneCouncils();
    // BACKLOG-484: the held seating and its term day, plus a forced term so a spec needn't wait a day.
    (window as any).__seating = () => ({ seats: this.councilSeats, day: this.councilTermDay });
    (window as any).__forceTerm = () => {
      this.runTerm(getWorldClock().now().day);
      return this.councilSeats;
    };
    // BACKLOG-482: the folded read behind __councils and the book's standing lines.
    (window as any).__standings = () => this.standings();
    // BACKLOG-481: the vote itself, not just its outcome — who sat, how each voted, who'd break a tie.
    (window as any).__councilVotes = (zone: string) => {
      const z = zone ?? this.zoneId;
      const seats = this.councilFor(z);
      const provider = this.providerFor(z);
      return {
        seats,
        // BACKLOG-492: the *lived* ballots, because this hook's whole promise is the production path.
        votes: seats.map((n) => votedWork(this.dinoByName(n)?.traits, this.seatExperience(n, z))),
        tieBreak: provider ? votedWork(this.dinoByName(provider)?.traits, this.seatExperience(provider, z)) : null,
        call: this.workPriorityFor(z),
        // BACKLOG-487: the pantry call at the same seats, read through the same production path.
        spendVotes: seats.map((n) => votedSpend(this.dinoByName(n)?.traits, this.seatExperience(n, z))),
        spendTieBreak: provider
          ? votedSpend(this.dinoByName(provider)?.traits, this.seatExperience(provider, z))
          : null,
        spendCall: this.spendPriorityFor(z),
      };
    };
    // dev-only: credit banked food to a dino without staging a whole harvest haul, so a spec can seat a council.
    (window as any).__creditBank = (name: string, n = 1) => {
      for (let i = 0; i < n; i++) this.creditFoodBank(name);
      return this.foodBanked[name] ?? 0;
    };

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
    this.mapGfx.setVisible(L === 'map');
    this.mapLabels.forEach((t) => t.setVisible(L === 'map'));

    // role tags float over each dino only in the roles lens
    this.roleTags.forEach((tag, i) => {
      const d = this.dinos[i];
      const show = L === 'roles' && !!d && this.inView(d);
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
        if (!a || !b || !this.inView(a) || !this.inView(b)) continue;
        this.bondGfx.lineStyle(Math.max(1, Math.round(p.points / 18)), 0xff6fae, 0.6);
        this.bondGfx.lineBetween(a.x, a.y, b.x, b.y);
      }
    } else if (L === 'map') {
      this.drawZoneMap();
    }
  }

  /**
   * A zone's prosperity signals (BACKLOG-428) — the four live per-zone reads the index folds: banked
   * resources, built landmarks, resident heads, and crops harvested from the zone's plot. Pure gather;
   * `zoneProsperity` does the math.
   */
  private zoneSignals(id: string): ZoneSignals {
    const pile = this.pileFor(id);
    const stockpile = Object.values(pile).reduce((sum, n) => sum + (n ?? 0), 0);
    // BACKLOG-480: the *maintained* count, so the one term of the index that could never fall now can.
    const structures = this.standingIn(id);
    const heads = zonePopulations(this.dinoZones, this.dinos.map((d) => d.name), BOWL_ID)[id] ?? 0;
    const harvested = this.harvestedByZone[id] ?? 0;
    return { stockpile, structures, heads, harvested };
  }

  /** The prosperity tier of each zone (BACKLOG-428) — the map lens's per-zone read, keyed by zone id. */
  private zoneTiers(): Record<string, ProsperityTier> {
    const tiers: Record<string, ProsperityTier> = {};
    for (const id of zoneChain()) tiers[id] = prosperityTier(zoneProsperity(this.zoneSignals(id)));
    return tiers;
  }

  /** The live zone-map model (BACKLOG-425 + 428 tier) — the single source the lens draws and `__zoneMap` returns. */
  private zoneMapEntries(): ZoneMapEntry[] {
    return zoneMapModel(
      zoneChain(),
      zonePopulations(this.dinoZones, this.dinos.map((d) => d.name), BOWL_ID),
      this.zoneId,
      this.zoneTiers(),
      this.harvestedByZone, // BACKLOG-433: each zone's farming tally, read on its own on the lens
      this.foodPileByZone, // BACKLOG-446: each zone's banked food, read as a glyph line on the lens
      this.granaryZones(), // BACKLOG-454: zones that have raised a granary (🏛️ marker + a raised food cap)
      this.decliningZones(), // BACKLOG-460: zones hollowed below their peak (⬇ marker)
      this.zoneSpends(), // BACKLOG-468: how each ground has chosen to spend (🍽️/🏦 marker)
      this.unsettledZones(), // BACKLOG-474: a ground nobody has ever lived on reads as unsettled, not poor
      this.zoneWorks(), // BACKLOG-473: what each ground puts its backs into (🧺/🧱 marker)
      this.zoneCouncils(), // BACKLOG-479: the ground's seated voices (👥N beside the head count)
      this.hollowedZones(), // BACKLOG-512: a ground everybody has left reads hollowed, not unsettled and not poor
      this.zoneShorts(), // BACKLOG-509: what each ground's next landmark is still waiting on
    );
  }

  /** What each ground's next structure is short of (BACKLOG-509) — the map lens's `short` row, keyed by
   *  zone id. Derived through `recipeShortfall`, so the tithe lives in `structureRecipe` and nowhere else. */
  private zoneShorts(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const z of zoneChain()) out[z] = shortfallLine(this.pileFor(z), z);
    return out;
  }

  /** Which zones currently read declining (BACKLOG-460) — the map lens's ⬇ read, keyed by zone id. */
  private decliningZones(): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const z of zoneChain()) out[z] = this.isZoneDeclining(z);
    return out;
  }

  /** Each zone's spend policy (BACKLOG-468) — the map lens's 🍽️/🏦 read, keyed by zone id. A pure read
   *  through the existing `spendPriorityFor`; a ground that has never had a provider stays null. */
  private zoneSpends(): Record<string, SpendPriority | null> {
    const out: Record<string, SpendPriority | null> = {};
    for (const z of zoneChain()) out[z] = this.spendPriorityFor(z);
    return out;
  }

  /** Each zone's work policy (BACKLOG-473) — the map lens's 🧺/🧱 read, keyed by zone id. Twin of
   *  `zoneSpends`; a ground that has never had a provider stays null. */
  private zoneWorks(): Record<string, WorkPriority | null> {
    const out: Record<string, WorkPriority | null> = {};
    for (const z of zoneChain()) out[z] = this.workPriorityFor(z);
    return out;
  }

  /**
   * Draw the zone map (BACKLOG-425): the chain as a centered horizontal row of labelled boxes
   * (name + head count), a connector between neighbours, and a dot marking the keeper's zone.
   * Pure model in, chrome out — redrawn on every lens refresh so counts and the dot stay live.
   */
  private drawZoneMap(): void {
    const entries = this.zoneMapEntries();
    const boxW = 118;
    const boxH = 104; // BACKLOG-428/438: prosperity + want lines; -446 banked food; -477 the governance row
    const gap = 26;
    const totalW = entries.length * boxW + (entries.length - 1) * gap;
    const x0 = ((TILE * COLS) - totalW) / 2;
    const y = 44;
    this.mapGfx.clear();
    entries.forEach((e, i) => {
      const x = x0 + i * (boxW + gap);
      if (i > 0) {
        this.mapGfx.lineStyle(2, 0xffffff, 0.5);
        this.mapGfx.lineBetween(x - gap, y + boxH / 2, x, y + boxH / 2);
      }
      this.mapGfx.fillStyle(0x000000, 0.85);
      this.mapGfx.fillRect(x, y, boxW, boxH);
      this.mapGfx.lineStyle(2, e.keeper ? 0xffe0a0 : 0xffffff, 0.9);
      this.mapGfx.strokeRect(x, y, boxW, boxH);
      if (e.keeper) {
        this.mapGfx.fillStyle(0xffe0a0, 1);
        this.mapGfx.fillCircle(x + boxW / 2, y + boxH - 9, 4);
      }
      // BACKLOG-428: name + head count + prosperity badge (○/◐/● quiet/growing/thriving).
      // BACKLOG-433: the zone's own harvest tally (🌾N) reads beside the folded tier.
      // BACKLOG-438: a fourth line names what the zone wants from a neighbour, only when it has a demand.
      // BACKLOG-460: a zone hollowed below its peak reads a ⬇ beside the tier — an exodus made legible.
      // BACKLOG-474: a ground nobody has ever lived on replaces that whole line with the unsettled read —
      // `○ quiet` beside an empty ground says "poor" when the truth is "nobody has ever been here".
      // BACKLOG-477: the two governance glyphs (468's 🍽️/🏦, 473's 🧺/🧱) come *off* this line — they were
      // the fourth and fifth reads on it, and they are the same kind of fact — and land on their own row
      // below, in one table-driven order with a legend in the [?] panel.
      // BACKLOG-512: and a ground everybody *left* gets the other empty read. The two are complements
      // within "no heads", so an empty ground always says which kind of empty it is.
      let txt = e.unsettled || e.hollowed
        ? `${e.name}\n${e.count} 🦕\n${e.unsettled ? UNSETTLED_BADGE : HOLLOWED_BADGE}`
        : `${e.name}\n${e.count} 🦕${e.council.length ? `  👥${e.council.length}` : ''}\n${prosperityBadge(e.tier)}${e.declining ? ` ${declineGlyph()}` : ''}  🌾${e.harvested}`;
      // BACKLOG-479: the council rides the head-count line — it *is* a fact about who lives here, and it
      // costs no new row, so the box height (and the 477 governance row below it) is untouched.
      const gov = e.unsettled || e.hollowed ? '' : governanceLine([e.spend, e.work]); // BACKLOG-477 / 512
      if (gov) txt += `\n${gov}`;
      if (e.want) txt += `\nwants ${e.want.glyph}◂${e.want.fromName}`;
      // BACKLOG-509: and what its own next landmark is waiting on — the tithe named, with where it comes
      // from, so a fresh park reads that nothing goes up here until somebody climbs, with nothing else opened.
      // ...but not on a ground nobody lives on. An unsettled or hollowed ground has no backs to put on a
      // landmark, so naming what its landmark is short of is noise on the one row that says why it is empty
      // — the same reason 477's governance glyphs come off those two. (QA, cycle 146.)
      if (e.short && !e.unsettled && !e.hollowed) txt += `
${e.short}`;
      if (e.banked) txt += `\n${e.banked}${e.granary ? ` ${GRANARY_GLYPH}` : ''}`; // BACKLOG-446 banked food + BACKLOG-454 granary marker
      else if (e.granary) txt += `\n${GRANARY_GLYPH}`; // BACKLOG-454: a granary reads even with an empty pantry
      this.mapLabels[i]?.setText(txt).setPosition(x + boxW / 2, y + boxH / 2 - 5);
    });
    // A roster bigger than ZONES can't happen (labels are per-zone), but hide any spare label anyway.
    for (let i = entries.length; i < this.mapLabels.length; i++) this.mapLabels[i].setVisible(false);
  }

  private setupMovement(): void {
    // BACKLOG-333: wander on a real-time timer, not the in-game clock, so the park mills about at a
    // watchable pace whatever the time scale (at 1× an in-game minute is 60 real seconds).
    this.time.addEvent({ delay: WANDER_STEP_MS, loop: true, callback: () => { if (!this.ambientPaused) this.forceStep(); } }); // BACKLOG-431

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
    // BACKLOG-355: append a raw memory (lets the e2e age a grove telling toward the back of the ring).
    (window as any).__remember = (name: string, event: string) => {
      this.memory = remember(this.memory, name, event);
    };
    // dev-only: tone state (BACKLOG-142) — friendship points, last-tone map, and live menu.
    (window as any).__friendship = () => ({ ...this.friendship });
    // BACKLOG-370: set a dino's keeper-friendship points outright (the e2e needs ≥ LEAN_HEARTS hearts
    // without greeting it a dozen times, which would also lift it out of loner status via LONER_BONUS).
    (window as any).__setFriendship = (name: string, points: number) => {
      this.friendship = { ...this.friendship, [name]: points };
    };
    // BACKLOG-370: the wall this dino's mope branch would aim at right now, or null when it isn't a
    // leaning loner. Same three predicates the branch itself uses, so hook and behaviour cannot drift.
    (window as any).__leanTarget = (name: string) => {
      const d = this.dinoByName(name);
      return d ? this.leanTargetFor(d) : null;
    };
    (window as any).__leanFiled = () => [...this.leanFiled];
    (window as any).__playerTile = () => this.playerTile(); // BACKLOG-370: what wall the keeper is by
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
    // dev-only: word of the grove (BACKLOG-342) — a just-returned speaker leads with grove news.
    (window as any).__spreadGroveWord = (a: string, b: string) => {
      const g = spreadGroveWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    (window as any).__groveWord = (speaker: string) => groveWordLine(speaker);
    // BACKLOG-453: who keeps a zone's pantry full, and the word of it passing between two dinos.
    (window as any).__zoneProvider = (zone: string) => this.providerFor(zone);
    (window as any).__spreadProviderWord = (a: string, b: string) => {
      const zone = zoneOf(this.dinoZones, a, BOWL_ID);
      const p = spreadProviderWord(this.memory, a, b, this.providerFor(zone), zoneById(zone).name);
      this.memory = p.store;
      return p.rumor;
    };
    // BACKLOG-470: word of how the ground decides — the speaker's zone's spend policy passing to a listener.
    (window as any).__spreadPolicyWord = (a: string, b: string) => {
      const zone = zoneOf(this.dinoZones, a, BOWL_ID);
      const p = spreadPolicyWord(this.memory, a, b, this.spendPriorityFor(zone), zoneById(zone).name);
      this.memory = p.store;
      return p.rumor;
    };
    // BACKLOG-458: word of plenty — spread it (applies to the store), read a dino's primed target, or seed
    // a thriving zone's residents with first-hand plenty word.
    (window as any).__spreadPlentyWord = (a: string, b: string) => {
      const p = spreadPlentyWord(this.memory, a, b);
      this.memory = p.store;
      return p.rumor;
    };
    (window as any).__plentyTarget = (name: string) =>
      plentyTarget(recall(this.memory, name), zoneOf(this.dinoZones, name, BOWL_ID));
    (window as any).__seedPlentyWord = () => this.seedPlentyWord();
    (window as any).__seedYearning = () => this.seedYearning(); // BACKLOG-362
    // dev-only: pond-swappers (BACKLOG-346) — two grove-visited dinos trade pond notes (applies it).
    (window as any).__pondSwap = (a: string, b: string) => this.pondSwapBeat(a, b);
    // dev-only: word of the warmth (BACKLOG-223) — a warmed speaker leads with the good news.
    (window as any).__spreadWarmWord = (a: string, b: string) => {
      const g = spreadWarmWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    (window as any).__warmWord = (speaker: string) => warmWordLine(speaker);
    // dev-only: word of the relief (BACKLOG-235) — a corrector leads with the all-clear it carries.
    (window as any).__spreadReliefWord = (a: string, b: string) => {
      const g = spreadReliefWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    // dev-only: secondhand sympathy visit (BACKLOG-217) — the carrier of a cold word comes to find
    // the sufferer; applies the bump + memory and returns {visitor, sufferer, memory} or null.
    (window as any).__sympathyVisit = (a: string, b: string) => {
      const v = sympathyVisit(this.memory, a, b);
      if (v) {
        this.memory = remember(this.memory, v.sufferer, v.memory);
        this.bonds = strengthen(this.bonds, v.visitor, v.sufferer, SYMPATHY_BOND);
      }
      return v;
    };
    (window as any).__bond = (a: string, b: string) => bondPoints(this.bonds, a, b);
    // dev-only: the bowl self-corrects (BACKLOG-234) — a carrier drops a recovered sufferer's
    // cold word with relief; applies the forget + relief memory and returns the correction or null.
    (window as any).__selfCorrect = (a: string, b: string) => {
      const c = selfCorrect(this.memory, a, b);
      if (c) {
        this.memory = forget(this.memory, c.corrector, c.dropped);
        this.memory = remember(this.memory, c.corrector, c.memory);
      }
      return c;
    };
    // dev-only: plant a first-hand cold memory without staging a winter night.
    (window as any).__rememberCold = (name: string) => {
      this.memory = remember(this.memory, name, coldMemory());
    };
    // dev-only: plant a first-hand warm memory without staging a warming.
    (window as any).__rememberWarm = (name: string) => {
      this.memory = remember(this.memory, name, warmMemory());
    };
    // dev-only: plant a "<clearer> cleared my name" memory (BACKLOG-247) without staging the gossip arc.
    (window as any).__rememberGrateful = (sufferer: string, clearer: string) => {
      this.memory = remember(this.memory, sufferer, gratefulMemory(clearer));
    };
    // dev-only: grateful to the one who cleared your name (BACKLOG-243) — a recovered sufferer warms
    // to the carrier of its first-hand all-clear; applies the bump + memory, returns the result or null.
    (window as any).__clearedName = (a: string, b: string) => {
      const t = clearedName(this.memory, a, b);
      if (t) {
        this.memory = remember(this.memory, t.sufferer, t.memory);
        this.bonds = strengthen(this.bonds, t.sufferer, t.clearer, GRATEFUL_BOND);
      }
      return t;
    };
    // dev-only: plant a first-hand relief memory (`saw <sufferer> came through it fine`) on the clearer.
    (window as any).__rememberRelief = (name: string, sufferer: string) => {
      this.memory = remember(this.memory, name, reliefMemory(sufferer));
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

  /**
   * The nearest dino in `d`'s own zone within tic-company range (BACKLOG-405), or null when `d` is alone.
   * Nearest first, ties by name so the pick is deterministic.
   *
   * Split out of `companyNear` for BACKLOG-411, which needs the *name* of whoever ended the stretch. One
   * function answers both questions on purpose: a beat that named a dino the solitude rule did not agree
   * was there would be a lie the player could catch.
   */
  private nearestCompany(d: Dino): string | null {
    const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const cur = this.tileOf(d);
    let best: { name: string; dist: number } | null = null;
    for (const o of this.dinos) {
      if (o === d) continue;
      if (zoneOf(this.dinoZones, o.name, BOWL_ID) !== zone) continue;
      const dist = this.chebyTiles(this.tileOf(o), cur);
      if (dist > TIC_COMPANY_RANGE) continue;
      if (!best || dist < best.dist || (dist === best.dist && o.name.localeCompare(best.name) < 0)) {
        best = { name: o.name, dist };
      }
    }
    return best?.name ?? null;
  }

  /** Is another dino in `d`'s own zone within tic-company range (BACKLOG-405)? Company breaks the solitude. */
  private companyNear(d: Dino): boolean {
    return this.nearestCompany(d) !== null;
  }

  /**
   * Glad of the company (BACKLOG-411) — the solitude ended, and for once the park says so.
   *
   * The one caller is the wander loop's not-alone branch, which until now went straight to `resetTic`. The
   * beat fires *before* the teardown and the teardown is unconditional: a stretch that earns no beat must
   * still end. `foundByCompany` holds the whole ordering rule (mid-ritual, and not a need that pulled the
   * dino away), and the ambient pause holds the beat exactly like every other ambient beat.
   */
  private breakTic(d: Dino): void {
    const friend = foundByCompany(this.ticInvented.has(d.name), !!pressingNeed(this.needs[d.name]))
      ? this.nearestCompany(d)
      : null;
    if (friend && !this.ambientHeld) {
      const tic = this.ticFor(d); // BACKLOG-407: the ritual it actually performs, not the one it was born with
      this.memory = remember(this.memory, d.name, gladOfCompanyMemory(tic.label, friend));
      this.flashFeed(d, COMPANY_GLYPH);
      this.logEvent(gladOfCompanyLine(d.name, friend, COMPANY_GLYPH));
      this.companyTrace[d.name] = { friend, at: this.worldSteps };
    }
    this.resetTic(d.name);
  }

  /**
   * The wall a leaning loner (BACKLOG-370) withdraws toward, or null when this dino isn't one — it isn't a
   * loner, it's out of the keeper's view, or its hearts are under LEAN_HEARTS. Deliberately does NOT roll
   * MOPE_CHANCE: that roll decides *whether* a loner mopes this step, this decides *where* it mopes to.
   */
  private leanTargetFor(d: Dino): { tileX: number; tileY: number } | null {
    if (!isLoner(this.bonds, d.name, this.dinoNames(), LONER_FLOOR)) return null;
    if (!this.inView(d)) return null;
    if (!leansOnKeeper(heartsFromPoints(this.friendship[d.name] ?? 0))) return null;
    return keeperEdgeTarget(this.playerTile(), COLS, ROWS);
  }

  /** Company or a need returned (BACKLOG-405): drop the solitary streak so the ritual can re-form fresh later. */
  private resetTic(name: string): void {
    this.soloSteps[name] = 0;
    this.ticInvented.delete(name);
    delete this.ticAnchor[name];
    delete this.ticPhase[name];
    delete this.ticGrief[name]; // BACKLOG-414: the grief re-derives fresh next stretch

    // BACKLOG-408/420: the stretch ended — a later one can be caught (+ remembered) afresh, and its
    // register starts back at pleased rather than leaving the dino permanently sardonic.
    delete this.ticCatches[name];
    delete this.ticWarmthStretch[name]; // BACKLOG-422: ...and the stretch's warmth budget refills. The lifetime tally is deliberately untouched.
    for (const key of [...this.ticCaughtFiled]) if (key.startsWith(`${name}:`)) this.ticCaughtFiled.delete(key);
    this.kinFiled.delete(name); // BACKLOG-416: ...and a later stretch can find company across the way afresh
    if (this.caughtTic === name) this.caughtTic = null;
  }

  /**
   * BACKLOG-414: the ache a lone dino carries into its ritual — its *closest* friend (013, above the
   * grief floor) and the edge that friend crossed away by, or null when that friend shares its zone (no
   * departure to grieve) or it has no real friend at all. A solitude with a direction.
   */
  /** BACKLOG-410: the names of the *other* dinos residing in `d`'s current zone (any distance) — the pool
   *  `closestFriend` searches to decide whether `d` has a friend at home in its strange new zone. */
  private zoneMates(d: Dino): string[] {
    const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
    return this.dinos
      .filter((o) => o.name !== d.name && zoneOf(this.dinoZones, o.name, BOWL_ID) === zone)
      .map((o) => o.name);
  }

  private griefFor(d: Dino): { edge: Edge; friend: string } | null {
    const friend = closestFriend(d.name, this.bonds, this.dinoNames(), GRIEF_BOND_FLOOR);
    if (!friend) return null;
    const dz = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const fz = zoneOf(this.dinoZones, friend, BOWL_ID);
    const edge = griefEdge(dz, fz);
    return edge ? { edge, friend } : null;
  }

  /**
   * Where this stretch's ritual is performed (BACKLOG-421). One decision, one caller-visible effect.
   *
   * Grief (414) still outranks the habit and deliberately leaves `ticHaunts` alone: a dino pacing the edge
   * its friend left by is not keeping a habit, and the habit has to still be there to come back to. Every
   * other ritual goes through `ticAnchorFor`, which lays a haunt where the dino stands the first time and
   * nudges it one tile every stretch after — so the little path migrates instead of being re-rolled.
   */
  private anchorForTic(d: Dino): Tile {
    const cur = this.tileOf(d);
    const grief = this.griefFor(d);
    this.ticGrief[d.name] = grief?.friend ?? null;
    if (grief) return griefAnchor(grief.edge, cur, COLS, ROWS);
    const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const byZone = (this.ticHaunts[d.name] ??= {});
    const { anchor, haunt } = ticAnchorFor({
      haunt: byZone[zone],
      at: cur,
      seed: hauntSeed(d.name),
      cols: COLS,
      rows: ROWS,
    });
    byZone[zone] = haunt;
    const key = `${d.name}:${zone}`;
    if (hauntWorthNoting(haunt) && !this.hauntNoted.has(key)) {
      this.hauntNoted.add(key);
      const tic = this.ticFor(d);
      this.memory = remember(this.memory, d.name, hauntDriftMemory(tic.label));
      this.logEvent(hauntDriftedLine(d.name, tic.glyph));
    }
    // BACKLOG-507: the haunt just moved (or was just laid), so the worn ground moves with it now rather
    // than at the next zone event.
    this.syncWear();
    return anchor;
  }

  /**
   * Perform the tic (BACKLOG-405): the first time a dino falls into its ritual this solitary stretch, float
   * the glyph, log it, and file the one-time memory (which the greeting/reflection path can later surface).
   * Afterward it re-floats the glyph every few steps so an ongoing ritual stays visible without spamming.
   */
  /**
   * The ritual this dino actually performs (BACKLOG-407) — the one it picked up off a friend if it has one,
   * else the one its own temperament gave it. Every reader of a tic goes through here, so the player can
   * never be shown one ritual while the book or the keeper reads another. `signatureTic` still answers what
   * a dino was *born* with, which is a different question and stays available.
   */
  private ticFor(d: Dino): Tic {
    const axis = this.ticEchoes[d.name];
    return axis ? echoedTic(TIC_BY_AXIS[axis]) : signatureTic(d.traits);
  }

  /** The axis of the ritual this dino actually performs (BACKLOG-420) — a picked-up one (407) if it has it,
   *  else its own. `ticFor`'s twin: the tease is worded off the ritual you interrupted, not the one it was born with. */
  private ticAxisFor(d: Dino): keyof Personality {
    return this.ticEchoes[d.name] ?? signatureAxis(d.traits);
  }

  /**
   * The book's ritual line (BACKLOG-409), or `undefined` for a dino whose ritual has never formed here.
   *
   * Reads the *base* tic rather than `ticFor`'s echoed one: `echoedTic` rewords the label to say the ritual
   * is second-hand, and the book says that itself — with the friend's name — so going through `ticFor` would
   * print the provenance twice.
   */
  private ticBookEntry(d: Dino): string | undefined {
    if (!this.ticsFormed.has(d.name)) return undefined;
    const axis = this.ticEchoes[d.name];
    const base = axis ? TIC_BY_AXIS[axis] : signatureTic(d.traits);
    const from = axis ? (this.ticEchoFrom[d.name] ?? ECHO_FROM_UNKNOWN) : null;
    return ticBookLine(base, from);
  }

  /**
   * Watching a friend at its ritual (BACKLOG-407). Called once per *solitary stretch* from `performTic`'s
   * invention branch — never from the every-six-steps re-float, which would turn three watches into three
   * steps and have the whole park echoing inside a minute.
   *
   * A watcher must be in the **band**: further than `TIC_COMPANY_RANGE` (any nearer and the ritual would not
   * have formed at all) and no further than `ECHO_WATCH_RANGE`. That is the beat's whole shape — the friend
   * who learns your ritual is the one who left you alone to have it.
   *
   * One echo per dino, ever: a dino already carrying a ritual is done learning, so imitation never chains
   * beyond a single hop per learner. What it teaches onward, though, is what it *performs* — so a ritual
   * genuinely travels rather than every echo tracing back to one dino's temperament.
   */
  private watchTic(performer: Dino): Array<{ name: string; watches: number; echoed: boolean }> {
    const out: Array<{ name: string; watches: number; echoed: boolean }> = [];
    if (this.ambientHeld) return out;
    const zone = zoneOf(this.dinoZones, performer.name, BOWL_ID);
    const at = this.tileOf(performer);
    for (const o of this.dinos) {
      if (o.name === performer.name) continue;
      if (zoneOf(this.dinoZones, o.name, BOWL_ID) !== zone) continue;
      if (this.ticEchoes[o.name]) continue; // already carries a ritual of someone else's
      if (!watchingTic(this.chebyTiles(this.tileOf(o), at))) continue;
      const bond = bondPoints(this.bonds, o.name, performer.name);
      if (bond < ECHO_BOND_FLOOR) continue;
      const key = `${o.name}>${performer.name}`;
      const watches = (this.ticWatches[key] ?? 0) + 1;
      this.ticWatches[key] = watches;
      const echoed = picksUpTic(watches, bond);
      if (echoed) {
        this.ticEchoes[o.name] = this.ticEchoes[performer.name] ?? signatureAxis(performer.traits);
        // BACKLOG-409: an adopted ritual is one the park announced on the ticker, so it counts as witnessed —
        // and the book names who it came off rather than the vaguer "from a friend".
        this.ticEchoFrom[o.name] = performer.name;
        this.ticsFormed.add(o.name);
        const tic = this.ticFor(o);
        this.memory = remember(this.memory, o.name, echoTicMemory(tic.label, performer.name));
        this.flashFeed(o, tic.glyph);
        this.logEvent(echoedLine(o.name, performer.name, tic.glyph));
      }
      out.push({ name: o.name, watches, echoed });
    }
    return out;
  }

  /**
   * Not the only one (BACKLOG-416). `watchTic`'s shape with the two things that make 407 what it is removed:
   * the bond floor, and the requirement that only one of the pair be ticcing. Here **both** must be mid-ritual
   * (`ticInvented`), and no bond of any size is required or moved — you cannot learn a stranger's ritual from
   * across a field, but you can be glad they are out there.
   *
   * Called from `performTic`'s invention branch, after `watchTic`, so it fires once per solitary stretch and
   * touches none of 407's tallies. That means the pairing lands when the **second** of the two falls into its
   * ritual, which is the honest moment: until then there was only one loner out here.
   *
   * Reads `watchingTic` for the band rather than naming a distance of its own — the only window in which this
   * can happen is the one 407 already had to name for the opposite reason.
   */
  private kinTic(performer: Dino): string[] {
    const out: string[] = [];
    if (this.ambientHeld) return out;
    const zone = zoneOf(this.dinoZones, performer.name, BOWL_ID);
    const at = this.tileOf(performer);
    for (const o of this.dinos) {
      if (o.name === performer.name) continue;
      if (zoneOf(this.dinoZones, o.name, BOWL_ID) !== zone) continue;
      if (!this.ticInvented.has(o.name)) continue; // the other must be at its own ritual — the whole item
      if (!watchingTic(this.chebyTiles(this.tileOf(o), at))) continue;
      for (const [self, other] of [
        [performer, o],
        [o, performer],
      ] as const) {
        if (this.kinFiled.has(self.name)) continue; // once per solitary stretch, per dino
        this.kinFiled.add(self.name);
        this.memory = remember(this.memory, self.name, kinshipMemory(other.name));
      }
      this.logEvent(kinshipLine(performer.name, o.name));
      out.push(o.name);
    }
    return out;
  }

  private performTic(d: Dino, tic: Tic): void {
    if (!this.ticInvented.has(d.name)) {
      this.ticInvented.add(d.name);
      this.ticsFormed.add(d.name); // BACKLOG-409: the lifetime fact the book reads — never cleared by resetTic
      // BACKLOG-414: a dino grieving a departed friend files the directional ache; else the plain 405 ritual.
      // BACKLOG-412: a dino still smarting from a contested drop files the self-soothing note instead —
      // the same ritual, started for a reason. Grief outranks it: a departed friend is the larger ache, and
      // a dino carrying both should read as grieving, not as sore about a scrap.
      const grieved = this.ticGrief[d.name];
      const soothing = !grieved && this.stungNow(d.name) && !this.soothedFiled.has(d.name);
      if (soothing) this.soothedFiled.add(d.name);
      this.memory = remember(
        this.memory,
        d.name,
        grieved ? griefTicMemory(tic.label, grieved) : soothing ? soothingTicMemory(tic.label) : ticMemory(tic.label),
      );
      this.flashFeed(d, tic.glyph);
      this.logEvent(`${tic.glyph} ${d.name} ${grieved ? `${tic.label} at the edge ${grieved} left by` : tic.label}`);
      this.leaveTrace(d); // BACKLOG-424: the ritual scuffs the ground it happens on
      this.watchTic(d); // BACKLOG-407: whoever is watching from the band gets one watch of this stretch
      this.kinTic(d); // BACKLOG-416: ...and another loner ticcing in that same band is company of a kind
    } else if ((this.soloSteps[d.name] ?? 0) % 6 === 0) {
      this.flashFeed(d, tic.glyph);
    }
  }

  /**
   * Leave a pacing trace (BACKLOG-424) — the mark a ritual makes on the ground, at the tic's anchor (the
   * grief edge for a 414 ache, the spot it settled on otherwise) and in the zone it happened in.
   */
  private leaveTrace(d: Dino): void {
    const at = this.ticAnchor[d.name] ?? this.tileOf(d);
    this.paceTraces = recordTrace(this.paceTraces, {
      zone: zoneOf(this.dinoZones, d.name, BOWL_ID),
      tileX: at.tileX,
      tileY: at.tileY,
      by: d.name,
      at: this.worldSteps,
    });
  }

  /**
   * Read the ground (BACKLOG-424) — any dino standing on someone else's fresh scuff floats 👣 and files the
   * faint, unnamed memory, once per trace. Held by the ambient pause (456) like every other ambient beat.
   * Returns who filed what, for the dev hook.
   */
  private noticeTraces(): Array<{ name: string; filed: boolean }> {
    const out: Array<{ name: string; filed: boolean }> = [];
    if (this.ambientHeld) return out;
    for (const d of this.dinos) {
      const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
      const t = traceNear(this.paceTraces, zone, this.tileOf(d), d.name, this.worldSteps);
      if (!t) continue;
      const key = `${d.name}|${traceKey(t)}`;
      if (this.noticedTraces.has(key)) {
        out.push({ name: d.name, filed: false });
        continue;
      }
      this.noticedTraces.add(key);
      this.memory = remember(this.memory, d.name, traceMemory());
      this.flashFeed(d, TRACE_GLYPH);
      this.logEvent(`${TRACE_GLYPH} ${d.name} finds the ground scuffed — someone was pacing here`);
      out.push({ name: d.name, filed: true });
    }
    return out;
  }

  /** One wander + meeting step for every dino (used by the throttled tick and the dev hook). */
  private forceStep(): void {
    this.worldSteps++; // BACKLOG-424: the stamp a pacing trace ages against
    if (this.convoCooldown > 0) this.convoCooldown--;

    // A world-scale night event (BACKLOG-144) overrides all wandering: the whole cast gathers to
    // gawp at the sky. When it ends (duration/dawn) stepSky returns false and ordinary life resumes.
    if (this.stepSky()) {
      for (const d of this.dinos) this.activityById[d.name] = 'gazing'; // BACKLOG-295
      this.refreshSleepMarks();
      this.refreshActivityMarks();
      return;
    }

    // BACKLOG-297/314: age every zone's resource so each zone's fetch grace can elapse (a grove resource
    // is past its grace and ready when the keeper crosses in).
    for (const z of Object.keys(this.resourceByZone)) this.resourceAgeByZone[z] = (this.resourceAgeByZone[z] ?? 0) + 1;

    const season = this.currentSeason();
    // BACKLOG-109: the rest window is per dino now, not one boolean for the whole cast — `restingNow` reads
    // the dino's own chronotype against this hour. A day-dino's window is still exactly `SEASON_HUDDLE`'s.
    const hourNow = getWorldClock().now().hour;

    // Food web (BACKLOG-367): pair each hungry, in-view carnivore off cooldown with the nearest in-view
    // herbivore — the bowl's first hunt. Built once per step (before the movement ladder) so the hunter
    // and its prey read the same pairing whichever is processed first. Deathless; resolution below.
    const now = Date.now();
    const stalkTargets: Record<string, string> = {};
    const fleeFrom: Record<string, string> = {};
    const herbivores = this.dinos.filter((h) => this.inView(h) && !isCarnivore(h.species, h.name));
    for (const d of this.dinos) {
      if (!isCarnivore(d.species, d.name) || !this.inView(d)) continue;
      if ((this.huntCooldownUntil[d.name] ?? 0) > now) continue;
      if (pressingNeed(this.needs[d.name]) !== 'hunger') continue;
      const prey = nearestPrey(
        this.tileOf(d),
        herbivores.map((h) => ({ name: h.name, tile: this.tileOf(h) })),
      );
      if (prey) {
        stalkTargets[d.name] = prey;
        fleeFrom[prey] = d.name; // a prey chased by two hunters flees the nearer-scanned one; harmless either way
      }
    }
    this.lastStalk = stalkTargets;

    // The hunter's reputation (BACKLOG-442): fear turns personal. A herbivore chased by the *same* carnivore
    // WARY_CHASES+ times startles when that specific hunter comes within WARY_RANGE — even off an active hunt
    // (the hunter sated, on cooldown, just passing). It reuses the flee branch below; only prey not already
    // fleeing an active stalker are considered, and the nearest feared hunter wins.
    for (const h of herbivores) {
      if (fleeFrom[h.name]) continue;
      const mem = recall(this.memory, h.name);
      const ht = this.tileOf(h);
      let feared: string | null = null;
      let fearedDist = Infinity;
      for (const c of this.dinos) {
        if (c.name === h.name || !isCarnivore(c.species, c.name) || !this.inView(c)) continue;
        if (!fearsHunter(mem, c.name)) continue;
        const dist = this.chebyTiles(ht, this.tileOf(c));
        if (dist <= WARY_RANGE && dist < fearedDist) { fearedDist = dist; feared = c.name; }
      }
      if (feared) fleeFrom[h.name] = feared;
    }
    this.lastFlee = fleeFrom;

    for (const d of this.dinos) {
      const cur = this.tileOf(d);

      // First contact (BACKLOG-161): the armed inspector beelines for the new watcher,
      // ignoring food and friends until it gets its look (or loses interest — ttl below).
      if (this.pendingInspect?.name === d.name) {
        const step = stepToward(cur, this.playerTile(), COLS, ROWS);
        d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
        this.activityById[d.name] = 'inspecting'; // BACKLOG-295
        continue;
      }

      // Distress response (BACKLOG-194): the friend that heard the cry walks toward the
      // caller's LIVE tile (it may have bolted as it cried). Below inspection in priority.
      if (this.pendingRespond?.name === d.name) {
        const caller = this.dinoByName(this.pendingRespond.caller);
        if (caller) {
          const step = stepToward(cur, this.tileOf(caller), COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = 'responding'; // BACKLOG-295
          continue;
        }
      }

      // Visible zone crossing (BACKLOG-334): a migrating dino is on a committed journey — it walks to its
      // zone's linked edge and crosses, rather than teleporting (the old `relocate`). Above food/huddle (a
      // crossing dino ignores snacks), below inspection/response (a startle can still pre-empt). The home
      // zone flips only on arrival, so the dino stays visible in its origin zone for the whole walk.
      if (this.migrating.has(d.name)) {
        const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
        const edge = this.migrationCross[d.name]?.edge; // BACKLOG-378: the chosen crossing's edge (grove → bowl|Fernreach)
        if (atMigrationEdge(home, cur, COLS, ROWS, edge)) {
          this.crossDino(d);
        } else {
          const step = stepToward(cur, migrationStepTarget(home, cur, COLS, ROWS, edge), COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = 'wandering'; // BACKLOG-295: the journey reads in motion, not a glyph
        }
        continue;
      }

      // First steps in the grove (BACKLOG-339): a dino fresh across pauses one step to look around (the
      // 🌿 bubble crossDino floated still hangs) before it resumes wandering — arrival as a beat.
      if (this.arriving.has(d.name)) {
        this.arriving.delete(d.name);
        this.activityById[d.name] = 'wandering';
        continue;
      }

      // Hands on the derelict (BACKLOG-488): the fixer is on a committed errand — it walks to its ground's
      // ruin instead of wandering, the same way the escort walks away from a meal. Below the crossing/hunt
      // branches above (a migration still beats a day's work) and above the escort, because a mend is the
      // shorter errand and the two never contend for the same dino anyway (the escort's pair is picked
      // from dinos missing a meal, and `checkMend` skips nobody).
      if (this.mend && d.name === this.mend.fixer) {
        this.activityById[d.name] = 'gathering'; // it is working with materials — the nearest true activity
        continue; // `stepMend` owns the walk, so exactly one place moves the fixer
      }

      // Brought to the hatch (BACKLOG-381): the escort outranks the food rush — that's the whole visible
      // oddity, one dino walking *away* from the meal while everyone else converges on it — and it outranks
      // the moping branch below, so the fetched loner follows instead of withdrawing. It sits under the
      // sleeping/crossing/fleeing/stalking branches above: a hunt or a migration still beats a social errand.
      if (this.escort) {
        const partner = this.escort.phase === 'to-loner' ? this.dinoByName(this.escort.loner) : null;
        const target =
          d.name === this.escort.friend
            ? partner
              ? this.tileOf(partner)
              : this.escortTarget()
            : d.name === this.escort.loner && this.escort.phase === 'to-food'
              ? this.escortTarget()
              : null;
        if (target) {
          const step = stepToward(cur, target, COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = this.escort.phase === 'to-loner' && d.name === this.escort.friend ? 'responding' : 'feeding';
          continue;
        }
      }

      // Food on the ground pulls eager, nearby dinos toward it (BACKLOG-059) — overrides
      // wandering. A dino rushes its favorite harder: wider range, lower bar (BACKLOG-061).
      if (this.food && this.foodLanded) {
        const food = this.food;
        const dist = Math.hypot(cur.tileX - food.tileX, cur.tileY - food.tileY);
        const isFav = !!this.foodKind && this.foodKind.id === favoriteFood(d.traits, this.currentSeason()).id;
        // BACKLOG-389: before it rushes, a dino looks at who is already closer than it is. One of them it
        // has lost to here before and it stays out of the swarm — the pecking order moving feet rather
        // than only outcomes. A gate *around* `reactionToFood`, never inside it, so the escort's rush read
        // (381) and this one remain the same function.
        const nearer = this.dinos
          .filter((o) => o.name !== d.name && this.inView(o))
          .filter((o) => {
            const t = this.tileOf(o);
            return Math.hypot(t.tileX - food.tileX, t.tileY - food.tileY) < dist;
          })
          .map((o) => o.name);
        const feared = nearer.length ? givesBerthTo(recall(this.memory, d.name), nearer) : null;
        if (feared) {  // 😬 and not 👀: 👀 is already the `inspecting` activity mark (295) and the
          // first-contact beat (161), both floating marks over a dino — the same register this draws in.
          if (!this.berthedThisDrop.has(d.name)) {
            this.berthedThisDrop.add(d.name); // once per dino per drop — a hesitation, not a chant
            this.lastBerth = { name: d.name, rival: feared };
            this.flashFeed(d, '😬');
            this.logEvent(`😬 ${d.name} hung back — ${feared} got to the food first`);
          }
          // No `continue`: it isn't doing a thing, it's *not* doing one. Control falls through to the rest
          // of the step and it goes on wandering / ticcing / huddling as it would have with no drop at all.
        } else if (reactionToFood(d.traits.energy, dist, isFav) === 'rush') {
          const step = feedStep(cur, this.food, COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = 'feeding'; // BACKLOG-295
          continue;
        }
      }

      // Food web (BACKLOG-367): the hunt overrides ordinary life but yields to a sure meal (above). A
      // hungry carnivore stalks (🎯); its quarry flees (💨). Deathless — reaching the prey ends the hunt
      // empty, not fatal: the quarry escapes, the hunter rests on cooldown, and each keeps a memory.
      const preyName = stalkTargets[d.name];
      if (preyName) {
        const prey = this.dinoByName(preyName);
        if (prey) {
          const preyTile = this.tileOf(prey);
          if (huntCaught(cur, preyTile)) {
            // The catch resolves (BACKLOG-437). The quarry ALWAYS slips away (deathless — 💨 + memory in
            // both outcomes); only the hunter's luck differs. An occasional success feeds it (hunger sated,
            // the take modelled as a direct `satisfy`, not a spawned drop); most stalks still come up empty.
            this.huntCooldownUntil[d.name] = Date.now() + HUNT_COOLDOWN_MS;
            this.flashFeed(prey, '💨');
            this.memory = remember(this.memory, preyName, `you slipped ${d.name}'s hunt`);
            if (huntSucceeds(rand())) {
              this.needs = satisfy(this.needs, d.name, 'hunger'); // BACKLOG-437: hunger resolves through hunting
              this.flashFeed(d, '🍖');
              this.logEvent(`🦖 ${d.name} made its catch — a lean meal`);
              this.memory = remember(this.memory, d.name, `you brought down a meal`);
            } else {
              this.logEvent(`🦖 the hunt came up empty — ${preyName} slipped away from ${d.name}`);
              this.memory = remember(this.memory, d.name, `your hunt for ${preyName} came up empty`);
            }
          } else {
            const step = stepToward(cur, preyTile, COLS, ROWS);
            d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          }
          this.activityById[d.name] = 'stalking';
          continue;
        }
      }
      const hunterName = fleeFrom[d.name];
      if (hunterName) {
        const hunter = this.dinoByName(hunterName);
        if (hunter) {
          const step = fleeStep(cur, this.tileOf(hunter), COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = 'fleeing';
          continue;
        }
      }

      const other = this.nearestOther(d);
      // Brain-biased intent (BACKLOG-393): today's lean scales the rolls below — never the order.
      const intent = this.ensureIntent(d);
      // BACKLOG-314: a dino fetches the resource in its own home zone (each zone has its own slot now).
      const dz = zoneOf(this.dinoZones, d.name, BOWL_ID);
      const dres = this.resourceByZone[dz];
      const resDist = dres ? Math.hypot(cur.tileX - dres.tileX, cur.tileY - dres.tileY) : Infinity;
      // Decide the branch once (mutually exclusive), then both move and label off the same flags so the
      // glyph the player sees can never disagree with what the dino actually did this step (BACKLOG-295).
      // Winter opens the huddle window at dusk and lowers the bar; summer waits until late.
      const resting = atRest(hourNow, this.chronoOf(d), season); // BACKLOG-109
      const huddling = resting && this.maxBond(d.name) >= huddleThreshold(season);
      const gathering =
        !huddling &&
        !resting && // BACKLOG-109: a sleeping dino does not go fetch things
        !!dres &&
        resourceFetchable(this.resourceAgeByZone[dz] ?? 0) && // BACKLOG-297: ignore it until the grace elapses
        noticeResource(forageCuriosity(d.traits.curiosity, intent), resDist) === 'fetch'; // BACKLOG-393: a forage day looks wider
      // The loner (BACKLOG-135): a dino with no real friend withdraws to the edge instead of drifting to
      // the cluster. Below huddle/gather (it'll still come in from the cold / chase a snack), above
      // socializing (loneliness IS the not-socializing). Probabilistic so a loner still mills enough to
      // meet someone and grow out of it (no all-unbonded deadlock). Activity stays 'wandering' — the 🥀
      // mark rides loner status, not this roll, so the tell shows the whole time.
      const moping =
        !huddling && !resting && !gathering && isLoner(this.bonds, d.name, this.dinoNames(), LONER_FLOOR) && rand() < MOPE_CHANCE;
      // BACKLOG-393 intent lean, then BACKLOG-178 season lean: winter tightens the drift-to-the-cluster odds,
      // summer loosens them, so the bowl's daytime social density breathes with the year (clamped, never pegs).
      const socializing =
        !huddling && !resting && !gathering && !moping && !!other && rand() < seasonalSocializeChance(socializeChanceFor(intent), season);
      // Need pulls the body (BACKLOG-436): a pressing 🍖/💧 leans the wander toward relief (hatch/pond),
      // but only below every ritual above (they still win) and gated so it's a lean, not a compulsion.
      // No reachable target (thirst outside the grove) → seekTarget null → the dino just wanders.
      const need = pressingNeed(this.needs[d.name]);
      const seekTarget =
        !huddling && !resting && !gathering && !moping && !socializing && need ? this.needTargetFor(d, need) : null;
      const seeking = !!seekTarget && needSeeks(rand());
      // Solitary tic (BACKLOG-405): a dino truly alone — nothing pressing, nobody in its zone within range,
      // and nothing to do (not huddling/gathering) — accrues a solitary streak and, past TIC_AFTER_STEPS,
      // falls into a small ritual of its own. Only *company or a need* breaks the streak (`resetTic`); moping
      // and pointless socializing toward a far cross-zone dino don't — a lonely dino at the edge is still
      // alone, and its tic forms on the next calm step. Ranks above socializing (a real ritual beats drifting
      // toward someone a whole zone away) but below moping, so the loner's withdrawal still reads first.
      // (foodRush is already handled by an earlier `continue`, so it's false here.)
      const aloneNow =
        !huddling && !resting && !gathering && undisturbed(!!pressingNeed(this.needs[d.name]), false, this.companyNear(d));
      if (aloneNow) this.soloSteps[d.name] = (this.soloSteps[d.name] ?? 0) + 1;
      else this.breakTic(d); // BACKLOG-411: ...and if a body ended the stretch, the park says so before it ends
      // BACKLOG-410: a dino freshly moved *alone* into a friendless zone (not settled + no in-zone bonded
      // friend) falls into its tic sooner — take the min with the 393 solitary-day threshold so the two
      // shorteners compose. The onset only shortens; the ritual + its memory (plain 405 / grief 414) are unchanged.
      const strange = aloneInStrangeZone(
        isSettled(tenureOf(this.tenure, d.name)),
        closestFriend(d.name, this.bonds, this.zoneMates(d), GRIEF_BOND_FLOOR) !== null,
      );
      let ticAfter = ticAfterFor(intent, TIC_AFTER_STEPS); // BACKLOG-393: a solitary day settles into the ritual sooner
      if (strange) ticAfter = Math.min(ticAfter, TIC_AFTER_STEPS_HOMESICK);
      // BACKLOG-412: a fresh sting at the hatch shortens the onset further still — one more `Math.min`, so
      // the three shorteners compose and the lowest applicable threshold wins rather than one overriding.
      if (this.stungNow(d.name)) ticAfter = Math.min(ticAfter, TIC_AFTER_STEPS_STUNG);
      const ticcing = aloneNow && !moping && inventsTic(this.soloSteps[d.name] ?? 0, ticAfter);
      let next;
      if (huddling) {
        next = stepToward(cur, HUDDLE_TILE, COLS, ROWS); // sleep beats gathering
      } else if (gathering) {
        next = stepToward(cur, dres!, COLS, ROWS); // a curious dino fetches it (BACKLOG-146)
      } else if (moping) {
        // Lonely lean on the keeper (BACKLOG-370): a loner with real hearts withdraws toward the wall the
        // *keeper* is by rather than its own nearest one — the one relationship it has left finally has a
        // bearing on where it goes. In-view only: a dino aiming at a keeper it can't see isn't a bid.
        const target = this.leanTargetFor(d);
        next = stepToward(cur, target ?? edgeTarget(cur, COLS, ROWS), COLS, ROWS);
        if (target && next.tileX === target.tileX && next.tileY === target.tileY && !this.leanFiled.has(d.name)) {
          this.memory = remember(this.memory, d.name, leanMemory());
          this.leanFiled.add(d.name);
        }
      } else if (ticcing) {
        // BACKLOG-414: on the first ticcing step, if this dino's closest friend has crossed to another zone,
        // aim the ritual at the edge they left by (walked toward, below); else settle where the ritual began (405).
        if (this.ticAnchor[d.name] === undefined) this.ticAnchor[d.name] = this.anchorForTic(d);
        const anchor = this.ticAnchor[d.name];
        const tic = this.ticFor(d); // BACKLOG-407: a picked-up ritual if it has one, else its own
        this.ticPhase[d.name] = (this.ticPhase[d.name] ?? 0) + 1;
        const atAnchor = cur.tileX === anchor.tileX && cur.tileY === anchor.tileY;
        // Walk to the grief edge first (the ache with a direction), then perform the ritual there. For a
        // plain 405 tic the anchor IS the current tile, so atAnchor is true immediately — byte-identical.
        next = atAnchor ? ticStep(tic.kind, anchor, this.ticPhase[d.name], COLS, ROWS) : stepToward(cur, anchor, COLS, ROWS);
        this.performTic(d, tic);
      } else if (socializing) {
        next = stepToward(cur, this.tileOf(other!), COLS, ROWS); // drift to cluster + converse
      } else if (seeking) {
        next = stepToward(cur, seekTarget!, COLS, ROWS); // BACKLOG-436: lean toward the hatch (hunger) / pond (thirst)
      } else if (resting) {
        // BACKLOG-109: down, and without a bond strong enough to seek the den — so it holds its tile rather
        // than falling through to wander. This is the half that makes the night legible: without it an
        // unbonded day-dino mills about after dark and there is nothing to tell it from a night-owl.
        next = cur;
      } else {
        // BACKLOG-393: a restless day re-rolls a "stay" pick once — moves more, never forbidden to rest.
        const dir = rerollStay(intent, Math.floor(rand() * 5), () => Math.floor(rand() * 5));
        next = wanderStep(cur, dir, COLS, ROWS);
      }
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);
      this.activityById[d.name] = dinoActivity({
        gazing: false,
        inspecting: false,
        responding: false,
        feeding: false,
        huddling,
        gathering,
        socializing,
      });
    }

    // BACKLOG-456: held, no meeting fires — bonds/meetings stay exactly as the spec pinned them.
    if (!this.ambientHeld) for (let i = 0; i < this.dinos.length; i++) {
      for (let j = i + 1; j < this.dinos.length; j++) {
        const a = this.dinos[i];
        const b = this.dinos[j];
        if (Math.abs(a.x - b.x) <= TILE * 1.01 && Math.abs(a.y - b.y) <= TILE * 1.01) {
          this.meetings = recordMeet(this.meetings, a.name, b.name);
          const beforeMeet = this.bonds;
          this.bonds = strengthen(this.bonds, a.name, b.name, BOND_PER_MEET); // meeting (and huddling) deepens the bond
          // The loner finds a friend (BACKLOG-369): if this meeting lifted either dino out of loner status
          // (its first bond over the floor), mark the moment once.
          this.checkLonerLift(a.name, beforeMeet);
          this.checkLonerLift(b.name, beforeMeet);
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
    this.stepEscort(); // BACKLOG-381: the fetch's two legs resolve beside the distress walk
    this.checkMend(); // BACKLOG-488: a ground the player is watching sends somebody to its ruin...
    this.stepMend(); // ...and the patch-up resolves where that somebody is standing

    // Cold-night shiver (BACKLOG-179): note the season the night belongs to; when the night's
    // huddle window closes in the morning, resolve who slept cold.
    //
    // BACKLOG-109 left this reading the *park's* night rather than any dino's own rest window, on purpose:
    // a cold night is a fact about the weather, not about who chose to sleep through it. The owls are out
    // in the same cold, and 179's morning resolution still asks who was too loosely bonded for the den.
    const denTime = inHuddleWindow(hourNow, season);
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
    this.refreshActivityMarks();
    this.noticeTraces(); // BACKLOG-424: whoever wandered onto a fresh scuff this step reads it
    this.refreshSleepPoses();
    this.maybeMurmur();
    this.checkFeeding();
    this.checkPlot();
    this.checkPondSight(); // BACKLOG-359: a grove dino reaching the pond for the first time
    this.checkNeeds(); // BACKLOG-371: hunger/thirst build; a dino at the pond drinks
    if (!this.ambientHeld) this.maybeSpawnResource(); // BACKLOG-456: no new resource lands mid-crossing
    if (!this.ambientHeld) this.checkGather(); // BACKLOG-456: nothing re-banks into a pinned pile
    this.maybeBarter(); // BACKLOG-358: two dinos meeting at a shared zone edge trade what each other's zone needs
    this.maybeLayEggs();
    this.checkHatch();
    this.checkProviderHandover(); // BACKLOG-467: mark the say changing hands (after this step's banking settled)
    this.checkCouncilCall(); // BACKLOG-481: ...and mark the council changing the ground's call
  }

  /**
   * Edge-meet barter (BACKLOG-358) — the ambient scan. Two dinos who *linger* at their zones' shared edge
   * (each parked on the literal edge column for `EDGE_DWELL` steps, facing the other's zone) trade — the
   * converse of one-way carry (329), both piles flowing toward each other's shortfall. The dwell + exact-edge
   * gate is deliberate: an arriving crosser sits at the entry tile for a frame, and must NOT be mistaken for a
   * meet (else it would immediately barter back the resource it just carried). Near-inert unless two dinos
   * actually settle at a boundary with tradeable stock. Dwell is tracked every step; the cooldown only paces firing.
   */
  private maybeBarter(): void {
    const facing: Record<string, string | null> = {};
    for (const d of this.dinos) {
      const to = this.migrating.has(d.name)
        ? null
        : nearLinkEdge(zoneOf(this.dinoZones, d.name, BOWL_ID), this.tileOf(d), COLS, ROWS, 0); // band 0: the edge column/row itself
      facing[d.name] = to;
      this.edgeDwell[d.name] = to === null ? 0 : (this.edgeDwell[d.name] ?? 0) + 1;
    }
    if (!cooldownReady(Date.now(), this.lastBarterMs, BARTER_COOLDOWN_MS)) return;
    const parked = this.dinos.filter((d) => facing[d.name] && (this.edgeDwell[d.name] ?? 0) >= EDGE_DWELL);
    for (const a of parked) {
      const za = zoneOf(this.dinoZones, a.name, BOWL_ID);
      const b = parked.find(
        (y) => y !== a && zoneOf(this.dinoZones, y.name, BOWL_ID) === facing[a.name] && facing[y.name] === za,
      );
      if (!b) continue;
      if (this.doBarter(a, za, b, zoneOf(this.dinoZones, b.name, BOWL_ID))) {
        this.lastBarterMs = Date.now();
        return; // one barter per scan
      }
    }
  }

  /**
   * Apply an edge-meet barter (BACKLOG-358): each zone hands the other the kind it's short of for its own
   * structure (`barterSwap` = `directedCarry` both ways). Conserved + cap-safe via the same lossless
   * `takeResource`→`bankResource` path carry uses; no bond change (the economic beat only — the social
   * ripple is the Lore-smith's). Returns whether anything actually traded (so the scan doesn't burn its
   * cooldown on an empty meet).
   */
  private doBarter(a: Dino, zoneA: string, b: Dino, zoneB: string): boolean {
    const swap = barterSwap(this.pileFor(zoneA), this.pileFor(zoneB), structureRecipe(zoneA), structureRecipe(zoneB));
    if (!swap.aGives && !swap.bGives) return false; // nothing tradeable — no phantom beat
    if (swap.aGives) {
      this.setPile(zoneA, takeResource(this.pileFor(zoneA), swap.aGives));
      this.setPile(zoneB, bankResource(this.pileFor(zoneB), swap.aGives));
    }
    if (swap.bGives) {
      this.setPile(zoneB, takeResource(this.pileFor(zoneB), swap.bGives));
      this.setPile(zoneA, bankResource(this.pileFor(zoneA), swap.bGives));
    }
    for (const d of [a, b]) if (this.inView(d)) this.flashFeed(d, '🔄');
    this.memory = remember(this.memory, a.name, `bartered with ${b.name} at ${theZone(zoneById(zoneB).name)} edge`);
    this.memory = remember(this.memory, b.name, `bartered with ${a.name} at ${theZone(zoneById(zoneA).name)} edge`);
    this.logEvent(
      // BACKLOG-499: two grounds, one article — `bareZone` for the far side of the en-dash rather than a
      // second `the`, which is the shape that put a doubled article in this line in the first place.
      `🔄 ${a.name} and ${b.name} bartered at ${theZone(zoneById(zoneA).name)}–${bareZone(zoneById(zoneB).name)} edge`,
    );
    this.refreshPlaque();
    void this.saveGame();
    return true;
  }

  /**
   * Sleep murmurs (BACKLOG-181): on a sparse roll, a sleeping, in-view dino floats a 💭 line drawn from its
   * strongest memory of the day, so the den has an audible-on-screen inner life. Deterministic (no model);
   * out-of-view sleepers (the other zone) stay silent. The LLM-coloured murmur is a 181 follow-up.
   * BACKLOG-307: with no memory yet it dreams its signature trait instead of everybody's `…zzz…`.
   */
  private maybeMurmur(): void {
    if (rand() >= MURMUR_CHANCE) return;
    const d = this.pickMurmurer();
    if (d) this.showBubble(d, murmurLine(pickMurmurMemory(recall(this.memory, d.name)), d.traits));
  }

  /**
   * Asleep, either way the park has of being asleep (BACKLOG-307). `isHuddling` is a *den* state — the
   * season's huddle window and standing near the den — and BACKLOG-109 added `isResting`, which is
   * per-dino and chronotype-shaped. They do not overlap for an owl: Rex is down at 08:00 out in the open,
   * nowhere near the den and hours outside the spring window, which is why the one dino this park ships
   * asleep on frame one could not murmur at all until this fire.
   */
  private asleep(d: Dino): boolean {
    return this.isResting(d) || this.isHuddling(d);
  }

  /** A random sleeping, in-view dino (BACKLOG-181/307), or null when nobody is down / in view. */
  private pickMurmurer(): Dino | undefined {
    const sleepers = this.dinos.filter((d) => this.asleep(d) && this.inView(d));
    return sleepers[Math.floor(rand() * sleepers.length)];
  }

  /** Show each awake dino's current-activity glyph (BACKLOG-295). The 💤 sleep mark owns the sleeping state. */
  private refreshActivityMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.activityMarks[i];
      if (!mark) return;
      const show = !this.isHuddling(d) && this.inView(d);
      mark.setVisible(show).setPosition(d.x, d.y - TILE);
      if (show) {
        const act = this.activityById[d.name] ?? 'wandering';
        // Idle fidgets (BACKLOG-298): a goalless wanderer shows its trait-derived signature quirk
        // instead of the generic 🚶, so five idle dinos read as five individuals. Other 295 states
        // keep their glyph; activityById is untouched (the 295 __activity hook still reads 'wandering').
        // BACKLOG-310: a jealous sulk (pendingRepair) shades that idle glyph to 😒 — mood over motion.
        // Cold keeps its signature glyph (the floating 🥶 mark already signals the cold funk).
        const mood: Mood | undefined = this.pendingRepair === d.name ? 'sulk' : undefined;
        // BACKLOG-325: a just-recovered dino (no current mood) idles with the brightened flourish glyph
        // for a short window before settling back to its plain signature quirk.
        const lifted = !mood && Date.now() < (this.liftedUntil[d.name] ?? 0);
        const wanderGlyph = lifted ? reliefFlourish(d.traits) : moodFidget(d.traits, mood).glyph;
        mark.setText(act === 'wandering' ? wanderGlyph : ACTIVITY_GLYPH[act]);
      }
    });
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
      // Snapshot before this meeting plants anything: the sympathy visit (BACKLOG-217) keys off
      // word carried in from a PRIOR meeting, so this meeting's fresh cold word can't self-trigger.
      const snapshot = this.memory;
      const reply = await this.npcBrain.respond(
        {
          name: a.name,
          species: a.species,
          personality: this.ensurePersona(a).text, // BACKLOG-103: the stored self, not the roster one-liner
          traits: a.traits,
          timeOfDay: dayPhase(now.hour),
        },
        { kind: 'npc_meet', detail: `${b.name} the ${b.species} wanders up` },
      );
      this.lastConversation = { speaker: a.name, text: reply.text, source: reply.source };
      this.memory = remember(this.memory, a.name, `you ran into ${b.name} the ${b.species}`);
      // Gossip: the speaker passes news to the listener (BACKLOG-019). A dino that just dropped a
      // false alarm leads with the all-clear (BACKLOG-235), else a dino the keeper warmed leads with
      // the word of the warmth (BACKLOG-223), else a cold-slept dino leads with the word of the cold
      // (BACKLOG-185), else the generic most-recent retelling. Relief is checked first so the bowl
      // un-tells a stale worry the way it once told it; warm before cold because a warm memory also
      // matches the cold token. Each `?:` only fires when an earlier rung didn't, so the log else-if
      // order tracks the cascade order.
      const relief = spreadReliefWord(this.memory, a.name, b.name);
      const warm = relief.rumor ? relief : spreadWarmWord(this.memory, a.name, b.name);
      const cold = warm.rumor ? warm : spreadColdWord(this.memory, a.name, b.name);
      // Tell of the grove (BACKLOG-342): a just-returned dino leads with grove news — below cold (a
      // worry outranks scenery), above the generic retelling (news of a place beats an ordinary rumor).
      const grove = cold.rumor ? cold : spreadGroveWord(this.memory, a.name, b.name);
      // Word of the provider (BACKLOG-453): who keeps this ground fed — under grove news (a fresh sighting
      // beats a standing), over the generic retelling (the ground you live on beats an ordinary rumor).
      // The provider read is skipped entirely when an earlier rung already won, so a meet costs no extra
      // role derivation.
      const zone = zoneOf(this.dinoZones, a.name, BOWL_ID);
      const pword = grove.rumor
        ? grove
        : spreadProviderWord(this.memory, a.name, b.name, this.providerFor(zone), zoneById(zone).name);
      // Word of how the ground decides (BACKLOG-470): *how* this ground spends its store, under the
      // provider word (a name beats a stance — who keeps you fed is the sharper news) and over word of
      // another ground. Silent on a ground with no provider-set policy.
      const policy = pword.rumor
        ? pword
        : spreadPolicyWord(this.memory, a.name, b.name, this.spendPriorityFor(zone), zoneById(zone).name);
      // Word of plenty (BACKLOG-458): a dino carrying first-hand word of a thriving zone lets it slip — below
      // policy-word (how THIS ground spends beats news of another), above generic gossip (a thriving
      // ground beats an ordinary rumor). The listener is then primed to migrate toward that zone.
      const plenty = policy.rumor ? policy : spreadPlentyWord(this.memory, a.name, b.name);
      const gossip = plenty.rumor ? plenty : spreadGossip(this.memory, a.name, b.name);
      this.memory = gossip.store;
      if (relief.rumor) this.logEvent(`😌 ${b.name} heard the all-clear from ${a.name}`);
      else if (warm.rumor) this.logEvent(`😊 ${b.name} heard the keeper warmed ${a.name}`);
      else if (cold.rumor) this.logEvent(`🥶 ${b.name} heard about ${a.name}'s cold night`);
      else if (grove.rumor) this.logEvent(`🌿 ${b.name} heard about the grove from ${a.name}`);
      else if (pword.rumor) this.logEvent(`🧺 ${b.name} heard from ${a.name} who keeps ${zoneById(zone).name} fed`);
      else if (policy.rumor) this.logEvent(`🏛️ ${b.name} heard from ${a.name} how ${zoneById(zone).name} spends`);
      else if (plenty.rumor) this.logEvent(`🌾 ${b.name} heard plenty is thriving from ${a.name}`);
      else if (gossip.rumor) this.logEvent(`🗣️ ${b.name} heard news about ${a.name}`);
      this.chirpFor(a); // the speaker calls in its own voice (BACKLOG-191)
      this.showBubble(a, `${replyPrefix(reply.source)}${reply.text}`);
      // The bowl self-corrects (BACKLOG-234): if a carrier meets the dino it heard slept cold and
      // finds it recovered, it drops the now-false worry with relief — and the stale pity visit is
      // suppressed. Higher precedence than the sympathy visit, same pre-meeting snapshot.
      const correction = selfCorrect(snapshot, a.name, b.name);
      if (correction) {
        this.memory = forget(this.memory, correction.corrector, correction.dropped);
        this.memory = remember(this.memory, correction.corrector, correction.memory);
        const cDino = this.dinos.find((d) => d.name === correction.corrector);
        if (cDino) this.showBubble(cDino, reliefLine(correction.corrector, correction.sufferer));
        this.logEvent(`😌 ${correction.corrector} sees ${correction.sufferer} came through it fine`);
      } else if (clearedName(snapshot, a.name, b.name)) {
        // Grateful to the one who cleared your name (BACKLOG-243): a recovered sufferer meets the
        // dino carrying its first-hand all-clear and warms to it — the giving side of relief, the
        // symmetric twin of the sympathy visit below. Outranks the visit; reads the pre-meeting
        // snapshot so a relief filed THIS meeting can't grant gratitude until a later one.
        const thanks = clearedName(snapshot, a.name, b.name)!;
        this.memory = remember(this.memory, thanks.sufferer, thanks.memory);
        this.bonds = strengthen(this.bonds, thanks.sufferer, thanks.clearer, GRATEFUL_BOND);
        const sDino = this.dinos.find((d) => d.name === thanks.sufferer);
        if (sDino) this.showBubble(sDino, gratefulLine(thanks.sufferer, thanks.clearer));
        this.logEvent(`💛 ${thanks.sufferer} thanks ${thanks.clearer} for clearing their name`);
      } else {
        // Secondhand sympathy (BACKLOG-217): if either dino already carried the other's cold word,
        // the carrier crosses over to keep it company — a sub-floor bond bump + a memory it keeps.
        const visit = sympathyVisit(snapshot, a.name, b.name);
        if (visit) {
          this.memory = remember(this.memory, visit.sufferer, visit.memory);
          this.bonds = strengthen(this.bonds, visit.visitor, visit.sufferer, SYMPATHY_BOND);
          const vDino = this.dinos.find((d) => d.name === visit.visitor);
          const sDino = this.dinos.find((d) => d.name === visit.sufferer);
          if (vDino && sDino) {
            const step = stepToward(this.tileOf(vDino), this.tileOf(sDino), COLS, ROWS);
            vDino.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
            this.showBubble(vDino, sympathyLine(visit.visitor, visit.sufferer));
          }
          this.logEvent(`🫂 ${visit.visitor} came to find ${visit.sufferer} after hearing`);
        }
      }
      // Pond-swappers (BACKLOG-346): if both dinos have been to the grove, they trade pond notes — a
      // small shared-place bond + a memory each. Independent of the cold/grove cascade above, so it can
      // fire alongside any of it; the grove's version of stargazing companions (288).
      this.pondSwapBeat(a.name, b.name);
      // The one who knew first (BACKLOG-364): if the speaker has stood on a ground the listener never has,
      // it shows them the way and keeps the telling. Deliberately beside the cascade, not a ninth rung in
      // it — a rung would make one of the eight shipped beats silently rarer, and a worry and a postcard
      // are different registers anyway.
      this.teachBeat(a.name, b.name);
    } finally {
      this.convoInFlight = false;
    }
  }

  /** Pond-swap (BACKLOG-346): two grove-visited dinos trade pond notes — a memory each + a small bond. */
  private pondSwapBeat(a: string, b: string): boolean {
    if (!pondSwap(this.groveVisited, a, b)) return false;
    this.memory = remember(this.memory, a, pondSwapMemory(b));
    this.memory = remember(this.memory, b, pondSwapMemory(a));
    this.bonds = strengthen(this.bonds, a, b, POND_BOND);
    this.logEvent(`🌿 ${a} and ${b} compared notes on the grove`);
    return true;
  }

  /**
   * The one who knew first (BACKLOG-364): the speaker shows the listener a ground it has never seen — a
   * pride memory naming both, a 1-hop word for the listener, a small bond, a bubble and a ticker line.
   * Deduped on the pride memory itself, so a pair that keeps meeting doesn't re-tell the same place, but a
   * dino that later reaches a *further* ground has something new to show the same friend.
   */
  private teachBeat(a: string, b: string): boolean {
    const zone = teachableZone(this.seenZones, a, b, zoneChain());
    if (!zone) return false;
    const zoneName = zoneById(zone).name;
    const mem = taughtMemory(b, zoneName);
    if (recall(this.memory, a).includes(mem)) return false;
    this.memory = remember(this.memory, a, mem);
    this.memory = remember(this.memory, b, taughtWordLine(a, zoneName));
    this.bonds = strengthen(this.bonds, a, b, TAUGHT_BOND);
    const speaker = this.dinoByName(a);
    if (speaker) this.showBubble(speaker, taughtLine(zoneName));
    this.logEvent(taughtEvent(a, b, zoneName));
    return true;
  }

  /** Fold the homecoming's memories into the store: the homecomer's, plus a near-tied runner-up's sulk (BACKLOG-120). */
  private applyHomecomingMemory(hc: Homecoming): void {
    this.memory = remember(this.memory, hc.name, hc.memory);
    if (hc.jealous) this.memory = remember(this.memory, hc.jealous.name, hc.jealous.memory);
  }

  /** Float the welcome-back line over the closest dino; if a near-tied rival is jealous, float its sulk too (BACKLOG-112/120). */
  /** A dino's signature idle quirk label (BACKLOG-306) — the same `fidget()` read the book/live glyph use. */
  private dinoQuirkLabel(name: string): string | undefined {
    const d = this.dinos.find((x) => x.name === name);
    return d ? fidget(d.traits).label : undefined;
  }

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
    if (!this.inView(d)) return; // a dino in another zone speaks off-screen, not into this one
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
    (window as any).__helpText = () => this.helpPanel.text; // BACKLOG-477: the panel's rendered text (controls + legend)
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
          gratitude: whoClearedMyName(this.memory, d.name) ?? undefined,
          keeperName: keeperAddress(keeperById(this.keeperId), heartsFromPoints(this.friendship[d.name] ?? 0)),
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
      this.applyClockRate(); // BACKLOG-493: a hidden tab's world runs at real time, not at watching speed
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

    // BACKLOG-143: walking off a linked edge crosses to the adjacent zone instead of clamping there.
    if (this.tryCrossZone()) {
      this.applyIdle();
      return;
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, TILE / 2, TILE * COLS - TILE / 2);
    this.player.y = Phaser.Math.Clamp(this.player.y, TILE / 2, TILE * ROWS - TILE / 2);

    this.applyIdle();
  }

  /**
   * If the keeper has stepped off a linked edge, cross into the neighbour zone (repositioned to the
   * far side) and return true; otherwise false so the caller clamps normally. (BACKLOG-143)
   */
  /**
   * A dino's daily plan (BACKLOG-012) — the day's shape, one lean per day-phase. Recomputed once
   * per in-game day from name+day+traits (deterministic floor, never persisted); cached so the hot
   * step loop pays nothing after the first read of the day.
   */
  private ensurePlan(d: Dino, day: number): DayPlan {
    const cached = this.plans[d.name];
    if (cached && cached.day === day) return cached.plan;
    const plan = proceduralPlan(d.name, day, d.traits);
    this.plans[d.name] = { day, plan };
    return plan;
  }

  /**
   * The active intent for a dino (BACKLOG-393 + BACKLOG-012) — the current day-phase's lean pulled
   * from today's plan (the deterministic floor: full sim with zero model). Cached until the phase or
   * day turns, then re-derived so behaviour shifts across the day. Where a brain can author (`intend`
   * present, ambient inference allowed by the governor), fire-and-forget an upgrade — exactly the
   * `converse` shape — coloring the active note via `fromDraft` only if the phase hasn't turned.
   * The model leans on the day; it never decides a step.
   */
  private ensureIntent(d: Dino): DinoIntent {
    const now = getWorldClock().now();
    const day = now.day;
    const phase = dayPhase(now.hour);
    const cached = this.intents[d.name];
    if (cached && cached.until >= day && this.intentPhase[d.name] === phase) return cached;
    const fresh = activeIntent(this.ensurePlan(d, day), phase, day);
    this.intents[d.name] = fresh;
    this.intentPhase[d.name] = phase;
    if (this.npcBrain.intend && allowAmbient({ hidden: this.tabHidden, battery: this.batteryLevel })) {
      void this.npcBrain
        .intend({ name: d.name, species: d.species, personality: this.ensurePersona(d).text, traits: d.traits })
        .then((draft) => {
          // Color the active note only if the same phase-intent is still current (day+phase unturned).
          if (this.intents[d.name]?.until === day && this.intentPhase[d.name] === phase)
            this.intents[d.name] = fromDraft(draft, fresh);
        })
        .catch(() => {});
    }
    return fresh;
  }

  /**
   * A dino's persona (BACKLOG-103) — the cached self if it has one (generate-once: an 'llm'
   * persona is settled forever), else the deterministic procedural persona cached immediately.
   * Where a ready brain can author (`author` present, ambient inference allowed), fire-and-forget
   * an upgrade — `upgradePersona` keeps it one-shot and never regresses an authored self. The
   * hourly save persists whatever the cache holds; a phone loading a save pays nothing.
   */
  private ensurePersona(d: Dino): Persona {
    const cached = this.personas[d.name];
    if (cached) return cached;
    const fresh = proceduralPersona(d.name, d.species, d.personality, d.traits);
    this.personas[d.name] = fresh;
    if (this.npcBrain.author && allowAmbient({ hidden: this.tabHidden, battery: this.batteryLevel })) {
      void this.npcBrain
        .author({ name: d.name, species: d.species, personality: d.personality, traits: d.traits })
        .then((draft) => {
          this.personas[d.name] = upgradePersona(this.personas[d.name] ?? fresh, draft);
        })
        .catch(() => {});
    }
    return fresh;
  }

  private tryCrossZone(): boolean {
    const edge = crossing(this.player.x, this.player.y, COLS, ROWS, TILE);
    const link = edge ? linkedZone(this.zoneId, edge, this.player.x, this.player.y, COLS, ROWS, TILE) : null;
    if (!link) return false;
    this.zoneId = link.zoneId;
    this.player.setPosition(link.entry.x, link.entry.y);
    this.refreshPlaque();
    this.applyZoneVisibility();
    this.applyObjectVisibility();
    this.drawFloor();
    return true;
  }

  /** True when a dino lives in the keeper's current zone (and so should be drawn). */
  private inView(d: Dino): boolean {
    return zoneOf(this.dinoZones, d.name, BOWL_ID) === this.zoneId;
  }

  /** Show only the current zone's dinos; their marks/tags AND-gate on inView each tick. */
  private applyZoneVisibility(): void {
    for (const d of this.dinos) {
      const v = this.inView(d);
      d.sprite.setVisible(v);
      d.label.setVisible(v);
    }
  }

  /**
   * BACKLOG-308: world objects (resource, cairns, plot) draw only in their home zone, so the grove's
   * own floor isn't overlaid with bowl-built props seen through the zone switch. Interaction is gated
   * at the source (checkGather on `resource.zone`, handlePlot on the active zone); this is the render half.
   */
  private applyObjectVisibility(): void {
    // BACKLOG-314: each zone's resource sprite shows only while the keeper stands in that zone.
    for (const z of Object.keys(this.resourceSpriteByZone)) this.resourceSpriteByZone[z].setVisible(z === this.zoneId);
    // BACKLOG-480: the same pass sets each landmark's alpha, so disrepair is visible where it happened
    // rather than only on the ticker. One helper over all four parallel sprite arrays.
    // BACKLOG-494: a landmark whose ruin has been drawn swaps to it and keeps full opacity — disrepair
    // reads as a *fallen thing* rather than the same thing in fog. One whose ruin is undrawn keeps 480's
    // alpha fade, the graceful fallback, exactly as an undrawn species keeps its rectangle.
    const showLandmarks = (sprites: Phaser.GameObjects.GameObject[], recs: Landmark[], prop: string) =>
      sprites.forEach((sp, i) => {
        const rec = recs[i];
        const s = sp as Phaser.GameObjects.Text;
        s.setVisible(rec?.zone === this.zoneId);
        const drawnRuin = !!rec?.derelict && hasPropArt(`${prop}_derelict`);
        const img = sp as Phaser.GameObjects.Image;
        if (typeof img.setTexture === 'function' && hasPropArt(prop)) {
          const key = drawnRuin ? bakeRuinArt(this, prop) : bakePropArt(this, prop);
          if (key) img.setTexture(key);
        }
        s.setAlpha(rec?.derelict && !drawnRuin ? DERELICT_ALPHA : 1);
      });
    showLandmarks(this.cairnSprites, this.cairns, 'cairn');
    showLandmarks(this.shelterSprites, this.shelters, 'shelter'); // BACKLOG-315
    showLandmarks(this.thatchSprites, this.thatches, 'thatch'); // BACKLOG-417
    showLandmarks(this.beaconSprites, this.beacons, 'beacon'); // BACKLOG-503
    showLandmarks(this.granarySprites, this.granaries, 'granary'); // BACKLOG-454
    // BACKLOG-308/349: each zone's plot draws only while the keeper stands in that zone.
    for (const z of Object.keys(this.plotSpriteByZone)) this.plotSpriteByZone[z]?.setVisible(z === this.zoneId);
    // BACKLOG-504: and each ground's banked heap, on the same rule.
    for (const z of Object.keys(this.bankSprites)) this.syncBank(z);
    // BACKLOG-507: and the worn ground under this ground's haunts. One call site rather than four —
    // a zone cross, the founding pass and the save restore all already come through here.
    this.syncWear();
    // BACKLOG-501: and the founder's mark on this ground — the host the stashed 513/514 rigs were waiting for.
    this.syncStakes();
  }

  /**
   * Dino migration (BACKLOG-274) — the grove fills by dinos wandering into it, not at spawn (spawn stays
   * byte-identical, so every bowl-targeting spec is intact). A sparse real-time roll, capped ≤1/in-game-day.
   */
  private setupMigration(): void {
    this.time.addEvent({ delay: MIGRATE_ROLL_INTERVAL_MS, loop: true, callback: () => { if (!this.ambientPaused) this.maybeMigrate(); } }); // BACKLOG-431
    // dev-only Playwright hook — migrate a named dino to a zone INSTANTLY (teleport); returns its new zone.
    // Kept instant (BACKLOG-274 semantics) so the cycle-068/069 migration specs + the save-restore path are
    // byte-identical; the *ambient* roll is what became a visible walk (BACKLOG-334).
    (window as any).__migrate = (name: string, zoneId: string) => {
      const d = this.dinoByName(name);
      if (d) this.relocate(d, zoneId);
      return zoneOf(this.dinoZones, name, BOWL_ID);
    };
    // BACKLOG-334: drive + observe the visible crossing from Playwright.
    (window as any).__startMigration = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.startMigration(d);
      return zoneOf(this.dinoZones, name, BOWL_ID);
    };
    // BACKLOG-378: start a visible crossing toward a *chosen* neighbour (deterministic), so a test can prove a
    // grove dino migrates east into the Fernreach (not only west to the bowl) — migration generalized past two.
    (window as any).__startMigrationTo = (name: string, dest: string) => {
      const d = this.dinoByName(name);
      if (d) this.startMigration(d, dest);
      return zoneOf(this.dinoZones, name, BOWL_ID);
    };
    // BACKLOG-345: run the migrant *pick* deterministically (bypassing cooldown/chance) — returns the
    // chosen name, so a test can prove grove news pulls a curious newcomer over a coin-flip.
    (window as any).__maybeMigrate = () => {
      const d = this.pickMigrant();
      if (d) this.scarcityMigrate(d); // BACKLOG-450: drive the exact production destination bias
      return d?.name ?? null;
    };
    (window as any).__migrating = () => [...this.migrating];
    // BACKLOG-360: drive the companion pull for a dino already mid-crossing; returns the companion or null.
    (window as any).__together = (name: string) => {
      const d = this.dinoByName(name);
      return d ? this.tryTogether(d) : null;
    };
    // BACKLOG-450: a zone's scarcity appeal (prosperity + banked food), and where its residents would head.
    (window as any).__zoneAppeal = (zone: string) => this.zoneAppeal(zone);
    // BACKLOG-476: what each ground can hold, and which are currently over it.
    (window as any).__zoneCapacity = () => ({ ...this.zoneCaps });
    (window as any).__crowded = () => {
      const out: Record<string, boolean> = {};
      for (const z of zoneChain()) out[z] = this.isZoneCrowded(z);
      return out;
    };
    (window as any).__scarcityDest = (name: string) => {
      const d = this.dinoByName(name);
      return d ? this.scarcityDestOf(zoneOf(this.dinoZones, d.name, BOWL_ID)) : null;
    };
    // BACKLOG-340: run the homesick decision + crossing for a named dino deterministically; returns the
    // destination zone it set off toward (or null when it isn't homesick). Drives the exact production path.
    (window as any).__homesickMigrate = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d && this.tryHomesick(d) ? this.migrationCross[name]?.dest ?? null : null;
    };
    // BACKLOG-333: the real-time cadences (regression guard — a return to clock-gating fails these).
    (window as any).__wanderStepMs = () => WANDER_STEP_MS;
    (window as any).__migrateCooldownMs = () => MIGRATE_COOLDOWN_MS;
    // BACKLOG-341: drive + observe home-zone settling from Playwright (tenure accrues one roll per tick).
    (window as any).__settleTick = () => this.bumpTenures();
    (window as any).__tenure = (name: string) => tenureOf(this.tenure, name);
    (window as any).__settled = (name: string) => isSettled(tenureOf(this.tenure, name));
    // BACKLOG-452: observe/seed where a dino belongs, so a homecoming is drivable without 4 settle rolls.
    (window as any).__roots = () => ({ ...this.roots });
    // BACKLOG-347: the ground a dino is still full of (null once the window closes).
    (window as any).__struck = (name: string) => {
      const d = this.dinoByName(name);
      return d ? this.struckOf(d) : null;
    };
    (window as any).__setRoot = (name: string, zone: string) => {
      this.roots = rememberRoot(this.roots, name, zone);
      return this.roots[name];
    };
  }

  /** Accrue home-zone tenure (BACKLOG-341) for every settled-in-place dino, on the migration cadence. */
  private bumpTenures(): void {
    for (const d of this.dinos) {
      if (this.migrating.has(d.name)) continue;
      // BACKLOG-347: read *before* the bump, so the first glance back lands on the roll after arrival and the
      // window is the two rolls the knob names. A homecoming (452) restored tenure to SETTLE_ROLLS, so a dino
      // walking back into its own ground reads false here — the 🏡 beat owns that moment alone.
      this.floatKeepsake(d);
      this.tenure = bumpTenure(this.tenure, d.name);
      // BACKLOG-452: settling somewhere makes it this dino's root — the ground a later crossing can come
      // *home* to. Re-recording the same zone is a no-op, so this stays allocation-light on the cadence.
      if (isSettled(tenureOf(this.tenure, d.name))) {
        this.roots = rememberRoot(this.roots, d.name, zoneOf(this.dinoZones, d.name, BOWL_ID));
      }
    }
  }

  /**
   * The ground a dino is still full of (BACKLOG-347), or null once the window has closed / it never crossed.
   * The book, the bubble and the dev hook all read this one place.
   */
  private struckOf(d: Dino): { from: string; glyph: string } | null {
    const from = this.cameFrom[d.name];
    if (!isStruck(tenureOf(this.tenure, d.name), from)) return null;
    return { from, glyph: keepsakeGlyph(from) };
  }

  /** Float the keepsake glance of the ground a dino left (BACKLOG-347), logging the ticker line once per
   *  crossing rather than once per float. */
  private floatKeepsake(d: Dino): void {
    const struck = this.struckOf(d);
    if (!struck) return;
    this.flashFeed(d, struckLine(struck.glyph));
    if (this.struckTold.has(d.name)) return;
    this.struckTold.add(d.name);
    this.logEvent(struckEvent(d.name, zoneById(struck.from).name, struck.glyph));
  }

  /** A dino's homesickness (BACKLOG-340): the neighbour zone + friend to head toward, or null. */
  private homesickOf(d: Dino): { dest: string; friend: string } | null {
    return homesickDest(
      d.name,
      zoneOf(this.dinoZones, d.name, BOWL_ID),
      this.bonds,
      this.dinoNames(),
      (n) => zoneOf(this.dinoZones, n, BOWL_ID),
      tenureOf(this.tenure, d.name),
    );
  }

  /**
   * BACKLOG-340: if a dino is homesick, start its crossing back toward its closest friend, file the one-time
   * memory, and float the beat. Returns true when it fired (so the caller skips the ambient path). Shared by
   * `maybeMigrate` and the `__homesickMigrate` dev hook so production and test drive the exact same path.
   */
  private tryHomesick(d: Dino): boolean {
    const h = this.homesickOf(d);
    if (!h) return false;
    this.startMigration(d, h.dest);
    this.memory = remember(this.memory, d.name, homesickMemory(h.friend));
    this.logEvent(`🧭 ${d.name} misses ${h.friend} — drifts back toward ${zoneById(h.dest).name}`);
    this.tryTogether(d); // BACKLOG-360: a pond-swap companion falls in beside it if this is the grove
    return true;
  }

  /**
   * Two who go together (BACKLOG-360) — the companion pull. A crossing already bound for the ground this
   * dino once traded pond stories about takes its pond-swap partner along, if that partner lives on the
   * same ground and isn't already crossing. Rides the destination `startMigration` fixed a moment ago; it
   * never chooses one, so no destination read and no migrant tier is touched. Returns the companion, or null.
   */
  private tryTogether(leader: Dino): string | null {
    const cross = this.migrationCross[leader.name];
    if (!cross) return null;
    const home = zoneOf(this.dinoZones, leader.name, BOWL_ID);
    const candidates = this.dinos
      .filter((x) => x.name !== leader.name && !this.migrating.has(x.name) && zoneOf(this.dinoZones, x.name, BOWL_ID) === home)
      .map((x) => x.name);
    // The grove is the one place 346 records a shared-place bond for; the module takes it as a parameter
    // so a second such bond is a change here and not a rewrite there.
    const mate = travelsTogether(cross.dest, GROVE_ID, recall(this.memory, leader.name), candidates);
    if (!mate) return null;
    const companion = this.dinoByName(mate);
    if (!companion) return null;
    this.startMigration(companion, cross.dest);
    const zoneName = zoneById(cross.dest).name;
    this.memory = remember(this.memory, leader.name, togetherMemory(mate, zoneName));
    this.memory = remember(this.memory, mate, togetherMemory(leader.name, zoneName));
    this.bonds = strengthen(this.bonds, leader.name, mate, TOGETHER_BOND);
    this.showBubble(companion, togetherLine());
    this.logEvent(togetherEvent(leader.name, mate, zoneName));
    return mate;
  }

  private maybeMigrate(): void {
    this.bumpTenures(); // BACKLOG-341: home-zone tenure accrues on the migrate cadence, migration or not
    this.bumpPeaks(); // BACKLOG-460: each zone's population high-water mark tracks before anyone leaves this roll
    this.seedPlentyWord(); // BACKLOG-458: a thriving zone's residents get first-hand word of plenty to spread
    this.seedYearning(); // BACKLOG-362: a dino long away from a ground it has stood on starts to miss it
    this.checkLastOne(); // BACKLOG-464: a zone hollowed to its last resident sounds the wistful "gone quiet" beat
    this.checkHollowed(); // BACKLOG-512: ...and a zone that loses that last resident says whose ground it was
    // BACKLOG-333: pace by a real-time cooldown, not the in-game day (which is 24 real hours at 1×).
    if (!cooldownReady(Date.now(), this.lastMigrationMs, MIGRATE_COOLDOWN_MS)) return;
    if (rand() >= MIGRATE_CHANCE) return;
    const d = this.pickMigrant();
    if (!d) return;
    // BACKLOG-340: homesickness overrules scenery — a dino aching for a friend a zone away crosses toward it,
    // ignoring the 341 settle-resist. Checked before the resist gate so a *settled* lonely dino still leaves.
    if (this.tryHomesick(d)) {
      this.lastMigrationMs = Date.now();
      return;
    }
    // BACKLOG-460: the floor — the ambient wander never drains a zone below its last resident (thin, never
    // vanish; deathless). Consume the roll so the cooldown still paces.
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    if ((this.zoneHeads()[home] ?? 0) <= ZONE_FLOOR) {
      this.lastMigrationMs = Date.now();
      return;
    }
    // BACKLOG-341 + 460: a dino settled into its home zone resists the ambient wander — but a *declining*
    // zone holds its residents more weakly (a lower damp), so a hollowing zone's exodus gains momentum.
    // BACKLOG-476: and a *crowded* ground holds them weakly too. A ground under both stresses takes the
    // weaker of the two holds rather than compounding them — one reason to leave is enough.
    const damp = Math.min(
      this.isZoneDeclining(home) ? DECLINING_MIGRATE_DAMP : SETTLED_MIGRATE_DAMP,
      this.isZoneCrowded(home) ? CROWDED_MIGRATE_DAMP : SETTLED_MIGRATE_DAMP,
    );
    if (isSettled(tenureOf(this.tenure, d.name)) && resistsMigration(true, rand, damp)) return;
    // BACKLOG-450: mouths move toward plenty — head for the richest neighbour, not a coin flip.
    this.scarcityMigrate(d);
    this.lastMigrationMs = Date.now();
  }

  /** Live per-zone head counts (BACKLOG-460 helper) — one shared read of `zonePopulations` for the cadence. */
  private zoneHeads(): Record<string, number> {
    return zonePopulations(this.dinoZones, this.dinos.map((d) => d.name), BOWL_ID);
  }

  /** Raise every zone's high-water mark to its current head count (BACKLOG-460). Runs on the migrate cadence
   *  before any migration, so a zone's peak registers before residents start leaving it. */
  private bumpPeaks(): void {
    const pop = this.zoneHeads();
    for (const z of zoneChain()) this.zonePeaks = bumpPeak(this.zonePeaks, z, pop[z] ?? 0);
  }

  /** Is a zone declining (BACKLOG-460) — below its peak while still holding the floor? */
  private isZoneDeclining(zone: string): boolean {
    return isDeclining(this.zonePeaks[zone] ?? 0, this.zoneHeads()[zone] ?? 0);
  }

  /**
   * Last one standing (BACKLOG-464): a zone hollowed to its final resident (declining per 460, `heads === 1`)
   * lets that dino feel the quiet — a wistful 🍂 bubble, a ticker line, and a memory of the emptiness that
   * rides recall into its next greeting. Deduped against the dino's own memory ring so it reads as a moment,
   * not a tic (a zone that repopulates and drains again can sound it afresh). Returns the names beat.
   */
  private checkLastOne(): string[] {
    const pop = this.zoneHeads();
    const beat: string[] = [];
    for (const z of zoneChain()) {
      if (!this.isZoneDeclining(z) || (pop[z] ?? 0) !== 1) continue;
      const d = this.dinos.find((x) => !this.migrating.has(x.name) && zoneOf(this.dinoZones, x.name, BOWL_ID) === z);
      if (!d) continue;
      const zoneName = zoneById(z).name;
      const mem = lastoneMemory(zoneName);
      if (recall(this.memory, d.name).includes(mem)) continue; // dedup: a moment, not a tic
      this.memory = remember(this.memory, d.name, mem);
      this.showBubble(d, lastoneLine());
      this.logEvent(lastoneEvent(d.name, zoneName));
      beat.push(d.name);
    }
    return beat;
  }

  /**
   * Word of plenty seed (BACKLOG-458): a resident of a zone that currently reads `thriving` has first-hand
   * knowledge its ground is thriving, so it files a shareable plenty memory it can later let slip on the
   * gossip spine. Deduped against a plenty memory it already carries for that zone, so it doesn't spam the
   * ring. Fires on the migration cadence.
   */
  private seedPlentyWord(): void {
    const tiers = this.zoneTiers();
    for (const d of this.dinos) {
      const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
      if (tiers[home] !== 'thriving') continue;
      const zoneName = zoneById(home).name;
      if (recall(this.memory, d.name).some((e) => e.includes(`${zoneName} ${PLENTY_TOKEN}`))) continue;
      this.memory = remember(this.memory, d.name, plentyMemory(zoneName));
    }
  }

  /**
   * Where word of plenty primes this dino to head (BACKLOG-458): the thriving zone it carries word of, but
   * anywhere in the park it can reach (BACKLOG-475 — it used to have to *border* home, so a dino could hear
   * about a ground two hops off and do nothing with it). null when it carries no plenty word, or word only
   * of its own ground.
   */
  private plentyTargetOf(d: Dino): string | null {
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    return plentyTarget(recall(this.memory, d.name), home);
  }

  /** The neighbour a plenty-primed dino actually crosses to: one ground closer to what it heard about
   *  (BACKLOG-475). `hopToward` returns the target itself when it borders home, so every pre-475 pick is
   *  byte-identical; the dino re-reads the pull on arrival and steps again. */
  private plentyDestOf(d: Dino): string | null {
    const target = this.plentyTargetOf(d);
    if (!target) return null;
    return hopToward(zoneOf(this.dinoZones, d.name, BOWL_ID), target);
  }

  /**
   * The ground this dino misses (BACKLOG-362): one it stood on and has been away from past its own
   * threshold. null when it longs for nowhere. The first migration *pull* in the park — every other bias
   * is a push. BACKLOG-475: the candidate set is now the whole park, not the home zone's neighbours; a
   * longing for the far end of the chain is answered one ground at a time by `yearnDestOf`.
   */
  private yearnTargetOf(d: Dino): string | null {
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    return yearnedZone(
      this.leftDays,
      d.name,
      home,
      getWorldClock().now().day,
      ZONES.map((z) => z.id),
      yearnThreshold(d.traits),
    );
  }

  /** The neighbour a yearning dino crosses to — one ground closer to the one it misses (BACKLOG-475). */
  private yearnDestOf(d: Dino): string | null {
    const target = this.yearnTargetOf(d);
    if (!target) return null;
    return hopToward(zoneOf(this.dinoZones, d.name, BOWL_ID), target);
  }

  /**
   * File the longing (BACKLOG-362) — a dino past its threshold for a reachable ground it has left keeps a
   * faint memory of it. Deduped against the ring the way `seedPlentyWord` dedupes its plenty memory, so the
   * beat is a feeling and not a tic. Fires on the migration cadence.
   */
  private seedYearning(): void {
    for (const d of this.dinos) {
      // BACKLOG-475: the memory names the ground it *misses*, not the neighbour it would step to on the way.
      const dest = this.yearnTargetOf(d);
      if (!dest) continue;
      const line = yearnMemory(zoneById(dest).name);
      if (recall(this.memory, d.name).includes(line)) continue;
      this.memory = remember(this.memory, d.name, line);
    }
  }

  /**
   * The neighbour a scarcity-driven migrant heads for (BACKLOG-450): the most appealing (richest prosperity
   * + fullest pantry) of `home`'s neighbours, falling back to the primary link for an unlinked zone.
   *
   * BACKLOG-474: an **unsettled** neighbour outranks the richest one. A ground nobody has ever lived on is
   * the poorest place in the park by construction, so the appeal read can never send anyone there; the pull
   * has to be its own tier. It sits *above* the richest pick and *below* word-of-plenty priming (458) — a
   * ground a dino has actually heard described as thriving beats an empty one it knows nothing about.
   */
  private scarcityDestOf(home: string): string {
    const neighbors = zoneNeighbors(home).map((l) => l.to);
    const frontier = unsettledNeighbor(neighbors, (z) => this.isZoneUnsettled(z));
    if (frontier) return frontier;
    const richest = richestNeighbor(neighbors, (z) => this.zoneAppeal(z));
    // BACKLOG-503: a neighbour that is genuinely better off still wins — mouths move toward plenty, and
    // that is 450's whole claim. The errand is what a dino does when *nothing else is pulling it*: the
    // appeal read has found no neighbour worth the walk, so the walk may as well fetch the one thing the
    // ground cannot grow. Putting it above this read instead made every migration an errand and took the
    // scarcity system dormant — the exact defect CHARTER v7's corollary is about, arrived at from the
    // other side.
    // BACKLOG-509: the errand jumps the appeal read when the tithe is the *only* thing left between this
    // ground and its next landmark. Narrow on purpose. 503 found that promoting it unconditionally made
    // every migration an errand and took the scarcity system dormant — the CHARTER v7 corollary reached
    // from the other side — so a ground short of two kinds still migrates on appeal exactly as before.
    // Only a ground standing there with everything but the shard is worth sending up the hill, and that is
    // what turns a banked pile into a climb the player can watch.
    if (shortOnlyTithe(this.pileFor(home), home)) {
      const errand = this.quarryDestOf(home);
      if (errand) return errand;
    }
    if (richest && this.zoneAppeal(richest) > this.zoneAppeal(home)) return richest;
    return this.quarryDestOf(home) ?? richest ?? otherZone(home);
  }

  /**
   * The next hop a dino takes on a quarry errand (BACKLOG-503), or null when it has none.
   *
   * `scarcityDestOf`'s tiers all answer "which of my neighbours is better"; this one answers a question no
   * comparison of two grounds can — the black glass falls on the Ridge and nowhere else, so a ground
   * without any cannot gather, trade, or prosper its way into some. The routing is multi-hop
   * (`hopToward`, 475), so a dino three grounds away gets the first step of the walk rather than a shrug.
   */
  private quarryDestOf(home: string): string | null {
    return quarryDest(home, this.pileFor(home));
  }

  /** A zone's appeal to a mouth seeking plenty (BACKLOG-450) — its prosperity index (428) + banked food (446),
   *  the live reads folded by `world/scarcity.ts`. */
  private zoneAppeal(zoneId: string): number {
    // BACKLOG-476: and damped once per surplus mouth when the ground is holding more than it can. Not a tier
    // above the number (474's frontier shape) because crowding's two readers — `richestNeighbor` asking
    // where to go and `poorestResidents` asking who leaves — want the same sign from it.
    return crowdedAppeal(
      zoneAppeal(zoneProsperity(this.zoneSignals(zoneId)), foodPileTotal(this.foodStoreFor(zoneId))),
      this.zoneHeads()[zoneId] ?? 0,
      this.zoneCaps[zoneId] ?? 1,
    );
  }

  /** Is this ground holding more mouths than it can (BACKLOG-476)? */
  private isZoneCrowded(zone: string): boolean {
    return isCrowded(this.zoneHeads()[zone] ?? 0, this.zoneCaps[zone] ?? 1);
  }

  /** Begin a scarcity-biased crossing (BACKLOG-450/457): head for the richest neighbour, tagging it
   *  `'scarcity'` only when that neighbour is genuinely richer than home — so 457's greener-ground beat fires
   *  on a move toward plenty and not on a lateral/downhill shuffle. Shared by `maybeMigrate` + `__maybeMigrate`. */
  private scarcityMigrate(d: Dino): void {
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    // BACKLOG-458: a dino primed by word of plenty heads for the *named* thriving neighbour it heard about,
    // not the pure richest-neighbour pick — hearsay chooses the destination. Falls back to the scarcity pick.
    const primed = this.plentyDestOf(d);
    // BACKLOG-362: below hearsay, above the appeal read — a ground it has actually heard described as
    // thriving still beats one it merely misses, but a longing beats a spreadsheet.
    const missed = primed ? null : this.yearnDestOf(d);
    const dest = primed ?? missed ?? this.scarcityDestOf(home);
    // BACKLOG-503: an errand is not a separate destination tier, it is a *reason* the destination read
    // already reached. Asking `scarcityDestOf` what it decided keeps one ordering rather than two.
    const errand = !primed && !missed && dest === this.quarryDestOf(home) ? dest : null;
    // BACKLOG-475: the ticker names the ground it is *heading for* — which is no longer always the ground it
    // steps into this crossing. `primed`/`missed` are the next hop; the target is what it actually wants.
    if (primed) this.logEvent(`🌾 ${d.name} heard ${zoneById(this.plentyTargetOf(d) ?? primed).name} is thriving — heads that way`);
    if (missed) {
      this.logEvent(yearnEvent(d.name, zoneById(this.yearnTargetOf(d) ?? missed).name));
      this.flashFeed(d, yearnLine());
    }
    if (errand) {
      const ground = quarryGround();
      const groundName = zoneById(ground ?? dest).name;
      // The ticker is a **12-line ring**, and an errand is the *commonest* crossing in a park where no
      // ground has fetched a shard yet — every migration with no richer neighbour is one. Logging each of
      // them evicted whatever the player was actually watching within a few steps, which `cycle-110-plenty`
      // caught: hearsay chose its destination correctly and its own ticker line had been pushed off the end.
      //
      // So the beat is once per ground, not once per crossing. A ground deciding it needs black glass is
      // an event; a ground trying again is a habit, and habits do not belong on a ticker. Announced only on
      // the ground the player is standing on, `maybeSpawnResource`'s rule.
      const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
      // ponytail: never cleared, so a ground announces its first errand once a session. If a ground that
      // has *had* a shard and run dry should announce again, clear this in `setPile` when obsidian hits 0.
      if (home === this.zoneId && !this.quarryTold.has(home)) {
        this.quarryTold.add(home);
        this.logEvent(quarryEvent(d.name, groundName, RESOURCE_GLYPH.obsidian));
      }
      const trace = quarryMemory(groundName);
      // Deduped against the ring the way `seedYearning` dedupes its own: a dino that climbs three times is
      // a dino with a habit, not a dino with three memories.
      if (!recall(this.memory, d.name).includes(trace)) this.memory = remember(this.memory, d.name, trace);
      this.flashFeed(d, RESOURCE_GLYPH.obsidian);
    }
    // A yearning move is not a scarcity move: it must not fire 457's greener-ground beat, whatever the
    // appeal maths happen to say about where it is going. BACKLOG-503: nor is an errand — a dino that
    // went for the one thing its ground could not grow did not leave for greener ground.
    const reason = missed || errand ? undefined : this.zoneAppeal(dest) > this.zoneAppeal(home) ? 'scarcity' : undefined;
    this.startMigration(d, dest, reason);
    this.tryTogether(d); // BACKLOG-360: shared travel, off the shared-place bond 346 has been filing since c76
  }

  /**
   * Pick the next migrant (BACKLOG-334 pick + BACKLOG-345 nudge + BACKLOG-355 grading): a dino not
   * already crossing, *preferring* the one the grove pulls hardest. A dino freshly told to its face
   * (pull 2) outranks one whose grove news has gone to ambient background (pull 1), which outranks a
   * coin-flip. With no grove-curious dino at all, it's the old uniform random (345 behavior preserved).
   */
  private pickMigrant(): Dino | null {
    const candidates = this.dinos.filter((d) => !this.migrating.has(d.name));
    // BACKLOG-340: a dino homesick for a friend a zone away is the first the wander picks up (company > scenery).
    const homesick = candidates.filter((d) => this.homesickOf(d));
    // BACKLOG-456: positional, not random. This was the last `rand()` left in a pickable set, and
    // it is the mechanism behind cycle-076-news-pull's identity flake: an ambient meeting mid-drive turns a
    // dino homesick and the pick lands on someone else. First-in-list-order-wins is the same rule
    // richestNeighbor (450), unsettledNeighbor (474), hopToward (475) and pondCompanion (360) all use.
    if (homesick.length) return homesick[0];
    const pull = (d: Dino) =>
      grovePull(recall(this.memory, d.name), this.groveVisited, d.name, zoneOf(this.dinoZones, d.name, BOWL_ID));
    const told = candidates.filter((d) => pull(d) === 2);
    if (told.length) return told[Math.floor(rand() * told.length)];
    const curious = candidates.filter((d) => pull(d) >= 1);
    if (curious.length) return curious[Math.floor(rand() * curious.length)];
    // BACKLOG-458: a dino primed by word of plenty (heard a thriving neighbour) is pulled next — ahead of the
    // scarcity/random fallback, below the grove tiers so the 076/078 grove-pull picks stay byte-identical.
    const primed = candidates.filter((d) => this.plentyDestOf(d));
    if (primed.length) return primed[Math.floor(rand() * primed.length)];
    // BACKLOG-362: a dino that misses a ground goes next — strictly below the plenty tier and strictly
    // above the scarcity fallback, so every pinned pick above stays byte-identical.
    const yearning = candidates.filter((d) => this.yearnDestOf(d));
    if (yearning.length) return yearning[Math.floor(rand() * yearning.length)];
    // BACKLOG-450: no news or homesickness pulling anyone — scarcity decides. A resident of the poorest,
    // emptiest-pantry zone is likeliest to walk out (want empties out); random among the equally-poor keeps
    // *which* of them leaves varied. Touches only this fallback tier, so the grove-pull picks above (pinned by
    // cycle-076/078) and the homesick pick are byte-identical.
    const poor = poorestResidents(candidates, (d) => zoneOf(this.dinoZones, d.name, BOWL_ID), (z) => this.zoneAppeal(z));
    return poor[Math.floor(rand() * poor.length)] ?? null;
  }

  /**
   * Begin a visible crossing (BACKLOG-334/378): fix the destination + the edge to walk to, then mark the dino
   * migrating; the forceStep walk + `crossDino` do the rest. `dest` defaults to the home zone's primary
   * neighbour (`otherZone`), so the old single-neighbour callers (the `__startMigration` hook) are byte-identical.
   */
  private startMigration(d: Dino, dest?: string, reason?: 'scarcity'): void {
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const to = dest ?? otherZone(home);
    const neighbors = zoneNeighbors(home);
    const link = neighbors.find((l) => l.to === to) ?? neighbors[0];
    this.migrationCross[d.name] = { dest: to, edge: link?.edge ?? 'east', reason };
    this.migrating.add(d.name);
  }

  /** Arrival (BACKLOG-334): flip the home zone, drop the dino at the far zone's opposite edge, refresh + persist. */
  private crossDino(d: Dino): void {
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const cross = this.migrationCross[d.name];
    const dest = cross?.dest ?? otherZone(home); // BACKLOG-378: the destination fixed at startMigration
    const from = this.tileOf(d); // BACKLOG-478: the whole tile — a vertical crossing preserves the column, not the row
    setZone(this.dinoZones, d.name, dest);
    // BACKLOG-343: first across — the founding footfall, if this ground is new.
    // BACKLOG-474: and if it founded the ground, this dino is settling somewhere nobody has ever lived.
    if (this.foundZone(d.name, dest)) this.settleZone(d, dest);
    markSeen(this.seenZones, d.name, dest); // BACKLOG-364: it has now seen this ground, and can show it to others
    // BACKLOG-362: the departure clock — the ground it just left starts counting, the one it arrived at
    // stops. You cannot miss where you are standing.
    markLeft(this.leftDays, d.name, home, getWorldClock().now().day);
    clearLeft(this.leftDays, d.name, dest);
    // BACKLOG-347: the near end of that same clock — it is still full of the ground it just left. The memory
    // rides `recall → recentMemory → greet`; the glance back is floated a roll later by `bumpTenures`, not
    // here, because four beats already contend for the crossing instant (339/451/452/457).
    markCameFrom(this.cameFrom, d.name, home);
    // BACKLOG-361: one more crossing on this dino's life. Counted at *arrival* (after `setZone`), the same
    // moment `markSeen` counts the ground — a crossing that never lands is not a crossing.
    recordCrossing(this.crossings, d.name);
    this.struckTold.delete(d.name);
    this.memory = remember(this.memory, d.name, struckMemory(zoneById(home).name));
    this.tenure = resetTenure(this.tenure, d.name); // BACKLOG-341: a fresh zone starts fresh — no longer "at home"
    const entry = crossEntryTile(home, from, COLS, ROWS, cross?.edge);
    d.setPosition(entry.tileX * TILE + TILE / 2, entry.tileY * TILE + TILE / 2);
    this.migrating.delete(d.name);
    delete this.migrationCross[d.name];
    this.applyZoneVisibility();
    this.logEvent(
      `🌿 ${d.name} ${dest === BOWL_ID ? 'crossed back to the bowl' : `crossed into ${zoneById(dest).name}`}`,
    );
    // Carry between zones (BACKLOG-329): the crossing dino ferries one banked resource from the pile it
    // leaves into the pile it enters — the first link between the two per-zone economies (328). Only the
    // visible crossing carries; the instant __migrate/relocate path does not. Empty source or a capped
    // destination → nothing moves (directedCarry returns null), so nothing is ever lost.
    // Directed carry (BACKLOG-356): ferry the kind `dest` is short of for its next craft, not a random
    // spare — so the trade route actively balances the diverging piles (falls back to a spare otherwise).
    // BACKLOG-377: aim at the destination zone's *own* structure recipe (a grove short of stone for its
    // lean-to pulls stone; a bowl short of branch for its cairn pulls branch).
    // BACKLOG-429: under carry pressure (leaving a zone over its soft cap toward a lighter neighbour) the
    // crosser sheds the glut — up to PRESSURE_CARRY kinds — instead of a single directed kind, so banked
    // resources flow toward need. Not over cap / heavier dest → one kind, byte-identical to 356/377.
    const carried = pressuredCarry(this.pileFor(home), this.pileFor(dest), structureRecipe(dest));
    for (const carry of carried) {
      this.setPile(home, takeResource(this.pileFor(home), carry));
      this.setPile(dest, bankResource(this.pileFor(dest), carry));
    }
    if (carried.length) {
      const glyphs = carried.map((k) => RESOURCE_GLYPH[k]).join('');
      this.logEvent(`${glyphs} ${d.name} carried ${carried.length} to ${zoneById(dest).name}`);
    }
    // Food flows between zones (BACKLOG-447): the food twin of the resource carry above. The crossing dino
    // also ferries one banked *food* unit from the zone it leaves toward the lighter neighbour it enters,
    // aimed at the demand read (438's zoneWant) so the "wants what it can't grow" line becomes a mover.
    // ponytail: one unit per crossing (a lean, like the non-pressured resource carry) — a pressured
    // multi-unit food shed can follow if a zone visibly stays glutted.
    const wantId = zoneWant(dest, this.harvestedByZone)?.food;
    const destCap = this.foodCapFor(dest); // BACKLOG-454/461: granary- and season-aware accept cap
    const foodCarry = pickFoodCarry(this.foodStoreFor(home), this.foodStoreFor(dest), wantId, destCap);
    if (foodCarry) {
      this.foodPileByZone[home] = takeFood(this.foodStoreFor(home), foodCarry);
      this.foodPileByZone[dest] = bankFood(this.foodStoreFor(dest), foodCarry, destCap);
      const emoji = FOODS.find((f) => f.id === foodCarry)?.emoji ?? '';
      const destName = zoneById(dest).name;
      this.logEvent(`${emoji} ${d.name} carried food to ${destName}`);
      // The courier's pride (BACKLOG-451): the carrier shows a 📦 beat and keeps the memory, which rides
      // the store into `recall` → the next greeting reads a beat prouder. Only fires when a unit actually
      // moved (dest was genuinely short), so a no-op crossing earns no false pride. Mirrors the 339 beat.
      this.creditFoodBank(d.name); // BACKLOG-448: a carried unit is banked food this dino put there
      this.memory = remember(this.memory, d.name, courierMemory(destName, emoji));
      this.showBubble(d, courierLine());
    }
    // Homecoming from the road (BACKLOG-452): crossing back into the zone this dino last *settled* in is a
    // return, not an arrival. It resettles on the spot — the tenure reset above is overridden, because it
    // never stopped belonging here (341's settle-resist then keeps it put) — wears a 🏡, keeps the trace,
    // and the nearest resident still living there looks up and welcomes it home.
    const homecoming = isHomecoming(this.roots, d.name, home, dest);
    if (homecoming) {
      const zoneName = zoneById(dest).name;
      this.tenure = { ...this.tenure, [d.name]: SETTLE_ROLLS };
      this.memory = remember(this.memory, d.name, homecomingMemory(zoneName));
      this.showBubble(d, homecomingLine());
      this.logEvent(homecomingEvent(d.name, zoneName));
      const residents = this.dinos
        .filter((r) => r.name !== d.name && zoneOf(this.dinoZones, r.name, BOWL_ID) === dest)
        .map((r) => ({ name: r.name, dist: this.chebyTiles(this.tileOf(r), this.tileOf(d)) }));
      const greeter = pickNearest(residents);
      // Nobody home is a legitimate read: the homecoming still fires, it just goes unwitnessed.
      if (greeter) {
        this.bonds = strengthen(this.bonds, greeter, d.name, WELCOME_BOND);
        this.memory = remember(this.memory, greeter, welcomeMemory(d.name, zoneName));
        this.flashFeed(this.dinoByName(greeter)!, '👋');
        this.logEvent(welcomeEvent(greeter, d.name));
      }
    }
    // Left for greener ground (BACKLOG-457): a scarcity-tagged crossing that moved toward a richer neighbour
    // files the reason it left + a 🍃 departure beat; the memory rides recall → the next greeting. Only a
    // scarcity move qualifies (maybeMigrate/scarcityMigrate found dest richer than home) — a homesick or
    // homecoming crossing, or a lateral shuffle, sets no reason, so it earns no greener-ground line.
    if (cross?.reason === 'scarcity' && !homecoming) {
      const leftName = zoneById(home).name;
      this.memory = remember(this.memory, d.name, greenerGroundMemory(leftName));
      this.showBubble(d, greenerGroundLine());
      this.logEvent(`🍃 ${d.name} left ${leftName} for greener ground in ${zoneById(dest).name}`);
      // Come for the plenty (BACKLOG-459): the far side of the move — the nearest resident of the richer
      // ground sizes up the newcomer with a wry welcome and a small bond forms. Mirror of the 452 welcome
      // above (pickNearest + strengthen), but sardonic: come for the food, not come home. Nobody near is a
      // legitimate read — the crossing still happened, the welcome just goes unwitnessed.
      const destName = zoneById(dest).name;
      const nearby = this.dinos
        .filter((r) => r.name !== d.name && zoneOf(this.dinoZones, r.name, BOWL_ID) === dest)
        .map((r) => ({ name: r.name, dist: this.chebyTiles(this.tileOf(r), this.tileOf(d)) }));
      const greeter = pickNearest(nearby);
      if (greeter) {
        this.bonds = strengthen(this.bonds, greeter, d.name, PLENTY_WELCOME_BOND);
        this.memory = remember(this.memory, greeter, plentyWelcomeMemory(d.name, destName));
        this.memory = remember(this.memory, d.name, plentyWelcomedMemory(destName));
        this.showBubble(this.dinoByName(greeter)!, plentyWelcomeLine());
        this.logEvent(plentyWelcomeEvent(greeter, d.name));
      }
    }
    // First steps in the grove (BACKLOG-339): the first time this dino ever crosses *into* the grove,
    // arrival is a beat — a 🌿 look-around bubble, a "first time across" memory (rides the existing store,
    // surfaces in a later greeting), and a one-step pause (the arriving Set) before it wanders on.
    if (firstGroveArrival(this.groveVisited, d.name, dest)) {
      this.groveVisited.push(d.name);
      this.memory = remember(this.memory, d.name, groveArrivalMemory());
      this.showBubble(d, groveArrivalLine());
      this.arriving.add(d.name);
    }
    // Tell of the grove (BACKLOG-342): a dino crossing *back* to the bowl carries grove news, which it
    // leads its next meeting with (the gossip cascade). Only the return crossing files it.
    if (dest === BOWL_ID) {
      this.memory = remember(this.memory, d.name, groveNewsMemory());
    }
    this.refreshPlaque(); // BACKLOG-316: the per-zone tally is live the moment a dino changes zones
    void this.saveGame();
  }

  /** Move a dino to a zone: flip its home zone, drop it on an interior tile there, refresh + persist. */
  private relocate(d: Dino, destZoneId: string): void {
    // BACKLOG-362: the ground it is leaving, read *before* the zone flips — after `setZone` this dino is
    // already standing in the destination and the departure clock would stamp the wrong ground.
    const from = zoneOf(this.dinoZones, d.name, BOWL_ID);
    setZone(this.dinoZones, d.name, destZoneId);
    // BACKLOG-343/474: the instant path founds — and settles — a ground too.
    if (this.foundZone(d.name, destZoneId)) this.settleZone(d, destZoneId);
    markSeen(this.seenZones, d.name, destZoneId); // BACKLOG-364: the instant path sees a ground too
    // BACKLOG-362: and stamps the departure clock, so the instant path can be missed from too.
    if (from !== destZoneId) {
      markLeft(this.leftDays, d.name, from, getWorldClock().now().day);
      // BACKLOG-347: the instant path leaves a ground behind too, so it can be missed *and* carried.
      markCameFrom(this.cameFrom, d.name, from);
      // BACKLOG-361: the instant path counts too — but only inside this guard, unlike `crossDino`. A walked
      // crossing always lands on a *linked neighbour* and so can never be a same-zone move; `__migrate` can
      // be told to send a dino to the ground it is already standing on, and that is not a journey.
      recordCrossing(this.crossings, d.name);
      this.struckTold.delete(d.name);
      this.memory = remember(this.memory, d.name, struckMemory(zoneById(from).name));
    }
    clearLeft(this.leftDays, d.name, destZoneId);
    this.tenure = resetTenure(this.tenure, d.name); // BACKLOG-341: a new zone starts fresh (mirrors crossDino)
    // an interior tile, away from the linked east/west edges so it doesn't instantly read as a crossing
    const tileX = Phaser.Math.Between(2, COLS - 3);
    const tileY = Phaser.Math.Between(2, ROWS - 3);
    d.setPosition(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
    this.applyZoneVisibility();
    this.logEvent(
      `🌿 ${d.name} ${destZoneId === GROVE_ID ? `wandered into ${zoneById(GROVE_ID).name}` : 'wandered back to the bowl'}`,
    );
    void this.saveGame();
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
    // Caught mid-tic (BACKLOG-408): if the dino is deep in its solitary ritual (405) when greeted, it
    // startles the instant the greet opens — a 😳 over it, and its reply comes out bashful (see pickTone).
    // The player isn't a dino, so approaching never counts as the company that would break the tic.
    this.caughtTic = this.ticInvented.has(target.name) ? target.name : null;
    if (this.caughtTic) {
      // BACKLOG-413: the same catch reads opposite by bond — a fond dino is *pleased* (😊), not bashful (😳).
      const fond = fondOfBeingCaught(heartsFromPoints(this.friendship[target.name] ?? 0));
      this.flashFeed(target, fond ? '😊' : '😳');
    }

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
    this.caughtTic = null; // a cancelled greet mustn't leak the bashful frame into the next dino (BACKLOG-408)
    this.dialog.hide();
    this.dialogOpen = false;
  }

  /** Resolve a tone pick: apply the affinity delta + memory + trace, then show the reply. Returns the shown line. */
  private async pickTone(id: ToneId): Promise<string> {
    if (!this.toneMenuOpen || !this.toneTarget) return '';
    const target = this.toneTarget;
    this.toneMenuOpen = false;
    this.toneMenuText = '';

    this.recordTone(target.name, id, target.traits);

    // Reply path is unchanged from the old greet flow (tone-coloured reply is BACKLOG-148).
    this.dialog.show(`${target.name}: ...`);
    // BACKLOG-423: hoisted above the context literal so the prompt can carry the interrupted ritual. Reads
    // only `this.caughtTic` and `target.name`, and nothing between here and its old site touches either —
    // the ordering that *is* load-bearing (the 420 count, and `fond` being read before the 422 grant) is
    // untouched below.
    const caught = this.caughtTic === target.name;
    // BACKLOG-300: what the keeper walked up on, read once and used by both the aside and the prompt — the
    // same discipline 423 used for `ticFor`, so the two can never name different things. Never set on a
    // catch: the ritual is the more specific truth about a dino found alone with its own habit.
    const doingNow = caught ? undefined : this.activityById[target.name];
    const now = getWorldClock().now();
    const reply = await target.greet({
      personality: this.ensurePersona(target).text, // BACKLOG-103: the stored self feeds the prompt
      timeOfDay: dayPhase(now.hour),
      affection: heartsFromPoints(this.friendship[target.name] ?? 0),
      recentMemory: recall(this.memory, target.name),
      // A just-cleared dino names who set its record straight (BACKLOG-247).
      gratitude: whoClearedMyName(this.memory, target.name) ?? undefined,
      // A fond dino names the chosen observer (BACKLOG-276); the closest of all uses the nickname (BACKLOG-278).
      keeperName: keeperAddress(keeperById(this.keeperId), heartsFromPoints(this.friendship[target.name] ?? 0)),
      // Hunger you can hear (BACKLOG-368): a dino over the need threshold lets it slip into its line.
      hungry: pressingNeed(this.needs[target.name]) === 'hunger',
      // Rattled after the chase (BACKLOG-440): a prey with a fresh "slipped X's hunt" memory names its chaser.
      rattled: recentHunter(recall(this.memory, target.name)) ?? undefined,
      // Word of the provider (BACKLOG-453): it names whoever keeps its ground fed — never itself.
      provider: this.providerAsideFor(target.name),
      // Season in the voice (BACKLOG-173): the turning year colours the line — winter grumble / spring savour.
      season: this.currentSeason(),
      // Fed first, or left short (BACKLOG-469): a hungry dino voices its ground's spend policy (463) — grateful
      // on a feed-first ground, grumbling on a bank-first one. Set only when hungry, so it stays a flavour beat.
      groundPolicy:
        pressingNeed(this.needs[target.name]) === 'hunger'
          ? (this.spendPriorityFor(zoneOf(this.dinoZones, target.name, BOWL_ID)) ?? undefined)
          : undefined,
      // Mealtime mood in the voice (BACKLOG-404): how its last contested drop went, while that beat is still
      // on the ring. The ring is the freshness gate — when the memory rolls off, the dino stops mentioning it.
      mealtime: lastHatchOutcome(recall(this.memory, target.name)) ?? undefined,
      // The ritual colours the voice (BACKLOG-423): the enrichment half. Goes through the same `ticFor` the
      // aside and the memory filing use, so the three can never name different rituals.
      interrupted: caught
        ? { kind: this.ticFor(target).kind, label: this.ticFor(target).label }
        : undefined,
      // Caught in the act (BACKLOG-300): the enrichment half, beside 423's. The deterministic clause below
      // ships to every device whether or not a model ever loads.
      doing: doingNow,
    });
    this.chirpFor(target); // it answers in its own voice (BACKLOG-191)
    // Caught mid-tic (BACKLOG-408): a dino greeted mid-ritual sounds bashful — a deterministic frame prefixed
    // to whatever the brain/stub returned (never asks the model to be bashful; the NPCBrain boundary is intact).
    // It files the caught memory once per solitary stretch (cleared by resetTic when the stretch ends).
    // BACKLOG-413: a fond caught dino leads with a warm opener + files a glad memory; a non-fond one stays bashful (408).
    const fond = caught && fondOfBeingCaught(heartsFromPoints(this.friendship[target.name] ?? 0));
    // BACKLOG-420: the catch climbs across one stretch — pleased, teasing, then fondly resigned — but only
    // for a dino that is fond. A dino that barely knows you stays bashful however often you find it, and
    // that flatness is the read: the escalation is the tell. The count advances here and nowhere else, so a
    // cancelled greet (which nulls `caughtTic` above) can never burn a register.
    const catches = caught ? (this.ticCatches[target.name] = (this.ticCatches[target.name] ?? 0) + 1) : 0;
    const register = caughtRegister(catches, fond);
    // BACKLOG-411: a dino found mid-ritual by *another dino* leads its next line with it. One prefix or the
    // other or neither — never both. The `caught` branch wins because it is about the stretch happening
    // right now, where the trace is what an already-ended stretch left behind (and a caught dino is by
    // definition mid-stretch, so any trace it holds is older than the ritual it is standing in).
    const trace = caught ? undefined : this.companyTrace[target.name];
    const glad = trace && companyTraceIsFresh(this.worldSteps - trace.at) ? trace : undefined;
    if (glad) delete this.companyTrace[target.name]; // consumed by this one line
    const opener = caught
      ? caughtOpener(register, this.ticAxisFor(target))
      : glad
        ? gladOpener(glad.friend)
        : null;
    // BACKLOG-423: the ritual's own aside, between the frozen opener and the reply. Only a caught dino gets
    // one — the glad-of-company opener (411) and the plain greet are byte-identical to before.
    // BACKLOG-300: and a dino that was *not* mid-ritual names what it was doing instead. One aside or the
    // other or neither — never both; a plain wanderer still gets none, so an ordinary greet is unchanged.
    const aside = caught
      ? ticAside(this.ticFor(target).kind)
      : doingNow
        ? activityAside(doingNow, target.name)
        : null;
    const text = [opener, aside, reply.text].filter(Boolean).join(' ');
    const filedKey = `${target.name}:${register}`;
    if (caught && !this.ticCaughtFiled.has(filedKey)) {
      const label = this.ticFor(target).label; // BACKLOG-407: it names the ritual it actually performs
      this.memory = remember(this.memory, target.name, caughtRegisterMemory(register, label));
      this.ticCaughtFiled.add(filedKey);
    }
    // BACKLOG-422: the register is the price. Granted after the memory filing so both read the same register,
    // and inside the `caught` guard so an ordinary greet is untouched. Note the ordering above: `fond` was
    // read from `this.friendship` *before* this — a grant can never retroactively change the register of the
    // catch that earned it. The register is decided by the bond you walked up with.
    if (caught) {
      const gain = catchWarmth(
        register,
        this.ticWarmthStretch[target.name] ?? 0,
        this.catchWarmthTotal[target.name] ?? 0,
      );
      if (gain > 0) {
        const firstPaid = (this.ticWarmthStretch[target.name] ?? 0) === 0;
        this.ticWarmthStretch[target.name] = (this.ticWarmthStretch[target.name] ?? 0) + gain;
        this.catchWarmthTotal[target.name] = (this.catchWarmthTotal[target.name] ?? 0) + gain;
        this.friendship = bumpPoints(this.friendship, target.name, gain);
        // One beat per stretch, on the first catch that actually pays. The first draft gated this on a
        // whole-heart crossing, which was wrong for a reason worth recording: the greet path applies its own
        // tone gain (142) in the same call, so whether the *warmth* crossed a heart depends on a number this
        // beat has nothing to do with — the line would fire or not fire for reasons the player cannot see.
        // A stretch is the unit the whole feature is denominated in; it is the unit the beat reports in too.
        if (firstPaid) this.logEvent(catchWarmedLine(target.name));
      }
    }
    this.caughtTic = null;
    const line = `${replyPrefix(reply.source)}${target.name}: ${text}`;
    this.dialog.show(line);
    this.toneTarget = null;
    return line;
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
    // any: dev-only Playwright hook — who the keeper would interact with right now (the zone-gated
    // nearest dino, BACKLOG-274), or null when none is in range/zone.
    (window as any).__nearestDino = () => this.nearestDino()?.name ?? null;
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
    // The loner (BACKLOG-135): a tone pick to a friendless dino lands extra-hard too.
    const lonely = !repairing && !warming && isLoner(this.bonds, name, this.dinoNames(), LONER_FLOOR);
    const gain = repairing
      ? repairGain(traits)
      : warming
        ? warmGain(traits)
        : toneReaction(toneById(id), traits).delta + this.applyKeeperBonus(traits) + (lonely ? LONER_BONUS : 0);
    this.friendship = bumpPoints(this.friendship, name, gain);
    this.memory = remember(
      this.memory,
      name,
      repairing ? repairMemory(name) : warming ? warmMemory() : toneById(id).memory,
    );
    this.lastTone = { ...this.lastTone, [name]: id };
    if (lonely) {
      const dino = this.dinoByName(name);
      if (dino) this.showBubble(dino, perkUpLine(name));
    }
    if (repairing) {
      this.pendingRepair = null;
      const dino = this.dinos.find((d) => d.name === name);
      if (dino) {
        this.showBubble(dino, repairLine(name));
        this.liftMood(dino); // BACKLOG-318: the make-up greet bounces its signature quirk back
      }
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
    // The loner (BACKLOG-135): the keeper's notice lands extra-hard on a dino with no dino-friends.
    const lonely = !repairing && !warming && isLoner(this.bonds, name, this.dinoNames(), LONER_FLOOR);
    const gain = repairing
      ? repairGain(traits)
      : warming
        ? warmGain(traits)
        : greetGain(traits) + this.applyKeeperBonus(traits) + (lonely ? LONER_BONUS : 0);
    this.friendship = bumpPoints(this.friendship, name, gain);
    this.memory = remember(
      this.memory,
      name,
      repairing ? repairMemory(name) : warming ? warmMemory() : 'the human stopped by to say hello',
    );
    if (lonely) {
      const dino = this.dinoByName(name);
      if (dino) this.showBubble(dino, perkUpLine(name));
    }
    if (repairing) {
      this.pendingRepair = null;
      const dino = this.dinos.find((d) => d.name === name);
      if (dino) {
        this.showBubble(dino, repairLine(name));
        this.liftMood(dino); // BACKLOG-318: the make-up greet bounces its signature quirk back
      }
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
      if (dino) {
        this.showBubble(dino, warmLine(name));
        this.liftMood(dino); // BACKLOG-318: thawing the cold funk brightens its signature quirk
      }
    }
  }

  private nearestDino(): Dino | null {
    let best: Dino | null = null;
    let bestDist = TILE * 2;
    for (const d of this.dinos) {
      if (!this.inView(d)) continue; // BACKLOG-274: only a dino in the keeper's zone is interactable
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
    this.lastSpoilDay = clock.now().day; // BACKLOG-455: arm the spoilage day tracker (no pass on day 1)
    this.lastUpkeepDay = clock.now().day; // BACKLOG-480: same arming for upkeep
    this.councilTermDay = Math.max(this.councilTermDay, clock.now().day); // BACKLOG-484: same arming for the term

    clock.onHour((t) => this.checkSeasonTurn(t));
    // A pantry that spoils (BACKLOG-455) — its own live-only onHour listener, so a hoard at/near cap bleeds
    // one unit per in-game day. Separate from the season turn / dawn chorus so none disturbs the others.
    clock.onHour((t) => this.checkSpoilage(t));
    clock.onHour((t) => this.checkUpkeep(t)); // BACKLOG-480: a landmark costs its ground a unit a day
    clock.onHour((t) => this.checkTerm(t)); // BACKLOG-484: the council's seats are re-held once a day
    // Dawn chorus (BACKLOG-192) — its own live-only onHour listener, separate from the season
    // turn and the hour-6 reflection so neither is disturbed. onHour never fires on clock.set().
    clock.onHour((t) => this.checkDawnChorus(t));

    // any: dev-only Playwright hooks — seasons (BACKLOG-159)
    (window as any).__season = () => seasonFor(getWorldClock().now().day);
    // any: dev-only Playwright hook — the season's grip on the daytime socialize roll (BACKLOG-178)
    (window as any).__socialBias = () => seasonSocialBias(this.currentSeason());
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
    // any: dev-only Playwright hook — woke hungry (BACKLOG-376): who woke over the bar at the last dawn.
    (window as any).__wokeHungry = () => [...this.lastWokeHungry];
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
    this.lastSpoilDay = day; // BACKLOG-455: a restore/jump re-arms spoilage too — no spurious catch-up pass
    this.lastUpkeepDay = day; // BACKLOG-480: and upkeep
    this.councilTermDay = Math.max(this.councilTermDay, day); // BACKLOG-484: and the term — a jump holds no election
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
    // BACKLOG-461: the season's grip on the pantry is player-visible — no silent economy change.
    const gripLine = seasonGripLine(turned);
    if (gripLine) this.logEvent(gripLine);
    // BACKLOG-466: ...and its grip on drinking, the water twin of the grip line.
    const thirstLine = seasonThirstLine(turned);
    if (thirstLine) this.logEvent(thirstLine);
    // BACKLOG-465: and which *ground* the season favours — the per-crop companion to the park-wide grip.
    const cropLine = seasonCropLine(turned);
    if (cropLine) this.logEvent(cropLine);
    for (const d of this.dinos) this.memory = remember(this.memory, d.name, turnMemory(turned));
    // BACKLOG-215: the year turning OUT of winter (spring is only reached from winter on a live tick) rewards
    // the dinos that toughed the cold nights — a one-off relief lift + a 🌱 line.
    if (turned === 'spring') this.runThawRelief();
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
   * A pantry that spoils (BACKLOG-455) — once per in-game day, a zone's hoard at/near cap bleeds one unit.
   * Live-observed only (onHour never fires on a restore/away clock.set), so a restore never double-decays; a
   * multi-day jump spoils a single pass (day-count spoilage across a long absence is BACKLOG-462).
   */
  private checkSpoilage(t: GameTime): void {
    if (t.day <= this.lastSpoilDay) return;
    this.lastSpoilDay = t.day;
    this.runSpoilage();
  }

  /** Run one spoilage pass across every zone, using each zone's granary-aware cap. Logs a 🥀 line per id that
   *  actually lost a unit and persists once if anything changed. Shared by `checkSpoilage` + the `__spoilFood`
   *  dev hook so production and test drive the exact same path. */
  private runSpoilage(): void {
    let changed = false;
    for (const zone of zoneChain()) {
      const pile = this.foodStoreFor(zone);
      // BACKLOG-461: the season shifts both the cap and the spoil band — a lean season bleeds a hoard sooner
      // and to a deeper floor, plenty spoils only at the very cap.
      const next = spoilFood(pile, this.foodCapFor(zone), this.spoilMarginFor());
      if (next === pile) continue;
      changed = true;
      const zoneName = zoneById(zone).name;
      for (const id of Object.keys(pile)) {
        if ((next[id] ?? 0) < (pile[id] ?? 0)) {
          this.logEvent(spoiledLine(zoneName, FOODS.find((f) => f.id === id)?.emoji ?? id));
        }
      }
      this.foodPileByZone[zone] = next;
    }
    if (changed) void this.saveGame();
  }

  /**
   * A landmark that has to be kept up (BACKLOG-480). Once per in-game day each ground pays
   * `upkeepDue(standing)` out of its own resource pile; every unit it can't cover drops one standing
   * landmark into disrepair, and a ground that has met its bill with a unit to spare patches one back up.
   *
   * The *which* lives here because only the scene holds the arrays: the **newest** standing landmark
   * lapses first (so a ground's founding cairn is the last thing to fall, and a granary — always the last
   * thing raised — is the first to rot, losing the ground its cap lift immediately), and the **oldest**
   * derelict is patched first, the exact inverse. The arithmetic lives in `world/upkeep.ts`.
   *
   * Shared by the live day hook and the `__runUpkeep` dev hook, so production and test drive one path.
   * `days > 1` runs the away catch-up form (the 455 → 462 shape) and returns its digest lines.
   */
  private runUpkeepPass(days = 1): string[] {
    const lines: string[] = [];
    let changed = false;
    for (const zone of zoneChain()) {
      const pile = this.pileFor(zone);
      const plan =
        days > 1
          ? runUpkeepOverDays(pile, days, this.standingIn(zone), this.derelictIn(zone))
          // BACKLOG-488: the *live* pass asks for the bill only (`derelict = 0`). Lapsing is unchanged;
          // repairing is the mend errand's job now, and it happens where a dino is standing. The away form
          // above keeps 480's full arithmetic — nobody is watching an unattended park, so nobody can walk.
          : runUpkeep(pile, this.standingIn(zone), 0);
      if (plan.pile === pile && plan.lapsed === 0 && plan.repaired === 0) continue;
      changed = true;
      this.setPile(zone, plan.pile);
      const zoneName = zoneById(zone).name;
      for (let i = 0; i < plan.lapsed; i++) {
        const hit = this.landmarkRecords(zone).filter((r) => !r.rec.derelict).pop();
        if (!hit) break;
        hit.rec.derelict = true;
        lines.push(lapsedLine(zoneName, hit.glyph));
      }
      for (let i = 0; i < plan.repaired; i++) {
        const hit = this.landmarkRecords(zone).find((r) => r.rec.derelict);
        if (!hit) break;
        hit.rec.derelict = false;
        lines.push(patchedLine(zoneName, hit.glyph));
      }
    }
    if (changed) {
      this.applyObjectVisibility(); // BACKLOG-480: the alpha pass — disrepair reads in the world, not only the log
      for (const l of lines) this.logEvent(l);
      void this.saveGame();
    }
    return lines;
  }

  /** A zone's landmarks in raise order, each with the glyph it draws as (BACKLOG-480). Oldest first. */
  private landmarkRecords(zone: string): { rec: Landmark; glyph: string }[] {
    const of = (recs: Landmark[], glyph: string) => recs.filter((r) => r.zone === zone).map((rec) => ({ rec, glyph }));
    return [
      ...of(this.cairns, CAIRN_GLYPH),
      ...of(this.shelters, SHELTER_GLYPH),
      ...of(this.thatches, THATCH_GLYPH),
      ...of(this.beacons, BEACON_GLYPH), // BACKLOG-503
      ...of(this.granaries, GRANARY_GLYPH),
    ];
  }

  /** The once-a-day upkeep hook (BACKLOG-480) — live-observed only, the exact shape of `checkSpoilage`, so a
   *  restore or an away jump never fires a spurious pass (that catch-up is `runUpkeepPass(days)`). */
  private checkUpkeep(t: GameTime): void {
    if (t.day <= this.lastUpkeepDay) return;
    this.lastUpkeepDay = t.day;
    this.runUpkeepPass();
  }

  /**
   * Spring thaw relief (BACKLOG-215) — the winter→spring turn's reward. Every dino carrying a first-hand
   * cold-night memory (179 shiver / 208 neglect, but not a keeper-warmed 184 rescue) warms a touch to the
   * keeper (`THAW_LIFT`), floats a 🌱 relief line, and files a "made it through the winter" memory that can
   * colour its next greeting. Fires only on the turn moment (`checkSeasonTurn`, spring), so it's one-off per
   * winter with no per-dino flag. Shared with the `__thawRelief` dev hook so production and test drive one path.
   */
  private runThawRelief(): void {
    let changed = false;
    for (const d of this.dinos) {
      if (!thawedThroughWinter(this.memory, d.name)) continue;
      changed = true;
      this.friendship = bumpPoints(this.friendship, d.name, THAW_LIFT);
      this.memory = remember(this.memory, d.name, thawMemory());
      this.flashFeed(d, '🌱');
      this.logEvent(thawLine(d.name));
    }
    if (changed) void this.saveGame();
  }

  /**
   * Spoilage while you're away (BACKLOG-462) — the day-counted catch-up the live `checkSpoilage` can't do. Its
   * `onHour` day hook never fires on a restore/away `clock.set`, so a hoard left through a long absence used to
   * survive untouched while the away digest (106) fast-forwarded everything else. Here each zone bleeds up to
   * `days` in-game days of the same capped, self-limiting `spoilFood` decay, reading the same granary- and
   * season-aware cap + margin the live pass uses (so 461's grip carries into the catch-up). Returns a 🥀 digest
   * line per id that lost a unit (no silent change), and re-arms `lastSpoilDay` to the post-jump day so the next
   * live hour doesn't double-decay what the catch-up already spoiled. Deterministic — day-count in, no rolls.
   */
  private applyAwaySpoilage(days: number): string[] {
    if (days <= 0) return [];
    const lines: string[] = [];
    let changed = false;
    for (const zone of zoneChain()) {
      const pile = this.foodStoreFor(zone);
      const next = spoilFoodOverDays(pile, days, this.foodCapFor(zone), this.spoilMarginFor());
      if (next === pile) continue;
      changed = true;
      const zoneName = zoneById(zone).name;
      for (const id of Object.keys(pile)) {
        if ((next[id] ?? 0) < (pile[id] ?? 0)) {
          lines.push(spoiledLine(zoneName, FOODS.find((f) => f.id === id)?.emoji ?? id));
        }
      }
      this.foodPileByZone[zone] = next;
    }
    if (changed) {
      this.lastSpoilDay = getWorldClock().now().day;
      void this.saveGame();
    }
    return lines;
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
    this.checkWakeHungry();
  }

  /**
   * Woke hungry (BACKLOG-376) — the dinos that went to bed hungry break the morning's uniform chirp with a
   * visible 🍖 stir, a temperament-shaded line, and a memory that can colour their next greeting. Called
   * from the tail of the dawn chorus so it inherits both of that beat's guards (once per in-game day; live
   * crossings only — a restore/away `clock.set` fires no onHour). Synchronous on purpose: the chorus chirps
   * are staggered through delayedCall, but this beat must be readable the instant dawn breaks.
   */
  private checkWakeHungry(): void {
    this.lastWokeHungry = [];
    for (const d of this.dinos) {
      if (!wokeHungry(this.needs[d.name])) continue;
      this.lastWokeHungry.push(d.name);
      this.memory = remember(this.memory, d.name, wakeHungryMemory());
      this.flashFeed(d, NEED_GLYPH.hunger);
      this.logEvent(wakeHungryLine(d.name, d.traits));
    }
  }

  /** Cycle the realtime multiplier: 1× (24 real-hour day) ⇄ 60× (active watching). */
  /**
   * The rate the player has chosen for *watching* (BACKLOG-493). Distinct from the clock's live scale,
   * which drops to `AWAY_SCALE` whenever the tab is hidden: without somewhere to keep the choice, coming
   * back to the tab would silently reset a player who had picked the slow fishbowl. This is what the save
   * carries, and what a return to the foreground restores.
   */
  private activeScale = ACTIVE_SCALE;

  private toggleScale(): void {
    const clock = getWorldClock();
    this.activeScale = this.activeScale === AWAY_SCALE ? ACTIVE_SCALE : AWAY_SCALE;
    if (!this.tabHidden) clock.setScale(this.activeScale);
    this.clockHud.setText(this.fmtClock(clock.now()));
  }

  /**
   * The world runs fast while somebody is watching and at real time when nobody is (BACKLOG-493, operator
   * ruling). `setScale` re-anchors without jumping the displayed time, so crossing this boundary is
   * seamless in both directions — the clock simply starts accruing at the other rate.
   */
  private applyClockRate(): void {
    getWorldClock().setScale(this.tabHidden ? AWAY_SCALE : this.activeScale);
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
      personas: this.personas, // BACKLOG-103: generate-once selves ride the save
      keeperId: this.keeperId,
      zoneId: this.zoneId,
      roles: this.roles,
      dinoZones: this.dinoZones,
      tenure: this.tenure, // BACKLOG-341: per-dino home-zone tenure (settling persists across a reload)
      gathered: this.gathered,
      foodBanked: this.foodBanked, // BACKLOG-448: who's been filling the pantries (additive)
      catchWarmth: this.catchWarmthTotal, // BACKLOG-422: the lifetime being-found ceiling (additive)
      ticHaunts: this.ticHaunts, // BACKLOG-421: the worn places each ritual returns to (additive)
      roots: this.roots, // BACKLOG-452: where each dino belongs (additive)
      needs: this.needs, // BACKLOG-371: hunger/thirst per dino

      stockpile: this.pileFor(BOWL_ID), // BACKLOG-328: legacy field kept = bowl pile (back-compat for old readers + tests)
      stockpileByZone: this.stockpileByZone, // BACKLOG-328: the full per-zone map
      cairns: this.cairns,
      shelters: this.shelters,
      thatches: this.thatches, // BACKLOG-417: the Fernreach's frond-thatch landmarks
      beacons: this.beacons, // BACKLOG-503: the Ridge's obsidian beacons
      granaries: this.granaries, // BACKLOG-454: food-cap-lifting granaries, one per zone
      groveVisited: this.groveVisited,
      pondSeen: this.pondSeen, // BACKLOG-359
      pioneers: this.pioneers, // BACKLOG-343: who founded each ground (additive)
      seenZones: this.seenZones, // BACKLOG-364: which grounds each dino has set foot on (additive)
      crossings: this.crossings, // BACKLOG-361: lifetime arrivals per dino (additive)
      plot: this.plotByZone[BOWL_ID], // BACKLOG-349: bowl plot kept under the legacy `plot` field (back-compat)
      grovePlot: this.plotByZone[GROVE_ID], // BACKLOG-349: grove plot, additive
      fernreachPlot: this.plotByZone[FERNREACH_ID], // BACKLOG-432: Fernreach plot, additive
      hollowPlot: this.plotByZone[HOLLOW_ID], // BACKLOG-472: Hollow plot, additive
      ridgePlot: this.plotByZone[RIDGE_ID], // BACKLOG-478: Ridge plot, additive
      harvested: this.harvested,
      harvestedByZone: this.harvestedByZone, // BACKLOG-428: per-zone farming term (additive)
      foodPileByZone: this.foodPileByZone as Record<string, Record<string, number>>, // BACKLOG-446: per-zone banked food (additive)
      spendPriorityByZone: this.spendPriorityByZone, // BACKLOG-463: per-zone provider-set spend priority (additive)
      workPriorityByZone: this.workPriorityByZone, // BACKLOG-473: per-zone provider-set work priority (additive)
      // BACKLOG-484: the held seating + its term day. `undefined` while no term has been held, so an
      // untouched park writes no field and an older save keeps reading live.
      councilSeats: this.councilSeats ?? undefined,
      councilTermDay: this.councilTermDay,
      // BACKLOG-407: a ritual picked up off a friend, and the watches building toward one. Additive; the
      // echo is stored as an axis key so a reworded glyph or label can never invalidate an old save.
      ticEchoes: this.ticEchoes,
      ticWatches: this.ticWatches,
      // BACKLOG-409: the lifetime "this ritual happened" set + who each echo was caught off (additive).
      ticsFormed: [...this.ticsFormed],
      ticEchoFrom: this.ticEchoFrom,
      leftDays: this.leftDays, // BACKLOG-362: dino→zone→the day it last crossed out (additive)
      cameFrom: this.cameFrom, // BACKLOG-347: dino→the ground it last crossed out of (additive)
      lastProviderByZone: this.lastProviderByZone, // BACKLOG-467: who last held each zone's say (additive)
      eggs: this.eggs,
      born: this.born,
      savedAt: Date.now(),
      scale: this.activeScale, // BACKLOG-493: the chosen watching rate, not a hidden tab's AWAY_SCALE
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
        this.seedFounding(); // CHARTER v7: the founding park ships a ruin, so its systems are reachable
        this.showKeeperInvite();
        return;
      }
      // Resume at the saved rate, then fast-forward the world over the real gap
      // since the save (BACKLOG-106). clock.set re-anchors at now, so the live
      // pump counts forward from the post-catch-up moment — no double-advance.
      // BACKLOG-493: a save carries the player's chosen *watching* rate. Restore it as the active choice
      // and then let `applyClockRate` decide what the clock actually runs at right now — a save loaded into
      // a backgrounded tab must not start ticking at watching speed.
      if (save.scale) this.activeScale = save.scale;
      this.applyClockRate();
      const away = fastForward(
        // BACKLOG-493: `AWAY_SCALE`, not `save.scale`. The saved scale is the rate the player was *watching*
        // at; an unattended world runs at real time. Passing 60 here would turn a week away into 420 in-game
        // days — every store at its spoilage floor, every landmark derelict, the digest meaningless.
        { time: save.time, savedAt: save.savedAt, scale: AWAY_SCALE, bonds: save.bonds, memory: save.memory },
        Date.now(),
      );
      clock.set(away.time);
      this.player.setPosition(save.player.x, save.player.y);
      this.friendship = save.friendship;
      this.memory = away.memory;
      this.bonds = away.bonds;
      this.gratitude = save.gratitude ?? {};
      this.lastTone = (save.lastTone ?? {}) as Record<string, ToneId>;
      this.personas = (save.personas ?? {}) as Record<string, Persona>; // BACKLOG-103: selves restore
      this.keeperId = save.keeperId ?? DEFAULT_KEEPER_ID;
      this.zoneId = save.zoneId ?? BOWL_ID; // BACKLOG-143: old saves load into the bowl
      this.roles = (save.roles ?? {}) as Record<string, Role>; // BACKLOG-032: durable roles restore
      this.dinoZones = save.dinoZones ?? {}; // BACKLOG-274: home-zone restore (absent → all bowl via fallback)
      this.tenure = save.tenure ?? {}; // BACKLOG-341: home-zone tenure restore (absent → settle from scratch)
      this.gathered = save.gathered ?? {}; // BACKLOG-146: gathered tally restore
      this.foodBanked = save.foodBanked ?? {}; // BACKLOG-448: banked-food tally restore (absent → {})
      this.catchWarmthTotal = save.catchWarmth ?? {}; // BACKLOG-422: lifetime warmth restore (absent → {})
      this.ticHaunts = save.ticHaunts ?? {}; // BACKLOG-421: the haunts restore (absent → {}; every ritual a first)
      this.roots = save.roots ?? {}; // BACKLOG-452: roots restore (absent → nobody can come home yet)
      // BACKLOG-371: needs restore (absent → {}); any spawned dino missing an entry backfills to sated.
      this.needs = save.needs ?? {};
      for (const d of this.dinos) this.needs[d.name] ??= { hunger: 0, thirst: 0 };
      // BACKLOG-328: per-zone piles restore; an older save's single global `stockpile` migrates into the bowl pile.
      this.stockpileByZone = (save.stockpileByZone as Record<string, Stockpile>)
        ?? (save.stockpile && Object.keys(save.stockpile).length ? { [BOWL_ID]: save.stockpile as Stockpile } : {});
      // BACKLOG-286 restore; BACKLOG-308: backfill a home zone for cairns from saves before 308 (→ bowl).
      this.cairns = (save.cairns ?? []).map((c) => ({ ...c, zone: c.zone ?? BOWL_ID }));
      for (const c of this.cairns) this.drawCairn(c);
      // BACKLOG-315: dino-built shelters restore (additive; new field, so old saves load none).
      this.shelters = (save.shelters ?? []).map((s) => ({ ...s, zone: s.zone ?? BOWL_ID }));
      for (const s of this.shelters) this.drawShelter(s);
      // BACKLOG-417: frond thatches restore (additive; new field, so old saves load none). Mirrors shelters.
      this.thatches = (save.thatches ?? []).map((t) => ({ ...t, zone: t.zone ?? BOWL_ID }));
      for (const t of this.thatches) this.drawThatch(t);
      // BACKLOG-503: beacons restore (additive; new field, so old saves load none). Mirrors thatches.
      this.beacons = (save.beacons ?? []).map((b) => ({ ...b, zone: b.zone ?? BOWL_ID }));
      for (const b of this.beacons) this.drawBeacon(b);
      // BACKLOG-454: granaries restore (additive; new field, so old saves load none). Mirrors thatches.
      this.granaries = (save.granaries ?? []).map((g) => ({ ...g, zone: g.zone ?? BOWL_ID }));
      for (const g of this.granaries) this.drawGranary(g);
      this.groveVisited = save.groveVisited ?? []; // BACKLOG-339: who's already been to the grove (absent → none)
      this.pondSeen = save.pondSeen ?? []; // BACKLOG-359: who's already seen the pond (absent → none)
      this.pioneers = save.pioneers ?? {}; // BACKLOG-343 (absent → {})
      // BACKLOG-512: back-fill the foundings a pre-144 save never recorded. `recordPioneer`'s first-write-wins
      // means a ground that recorded a real arrival keeps that name — this only fills the silence.
      this.seedFoundingPioneers();
      // BACKLOG-364: seen-grounds restore, then re-seed from the restored home zones — a save written
      // before this item knows nothing, and the honest floor is "a dino has seen where it lives".
      this.seenZones = save.seenZones ?? {};
      this.crossings = save.crossings ?? {}; // BACKLOG-361 (absent → {}: an older save never counted)
      for (const d of this.dinos) markSeen(this.seenZones, d.name, zoneOf(this.dinoZones, d.name, BOWL_ID));
      // BACKLOG-145/349: per-zone plots restore (bowl from the legacy `plot`, grove from `grovePlot`; old saves → grove-empty).
      this.plotByZone = {
        ...emptyPlots(),
        [BOWL_ID]: save.plot ?? null,
        [GROVE_ID]: save.grovePlot ?? null,
        [FERNREACH_ID]: save.fernreachPlot ?? null,
        [HOLLOW_ID]: save.hollowPlot ?? null, // BACKLOG-472
        [RIDGE_ID]: save.ridgePlot ?? null, // BACKLOG-478
      };
      this.harvested = save.harvested ?? 0;
      this.harvestedByZone = (save.harvestedByZone as Record<string, number>) ?? {}; // BACKLOG-428 (absent → {})
      this.foodPileByZone = (save.foodPileByZone as Record<string, FoodPile>) ?? {}; // BACKLOG-446 (absent → {})
      this.spendPriorityByZone = (save.spendPriorityByZone as Record<string, SpendPriority>) ?? {}; // BACKLOG-463 (absent → {})
      this.workPriorityByZone = (save.workPriorityByZone as Record<string, WorkPriority>) ?? {}; // BACKLOG-473 (absent → {})
      // BACKLOG-407 (absent → {}): a pre-407 save restores with every dino on the ritual it was born with.
      this.ticEchoes = (save.ticEchoes as Record<string, keyof Personality>) ?? {};
      this.ticWatches = (save.ticWatches as Record<string, number>) ?? {};
      // BACKLOG-409 (absent → the echo back-fill): a pre-409 save recorded no formed-set, but a dino carrying
      // an echo demonstrably has a ritual — the park announced it when it took — so the union is the honest
      // restore rather than a blank line under a dino that plainly paces.
      this.ticsFormed = new Set([...(save.ticsFormed ?? []), ...Object.keys(this.ticEchoes)]);
      this.ticEchoFrom = save.ticEchoFrom ?? {};
      // BACKLOG-484: absent seats mean *no term yet*, so `null` (read live) — never `{}`, which would say
      // "held, and every ground seats nobody" and take the 481 vote inert for a day.
      this.councilSeats = save.councilSeats ?? null;
      this.councilTermDay = save.councilTermDay ?? 0;
      this.leftDays = save.leftDays ?? {}; // BACKLOG-362 (absent → {}: nothing to miss until it leaves somewhere)
      this.cameFrom = save.cameFrom ?? {}; // BACKLOG-347 (absent → {}: nothing carried until it crosses)
      this.lastProviderByZone = (save.lastProviderByZone as Record<string, string>) ?? {}; // BACKLOG-467 (absent → {})
      this.plotStageShownByZone = emptyPlotStages();
      this.refreshPlot();
      this.syncBanks(); // BACKLOG-504: the restore replaces the whole pile map, so resync every ground's heap
      this.applyObjectVisibility(); // BACKLOG-308: hide off-zone props if we restored into the grove
      this.renderKeeperAvatar(); // restore re-renders the saved observer at the restored position
      this.lastAwayDigest = away.digest;
      // Respawn dinos born in a previous session, then redraw any pending eggs.
      this.born = save.born ?? [];
      for (const b of this.born) this.spawnDino(b);
      this.eggs = save.eggs ?? [];
      for (const e of this.eggs) this.drawEgg(e);
      this.applyZoneVisibility(); // a save restored into the grove must not show the bowl's dinos
      this.clockHud.setText(this.fmtClock(clock.now()));
      this.applyTint(clock.now());
      this.syncSeason(); // restore re-derives the season; never a turn beat (BACKLOG-159)
      // BACKLOG-462: a hoard left through the absence bleeds the elapsed days on the same capped decay a watched
      // pile does — after syncSeason so the cap/margin read the restored day. Surfaced in the homecoming digest.
      const awaySpoil = [...this.applyAwaySpoilage(away.days), ...this.runUpkeepPass(away.days)]; // BACKLOG-462/480
      if (awaySpoil.length) {
        away.digest.push(...awaySpoil);
        this.lastAwayDigest = away.digest;
      }
      this.refreshHeartsPanel();
      if (away.minutes > 0) {
        this.dialogOpen = true;
        this.dialog.show('While you were away…\n' + away.digest.join('\n'));
      }
      // After a long absence, your closest dino notices you came back (BACKLOG-112).
      // Friendship is assigned above, so the homecomer reads the restored hearts.
      this.lastHomecoming = homecoming(this.friendship, away.minutes, (name) => this.dinoQuirkLabel(name));
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
        { time: clock.now(), savedAt: 0, scale: AWAY_SCALE, bonds: this.bonds, memory: this.memory },
        realMs,
      );
      clock.set(away.time);
      this.bonds = away.bonds;
      this.memory = away.memory;
      this.lastAwayDigest = away.digest;
      // BACKLOG-462: mirror the restore path — spoil the away days into the live piles + digest (clock already set).
      const awaySpoil = [...this.applyAwaySpoilage(away.days), ...this.runUpkeepPass(away.days)]; // BACKLOG-462/480
      if (awaySpoil.length) {
        away.digest.push(...awaySpoil);
        this.lastAwayDigest = away.digest;
      }
      this.lastHomecoming = homecoming(this.friendship, away.minutes, (name) => this.dinoQuirkLabel(name));
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
    // any: dev-only — the Gen3 floor (BACKLOG-033). True once the ground texture is baked; the size hook
    // proves it spans the whole zone (COLS×ROWS world tiles). BACKLOG-445 gave the bowl its own terrain,
    // so these read the *live* floor texture rather than the hardcoded grass key — every zone bakes a
    // different one now, and "is the ground there" is the question these were always really asking.
    (window as any).__groundReady = () => !!this.floorImage?.texture.key;
    (window as any).__groundSize = () => {
      const img = this.floorImage?.texture.getSourceImage() as { width: number; height: number } | undefined;
      return img ? [img.width, img.height] : [0, 0];
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
    // dev-only Playwright hooks — place the keeper + run the zone-crossing check once, deterministically
    // (no dependence on rAF frame-count, which throttles under parallel CI load). (BACKLOG-143)
    (window as any).__setPlayer = (x: number, y: number) => this.player.setPosition(x, y);
    (window as any).__tryCross = () => this.tryCrossZone();
    // any: dev-only Playwright hook — first dino's seeded personality traits
    (window as any).__dinoTraits = () => this.dinos[0]?.traits;
    // any: dev-only Playwright hook — roster size + names
    (window as any).__dinoCount = () => this.dinos.length;
    // any: dev-only Playwright hook — every dino's name
    (window as any).__dinoNames = () => this.dinos.map((d) => d.name);
    // any: dev-only Playwright hook — names of dinos currently drawn (in the keeper's zone) (BACKLOG-143)
    (window as any).__visibleDinos = () =>
      this.dinos.filter((d) => d.sprite.visible).map((d) => d.name);
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
    // any: dev-only Playwright hook — set a dino's hearts exactly (points = hearts×10) for deterministic tests
    (window as any).__setHearts = (name: string, hearts: number) => {
      this.friendship = { ...this.friendship, [name]: hearts * 10 };
      this.refreshHeartsPanel();
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

  /**
   * Draw the active zone's floor (BACKLOG-294). The bowl is the untinted Gen3 grass (unchanged from the
   * old drawGrassMap, BACKLOG-033); the grove bakes its own terrain layout (groveTileAt) under a cool
   * GROVE_TINT so it reads as a different place. One held `floorImage` (depth 0) is re-textured/re-tinted
   * on every zone change rather than stacking images. Falls back to the flat two-green checker if the
   * grass rig is ever missing (STYLE-GUIDE: undrawn → flat).
   */
  /**
   * Edge indicators (BACKLOG-398): a small label at each linked edge naming the neighbour zone, so
   * the chain is legible before you cross. Rebuilt on every floor draw (create, __setZone, keeper
   * cross) from the adjacency table — a fourth zone labels itself with zero changes here.
   */
  private drawEdgeLabels(): void {
    for (const t of this.edgeLabelTexts) t.destroy();
    this.edgeLabelTexts = edgeIndicators(this.zoneId).map((ind) => {
      // BACKLOG-478: vertical links label the top/bottom centre; horizontal ones keep the mid-height sides.
      const vertical = ind.edge === 'north' || ind.edge === 'south';
      const west = ind.edge === 'west';
      if (vertical) {
        const north = ind.edge === 'north';
        return this.add
          .text((COLS * TILE) / 2, north ? 6 : ROWS * TILE - 6, ind.text, {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#ffe9c0',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
          })
          .setOrigin(0.5, north ? 0 : 1)
          .setAlpha(0.85)
          .setDepth(7);
      }
      return this.add
        .text(west ? 6 : COLS * TILE - 6, (ROWS * TILE) / 2, ind.text, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffe9c0',
          shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
        })
        .setOrigin(west ? 0 : 1, 0.5)
        .setAlpha(0.85)
        .setDepth(7); // chrome: over the night overlay, under HUD/dialog
    });
  }

  private drawFloor(): void {
    this.drawEdgeLabels(); // BACKLOG-398: every floor redraw is a zone change (or boot) — relabel the edges
    // BACKLOG-399: dispatch on the zone's terrain layout — grove/Fernreach bake their own ground, the bowl
    // (null) bakes plain grass. The probe at (0,0) is non-null exactly for zones that have a layout.
    const tileAt = (x: number, y: number) => zoneTileAt(this.zoneId, x, y, COLS, ROWS);
    const key =
      tileAt(0, 0) !== null
        ? bakeTerrainMap(this, `terrain_${this.zoneId}_${COLS}x${ROWS}`, COLS, ROWS, TILE, (x, y) => tileAt(x, y)!)
        : bakeTileMap(this, 'grass', COLS, ROWS, TILE);
    if (key) {
      if (!this.floorImage) this.floorImage = this.add.image(0, 0, key).setOrigin(0).setDepth(0);
      else this.floorImage.setTexture(key);
      this.floorImage.setTint(zoneTint(this.zoneId)); // BACKLOG-378: grove cool, Fernreach warm, bowl untinted
      this.floorImage.setVisible(true);
      this.floorFallback?.setVisible(false);
      return;
    }
    if (!this.floorFallback) {
      const g = this.add.graphics().setDepth(0);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const shade = (x + y) % 2 === 0 ? 0x3a6a3a : 0x2f5e2f;
          g.fillStyle(shade, 1);
          g.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
      this.floorFallback = g;
    }
    this.floorFallback.setVisible(true);
  }
}
