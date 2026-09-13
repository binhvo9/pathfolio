import type { RiskBand, IncomeTiltBand } from "@/generated/prisma/client";
import { ASSET_CLASSES, type Allocation } from "@pathfolio/shared";

// AllocationEngineModule (docs/diagrams/c4/component-onboarding.md) —
// base table x income tilt adjustment -> clamp -> renormalize, per
// docs/specs/03-allocation-engine.md. Asset classes come from
// @pathfolio/shared per REQUIREMENTS.md NFR-M-2.

const BASE_ALLOCATION: Record<RiskBand, Allocation> = {
  CONSERVATIVE: { stocks: 20, bonds: 50, cash: 20, crypto: 0, gold: 5, realEstate: 5 },
  BALANCED: { stocks: 40, bonds: 30, cash: 10, crypto: 5, gold: 5, realEstate: 10 },
  GROWTH: { stocks: 55, bonds: 15, cash: 5, crypto: 10, gold: 5, realEstate: 10 },
  AGGRESSIVE: { stocks: 60, bonds: 5, cash: 5, crypto: 20, gold: 5, realEstate: 5 },
};

const INCOME_TILT_ADJUSTMENT: Record<IncomeTiltBand, Allocation> = {
  INCOME_FOCUSED: { stocks: -10, bonds: 10, cash: 0, crypto: -5, gold: 0, realEstate: 5 },
  BALANCED: { stocks: 0, bonds: 0, cash: 0, crypto: 0, gold: 0, realEstate: 0 },
  GROWTH_FOCUSED: { stocks: 10, bonds: -10, cash: 0, crypto: 5, gold: 0, realEstate: -5 },
};

export function computeDefaultAllocation(riskBand: RiskBand, incomeTiltBand: IncomeTiltBand): Allocation {
  const base = BASE_ALLOCATION[riskBand];
  const adjustment = INCOME_TILT_ADJUSTMENT[incomeTiltBand];

  // apply adjustment, then clamp negatives to 0
  const clamped = Object.fromEntries(
    ASSET_CLASSES.map((cls) => [cls, Math.max(0, base[cls] + adjustment[cls])])
  ) as Allocation;

  // renormalize so the total is exactly 100 again
  const total = ASSET_CLASSES.reduce((sum, cls) => sum + clamped[cls], 0);
  return Object.fromEntries(
    ASSET_CLASSES.map((cls) => [cls, (clamped[cls] / total) * 100])
  ) as Allocation;
}
