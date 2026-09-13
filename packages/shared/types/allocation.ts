// Shared across services per REQUIREMENTS.md NFR-M-2 — the 6 asset
// classes decided in CLAUDE.md's 2026-08-29 entry. Both Onboarding
// (computes it) and Simulation (stores it) need the exact same shape.

export const ASSET_CLASSES = ["stocks", "bonds", "cash", "crypto", "gold", "realEstate"] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];
export type Allocation = Record<AssetClass, number>;

// Used by Portfolio Simulation to validate manually-created scenarios
// (docs/specs/04-portfolio-simulation.md) — all 6 classes present,
// non-negative, summing to 100 within a small rounding tolerance.
export function isValidAllocation(value: unknown): value is Allocation {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!ASSET_CLASSES.every((cls) => typeof obj[cls] === "number" && (obj[cls] as number) >= 0)) {
    return false;
  }
  const sum = ASSET_CLASSES.reduce((s, cls) => s + (obj[cls] as number), 0);
  return Math.abs(sum - 100) < 0.5;
}
