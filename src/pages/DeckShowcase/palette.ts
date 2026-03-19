interface Palette {
  dark: string;
  mid: string;
  accent: string;
  glow: string;
}

const BASE: Record<string, Palette> = {
  W: { dark: "#2a2316", mid: "#5c4520", accent: "#d4b96a", glow: "#fff5cc" },
  U: { dark: "#04102a", mid: "#0d2a5c", accent: "#4a8fd4", glow: "#b3d0ff" },
  B: { dark: "#090909", mid: "#1a1a1a", accent: "#555555", glow: "#aaaaaa" },
  R: { dark: "#1c0606", mid: "#5c1010", accent: "#d4351a", glow: "#ffb3a0" },
  G: { dark: "#081209", mid: "#0d3814", accent: "#2e8b34", glow: "#aaff99" },
};

// Hand-crafted 2-color guild palettes
const GUILD: Record<string, Palette> = {
  WU: { dark: "#0c1520", mid: "#1e3050", accent: "#7ab8e0", glow: "#d0e8ff" }, // Azorius
  UB: { dark: "#060812", mid: "#0d1535", accent: "#5e48a8", glow: "#a080ff" }, // Dimir
  BR: { dark: "#120306", mid: "#2a0810", accent: "#b02820", glow: "#ff6050" }, // Rakdos
  RG: { dark: "#120a02", mid: "#2a1504", accent: "#c86010", glow: "#ffaa40" }, // Gruul — amber/orange
  GW: { dark: "#0c1408", mid: "#1e3010", accent: "#7aaa40", glow: "#d0f080" }, // Selesnya
  WB: { dark: "#130e10", mid: "#2a2030", accent: "#b0a0c0", glow: "#e8ddf0" }, // Orzhov
  UR: { dark: "#080618", mid: "#140c35", accent: "#6040d0", glow: "#c090ff" }, // Izzet
  BG: { dark: "#060c06", mid: "#0f1e0f", accent: "#3a6830", glow: "#70d060" }, // Golgari
  RW: { dark: "#1a0a04", mid: "#3c1408", accent: "#e06020", glow: "#ffb870" }, // Boros
  GU: { dark: "#040e10", mid: "#0a2020", accent: "#30a880", glow: "#80ffe0" }, // Simic
};

const COLORLESS: Palette = { dark: "#131313", mid: "#2c2c2c", accent: "#8a8a8a", glow: "#e0e0e0" };
const MULTI: Palette    = { dark: "#1a1308", mid: "#3d2c08", accent: "#c8a435", glow: "#ffe88a" };
const FIVE: Palette     = { dark: "#120e04", mid: "#3a2c06", accent: "#e0b840", glow: "#fff0a0" };

export function getBasePalette(color: string): Palette | null {
  return BASE[color] ?? null;
}

export function getPalette(colorIdentity: string[]): Palette {
  if (colorIdentity.length === 0) return COLORLESS;
  if (colorIdentity.length === 5) return FIVE;
  if (colorIdentity.length >= 3) return MULTI;
  if (colorIdentity.length === 1) return BASE[colorIdentity[0]] ?? COLORLESS;

  // 2-color: look up guild palette by sorted key
  const key = [...colorIdentity].sort((a, b) => "WUBRG".indexOf(a) - "WUBRG".indexOf(b)).join("");
  return GUILD[key] ?? MULTI;
}

export type { Palette };
