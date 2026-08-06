export const VIP_TIERS = [
  { level: 0, name: "No VIP", minSpendRs: 0, color: "#9E93B5" },
  { level: 1, name: "VIP 1", minSpendRs: 1000, color: "#8B5CF6" },
  { level: 2, name: "VIP 2", minSpendRs: 5000, color: "#FF3B7F" },
  { level: 3, name: "VIP 3", minSpendRs: 15000, color: "#FF8A3D" },
  { level: 4, name: "SVIP", minSpendRs: 50000, color: "#F5C34D" },
];

export function vipLevelForSpend(totalRechargedRs = 0) {
  let current = VIP_TIERS[0];
  for (const tier of VIP_TIERS) {
    if (totalRechargedRs >= tier.minSpendRs) current = tier;
  }
  return current;
}

export function nextVipTier(totalRechargedRs = 0) {
  return VIP_TIERS.find((t) => t.minSpendRs > totalRechargedRs) || null;
}
