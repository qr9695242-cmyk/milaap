import { hostLevelForDiamonds } from "@/lib/hostLevel";

/** Small 3D pill: 🥇 Gold Host — used on profiles, chat names, leaderboard rows. */
export default function HostLevelBadge({ diamonds = 0, compact = false }) {
  const tier = hostLevelForDiamonds(diamonds);
  const style = { backgroundColor: `${tier.color}22`, color: tier.color, boxShadow: `0 1px 0 rgba(255,255,255,.15) inset, 0 -2px 4px rgba(0,0,0,.2) inset` };

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
        style={style}
        title={tier.name}
      >
        {tier.icon} Lv.{tier.level}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={style}
    >
      {tier.icon} {tier.name}
    </span>
  );
}
