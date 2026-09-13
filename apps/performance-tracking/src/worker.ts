import { runSnapshotCycle } from "./snapshot";

// The tumbling-window job itself. Interval-based, not calendar-cron —
// simpler, and matches CLAUDE.md's "configurable via env var" decision:
// short in dev (with mocked/cheap prices), daily/weekly in production.
const intervalMs = Number(process.env.SNAPSHOT_INTERVAL_SECONDS ?? 3600) * 1000;

export function startSnapshotWorker() {
  console.log(`[worker] running a snapshot cycle every ${intervalMs}ms`);
  let running = false;
  setInterval(() => {
    // Guards REQUIREMENTS.md's NFR-S-3 — without this, a cycle that runs
    // long (a slow provider call) could still be inserting snapshots when
    // the next tick fires, creating duplicates for the same window.
    if (running) {
      console.warn("[worker] previous cycle still running, skipping this tick");
      return;
    }
    running = true;
    runSnapshotCycle()
      .then(({ portfoliosSnapshotted }) => console.log(`[worker] snapshotted ${portfoliosSnapshotted} portfolio(s)`))
      .catch((err) => console.error("[worker] cycle error:", err))
      .finally(() => {
        running = false;
      });
  }, intervalMs);
}
