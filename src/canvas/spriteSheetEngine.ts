import { CharacterId, PomodoroPhase, TimerStatus } from '../types/study';
import { TimeAtmosphere } from '../utils/timeOfDay';

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ROOM_W = 768;
export const ROOM_H = 512;

export const DESK_W = 768;
export const DESK_H = 512;

// Uniform 8x4 grid cell dimensions in /assets/sprites/girl-spritesheet-normalized.png (1280x704)
const GIRL_CELL_W = 160;
const GIRL_CELL_H = 176;
const girlCell = (col: number, row: number): SpriteRect => ({
  x: col * GIRL_CELL_W,
  y: row * GIRL_CELL_H,
  w: GIRL_CELL_W,
  h: GIRL_CELL_H,
});

export const GIRL_SHEET_FRAMES = {
  idle: [girlCell(0, 0), girlCell(1, 0), girlCell(2, 0), girlCell(3, 0)],
  blink: [girlCell(4, 0), girlCell(5, 0), girlCell(6, 0)],
  reading: [girlCell(0, 1), girlCell(1, 1), girlCell(2, 1), girlCell(3, 1)],
  writing: [girlCell(4, 1), girlCell(5, 1), girlCell(6, 1), girlCell(7, 1)],
  walkDown: [girlCell(0, 2), girlCell(1, 2), girlCell(2, 2), girlCell(3, 2)],
  walkUp: [girlCell(4, 2), girlCell(5, 2), girlCell(6, 2), girlCell(7, 2)],
  walkLeft: [girlCell(0, 3), girlCell(1, 3), girlCell(2, 3), girlCell(3, 3)],
  walkRight: [girlCell(4, 3), girlCell(5, 3), girlCell(6, 3), girlCell(7, 3)],
};

// Exact sprite coordinates measured from boy-spritesheet-reference_fb44cbf3.png (1536x1024)
export const BOY_SHEET_FRAMES = {
  idle: [
    { x: 97, y: 111, w: 116, h: 152 },
    { x: 243, y: 111, w: 115, h: 152 },
    { x: 389, y: 111, w: 116, h: 152 },
    { x: 531, y: 111, w: 115, h: 152 },
  ],
  blink: [
    { x: 770, y: 112, w: 115, h: 151 },
    { x: 911, y: 111, w: 114, h: 152 },
    { x: 1046, y: 111, w: 113, h: 152 },
  ],
  reading: [
    { x: 100, y: 371, w: 114, h: 144 },
    { x: 247, y: 373, w: 114, h: 148 },
    { x: 396, y: 374, w: 114, h: 147 },
    { x: 543, y: 374, w: 114, h: 147 },
  ],
  writing: [
    { x: 774, y: 375, w: 109, h: 161 },
    { x: 906, y: 375, w: 109, h: 161 },
    { x: 1042, y: 376, w: 110, h: 160 },
    { x: 1174, y: 370, w: 109, h: 166 },
  ],
  walkDown: [
    { x: 68, y: 716, w: 88, h: 126 },
    { x: 158, y: 716, w: 88, h: 126 },
    { x: 248, y: 716, w: 83, h: 126 },
    { x: 332, y: 716, w: 85, h: 126 },
  ],
  walkUp: [
    { x: 445, y: 714, w: 80, h: 125 },
    { x: 526, y: 714, w: 80, h: 125 },
    { x: 607, y: 714, w: 80, h: 125 },
    { x: 688, y: 714, w: 82, h: 125 },
  ],
  walkLeft: [
    { x: 802, y: 716, w: 82, h: 125 },
    { x: 886, y: 716, w: 82, h: 125 },
    { x: 970, y: 716, w: 81, h: 125 },
    { x: 1053, y: 716, w: 79, h: 125 },
  ],
  walkRight: [
    { x: 1165, y: 716, w: 79, h: 122 },
    { x: 1245, y: 716, w: 82, h: 122 },
    { x: 1329, y: 716, w: 80, h: 122 },
    { x: 1411, y: 716, w: 78, h: 122 },
  ],
};

// Exact sprite coordinates measured from boy-cat-spritesheet-reference_d48fbdff.png (1536x1024)
export const BOY_CAT_FRAMES = {
  deskStudy: [
    { x: 656, y: 17, w: 127, h: 153 },
    { x: 787, y: 18, w: 125, h: 151 },
    { x: 916, y: 18, w: 125, h: 151 },
    { x: 1045, y: 17, w: 125, h: 152 }, // blink
    { x: 1181, y: 17, w: 129, h: 151 },
    { x: 1337, y: 17, w: 128, h: 151 },
    { x: 655, y: 216, w: 127, h: 149 },
    { x: 789, y: 219, w: 124, h: 145 },
    { x: 922, y: 220, w: 123, h: 145 },
    { x: 1053, y: 220, w: 124, h: 144 }, // blink
    { x: 1186, y: 222, w: 127, h: 141 },
    { x: 1337, y: 219, w: 128, h: 144 },
  ],
  deskBreakStretch: [
    { x: 653, y: 400, w: 130, h: 148 },
    { x: 1057, y: 402, w: 126, h: 148 },
    { x: 1197, y: 401, w: 128, h: 160 },
    { x: 1345, y: 399, w: 139, h: 162 },
  ],
  catSit: [
    { x: 56, y: 592, w: 121, h: 122 },
    { x: 195, y: 596, w: 122, h: 118 },
    { x: 332, y: 596, w: 123, h: 118 },
    { x: 478, y: 603, w: 134, h: 123 },
    { x: 619, y: 606, w: 124, h: 107 }, // blink
  ],
  catSleep: [
    { x: 768, y: 610, w: 147, h: 95 },
    { x: 939, y: 618, w: 146, h: 94 },
    { x: 1109, y: 625, w: 132, h: 90 },
    { x: 1282, y: 622, w: 135, h: 93 }, // with Z
  ],
  catHappy: [
    { x: 100, y: 875, w: 109, h: 136 },
    { x: 282, y: 875, w: 112, h: 136 },
    { x: 461, y: 875, w: 112, h: 136 },
    { x: 815, y: 875, w: 119, h: 136 },
    { x: 973, y: 875, w: 133, h: 136 }, // sparkles
    { x: 1146, y: 875, w: 131, h: 136 }, // heart
  ],
};

// Uniform 8x6 grid cell dimensions in /assets/sprites/focus-desk-spritesheet.png (1536x1056)
const FOCUS_CELL_W = 192;
const FOCUS_CELL_H = 176;
const focusCell = (col: number, row: number): SpriteRect => ({
  x: col * FOCUS_CELL_W,
  y: row * FOCUS_CELL_H,
  w: FOCUS_CELL_W,
  h: FOCUS_CELL_H,
});

export const FOCUS_DESK_FRAMES = {
  male: {
    study: [
      focusCell(0, 0),
      focusCell(1, 0),
      focusCell(3, 0),
      focusCell(4, 0),
      focusCell(6, 0),
      focusCell(7, 0),
    ],
    blink: focusCell(2, 0),
    softBlink: focusCell(5, 0),
    idle: [focusCell(0, 0), focusCell(4, 0)],
    breakRest: [focusCell(0, 1), focusCell(2, 1), focusCell(5, 1), focusCell(7, 1)],
  },
  female: {
    study: [
      focusCell(0, 3),
      focusCell(1, 3),
      focusCell(3, 3),
      focusCell(4, 3),
      focusCell(6, 3),
      focusCell(7, 3),
    ],
    blink: focusCell(2, 3),
    softBlink: focusCell(5, 3),
    idle: [focusCell(0, 3), focusCell(4, 3)],
    breakRest: [focusCell(0, 4), focusCell(1, 4), focusCell(2, 4), focusCell(5, 4)],
  },
};

export interface LoadedPixelAssets {
  roomImg: HTMLImageElement;
  girlSheetImg: HTMLImageElement;
  boySheetImg: HTMLImageElement;
  boyCatImg: HTMLImageElement;
  focusDeskImg: HTMLImageElement;
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
    loadOne('/assets/aistudio/room_a76d0dd3.png'),
    loadOne('/assets/sprites/girl-spritesheet-normalized.png'),
    loadOne('/assets/aistudio/boy-spritesheet-reference_fb44cbf3.png'),
    loadOne('/assets/aistudio/boy-cat-spritesheet-reference_d48fbdff.png'),
    loadOne('/assets/sprites/focus-desk-spritesheet.png'),
  ]).then(([roomImg, girlSheetImg, boySheetImg, boyCatImg, focusDeskImg]) => ({
    roomImg,
    girlSheetImg,
    boySheetImg,
    boyCatImg,
    focusDeskImg,
  }));
}

export interface RoomWalker {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facing: 'down' | 'up' | 'left' | 'right';
  moving: boolean;
  waitTicks: number;
}

export type RoomTargetArea = 'desk' | 'cat' | 'window' | 'bookshelf' | 'bed' | null;

export const ROOM_CLICK_ZONES: {
  id: Exclude<RoomTargetArea, null>;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}[] = [
  { id: 'desk', label: 'Study Desk · Sit down together', x: 444, y: 116, w: 116, h: 98 },
  { id: 'cat', label: 'White Kitty · Say hello', x: 412, y: 256, w: 72, h: 66 },
  { id: 'window', label: 'Window · Look outside', x: 318, y: 58, w: 136, h: 68 },
  { id: 'bookshelf', label: 'Bookshelf · Browse books', x: 168, y: 56, w: 100, h: 112 },
  { id: 'bed', label: 'Cozy Bed · Rest corner', x: 114, y: 134, w: 94, h: 146 },
];

export function stepRoomWalker(state: RoomWalker, movingToDesk: boolean): RoomWalker {
  const deskSpot = { x: 494, y: 224 };

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
        facing: 'up',
        moving: false,
      };
    }
    const speed = 1.7;
    const nx = Math.abs(dx) > 1.5 ? state.x + Math.sign(dx) * speed : deskSpot.x;
    const ny = Math.abs(dy) > 1.5 ? state.y + Math.sign(dy) * speed : deskSpot.y;
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

  if (state.waitTicks > 0) {
    return { ...state, moving: false, waitTicks: state.waitTicks - 1 };
  }

  const dx = state.targetX - state.x;
  const dy = state.targetY - state.y;
  if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
    const spots = [
      { x: 345, y: 295, facing: 'down' as const },
      { x: 386, y: 215, facing: 'up' as const },
      { x: 268, y: 222, facing: 'up' as const },
      { x: 492, y: 230, facing: 'up' as const },
      { x: 365, y: 310, facing: 'right' as const },
    ];
    const next = spots[Math.floor(Math.random() * spots.length)];
    return {
      ...state,
      targetX: next.x,
      targetY: next.y,
      facing: next.facing,
      moving: false,
      waitTicks: 90 + Math.floor(Math.random() * 140),
    };
  }

  const speed = 1.25;
  const nx = Math.abs(dx) > 1.5 ? state.x + Math.sign(dx) * speed : state.targetX;
  const ny = Math.abs(dy) > 1.5 ? state.y + Math.sign(dy) * speed : state.targetY;
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

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: CanvasImageSource,
  rect: SpriteRect,
  destCenterX: number,
  destBottomY: number,
  scale: number
) {
  const dw = Math.round(rect.w * scale);
  const dh = Math.round(rect.h * scale);
  const dx = Math.round(destCenterX - dw / 2);
  const dy = Math.round(destBottomY - dh);
  ctx.drawImage(sheet, rect.x, rect.y, rect.w, rect.h, dx, dy, dw, dh);
}

/**
 * Draws a character frame normalized to an exact pixel height so characters
 * never shrink or jump proportions between idle, blink, and walking states.
 */
function drawSpriteFixedHeight(
  ctx: CanvasRenderingContext2D,
  sheet: CanvasImageSource,
  rect: SpriteRect,
  destCenterX: number,
  destBottomY: number,
  targetHeightPx: number
) {
  const scale = targetHeightPx / rect.h;
  const dw = Math.round(rect.w * scale);
  const dh = Math.round(targetHeightPx);
  const dx = Math.round(destCenterX - dw / 2);
  const dy = Math.round(destBottomY - dh);
  ctx.drawImage(sheet, rect.x, rect.y, rect.w, rect.h, dx, dy, dw, dh);
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
  ctx.fillRect(x, y, w, Math.floor(h * 0.55));
  ctx.fillStyle = atmosphere.skyBottom;
  ctx.fillRect(x, y + Math.floor(h * 0.55), w, Math.ceil(h * 0.45));

  // Morning / Afternoon drifting pixel clouds
  if (atmosphere.period === 'morning' || atmosphere.period === 'afternoon') {
    const drift = Math.floor(frame * 0.14) % (w + 48);
    ctx.fillStyle = '#F7F9FC';
    ctx.fillRect(x + ((drift - 24 + w) % w), y + Math.floor(h * 0.24), Math.floor(w * 0.24), 8);
    ctx.fillRect(
      x + ((drift + 42) % Math.max(1, w - 20)),
      y + Math.floor(h * 0.45),
      Math.floor(w * 0.18),
      6
    );
  }

  // Evening sunset orb
  if (atmosphere.period === 'evening') {
    ctx.fillStyle = '#FFE29E';
    ctx.fillRect(x + Math.floor(w * 0.65), y + Math.floor(h * 0.46), 16, 16);
  }

  // Stars & Crescent Moon in Evening / Night
  if (atmosphere.starsAlpha > 0) {
    if (atmosphere.period === 'night') {
      const mx = x + Math.floor(w * 0.64);
      const my = y + Math.floor(h * 0.16);
      ctx.fillStyle = '#FCE6A2';
      ctx.fillRect(mx, my, 18, 18);
      ctx.fillStyle = atmosphere.skyTop;
      ctx.fillRect(mx + 7, my - 1, 13, 13);
    }
    const starSpots = [
      [0.16, 0.2],
      [0.36, 0.36],
      [0.52, 0.18],
      [0.84, 0.26],
      [0.24, 0.68],
      [0.74, 0.62],
    ];
    starSpots.forEach(([sx, sy], i) => {
      if ((Math.floor(frame / 26) + i) % 3 !== 0) {
        ctx.fillStyle = `rgba(255, 243, 196, ${atmosphere.starsAlpha})`;
        ctx.fillRect(x + Math.floor(w * sx), y + Math.floor(h * sy), 3, 3);
      }
    });
  }

  // Distant silhouette roofs
  ctx.fillStyle = atmosphere.windowHorizonColor;
  ctx.fillRect(x, y + Math.floor(h * 0.8), Math.floor(w * 0.28), Math.ceil(h * 0.2));
  ctx.fillRect(
    x + Math.floor(w * 0.34),
    y + Math.floor(h * 0.74),
    Math.floor(w * 0.26),
    Math.ceil(h * 0.26)
  );
  ctx.fillRect(
    x + Math.floor(w * 0.68),
    y + Math.floor(h * 0.78),
    Math.floor(w * 0.32),
    Math.ceil(h * 0.22)
  );
  ctx.fillStyle = atmosphere.windowLitColor;
  ctx.fillRect(x + Math.floor(w * 0.4), y + Math.floor(h * 0.82), 4, 5);
  ctx.fillRect(x + Math.floor(w * 0.78), y + Math.floor(h * 0.84), 4, 5);
}

/**
 * Character selection card animated preview
 */
export function drawCharacterPreview(
  ctx: CanvasRenderingContext2D,
  assets: LoadedPixelAssets,
  characterId: CharacterId,
  frame: number,
  width: number,
  height: number
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  // Warm walnut & cream bedroom vignette
  ctx.fillStyle = '#1E2246';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#5A3A2C';
  ctx.fillRect(8, 8, width - 16, height - 42);
  ctx.fillStyle = '#7D5137';
  ctx.fillRect(8, height - 34, width - 16, 26);

  // Crisp pixel floor shadow
  ctx.fillStyle = 'rgba(20, 14, 24, 0.34)';
  ctx.fillRect(width / 2 - 24, height - 22, 48, 8);

  const blink = frame % 120 > 113;
  if (characterId === 'male') {
    const rect = blink
      ? BOY_SHEET_FRAMES.blink[1]
      : BOY_SHEET_FRAMES.idle[Math.floor(frame / 14) % 4];
    drawSpriteFixedHeight(ctx, assets.boySheetImg, rect, width / 2, height - 16, 110);
  } else {
    const rect = blink
      ? GIRL_SHEET_FRAMES.blink[1]
      : GIRL_SHEET_FRAMES.idle[Math.floor(frame / 14) % 4];
    drawSpriteFixedHeight(ctx, assets.girlSheetImg, rect, width / 2, height - 12, 130);
  }
}

/**
 * PLAYGROUND VIEW — Top-Down Cozy Bedroom View (normal room lighting & zero shrinking)
 */
export function drawRoomScene(
  ctx: CanvasRenderingContext2D,
  assets: LoadedPixelAssets,
  frame: number,
  opts: {
    characterId: CharacterId;
    walker: RoomWalker;
    hoveredZone: RoomTargetArea;
    catHappyTimer: number;
    isStudying: boolean;
    atmosphere: TimeAtmosphere;
    lampOn: boolean;
  }
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ROOM_W, ROOM_H);

  // 1. Exact provided pixel-art room background (1536x1024 -> 768x512)
  ctx.drawImage(assets.roomImg, 0, 0, ROOM_W, ROOM_H);

  // 2. Dynamic Time-of-Day sky inside the room's 4-pane window
  const winX = 336;
  const winY = 44;
  const winW = 104;
  const winH = 56;
  drawWindowSky(ctx, winX, winY, winW, winH, opts.atmosphere, frame);

  // Subtle swaying pixel curtains on the edges of the top-down window
  const sway = Math.floor(frame / 36) % 2;
  ctx.fillStyle = '#73587A';
  ctx.fillRect(winX, winY, 10 + sway, winH);
  ctx.fillRect(winX + winW - (10 + (1 - sway)), winY, 10 + (1 - sway), winH);
  ctx.fillStyle = '#927499';
  ctx.fillRect(winX + 2, winY + 2, 4, winH - 6);
  ctx.fillRect(winX + winW - 6, winY + 2, 4, winH - 6);

  // Restore wooden window mullions cleanly over the sky
  ctx.fillStyle = '#7D5134';
  ctx.fillRect(winX + 50, winY, 4, winH);
  ctx.fillRect(winX, winY + 26, winW, 4);

  // 3. Sunlight beams across wooden floor in Morning / Afternoon
  if (opts.atmosphere.sunBeamAlpha > 0) {
    ctx.fillStyle = `rgba(255, 240, 194, ${opts.atmosphere.sunBeamAlpha})`;
    ctx.beginPath();
    ctx.moveTo(winX, winY + winH + 14);
    ctx.lineTo(winX + winW, winY + winH + 14);
    ctx.lineTo(winX + winW + 24, winY + winH + 128);
    ctx.lineTo(winX - 24, winY + winH + 128);
    ctx.closePath();
    ctx.fill();
  }

  // 4. White Kitty on the checkered rug
  const catX = 448;
  const catY = 306;
  ctx.fillStyle = 'rgba(22, 16, 26, 0.22)';
  ctx.fillRect(catX - 20, catY - 6, 40, 10);

  let catRect: SpriteRect;
  if (opts.catHappyTimer > 0) {
    catRect = BOY_CAT_FRAMES.catHappy[5];
  } else if (opts.isStudying) {
    const sleepIdx = Math.floor(frame / 28) % 2 === 0 ? 2 : 3;
    catRect = BOY_CAT_FRAMES.catSleep[sleepIdx];
  } else {
    const blink = frame % 125 > 118;
    const earTwitch = frame % 190 > 180;
    catRect = blink
      ? BOY_CAT_FRAMES.catSit[4]
      : earTwitch
        ? BOY_CAT_FRAMES.catSit[3]
        : BOY_CAT_FRAMES.catSit[Math.floor(frame / 18) % 3];
  }
  drawSprite(ctx, assets.boyCatImg, catRect, catX, catY, 0.42);

  // 5. Top-Down Companion (Normalized height so walking NEVER shrinks!)
  const { walker, characterId } = opts;
  ctx.fillStyle = 'rgba(22, 16, 26, 0.25)';
  ctx.fillRect(Math.round(walker.x - 18), Math.round(walker.y - 6), 36, 10);

  const isMale = characterId === 'male';
  const sheetImg: CanvasImageSource = isMale ? assets.boySheetImg : assets.girlSheetImg;
  const frames = isMale ? BOY_SHEET_FRAMES : GIRL_SHEET_FRAMES;

  let charRect: SpriteRect;
  if (walker.moving) {
    const step = Math.floor(frame / 7) % 4;
    if (walker.facing === 'up') charRect = frames.walkUp[step];
    else if (walker.facing === 'left') charRect = frames.walkLeft[step];
    else if (walker.facing === 'right') charRect = frames.walkRight[step];
    else charRect = frames.walkDown[step];
  } else if (walker.facing === 'up') {
    charRect = frames.walkUp[0];
  } else if (walker.facing === 'left') {
    charRect = frames.walkLeft[0];
  } else if (walker.facing === 'right') {
    charRect = frames.walkRight[0];
  } else {
    const blink = frame % 130 > 123;
    charRect = blink ? frames.blink[1] : frames.idle[Math.floor(frame / 14) % 4];
  }

  // Girl uses fixed 160x176 cells with 148px character inside; target cell height = 100px keeps true 84px figure height invariant across all 32 cells!
  // Boy uses raw tight boxes, so drawSpriteFixedHeight(85px) normalizes his 125px walk to match his 152px idle!
  if (isMale) {
    drawSpriteFixedHeight(ctx, sheetImg, charRect, walker.x, walker.y, 85);
  } else {
    drawSpriteFixedHeight(ctx, sheetImg, charRect, walker.x, walker.y + 4, 100);
  }

  // 6. Time-of-Day room tint overlay (natural lighting in Playground)
  ctx.fillStyle = opts.atmosphere.roomTint;
  ctx.fillRect(80, 24, 608, 444);

  // 7. Gentle Desk Lamp Glow when lamp is on
  if (opts.lampOn) {
    const glowPulse = 0.16 + Math.sin(frame * 0.05) * 0.02;
    ctx.fillStyle = `rgba(255, 214, 134, ${glowPulse.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(504, 158, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 224, 158, ${(glowPulse * 0.5).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(504, 158, 118, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. Hovered interactive zone highlight
  if (opts.hoveredZone) {
    const z = ROOM_CLICK_ZONES.find((item) => item.id === opts.hoveredZone);
    if (z) {
      ctx.strokeStyle = '#F7D488';
      ctx.lineWidth = 3;
      ctx.strokeRect(z.x, z.y, z.w, z.h);
    }
  }
}

/**
 * FOCUS MODE — Deep Atmospheric Focus Sanctuary
 * Background softly fades away into quiet midnight-indigo bands so only the
 * companion, their coherent wooden desk, open notebook, and white kitty remain.
 */
export function drawWebcamFocusScene(
  ctx: CanvasRenderingContext2D,
  assets: LoadedPixelAssets,
  frame: number,
  opts: {
    characterId: CharacterId;
    status: TimerStatus;
    phase: PomodoroPhase;
    clockText: string;
    catHappyTimer: number;
    soundOn: boolean;
    atmosphere: TimeAtmosphere;
    lampOn: boolean;
  }
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, DESK_W, DESK_H);

  const isBreak = opts.phase !== 'focus';
  const isRunning = opts.status === 'running';

  const p = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // --- LAYER 1: QUIET FADING ATMOSPHERIC VOID ---
  // Smooth stepped midnight/twilight blue-purple bands that fade gently to dark edges
  const isDay = opts.atmosphere.period === 'morning' || opts.atmosphere.period === 'afternoon';
  const isEvening = opts.atmosphere.period === 'evening';

  const outerBg = isDay ? '#12162E' : isEvening ? '#111229' : '#0B0D1F';
  const midBg = isDay ? '#192042' : isEvening ? '#19193A' : '#121530';
  const innerBg = isDay ? '#222A54' : isEvening ? '#23204A' : '#1A1D40';
  const haloBg = isDay ? '#2D3464' : isEvening ? '#2F2857' : '#22254E';

  p(0, 0, DESK_W, DESK_H, outerBg);

  const drawPixelOval = (cx: number, cy: number, rx: number, ry: number, color: string) => {
    ctx.fillStyle = color;
    for (let y = -ry; y <= ry; y += 4) {
      const norm = y / ry;
      const span = Math.floor((rx * Math.sqrt(Math.max(0, 1 - norm * norm))) / 4) * 4;
      if (span > 0) {
        ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2, 4);
      }
    }
  };

  const centerX = DESK_W / 2;
  const centerY = 278;

  drawPixelOval(centerX, centerY, 344, 210, midBg);
  drawPixelOval(centerX, centerY + 4, 272, 168, innerBg);
  drawPixelOval(centerX, centerY + 8, 204, 126, haloBg);

  // Sparse quiet night stars in upper faded corners
  if (opts.atmosphere.starsAlpha > 0) {
    const stars = [
      [88, 56],
      [158, 96],
      [614, 68],
      [682, 112],
      [232, 44],
      [544, 48],
    ];
    stars.forEach(([sx, sy], idx) => {
      const twinkle = (Math.floor(frame / 34) + idx) % 4 !== 0;
      if (twinkle) {
        p(sx, sy, 2, 2, `rgba(245, 232, 198, ${(opts.atmosphere.starsAlpha * 0.4).toFixed(2)})`);
      }
    });
  }

  // Soft warm desk-lamp glow centered gently around the study desk when lamp is on
  if (opts.lampOn || isRunning) {
    const glowAlpha = opts.lampOn ? 0.13 + Math.sin(frame * 0.045) * 0.02 : 0.06;
    drawPixelOval(centerX, 296, 192, 124, `rgba(255, 218, 148, ${(glowAlpha * 0.65).toFixed(3)})`);
    drawPixelOval(centerX, 316, 136, 82, `rgba(255, 232, 174, ${glowAlpha.toFixed(3)})`);
  }

  // Soft grounded shadow directly beneath the companion's pixel wooden desk
  drawPixelOval(centerX, 428, 166, 20, 'rgba(6, 7, 18, 0.58)');
  drawPixelOval(centerX, 425, 148, 12, 'rgba(6, 7, 18, 0.42)');

  // --- LAYER 2: UNIFIED FOCUS SPRITE SHEET (COMPANION + DESK + OPEN NOTEBOOK + WHITE KITTY) ---
  const deskSet = opts.characterId === 'male' ? FOCUS_DESK_FRAMES.male : FOCUS_DESK_FRAMES.female;
  let deskRect: SpriteRect;

  if (isBreak) {
    // Gentle stretch / restful break cycle
    deskRect = deskSet.breakRest[Math.floor(frame / 34) % deskSet.breakRest.length];
  } else if (isRunning) {
    // Natural active study loop with subtle blinking & soft glances down at notebook
    const blinkTick = frame % 124;
    const glanceTick = frame % 256;
    if (blinkTick > 118) {
      deskRect = deskSet.blink;
    } else if (glanceTick > 244) {
      deskRect = deskSet.softBlink;
    } else {
      deskRect = deskSet.study[Math.floor(frame / 18) % deskSet.study.length];
    }
  } else {
    // Quiet ready/paused posture with slow natural blink
    const blinkTick = frame % 140;
    deskRect =
      blinkTick > 133
        ? deskSet.blink
        : deskSet.idle[Math.floor(frame / 48) % deskSet.idle.length];
  }

  // Exact 2x integer pixel scaling (192x176 -> 384x352) keeps every outline razor-sharp
  drawSprite(ctx, assets.focusDeskImg, deskRect, centerX, 436, 2);

  // Subtle pixel heart above the desk kitty when clicked/petted
  if (opts.catHappyTimer > 0) {
    const floatY = 266 - Math.round((80 - opts.catHappyTimer) * 0.18);
    const hx = 502;
    const hy = floatY;
    // Crisp 7x6 pixel heart outline + warm coral fill
    p(hx + 2, hy, 4, 2, '#3B1E1B');
    p(hx + 8, hy, 4, 2, '#3B1E1B');
    p(hx, hy + 2, 14, 4, '#3B1E1B');
    p(hx + 2, hy + 6, 10, 2, '#3B1E1B');
    p(hx + 4, hy + 8, 6, 2, '#3B1E1B');
    p(hx + 6, hy + 10, 2, 2, '#3B1E1B');

    p(hx + 2, hy + 2, 4, 2, '#F47C7C');
    p(hx + 8, hy + 2, 4, 2, '#F47C7C');
    p(hx + 2, hy + 4, 10, 2, '#E25B5B');
    p(hx + 4, hy + 6, 6, 2, '#E25B5B');
    p(hx + 6, hy + 8, 2, 2, '#E25B5B');
    p(hx + 3, hy + 2, 2, 2, '#FFD2CC');
  }
}
