import { GIRL_SIT_FRAMES, KITTY_FRAMES, LoadedPixelAssets } from '../canvas/spriteSheetEngine';
import { CHARACTERS, CAT_COMPANION } from '../types/study';
import { TIME_ATMOSPHERES, resolveTimeOfDay } from './timeOfDay';

export interface ShareCardPayload {
  subject: string;
  intention: string;
  durationMinutes: number;
  elapsedSeconds: number;
  todayMinutes: number;
  streakDays: number;
  completedAt?: Date;
  showCat?: boolean;
}

/**
 * Generates a crisp 1200x630 Stillalong Session Completion Card PNG data URL
 * combining actual Hana + Mochi pixel artwork and genuine session stats.
 */
export function renderSessionShareCard(
  assets: LoadedPixelAssets | null,
  payload: ShareCardPayload
): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;

  const atmo = TIME_ATMOSPHERES[resolveTimeOfDay('auto')];
  const dateObj = payload.completedAt ?? new Date();
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);

  // 1. Midnight-indigo card backdrop with quiet star speckles
  ctx.fillStyle = '#11152A';
  ctx.fillRect(0, 0, 1200, 630);

  ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
  const stars = [
    [76, 84], [190, 52], [320, 110], [490, 62], [650, 92], [860, 48], [1040, 98], [1124, 180],
    [92, 540], [1108, 520], [980, 560],
  ];
  stars.forEach(([sx, sy]) => ctx.fillRect(sx, sy, 4, 4));

  // 2. GBA Outer Walnut & Cream Bezel Frame
  ctx.fillStyle = '#4A2F24';
  ctx.fillRect(36, 36, 1128, 558);
  ctx.strokeStyle = '#2A1914';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, 1128, 558);

  // Cream Parchment Card Interior
  ctx.fillStyle = '#FBF7EE';
  ctx.fillRect(54, 54, 1092, 522);
  ctx.strokeStyle = '#3D2820';
  ctx.lineWidth = 4;
  ctx.strokeRect(54, 54, 1092, 522);

  // 3. Top Pill Header
  ctx.fillStyle = '#EFE8DB';
  ctx.fillRect(88, 86, 260, 40);
  ctx.strokeStyle = '#3D2820';
  ctx.lineWidth = 2;
  ctx.strokeRect(88, 86, 260, 40);

  ctx.fillStyle = '#2D2229';
  ctx.font = 'bold 18px "Silkscreen", monospace';
  ctx.fillText('STILLALONG', 108, 113);

  ctx.fillStyle = '#7D6551';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(dateLabel.toUpperCase(), 1110, 112);
  ctx.textAlign = 'left';

  // 4. Right Mini-Window Pixel Scene Box (Front Room + Desk + Hana + Mochi)
  const sceneX = 720;
  const sceneY = 148;
  const sceneW = 390;
  const sceneH = 290;

  // Background sky & wall gradient inside preview panel
  ctx.fillStyle = atmo.skyTop;
  ctx.fillRect(sceneX, sceneY, sceneW, sceneH);
  ctx.fillStyle = atmo.skyBottom;
  ctx.fillRect(sceneX, sceneY + 120, sceneW, sceneH - 120);

  if (assets) {
    // Draw cropped portion of front room centered on window/wall
    ctx.drawImage(assets.roomFrontImg, 130, 0, 540, 420, sceneX, sceneY, sceneW, sceneH);
    // Warm wooden desk across bottom of scene panel
    ctx.drawImage(assets.woodenDeskImg, sceneX + 26, sceneY + 206, 338, 118);

    // Hana celebrating happily behind desk!
    const hanaRect = GIRL_SIT_FRAMES.happy;
    ctx.drawImage(
      assets.girlSitImg,
      hanaRect.x,
      hanaRect.y,
      hanaRect.w,
      hanaRect.h,
      sceneX + 76,
      sceneY + 62,
      230,
      172
    );

    // Mochi happy heart on corner of desk
    if (payload.showCat ?? true) {
      const catRect = KITTY_FRAMES.happyHeart;
      ctx.drawImage(
        assets.kittyImg,
        catRect.x,
        catRect.y,
        catRect.w,
        catRect.h,
        sceneX + 274,
        sceneY + 168,
        68,
        64
      );
    }
  }

  ctx.strokeStyle = '#3D2820';
  ctx.lineWidth = 4;
  ctx.strokeRect(sceneX, sceneY, sceneW, sceneH);

  // 5. Main Focus Session Summary Left Column
  ctx.fillStyle = '#BA5F54';
  ctx.font = 'bold 18px "Silkscreen", monospace';
  ctx.fillText('STUDY BLOCK COMPLETE', 88, 178);

  const timeMain =
    payload.durationMinutes >= 1
      ? `${payload.durationMinutes} min`
      : `${payload.elapsedSeconds}s`;

  ctx.fillStyle = '#2D2229';
  ctx.font = 'bold 74px "Pixelify Sans", sans-serif';
  ctx.fillText(timeMain, 88, 256);

  ctx.fillStyle = '#3E549A';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(payload.subject || 'General Study', 88, 308);

  if (payload.intention.trim()) {
    ctx.fillStyle = '#5C4939';
    ctx.font = '500 21px "Plus Jakarta Sans", sans-serif';
    const note =
      payload.intention.trim().length > 44
        ? `${payload.intention.trim().slice(0, 41)}...`
        : payload.intention.trim();
    ctx.fillText(`"${note}"`, 88, 346);
  }

  // Stats Pills Row
  const statY = 384;
  const drawStatBox = (bx: number, label: string, val: string) => {
    ctx.fillStyle = '#FFFDF8';
    ctx.fillRect(bx, statY, 184, 72);
    ctx.strokeStyle = '#D6C7B2';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, statY, 184, 72);

    ctx.fillStyle = '#7D6652';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label.toUpperCase(), bx + 16, statY + 26);

    ctx.fillStyle = '#2D2229';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText(val, bx + 16, statY + 58);
  };

  drawStatBox(88, 'Today Total', `${payload.todayMinutes}m`);
  drawStatBox(290, 'Study Streak', `${payload.streakDays}d`);
  drawStatBox(
    492,
    'Company',
    payload.showCat ?? true ? `${CHARACTERS.female.name} & ${CAT_COMPANION.name}` : CHARACTERS.female.name
  );

  // 6. Footer Signature
  ctx.strokeStyle = '#E5D4BD';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(88, 502);
  ctx.lineTo(1112, 502);
  ctx.stroke();

  ctx.fillStyle = '#5C4939';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('A little place to stay awhile.', 88, 540);

  ctx.fillStyle = '#7D6551';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Crafted by Volfnyra · stillalong', 1112, 540);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}
