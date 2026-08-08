// Room backgrounds — cosmetic layered CSS gradients applied behind the
// seat grid / video stage. No external art assets needed (works offline,
// tiny payload, loads instantly on slow connections). Each entry is built
// from multiple gradient layers to approximate a scenic "design" look
// (glow, horizon, light spots) instead of a single flat colour swatch.
// Room doc stores just the id in `background`; look it up here to render.

export const BACKGROUND_CATALOG = [
  {
    id: "bg_heart_archway",
    name: "Heart Sunset",
    css: "radial-gradient(ellipse at 50% 100%,#FF9A6C 0%,#E85D75 30%,transparent 60%),linear-gradient(180deg,#3D1030 0%,#7A2050 45%,#C9506B 75%,#FF9A6C 100%)",
  },
  {
    id: "bg_moonlit_beach",
    name: "Moonlit Beach",
    css: "radial-gradient(circle at 75% 20%,#F5F3E7 0%,#DCE6F2 8%,transparent 25%),linear-gradient(180deg,#050914 0%,#0B1C33 55%,#123049 100%)",
  },
  {
    id: "bg_golden_hall",
    name: "Golden Hall",
    css: "radial-gradient(circle at 50% 0%,#FFE9B3 0%,#F0C46A 20%,transparent 55%),linear-gradient(180deg,#2B1B05 0%,#5C3D0F 55%,#8A6420 100%)",
  },
  {
    id: "bg_starry_lanterns",
    name: "Starry Lanterns",
    css: "radial-gradient(circle at 20% 70%,#FF9A4D 0%,transparent 20%),radial-gradient(circle at 60% 40%,#FFC46B 0%,transparent 15%),linear-gradient(160deg,#0B0B1F 0%,#241145 50%,#4A1E5C 100%)",
  },
  {
    id: "bg_cloud_castle",
    name: "Cloud Castle",
    css: "radial-gradient(circle at 70% 10%,#F3D9F7 0%,transparent 35%),linear-gradient(180deg,#2A1245 0%,#6A3B8F 45%,#C98FD1 80%,#F0D9EE 100%)",
  },
  {
    id: "bg_cherry_blossom",
    name: "Cherry Blossom",
    css: "radial-gradient(circle at 30% 20%,#FFD3E0 0%,transparent 30%),radial-gradient(circle at 75% 60%,#FFB6C9 0%,transparent 35%),linear-gradient(180deg,#3A1230 0%,#7A3355 60%,#C97F97 100%)",
  },
  {
    id: "bg_palm_sunset",
    name: "Palm Sunset",
    css: "radial-gradient(ellipse at 50% 95%,#FFD36B 0%,#FF8C5C 25%,transparent 55%),linear-gradient(180deg,#1B0F3D 0%,#6A2350 50%,#E0632E 100%)",
  },
  {
    id: "bg_balcony_cafe",
    name: "Balcony Café",
    css: "radial-gradient(circle at 25% 25%,#FFDFA0 0%,transparent 12%),radial-gradient(circle at 65% 15%,#FFDFA0 0%,transparent 10%),linear-gradient(160deg,#0B0F2B 0%,#1B2255 55%,#2E1E4A 100%)",
  },
  {
    id: "bg_green_valley",
    name: "Green Valley",
    css: "linear-gradient(180deg,#8FD1F0 0%,#B7E4C7 45%,#3E8F5C 75%,#1F4D33 100%)",
  },
  {
    id: "bg_neon_rain",
    name: "Neon Rain City",
    css: "radial-gradient(circle at 20% 40%,#FF3EA5 0%,transparent 25%),radial-gradient(circle at 80% 60%,#3EC6FF 0%,transparent 30%),linear-gradient(180deg,#050510 0%,#100826 55%,#1A0E3D 100%)",
  },
];

export function findBackground(id) {
  return BACKGROUND_CATALOG.find((b) => b.id === id) || BACKGROUND_CATALOG[0];
}
