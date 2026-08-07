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

function VehicleGlyph({ id }) {
  const type = id.includes("bike") || id.includes("bicycle") || id.includes("scooter") || id.includes("snowmobile") ? "bike" : id.includes("boat") || id.includes("yacht") || id.includes("jetski") ? "boat" : id.includes("jet") || id.includes("rocket") || id.includes("ufo") ? "air" : id.includes("heli") ? "heli" : id.includes("dragon") || id.includes("griffin") || id.includes("phoenix") ? "mount" : "car";
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true">
      <defs><linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".35" stopColor="#6ee7f2"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
      {type === "car" && <><path d="M18 50 30 30h45l18 20v15H18Z" fill="url(#body)" stroke="#fff" strokeWidth="2"/><path d="m38 32 8-11h19l9 11" fill="none" stroke="#fff" strokeWidth="4"/><circle cx="35" cy="65" r="9" fill="#111827" stroke="#d7eaff" strokeWidth="3"/><circle cx="78" cy="65" r="9" fill="#111827" stroke="#d7eaff" strokeWidth="3"/></>}
      {type === "bike" && <><circle cx="33" cy="58" r="13" fill="none" stroke="#d7eaff" strokeWidth="4"/><circle cx="86" cy="58" r="13" fill="none" stroke="#d7eaff" strokeWidth="4"/><path d="M33 58 48 36h17l21 22M48 36l-8-9m25 9 8-12" fill="none" stroke="url(#body)" strokeWidth="5" strokeLinecap="round"/></>}
      {type === "boat" && <><path d="M18 49h84l-13 16H31Z" fill="url(#body)" stroke="#fff" strokeWidth="2"/><path d="M42 49V29h30v20M52 29v-9h11v9" fill="none" stroke="#fff" strokeWidth="4"/><path d="M22 70c15-8 30 8 45 0s30 8 35 0" fill="none" stroke="#5ed4e8" strokeWidth="4"/></>}
      {type === "air" && <><path d="M60 13 70 43l32 14-3 7-36-9-36 9-3-7 32-14Z" fill="url(#body)" stroke="#fff" strokeWidth="2"/><path d="M52 43 42 24h12l6 19m0 0 10-19H58" fill="none" stroke="#fff" strokeWidth="3"/></>}
      {type === "heli" && <><path d="M31 45h55c7 0 12 5 12 11s-5 9-12 9H37c-10 0-17-5-17-12s5-8 11-8Z" fill="url(#body)" stroke="#fff" strokeWidth="2"/><path d="M58 45V30m-25 2h50M45 30h28" stroke="#fff" strokeWidth="4" strokeLinecap="round"/><path d="M85 57h20" stroke="#fff" strokeWidth="4"/></>}
      {type === "mount" && <><path d="M18 66 40 27l14 22 13-25 35 42H18Z" fill="url(#body)" stroke="#fff" strokeWidth="3"/><circle cx="72" cy="40" r="4" fill="#fff"/><path d="M79 41h10" stroke="#fff" strokeWidth="3"/></>}
    </svg>
  );
}

export default function DecorationArt({ type = "vehicle", id = "", className = "" }) {
  if (type === "frame") {
    return <FrameGlyph kind={frameSymbols[id] || "ring"} />;
  }

  return (
    <img
      src={`/vehicle-frames/${id}.jpg`}
      alt=""
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
    />
  );
}
