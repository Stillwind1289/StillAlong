import { CompanionPoseMode, PomodoroPhase, TimerStatus } from '../types/study';
import { TimeAtmosphere } from '../utils/timeOfDay';

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Native aspect-matched logical canvas sizes
export const ROOM_W = 640;
export const ROOM_H = 614;

export const DESK_W = 768;
export const DESK_H = 528;

// 4x4 uniform grid in /assets/sprites/girl-walk-sheet.png (576x768)
const WALK_CELL_W = 144;
const WALK_CELL_H = 192;
const walkCell = (col: number, row: number): SpriteRect => ({
  x: col * WALK_CELL_W,
  y: row * WALK_CELL_H,
  w: WALK_CELL_W,
  h: WALK_CELL_H,
});

// Smooth 4-step walk cycles anchored through neutral stances
export const GIRL_WALK_FRAMES = {
  down: [walkCell(0, 0), walkCell(2, 0), walkCell(1, 0), walkCell(2, 0)],
  left: [walkCell(0, 1), walkCell(1, 1), walkCell(2, 1), walkCell(3, 1)],
  up: [walkCell(0, 2), walkCell(1, 2), walkCell(2, 2), walkCell(3, 2)],
  right: [walkCell(0, 3), walkCell(1, 3), walkCell(2, 3), walkCell(3, 3)],
};

export const GIRL_IDLE_FRAMES = {
  down: walkCell(2, 0),
  left: walkCell(0, 1),
  up: walkCell(0, 2),
  right: walkCell(0, 3),
};

// 5x4 uniform grid in /assets/sprites/girl-sit-sheet.png (1600x960)
const SIT_CELL_W = 320;
const SIT_CELL_H = 240;
const sitCell = (index: number): SpriteRect => {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return {
    x: col * SIT_CELL_W,
    y: row * SIT_CELL_H,
    w: SIT_CELL_W,
    h: SIT_CELL_H,
  };
};

export const GIRL_SIT_FRAMES = {
  idle: sitCell(0),
  blink: sitCell(1),
  attentive: sitCell(2),
  notice: sitCell(3),
  penReady: sitCell(4),
  writing: sitCell(5),
  handsDesk: sitCell(6),
  reading: sitCell(7),
  perkUp: sitCell(8),
  happy: sitCell(9),
  confused: sitCell(10),
  startled: sitCell(11),
  eureka: sitCell(12),
  thinking: sitCell(13),
  dizzy: sitCell(14),
  mug: sitCell(15),
  peaceful: sitCell(16),
  chinRest: sitCell(17),
  peek: sitCell(18),
  sleepy: sitCell(19),
};

// 6x3 uniform grid in /assets/sprites/kitty-sheet.png (912x432) -> 152x144 cells
const KITTY_CELL_W = 152;
const KITTY_CELL_H = 144;
const kittyCell = (col: number, row: number): SpriteRect => ({
  x: col * KITTY_CELL_W,
  y: row * KITTY_CELL_H,
  w: KITTY_CELL_W,
  h: KITTY_CELL_H,
});

export const KITTY_FRAMES = {
  sitOpen: kittyCell(0, 0),
  sitSquint: kittyCell(1, 0),
  sitAlert: kittyCell(2, 0),
  loaf: kittyCell(3, 0),
  loafSquint: kittyCell(4, 0),
  sleep1: kittyCell(0, 1),
  sleep2: kittyCell(1, 1),
  sleep3: kittyCell(2, 1),
  sleepZ: kittyCell(3, 1),
  happyOpen: kittyCell(0, 2),
  happySmile: kittyCell(1, 2),
  happySparkle: kittyCell(4, 2),
  happyHeart: kittyCell(5, 2),
};

export type CompanionReactionKind = 'happy' | 'perkUp' | 'eureka' | 'confused' | 'mug';

export interface LoadedPixelAssets {
  roomTopDownImg: HTMLImageElement;
  roomFrontImg: HTMLImageElement;
  girlWalkImg: HTMLImageElement;
  girlSitImg: HTMLImageElement;
  woodenDeskImg: HTMLImageElement;
  kittyImg: HTMLImageElement;
}

export function loadPixelAssets(): Promise<LoadedPixelAssets> {
  const loadOne = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  return Promise.all([
    loadOne('/assets/sprites/room-topdown-cutout.png'),
    loadOne('/assets/sprites/room-front-cutout.png'),
    loadOne('/assets/sprites/girl-walk-sheet.png'),
    loadOne('/assets/sprites/girl-sit-sheet.png'),
    loadOne('/assets/sprites/wooden-desk.png'),
    loadOne('/assets/sprites/kitty-sheet.png'),
  ]).then(
    ([roomTopDownImg, roomFrontImg, girlWalkImg, girlSitImg, woodenDeskImg, kittyImg]) => ({
      roomTopDownImg,
      roomFrontImg,
      girlWalkImg,
      girlSitImg,
      woodenDeskImg,
      kittyImg,
    })
  );
}

export interface RoomWalker {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facing: 'down' | 'up' | 'left' | 'right';
  moving: boolean;
  waitTicks: number;
  manualMove: boolean;
}

export type RoomTargetArea = 'desk' | 'bookshelf' | 'window' | 'bed' | 'rug' | 'kitty' | null;

export const ROOM_CLICK_ZONES: {
  id: Exclude<RoomTargetArea, null>;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}[] = [
  { id: 'kitty', label: 'Mochi · Pet your study cat', x: 344, y: 342, w: 62, h: 62 },
  { id: 'desk', label: 'Study Desk · Sit down to study', x: 106, y: 482, w: 122, h: 90 },
  { id: 'bookshelf', label: 'Bookshelf · Browse books', x: 46, y: 74, w: 148, h: 176 },
  { id: 'window', label: 'Window · Look outside', x: 224, y: 44, w: 192, h: 108 },
  { id: 'bed', label: 'Plaid Bed · Cozy corner', x: 444, y: 114, w: 148, h: 238 },
  { id: 'rug', label: 'Lavender Rug · Walk here', x: 190, y: 288, w: 226, h: 142 },
];

export const FOCUS_DESK_GEOMETRY = {
  deskScale: 1.4,
  deskX: 140,
  deskY: 374,
  kittyX: 526,
  kittyY: 332,
  kittyW: 80,
  kittyH: 76,
};

export function clampWalkPoint(x: number, y: number): { x: number; y: number } {
  let nx = Math.max(66, Math.min(574, x));
  let ny = Math.max(246, Math.min(566, y));

  // Avoid top-right bed footprint (x > 426, y < 374)
  if (nx > 426 && ny < 374) {
    if (nx - 426 < 374 - ny) {
      nx = 426;
    } else {
      ny = 374;
    }
  }
  // Avoid top-left bookshelf footprint (x < 208, y < 268)
  if (nx < 208 && ny < 268) {
    ny = 268;
  }
  // Avoid stepping inside the desk body (allow sitting spot right behind it at y=492)
  if (nx >= 102 && nx <= 232 && ny > 498) {
    ny = 494;
  }
  return { x: Math.round(nx), y: Math.round(ny) };
}

export function stepRoomWalker(state: RoomWalker, movingToDesk: boolean): RoomWalker {
  const deskSpot = { x: 166, y: 492 };

  if (movingToDesk) {
    const dx = deskSpot.x - state.x;
    const dy = deskSpot.y - state.y;
    if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
      return {
        ...state,
        x: deskSpot.x,
        y: deskSpot.y,
        targetX: deskSpot.x,
        targetY: deskSpot.y,
        facing: 'down',
        moving: false,
        manualMove: false,
      };
    }
    const speed = 2.0;
    const nx = Math.abs(dx) > 1.8 ? state.x + Math.sign(dx) * speed : deskSpot.x;
    const ny = Math.abs(dy) > 1.8 ? state.y + Math.sign(dy) * speed : deskSpot.y;
    const facing =
      Math.abs(dx) >= Math.abs(dy)
        ? dx > 0
          ? 'right'
          : 'left'
        : dy > 0
          ? 'down'
          : 'up';
    return { ...state, x: nx, y: ny, facing, moving: true };
  }

  if (!state.manualMove && state.waitTicks > 0) {
    return { ...state, moving: false, waitTicks: state.waitTicks - 1 };
  }

  const dx = state.targetX - state.x;
  const dy = state.targetY - state.y;
  if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
    if (state.manualMove) {
      return {
        ...state,
        x: state.targetX,
        y: state.targetY,
        moving: false,
        manualMove: false,
        waitTicks: 320,
      };
    }
    const spots = [
      { x: 296, y: 356, facing: 'down' as const },
      { x: 318, y: 254, facing: 'up' as const },
      { x: 136, y: 274, facing: 'up' as const },
      { x: 406, y: 314, facing: 'right' as const },
      { x: 166, y: 492, facing: 'down' as const },
      { x: 278, y: 448, facing: 'down' as const },
    ];
    const next = spots[Math.floor(Math.random() * spots.length)];
    return {
      ...state,
      targetX: next.x,
      targetY: next.y,
      facing: next.facing,
      moving: false,
      // Rest naturally for ~12-24 seconds between strolls
      waitTicks: 290 + Math.floor(Math.random() * 290),
    };
  }

  const speed = state.manualMove ? 1.9 : 1.1;
  const nx = Math.abs(dx) > 1.8 ? state.x + Math.sign(dx) * speed : state.targetX;
  const ny = Math.abs(dy) > 1.8 ? state.y + Math.sign(dy) * speed : state.targetY;
  const facing =
    Math.abs(dx) >= Math.abs(dy)
      ? dx > 0
        ? 'right'
        : 'left'
      : dy > 0
        ? 'down'
        : 'up';
  return { ...state, x: nx, y: ny, facing, moving: true };
}

function drawWindowSky(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  atmosphere: TimeAtmosphere,
  frame: number
) {
  ctx.fillStyle = atmosphere.skyTop;
  ctx.fillRect(x, y, w, Math.ceil(h * 0.58));
  ctx.fillStyle = atmosphere.skyBottom;
  ctx.fillRect(x, y + Math.floor(h * 0.58), w, Math.ceil(h * 0.42));

  // Morning / Afternoon drifting pixel clouds
  if (atmosphere.period === 'morning' || atmosphere.period === 'afternoon') {
    const drift = Math.floor(frame * 0.1) % (w + 48);
    ctx.fillStyle = '#FFFFFF';
    const c1x = x + ((drift - 24 + w) % w);
    ctx.fillRect(c1x, y + Math.floor(h * 0.2), Math.floor(w * 0.2), 6);
    ctx.fillRect(c1x + 4, y + Math.floor(h * 0.2) - 4, Math.floor(w * 0.12), 4);

    const c2x = x + ((drift + Math.floor(w * 0.5)) % Math.max(1, w - 16));
    ctx.fillRect(c2x, y + Math.floor(h * 0.42), Math.floor(w * 0.16), 5);
  }

  // Evening warm horizon glow
  if (atmosphere.period === 'evening') {
    ctx.fillStyle = '#FFD584';
    ctx.fillRect(x + Math.floor(w * 0.68), y + Math.floor(h * 0.42), 16, 16);
    ctx.fillStyle = 'rgba(255, 198, 132, 0.35)';
    ctx.fillRect(x, y + Math.floor(h * 0.65), w, Math.ceil(h * 0.2));
  }

  // Stars & Crescent Moon in Evening / Night
  if (atmosphere.starsAlpha > 0) {
    if (atmosphere.period === 'night') {
      const mx = x + Math.floor(w * 0.68);
      const my = y + Math.floor(h * 0.18);
      ctx.fillStyle = '#FCE6A2';
      ctx.fillRect(mx, my, 16, 16);
      ctx.fillStyle = atmosphere.skyTop;
      ctx.fillRect(mx + 6, my - 2, 12, 12);
    }
    const starSpots = [
      [0.14, 0.22],
      [0.34, 0.34],
      [0.54, 0.18],
      [0.84, 0.28],
      [0.24, 0.56],
      [0.74, 0.52],
    ];
    starSpots.forEach(([sx, sy], i) => {
      if ((Math.floor(frame / 30) + i) % 3 !== 0) {
        ctx.fillStyle = `rgba(255, 243, 196, ${atmosphere.starsAlpha})`;
        ctx.fillRect(x + Math.floor(w * sx), y + Math.floor(h * sy), 3, 3);
      }
    });
  }

  // Soft distant treetop mounds along window sill matching time of day
  const treeBack =
    atmosphere.period === 'night'
      ? '#1B2B3A'
      : atmosphere.period === 'evening'
        ? '#3E4652'
        : '#76AA73';
  const treeFront =
    atmosphere.period === 'night'
      ? '#253D4D'
      : atmosphere.period === 'evening'
        ? '#525E66'
        : '#94C97E';

  ctx.fillStyle = treeBack;
  ctx.fillRect(x, y + Math.floor(h * 0.78), w, Math.ceil(h * 0.22));
  ctx.fillRect(x + Math.floor(w * 0.12), y + Math.floor(h * 0.68), Math.floor(w * 0.22), 16);
  ctx.fillRect(x + Math.floor(w * 0.62), y + Math.floor(h * 0.66), Math.floor(w * 0.26), 18);

  ctx.fillStyle = treeFront;
  ctx.fillRect(x + Math.floor(w * 0.06), y + Math.floor(h * 0.8), Math.floor(w * 0.24), 14);
  ctx.fillRect(x + Math.floor(w * 0.42), y + Math.floor(h * 0.84), Math.floor(w * 0.22), 12);
  ctx.fillRect(x + Math.floor(w * 0.7), y + Math.floor(h * 0.74), Math.floor(w * 0.24), 18);
}

function getKittyFrame(
  frame: number,
  opts: {
    sleepy: boolean;
    petTimer: number;
  }
): SpriteRect {
  if (opts.petTimer > 0) {
    return opts.petTimer % 20 > 9 ? KITTY_FRAMES.happyHeart : KITTY_FRAMES.happySparkle;
  }
  if (opts.sleepy) {
    // Slow ~2.5s sleepy breathing cadence
    const c = Math.floor(frame / 60) % 5;
    return c === 4 ? KITTY_FRAMES.sleepZ : c === 2 ? KITTY_FRAMES.sleep2 : KITTY_FRAMES.sleep1;
  }
  // Natural blinking every ~7.5s, loafing cozily most of the time (~38s) with calm ~8s upright sit
  const blink = frame % 184 > 176;
  if (blink) return KITTY_FRAMES.loafSquint;
  const catCycle = frame % 1120; // ~46s full cycle
  return catCycle >= 910 ? KITTY_FRAMES.sitOpen : KITTY_FRAMES.loaf;
}

/**
 * TOP-DOWN BEDROOM PLAYGROUND
 * Renders the top-down pixel bedroom cutout over a dynamic time-of-day sky
 * with proportional GBA top-down character scaling & Mochi the cat companion.
 */
export function drawRoomScene(
  ctx: CanvasRenderingContext2D,
  assets: LoadedPixelAssets,
  frame: number,
  opts: {
    walker: RoomWalker;
    hoveredZone: RoomTargetArea;
    isStudying: boolean;
    atmosphere: TimeAtmosphere;
    lampOn: boolean;
    showCat?: boolean;
    kittyReactionTimer?: number;
  }
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ROOM_W, ROOM_H);

  // 1. Dynamic time-of-day sky behind the top-center window opening
  drawWindowSky(ctx, 254, 60, 128, 60, opts.atmosphere, frame);

  // 2. Top-down pixel bedroom artwork (window glass is transparent)
  ctx.drawImage(assets.roomTopDownImg, 0, 0, ROOM_W, ROOM_H);

  // 3. Soft Morning/Afternoon sunbeams onto the wall/floor below window
  if (opts.atmosphere.sunBeamAlpha > 0) {
    ctx.fillStyle = `rgba(255, 243, 204, ${opts.atmosphere.sunBeamAlpha})`;
    ctx.beginPath();
    ctx.moveTo(260, 126);
    ctx.lineTo(376, 126);
    ctx.lineTo(404, 248);
    ctx.lineTo(232, 248);
    ctx.closePath();
    ctx.fill();
  }

  // 4. White Kitty companion (Mochi) resting on the lavender rug (drawn behind/by y-order)
  const showCat = opts.showCat ?? true;
  const kittyX = 374;
  const kittyY = 386;
  const drawCat = () => {
    if (!showCat) return;
    const kr = getKittyFrame(frame, {
      sleepy: opts.isStudying || opts.atmosphere.period === 'night',
      petTimer: opts.kittyReactionTimer ?? 0,
    });
    const kw = Math.round(kr.w * 0.3); // ~46x43 px matched cleanly to top-down room props
    const kh = Math.round(kr.h * 0.3);
    ctx.fillStyle = 'rgba(42, 28, 48, 0.22)';
    ctx.fillRect(Math.round(kittyX - 15), Math.round(kittyY - 4), 30, 6);
    ctx.drawImage(
      assets.kittyImg,
      kr.x,
      kr.y,
      kr.w,
      kr.h,
      Math.round(kittyX - kw / 2),
      Math.round(kittyY - kh + 2),
      kw,
      kh
    );
  };

  // 5. Top-down RPG companion (authentic GBA scale: ~55x73 px matching doorway/chair/desk)
  const { walker } = opts;
  const drawHana = () => {
    const idleBreath = walker.moving ? 0 : Math.sin(frame * 0.06) > 0.78 ? -1 : 0;
    ctx.fillStyle = 'rgba(42, 28, 48, 0.24)';
    ctx.fillRect(Math.round(walker.x - 13), Math.round(walker.y - 4), 26, 6);

    let rect: SpriteRect;
    if (walker.moving) {
      const step = Math.floor(frame / 7) % 4;
      rect = GIRL_WALK_FRAMES[walker.facing][step];
    } else {
      rect = GIRL_IDLE_FRAMES[walker.facing];
    }

    const dw = Math.round(rect.w * 0.39); // 56x75 px proportional to chair (44px) & doorway (76px)
    const dh = Math.round(rect.h * 0.39);
    const dx = Math.round(walker.x - dw / 2);
    const dy = Math.round(walker.y - dh + 4 + idleBreath);
    ctx.drawImage(assets.girlWalkImg, rect.x, rect.y, rect.w, rect.h, dx, dy, dw, dh);
  };

  // Correct top-down depth sorting by foot Y coordinate
  if (walker.y < kittyY) {
    drawHana();
    drawCat();
  } else {
    drawCat();
    drawHana();
  }

  // 6. Ambient time-of-day room tint
  ctx.fillStyle = opts.atmosphere.roomTint;
  ctx.fillRect(26, 22, ROOM_W - 52, ROOM_H - 44);

  // 7. Warm desk glow near bottom-left study desk when lamp is on
  if (opts.lampOn) {
    const glowPulse = 0.14 + Math.sin(frame * 0.045) * 0.02;
    ctx.fillStyle = `rgba(255, 214, 134, ${glowPulse.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(166, 514, 74, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. Interactive hover highlight on furniture / kitty
  if (opts.hoveredZone && opts.hoveredZone !== 'rug') {
    const z = ROOM_CLICK_ZONES.find((item) => item.id === opts.hoveredZone);
    if (z) {
      ctx.strokeStyle = '#F7D488';
      ctx.lineWidth = 3;
      ctx.strokeRect(z.x, z.y, z.w, z.h);
    }
  }
}

/**
 * FRONT-FACING STUDY DESK FOCUS MODE
 * Aligned with looking North across the top-down room desk:
 * bookshelf behind-left, window behind-center, bed behind-right, lavender rug below,
 * and wooden desk firmly grounded at the viewer's foreground edge.
 */
export function drawFocusScene(
  ctx: CanvasRenderingContext2D,
  assets: LoadedPixelAssets,
  frame: number,
  opts: {
    status: TimerStatus;
    phase: PomodoroPhase;
    poseMode: CompanionPoseMode;
    reactionTimer: number;
    reactionKind: CompanionReactionKind;
    atmosphere: TimeAtmosphere;
    lampOn: boolean;
    showCat?: boolean;
    kittyReactionTimer?: number;
  }
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, DESK_W, DESK_H);

  // 1. Dynamic time-of-day sky behind the front-facing window
  drawWindowSky(ctx, 358, 91, 216, 118, opts.atmosphere, frame);

  // 2. Front-facing bedroom artwork
  ctx.drawImage(assets.roomFrontImg, 0, 0, DESK_W, DESK_H);

  // 3. Morning/Afternoon soft sunlight wash across the wall & wood floor
  if (opts.atmosphere.sunBeamAlpha > 0) {
    ctx.fillStyle = `rgba(255, 243, 204, ${(opts.atmosphere.sunBeamAlpha * 0.8).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(366, 210);
    ctx.lineTo(566, 210);
    ctx.lineTo(640, 446);
    ctx.lineTo(292, 446);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Time-of-day atmospheric room tint
  ctx.fillStyle = opts.atmosphere.roomTint;
  ctx.fillRect(0, 0, DESK_W, DESK_H);

  // 5. Soft warm desk-lamp wash centered around foreground study desk
  if (opts.lampOn) {
    const glow = 0.16 + Math.sin(frame * 0.04) * 0.02;
    const grad = ctx.createRadialGradient(384, 358, 28, 384, 358, 280);
    grad.addColorStop(0, `rgba(255, 224, 158, ${glow.toFixed(3)})`);
    grad.addColorStop(1, 'rgba(255, 224, 158, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(90, 120, 588, 408);
  }

  // 6. Grounded foreground wooden desk anchored solidly to bottom edge (no dangling gap)
  const { deskScale, deskX, deskY, kittyX, kittyY, kittyW, kittyH } = FOCUS_DESK_GEOMETRY;
  const deskCenterX = Math.round(DESK_W / 2);
  const deskDrawW = Math.round(assets.woodenDeskImg.width * deskScale);
  const deskDrawH = Math.round(assets.woodenDeskImg.height * deskScale);

  // Floor contact shadow behind/under foreground desk skirt
  ctx.fillStyle = 'rgba(28, 18, 36, 0.28)';
  ctx.fillRect(deskX - 10, DESK_H - 18, deskDrawW + 20, 18);

  ctx.drawImage(assets.woodenDeskImg, deskX, deskY, deskDrawW, deskDrawH);

  // Subtle tabletop contact shadow under Hana & desk corner so sprite integrates into wood grain
  ctx.fillStyle = 'rgba(54, 31, 22, 0.16)';
  ctx.fillRect(deskCenterX - 66, deskY + 26, 132, 6);

  // 7. Natural, long-form human study pacing (~24fps -> 1440 frames/minute)
  // Stays immersed in one study task for 60-85+ seconds rather than switching props every few seconds
  const blinkCycle = frame % 168; // blink briefly every ~7s
  const blinkNow = blinkCycle >= 162;
  const isBreak = opts.phase !== 'focus';
  const isRunning = opts.status === 'running';
  const isPaused = opts.status === 'paused';

  let sitRect: SpriteRect = GIRL_SIT_FRAMES.idle;

  if (opts.reactionTimer > 0) {
    sitRect = GIRL_SIT_FRAMES[opts.reactionKind];
  } else if (opts.poseMode === 'writing') {
    const phase = frame % 1440; // 60s steady writing with occasional natural pause
    sitRect = blinkNow
      ? GIRL_SIT_FRAMES.blink
      : phase < 30
        ? GIRL_SIT_FRAMES.penReady
        : phase >= 1340 && phase < 1410
          ? GIRL_SIT_FRAMES.thinking
          : GIRL_SIT_FRAMES.writing;
  } else if (opts.poseMode === 'reading') {
    const phase = frame % 1440; // 60s steady reading with rare thoughtful glance
    sitRect = blinkNow
      ? GIRL_SIT_FRAMES.blink
      : phase >= 1340 && phase < 1415
        ? GIRL_SIT_FRAMES.thinking
        : GIRL_SIT_FRAMES.reading;
  } else if (opts.poseMode === 'mug') {
    const phase = frame % 1200; // 50s cozy tea pace
    sitRect = phase >= 860 ? GIRL_SIT_FRAMES.peaceful : GIRL_SIT_FRAMES.mug;
  } else if (opts.poseMode === 'resting') {
    const phase = frame % 1560; // 65s restful break pace
    sitRect =
      phase < 840
        ? GIRL_SIT_FRAMES.sleepy
        : phase < 1260
          ? GIRL_SIT_FRAMES.peaceful
          : GIRL_SIT_FRAMES.chinRest;
  } else {
    // Auto mode: realistic multi-minute focus flow
    if (isBreak) {
      const breakPhase = frame % 2160; // ~90s unhurried break rhythm
      if (breakPhase < 840) sitRect = GIRL_SIT_FRAMES.mug; // ~35s warm drink
      else if (breakPhase < 1440) sitRect = GIRL_SIT_FRAMES.peaceful; // ~25s eyes closed rest
      else if (breakPhase < 1860) sitRect = GIRL_SIT_FRAMES.chinRest; // ~17.5s calm daydream
      else
        sitRect =
          opts.atmosphere.period === 'night' ? GIRL_SIT_FRAMES.sleepy : GIRL_SIT_FRAMES.mug;
    } else if (isRunning) {
      // ~3 minute (4320 frames) natural study session loop:
      // 0..36 (1.5s): picks up pen -> 36..960 (38.5s): writes -> 960..1032 (3s): thinks ->
      // 1032..2040 (42s): continues writing -> 2040..2136 (4s): sets pen down / looks up ->
      // 2136..3048 (38s): reads book -> 3048..3120 (3s): pauses to think ->
      // 3120..3960 (35s): continues reading -> 3960..4180 (9s): sips mug -> 4180..4320 (6s): chin rest / settle
      const flow = frame % 4320;
      if (blinkNow) {
        sitRect = GIRL_SIT_FRAMES.blink;
      } else if (flow < 36) {
        sitRect = GIRL_SIT_FRAMES.penReady;
      } else if (flow < 960) {
        sitRect = GIRL_SIT_FRAMES.writing;
      } else if (flow < 1032) {
        sitRect = GIRL_SIT_FRAMES.thinking;
      } else if (flow < 2040) {
        sitRect = GIRL_SIT_FRAMES.writing;
      } else if (flow < 2100) {
        sitRect = GIRL_SIT_FRAMES.handsDesk;
      } else if (flow < 2136) {
        sitRect = GIRL_SIT_FRAMES.attentive;
      } else if (flow < 3048) {
        sitRect = GIRL_SIT_FRAMES.reading;
      } else if (flow < 3120) {
        sitRect = GIRL_SIT_FRAMES.thinking;
      } else if (flow < 3960) {
        sitRect = GIRL_SIT_FRAMES.reading;
      } else if (flow < 4180) {
        sitRect = GIRL_SIT_FRAMES.mug;
      } else {
        sitRect = GIRL_SIT_FRAMES.chinRest;
      }
    } else if (isPaused) {
      const pausePhase = frame % 1440; // 60s calm pause
      sitRect = blinkNow
        ? GIRL_SIT_FRAMES.blink
        : pausePhase >= 1120 && pausePhase < 1340
          ? GIRL_SIT_FRAMES.chinRest
          : GIRL_SIT_FRAMES.idle;
    } else {
      // Ready / Idle: calm waiting across the desk with very gentle occasional posture shift
      const idlePhase = frame % 1440; // 60s calm cycle
      if (blinkNow) sitRect = GIRL_SIT_FRAMES.blink;
      else if (idlePhase >= 1160 && idlePhase < 1320) sitRect = GIRL_SIT_FRAMES.chinRest;
      else sitRect = GIRL_SIT_FRAMES.idle;
    }
  }

  // Gentle 1px chest-breathing settle on whole pixel grid
  const breathY = Math.sin(frame * 0.045) > 0.72 ? -1 : 0;

  // Composite sitting companion so her arms/book/mug rest squarely on top of the desk surface
  const charScale = 1.0;
  const cw = Math.round(sitRect.w * charScale);
  const ch = Math.round(sitRect.h * charScale);
  const cx = Math.round(deskCenterX - cw / 2);
  // Baseline inside 240px cell is at y=216 -> rest cleanly on wooden tabletop at deskY + 28 (y = 402)
  const baselineOffset = Math.round(216 * charScale);
  const cy = Math.round(deskY + 28 - baselineOffset + breathY);

  ctx.drawImage(assets.girlSitImg, sitRect.x, sitRect.y, sitRect.w, sitRect.h, cx, cy, cw, ch);

  // 8. Mochi the study cat perched cozily on the right corner of the wooden desk
  if (opts.showCat ?? true) {
    const kittyRect = getKittyFrame(frame, {
      sleepy: isRunning || opts.poseMode === 'resting' || opts.atmosphere.period === 'night',
      petTimer: opts.kittyReactionTimer ?? 0,
    });
    ctx.fillStyle = 'rgba(54, 31, 22, 0.2)';
    ctx.fillRect(kittyX + 12, kittyY + kittyH - 9, kittyW - 24, 6);
    ctx.drawImage(
      assets.kittyImg,
      kittyRect.x,
      kittyRect.y,
      kittyRect.w,
      kittyRect.h,
      kittyX,
      kittyY,
      kittyW,
      kittyH
    );
  }
}
