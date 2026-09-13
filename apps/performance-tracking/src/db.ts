import { MongoClient } from "mongodb";
import type { Allocation } from "@pathfolio/shared";

// PerformanceSnapshots collection — MongoDB Atlas, same cluster as
// Portfolios per CLAUDE.md's storage split. docs/specs/06-performance-tracking.md.

export type SnapshotDoc = {
  portfolioId: string;
  userId: string;
  value: number;
  valueChangePercent: number;
  // Each asset class's contribution to this period's valueChangePercent,
  // in percentage points (they sum to valueChangePercent) — lets the UI
  // show *why* the total moved, not just that it did. Stored at snapshot
  // time (not recomputed later) so old snapshots stay accurate even if
  // today's prices/allocation change.
  assetContributions: Allocation;
  allocationSnapshot: Allocation;
  takenAt: Date;
};

const client = new MongoClient(process.env.DATABASE_URL!);
const db = client.db();

export const snapshots = db.collection<SnapshotDoc>("performance_snapshots");
