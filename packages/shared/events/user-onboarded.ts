import type { Allocation } from "../types/allocation";

// The one real async event in the system — docs/diagrams/c4/container.md.
// Published by apps/web (Onboarding), consumed by apps/simulation.
export const USER_ONBOARDED_STREAM = "pathfolio:user-onboarded";

export type UserOnboardedEvent = {
  userId: string;
  defaultAllocation: Allocation;
};
