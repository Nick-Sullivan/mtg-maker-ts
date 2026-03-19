import { getBasePalette, getPalette } from "./palette";

export const CANVAS_SIZE = 2400;
const WUBRG = ['W', 'U', 'B', 'R', 'G'];

export interface DrawState {
  title: string;
  bracket: string;
  description: string;
  keyCardImgs: (HTMLImageElement | null)[];
  keyCardLoadingStates: boolean[];
  commanderImg: HTMLImageElement | null;
  commanderImgLoading: boolean;
  altImgs: (HTMLImageElement | null)[];
  altImgLoadingStates: boolean[];
  backgroundImgs: (HTMLImageElement | null)[];
  backgroundImgLoadingStates: boolean[];
  partnerImgs: (HTMLImageElement | null)[];
  partnerImgLoadingStates: boolean[];
  colorIdentity: string[];
  colorIcons: Partial<Record<string, HTMLImageElement>>;
  showColorIcons: boolean;
  qrImg: HTMLImageElement | null;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  rotation = 0,
) {
  const r = 14;

  function roundedRectPath() {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
    ctx.lineTo(w / 2, h / 2 - r);
    ctx.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
    ctx.lineTo(-w / 2, -h / 2 + r);
    ctx.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
    ctx.closePath();
  }

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);

  // Drop shadow
  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 14;
  roundedRectPath();
  ctx.clip();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);

  // Highlight rim: bright top-left fading to dark bottom-right
  ctx.restore();
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  roundedRectPath();
  const rim = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  rim.addColorStop(0,   "rgba(255,255,255,0.35)");
  rim.addColorStop(0.4, "rgba(255,255,255,0.08)");
  rim.addColorStop(1,   "rgba(0,0,0,0.3)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

function drawPlaceholderCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  rotation = 0,
) {
  const r = 14;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);

  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 14;

  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.lineTo(w / 2 - r, -h / 2);
  ctx.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
  ctx.lineTo(w / 2, h / 2 - r);
  ctx.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
  ctx.lineTo(-w / 2 + r, h / 2);
  ctx.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
  ctx.lineTo(-w / 2, -h / 2 + r);
  ctx.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
  ctx.closePath();

  ctx.fillStyle = "rgba(90, 90, 90, 0.55)";
  ctx.fill();
  ctx.restore();
}

export function drawShowcase(canvas: HTMLCanvasElement, state: DrawState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(2, 0, 0, 2, 0, 0);
  const S = CANVAS_SIZE / 2;
  const palette = getPalette(state.colorIdentity);

  const sortedColors = [...state.colorIdentity].sort((a, b) => WUBRG.indexOf(a) - WUBRG.indexOf(b));
  const subPalettes = sortedColors.length >= 2
    ? sortedColors.map(getBasePalette).filter(Boolean) as NonNullable<ReturnType<typeof getBasePalette>>[]
    : null;

  if (subPalettes && subPalettes.length >= 2) {
    // Anchor positions (as fractions of S) for each color, spread evenly around canvas
    const ANCHORS: [number, number][][] = [
      [],
      [],
      [[0, 0], [1, 1]],
      [[0, 0], [1, 0], [0.5, 1]],
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]],
    ];
    const anchors = ANCHORS[subPalettes.length];

    // Base fill: linear gradient between first and last colour's dark so no black shows through
    const [ax0, ay0] = anchors[0];
    const [axN, ayN] = anchors[anchors.length - 1];
    const baseBg = ctx.createLinearGradient(S * ax0, S * ay0, S * axN, S * ayN);
    baseBg.addColorStop(0, subPalettes[0].dark);
    baseBg.addColorStop(1, subPalettes[subPalettes.length - 1].dark);
    ctx.fillStyle = baseBg;
    ctx.fillRect(0, 0, S, S);

    // Each color radiates from its anchor, fading to the neighbouring dark rather than transparent
    for (let i = 0; i < subPalettes.length; i++) {
      const p = subPalettes[i];
      const [fx, fy] = anchors[i];
      const cx = S * fx;
      const cy = S * fy;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.9);
      g.addColorStop(0, p.mid);
      g.addColorStop(0.45, p.dark);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
    }

    // Glows slightly inset from each anchor
    const glowInset = 0.2;
    for (let i = 0; i < subPalettes.length; i++) {
      const p = subPalettes[i];
      const [fx, fy] = anchors[i];
      const gx = fx === 0 ? glowInset : fx === 1 ? 1 - glowInset : fx;
      const gy = fy === 0 ? glowInset : fy === 1 ? 1 - glowInset : fy;
      const gg = ctx.createRadialGradient(S * gx, S * gy, 0, S * gx, S * gy, S * 0.5);
      gg.addColorStop(0, p.glow + "30");
      gg.addColorStop(1, "transparent");
      ctx.fillStyle = gg;
      ctx.fillRect(0, 0, S, S);
    }
  } else {
    const bg = ctx.createLinearGradient(0, 0, S * 0.3, S);
    bg.addColorStop(0, palette.dark);
    bg.addColorStop(1, palette.mid);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);

    const glow1 = ctx.createRadialGradient(S * 0.31, S * 0.62, 0, S * 0.31, S * 0.62, 420);
    glow1.addColorStop(0, palette.glow + "28");
    glow1.addColorStop(1, "transparent");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, S, S);

    const glow2 = ctx.createRadialGradient(S * 0.82, S * 0.72, 0, S * 0.82, S * 0.72, 300);
    glow2.addColorStop(0, palette.glow + "18");
    glow2.addColorStop(1, "transparent");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, S, S);
  }

  const streak = ctx.createLinearGradient(0, 0, S, S);
  streak.addColorStop(0, "rgba(255,255,255,0.0)");
  streak.addColorStop(0.5, "rgba(255,255,255,0.05)");
  streak.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = streak;
  ctx.fillRect(0, 0, S, S);

  // Commander group — starts near the top of the canvas
  const cmdCX = S * 0.26;
  const altCount = state.altImgs.reduce(
    (n, img, i) => n + (img || state.altImgLoadingStates[i] ? 1 : 0), 0,
  );
  const headerRowY = 36;

  type CmdLayout = { dx: number; dy: number; w: number; h: number; rot: number; z: number };

  const layouts: Record<number, CmdLayout[]> = {
    0: [
      { dx:   0, dy:    0, w: 500, h: 700, rot: 0, z: 0 },
    ],
    1: [
      { dx: 130, dy:  80, w: 390, h: 546, rot:  0.07, z: 1 },
      { dx: -90, dy: -80, w: 390, h: 546, rot: -0.07, z: 0 },
    ],
    2: [
      { dx:    0, dy:  160, w: 300, h: 420, rot:  0,    z: 2 },
      { dx: -130, dy: -130, w: 300, h: 420, rot: -0.08, z: 0 },
      { dx:  130, dy: -130, w: 300, h: 420, rot:  0.08, z: 1 },
    ],
    3: [
      { dx:  130, dy:  160, w: 300, h: 420, rot: 0, z: 3 },
      { dx: -130, dy: -130, w: 300, h: 420, rot: 0, z: 0 },
      { dx:  130, dy: -130, w: 300, h: 420, rot: 0, z: 1 },
      { dx: -130, dy:  160, w: 300, h: 420, rot: 0, z: 2 },
    ],
  };

  const config = layouts[altCount] ?? layouts[2];
  const PEEK_RATIO = 65 / 700;

  // Card dimensions for a slot, accounting for partner (two sub-cards) and background scaling
  const slotDims = (i: number) => {
    const hasPartner = !!state.partnerImgs[i] || (state.partnerImgLoadingStates[i] ?? false);
    const hasBg = !!state.backgroundImgs[i] || (state.backgroundImgLoadingStates[i] ?? false);
    const baseW = hasPartner ? Math.round(config[i].w * 0.82) : config[i].w;
    const baseH = hasPartner ? Math.round(baseW * 161 / 115) : config[i].h;
    const peekH = hasBg ? Math.round(baseH * PEEK_RATIO) : 0;
    const w = hasBg ? Math.round(baseW * (1 - PEEK_RATIO)) : baseW;
    const h = hasBg ? Math.round(baseH * (1 - PEEK_RATIO)) : baseH;
    return { w, h, peekH };
  };

  const slotEffectiveTop = (i: number) => {
    const { h, peekH } = slotDims(i);
    return config[i].dy - peekH - h / 2;
  };

  const cmdCY = headerRowY - Math.min(...config.map((_, i) => slotEffectiveTop(i)));
  const allImgs = [state.commanderImg, ...state.altImgs];
  const allImgLoadingStates = [state.commanderImgLoading, ...state.altImgLoadingStates];

  // Draw in z order; background then commander(s) per slot
  const drawOrder = Array.from({ length: config.length }, (_, i) => i)
    .sort((a, b) => config[a].z - config[b].z);
  for (const i of drawOrder) {
    const mainImg = allImgs[i] ?? null;
    const mainLoading = allImgLoadingStates[i] ?? false;
    const bgImg = state.backgroundImgs[i] ?? null;
    const bgLoading = state.backgroundImgLoadingStates[i] ?? false;
    const partnerImg = state.partnerImgs[i] ?? null;
    const partnerLoading = state.partnerImgLoadingStates[i] ?? false;
    const { w, h, peekH } = slotDims(i);
    const { dx, dy, rot } = config[i];
    const slotCX = cmdCX + dx;
    const slotCY = cmdCY + dy;

    if (partnerImg || partnerLoading) {
      // Partner and main commander overlap with opposing skew within the slot
      const SUB_ROT = 0.14;
      const ox = w * 0.14;  // horizontal offset from slot centre
      const oy = h * 0.04;  // vertical stagger
      const shiftY = h * 0.12; // shift the whole pair down

      if (bgImg) {
        drawCard(ctx, bgImg,
          slotCX + ox - w / 2 - w * 0.06,
          slotCY + shiftY + oy - peekH - h / 2,
          w, h, rot + SUB_ROT);
      } else if (bgLoading) {
        drawPlaceholderCard(ctx,
          slotCX + ox - w / 2 - w * 0.06,
          slotCY + shiftY + oy - peekH - h / 2,
          w, h, rot + SUB_ROT);
      }
      // Partner behind (left, up, rotated counter-clockwise)
      if (partnerImg) {
        drawCard(ctx, partnerImg, slotCX - ox - w / 2, slotCY + shiftY - oy - h / 2, w, h, rot - SUB_ROT);
      } else if (partnerLoading) {
        drawPlaceholderCard(ctx, slotCX - ox - w / 2, slotCY + shiftY - oy - h / 2, w, h, rot - SUB_ROT);
      }
      // Main commander in front (right, down, rotated clockwise)
      if (mainImg) {
        drawCard(ctx, mainImg, slotCX + ox - w / 2, slotCY + oy - h / 2, w, h, rot + SUB_ROT);
      } else if (mainLoading) {
        drawPlaceholderCard(ctx, slotCX + ox - w / 2, slotCY + oy - h / 2, w, h, rot + SUB_ROT);
      }
    } else {
      if (bgImg) {
        drawCard(ctx, bgImg,
          slotCX - w / 2 - w * 0.06,
          slotCY - peekH - h / 2,
          w, h, rot);
      } else if (bgLoading) {
        drawPlaceholderCard(ctx,
          slotCX - w / 2 - w * 0.06,
          slotCY - peekH - h / 2,
          w, h, rot);
      }
      if (mainImg) {
        drawCard(ctx, mainImg, slotCX - w / 2, slotCY - h / 2, w, h, rot);
      } else if (mainLoading) {
        drawPlaceholderCard(ctx, slotCX - w / 2, slotCY - h / 2, w, h, rot);
      }
    }
  }

  const rightX = S * 0.56;
  const rightW = S - rightX - 35;

  // Title — top of right column, wraps to second line if needed
  const titleSize = 84;
  let titleBottomY = 36;
  if (state.title) {
    ctx.save();
    ctx.font = `bold ${titleSize}px 'Cormorant Garamond', serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowOffsetY = 3;
    const titleCX = rightX + rightW / 2;
    const lines = state.title.split("\n").filter((l) => l.trim());
    lines.forEach((line, i) => {
      ctx.fillText(line, titleCX, 110 + i * (titleSize + 8), rightW);
    });
    titleBottomY = 110 + lines.length * (titleSize + 8);
    ctx.restore();
  }

  // Color icons + bracket badge — stacked below title
  const rowY = titleBottomY - 30;
  const iconSize = 48;
  const iconGap = 8;
  const activeColors = WUBRG.filter((c) => state.colorIdentity.includes(c));
  const iconsVisible = state.showColorIcons && activeColors.length > 0;
  const titleCX = rightX + rightW / 2;

  // Row 1: color icons
  if (iconsVisible) {
    const totalIconW = activeColors.length * iconSize + (activeColors.length - 1) * iconGap;
    let ix = titleCX - totalIconW / 2;
    for (const color of activeColors) {
      const img = state.colorIcons[color];
      if (img) ctx.drawImage(img, ix, rowY, iconSize, iconSize);
      ix += iconSize + iconGap;
    }
  }

  // Row 2: bracket badge — below icons (or at rowY if no icons)
  const bracketRowY = iconsVisible ? rowY + iconSize + 10 : rowY;
  let bracketH = 0;
  if (state.bracket) {
    ctx.font = "bold 30px Philosopher, 'Segoe UI', Tahoma, serif";
    const bw = ctx.measureText(state.bracket).width + 36;
    bracketH = 48;
    const br = bracketH / 2;
    const bx = titleCX - bw / 2;
    const by = bracketRowY;
    ctx.save();
    ctx.fillStyle = palette.accent + "cc";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(bx + br, by); ctx.lineTo(bx + bw - br, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
    ctx.arcTo(bx + bw, by + bracketH, bx + bw - br, by + bracketH, br);
    ctx.lineTo(bx + br, by + bracketH);
    ctx.arcTo(bx, by + bracketH, bx, by + bracketH - br, br);
    ctx.arcTo(bx, by, bx + br, by, br);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(state.bracket, bx + 18, by + 33);
    ctx.restore();
  }

  const headerBottomY = (state.bracket || iconsVisible)
    ? bracketRowY + (state.bracket ? bracketH + 8 : iconsVisible ? iconSize + 8 : 0)
    : rowY;

  // Description — top-right area, below header elements
  const descAreaTop = Math.max(headerBottomY + 30, 120);
  const keyCardsTop = S * 0.67;

  if (state.description) {
    const descSize = 38;
    ctx.save();
    ctx.font = `${descSize}px 'Segoe UI', Tahoma, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    let y = descAreaTop + descSize;
    const wrappedLines = state.description
      .split("\n")
      .flatMap((para) => para === "" ? [""] : wrapText(ctx, para, rightW));
    for (const line of wrappedLines) {
      if (y + descSize > keyCardsTop - 20) break;
      ctx.fillText(line, rightX, y);
      y += descSize + 10;
    }
    ctx.restore();
  }

  // Key Cards — bottom third, full width
  const keySlots = state.keyCardImgs.map((img, i) => ({
    img,
    loading: state.keyCardLoadingStates[i] ?? false,
  })).filter((s) => s.img || s.loading);
  if (keySlots.length > 0) {
    const keyAreaH = S - 40 - keyCardsTop;
    const keyH = Math.min(keyAreaH * 0.88, 260);
    const keyW = keyH * (115 / 161);
    const totalKeysW = keySlots.length * keyW + (keySlots.length - 1) * 20;
    const startX = (S - totalKeysW) / 2;
    const cardY = keyCardsTop + (keyAreaH - keyH) / 2;

    // Section label — centred
    ctx.save();
    ctx.font = "bold 48px 'Cormorant Garamond', serif";
    ctx.fillStyle = palette.accent;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("Key Cards", S / 2, keyCardsTop + 20);
    ctx.restore();

    for (let i = 0; i < keySlots.length; i++) {
      const { img, loading } = keySlots[i];
      if (img) {
        drawCard(ctx, img, startX + i * (keyW + 20), cardY, keyW, keyH);
      } else if (loading) {
        drawPlaceholderCard(ctx, startX + i * (keyW + 20), cardY, keyW, keyH);
      }
    }
  }

  const vig = ctx.createRadialGradient(S / 2, S / 2, S * 0.35, S / 2, S / 2, S * 0.85);
  vig.addColorStop(0, "transparent");
  vig.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, S, S);

  if (state.qrImg) {
    const qrSize = 140;
    const qrX = S - 48 - qrSize;
    const qrY = S - 48 - qrSize;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 8);
    ctx.fill();
    ctx.drawImage(state.qrImg, qrX, qrY, qrSize, qrSize);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = palette.accent + "55";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, S - 6, S - 6);
  ctx.restore();
}
