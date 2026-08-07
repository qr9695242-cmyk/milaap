"use client";

const frameSymbols = {
  frame_none: "",
  frame_silver: "ring",
  frame_bronze: "ring",
  frame_denim: "ring",
  frame_mint: "leaf",
  frame_coral: "coral",
  frame_rose: "rose",
  frame_ocean: "wave",
  frame_amber: "sun",
  frame_violet: "gem",
  frame_sapphire: "gem",
  frame_emerald_vine: "leaf",
  frame_phoenix: "wings",
  frame_dragon: "dragon",
  frame_falcon: "bird",
  frame_wolf: "wolf",
  frame_fox: "fox",
  frame_lotus: "flower",
  frame_serpent: "snake",
  frame_royal: "crown",
  frame_galaxy: "star",
  frame_eagle: "bird",
  frame_griffin: "lion",
  frame_inferno: "mask",
  frame_empress: "crown",
  frame_vortex: "gem",
  frame_svip_aurora: "aurora",
  frame_svip_eclipse: "eclipse",
  frame_svip_zenith: "star",
  frame_cosmic_throne: "crown",
};

function FrameGlyph({ kind }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".45" stopColor="#f6c34d" />
          <stop offset="1" stopColor="#7b4b10" />
        </linearGradient>
        <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffffff" /><stop offset=".5" stopColor="#aab5c8" /><stop offset="1" stopColor="#536173" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#metal)" strokeWidth="7" opacity=".9" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,.38)" strokeWidth="1.5" />
      {kind === "ring" && <circle cx="50" cy="50" r="24" fill="none" stroke="url(#silver)" strokeWidth="5" />}
      {kind === "leaf" && <path d="M50 72C27 61 29 34 56 25c5 22-1 37-6 47Z" fill="none" stroke="#72e0b1" strokeWidth="6"/><path d="M50 68 55 35" stroke="#d7fff0" strokeWidth="3"/>}
      {kind === "coral" && <path d="M31 69c3-19 1-27 8-35m4 35c2-13 8-20 8-31m4 32c1-13 9-18 13-28" fill="none" stroke="#ff8b78" strokeWidth="5" strokeLinecap="round"/>}
      {kind === "rose" && <path d="M50 72c-13-7-22-20-12-31 8-8 18-2 12 6-6-8 6-15 13-8 10 11 0 26-13 33Z" fill="none" stroke="#ff5c9a" strokeWidth="5"/>}
      {kind === "wave" && <path d="M20 58c10-18 20 18 30 0s20 18 30 0" fill="none" stroke="#64dcf0" strokeWidth="7" strokeLinecap="round"/>}
      {kind === "sun" && <circle cx="50" cy="50" r="15" fill="#ffd36a"/><circle cx="50" cy="50" r="27" fill="none" stroke="#ff9e34" strokeWidth="3" strokeDasharray="3 7"/>}
      {kind === "gem" && <path d="m50 20 25 25-25 35-25-35Z" fill="none" stroke="#9eeeff" strokeWidth="6"/><path d="M35 45h30L50 80" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="2"/>}
      {kind === "wings" && <path d="M49 72C35 61 23 59 15 45c12 0 25 3 35 14C40 41 31 32 20 27c16-2 28 6 31 22 3-16 15-24 31-22-11 5-20 14-30 32 10-11 23-14 35-14-8 14-20 16-38 27Z" fill="none" stroke="#ffb85a" strokeWidth="4"/>}
      {kind === "dragon" && <path d="M24 66c9-31 35-41 53-24-10 1-16 5-20 12 9-3 17-1 21 6-17 0-25 11-32 15l-7-10-15 4Z" fill="none" stroke="#45df96" strokeWidth="5"/>}
      {(kind === "bird" || kind === "eagle") && <path d="M20 58c11-21 26-28 31-7 8-16 18-18 29-13-8 4-12 10-14 18-13-8-24-4-31 10Z" fill="none" stroke="#dce9ff" strokeWidth="6"/>}
      {kind === "wolf" && <path d="M29 68 24 38l14 7 12-13 12 13 14-7-5 30-20 10Z" fill="none" stroke="#ff6b6b" strokeWidth="5"/><circle cx="43" cy="54" r="2" fill="#fff"/><circle cx="57" cy="54" r="2" fill="#fff"/>}
      {kind === "fox" && <path d="M29 67 27 36l16 10 7-8 7 8 16-10-2 31-21 12Z" fill="none" stroke="#8bdcff" strokeWidth="5"/>}
      {kind === "flower" && <g fill="none" stroke="#ffd76a" strokeWidth="5"><circle cx="50" cy="50" r="9"/><circle cx="50" cy="29" r="11"/><circle cx="50" cy="71" r="11"/><circle cx="29" cy="50" r="11"/><circle cx="71" cy="50" r="11"/></g>}
      {kind === "snake" && <path d="M24 70c28-43 30 28 52-25" fill="none" stroke="#52ff9c" strokeWidth="7" strokeLinecap="round"/><circle cx="75" cy="45" r="4" fill="#d9b6ff"/>}
      {kind === "crown" && <path d="m24 66 6-35 20 17 20-17 6 35H24Z" fill="none" stroke="url(#metal)" strokeWidth="6"/><path d="M29 73h42" stroke="#fff" strokeWidth="3"/>}
      {kind === "star" && <path d="m50 22 7 19 20 1-16 13 5 20-16-11-16 11 5-20-16-13 20-1Z" fill="none" stroke="#ffd66a" strokeWidth="5"/>}
      {kind === "lion" && <circle cx="50" cy="52" r="24" fill="none" stroke="#ffd66a" strokeWidth="6"/><path d="M38 54c5 9 19 9 24 0M41 45h1m17 0h1" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>}
      {kind === "mask" && <path d="M25 38c17-10 33-10 50 0v21c-14 15-36 15-50 0Z" fill="none" stroke="#ff8a45" strokeWidth="6"/><path d="M35 51h8m14 0h8" stroke="#fff" strokeWidth="4"/>}
      {kind === "aurora" && <path d="M20 66c12-30 22-31 30-5 8-26 18-25 30 5" fill="none" stroke="#64e9ff" strokeWidth="5"/><path d="M25 72c12-20 22-21 25-4 6-17 16-16 25 4" fill="none" stroke="#ff5ca9" strokeWidth="4"/>}
      {kind === "eclipse" && <><circle cx="50" cy="50" r="22" fill="#0b0b12" stroke="#f6c34d" strokeWidth="5"/><circle cx="59" cy="43" r="17" fill="#f6c34d"/></>}
    </svg>
  );
}

const VEHICLE_IMAGES = {
  veh_bike: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bauhaus_bicycle%2C_Groningen_%282019%29.jpg",
  veh_scooter: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Electric_scooter_%2851950182293%29.jpg",
  veh_skateboard: "https://commons.wikimedia.org/wiki/Special:Redirect/file/SkateBoard_2429.jpg",
  veh_hoverboard: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hover_board_%28hovering%29.jpg",
  veh_bicycle: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Vintage_Bicycles.jpg",
  veh_sedan: "https://commons.wikimedia.org/wiki/Special:Redirect/file/1997-1999_Mazda_626_%28GF%29_Classic_sedan_01.jpg",
  veh_cruiser: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cruiser_Motorcycle.jpg",
  veh_speedboat: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Speed_boat_%281%29.jpg",
  veh_convertible: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sports_car_%2814931023217%29.jpg",
  veh_atv: "https://commons.wikimedia.org/wiki/Special:Redirect/file/ATV_%28All-Terrain_Vehicles%29.jpg",
  veh_snowmobile: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Snowmobile_%285316247616%29.jpg",
  veh_sports: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ferrari_.jpg",
  veh_yacht: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Luxury_yacht.jpg",
  veh_racebike: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cruiser_Motorcycle.jpg",
  veh_armored: "https://commons.wikimedia.org/wiki/Special:Redirect/file/SsangYong_Chairman_CW600_W200_Classic_Black_%282%29.jpg",
  veh_jetski: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jet_ski.jpg",
  veh_heli: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Helicopter.jpg",
  veh_monstertruck: "https://commons.wikimedia.org/wiki/Special:Redirect/file/ATV_%28All-Terrain_Vehicles%29.jpg",
  veh_jet: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Private_Jet_%2829791079234%29.jpg",
  veh_supercar: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ferrari_LaFerrari_1.jpg",
  veh_limo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/SsangYong_Chairman_CW600_W200_Classic_Black_%282%29.jpg",
  veh_icechariot: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Private_Jet_%2829791079234%29.jpg",
  veh_dragonmount: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cruiser_Motorcycle.jpg",
  veh_griffinmount: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cruiser_Motorcycle.jpg",
  veh_rocket: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Private_Jet_%2829791079234%29.jpg",
  veh_ufo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Helicopters.jpg",
  veh_chariot: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Private_Jet_%2829791079234%29.jpg",
  veh_phoenixflyer: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Private_Jet_%2829791079234%29.jpg",
  veh_throne: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Luxury_yacht.jpg",
};

function VehiclePhoto({ id }) {
  const src = VEHICLE_IMAGES[id] || VEHICLE_IMAGES.veh_bike;
  return (
    <div className="vehicle-photo" aria-hidden="true">
      <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
      <span className="vehicle-photo-shine" />
    </div>
  );
}

export default function DecorationArt({ type = "vehicle", id = "", className = "" }) {
  return type === "frame" ? (
    <FrameGlyph kind={frameSymbols[id] || "ring"} />
  ) : (
    <VehiclePhoto id={id} />
  );
}
