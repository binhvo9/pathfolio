import { defineRailway, github, project, service } from "railway/iac";

// Secrets are NOT defined here (this file is committed to a public repo).
// They're set post-apply via `railway variable set` — see deploy notes in
// CLAUDE.md's 2026-09-13 compute hosting entry.

export default defineRailway(() => {
  const publicHttp = { networking: { serviceDomains: { default: {} } } };

  // rootDirectory stays at the repo root (not the app subfolder): these
  // are npm workspaces, and @pathfolio/shared only resolves when install
  // runs from the root so node_modules gets hoisted/symlinked correctly.
  // `npm run <script> --workspace=<path>` scopes the actual start command.
  const repoRoot = github("binhvo9/pathfolio");

  const apiGateway = service("api-gateway", {
    source: repoRoot,
    deploy: { startCommand: "npm run start --workspace=apps/api-gateway" },
    ...publicHttp,
  });

  const marketData = service("market-data", {
    source: repoRoot,
    deploy: { startCommand: "npm run start --workspace=apps/market-data" },
    ...publicHttp,
  });

  const performanceTracking = service("performance-tracking", {
    source: repoRoot,
    deploy: { startCommand: "npm run start --workspace=apps/performance-tracking" },
    ...publicHttp,
  });

  const insightAi = service("insight-ai", {
    source: repoRoot,
    deploy: { startCommand: "npm run start --workspace=apps/insight-ai" },
    ...publicHttp,
  });

  const simulation = service("simulation", {
    source: repoRoot,
    deploy: { startCommand: "npm run start --workspace=apps/simulation" },
    ...publicHttp,
  });

  const simulationWorker = service("simulation-worker", {
    source: repoRoot,
    deploy: { startCommand: "npm run start:worker --workspace=apps/simulation" },
  });

  return project("pathfolio", {
    resources: [
      apiGateway,
      marketData,
      performanceTracking,
      insightAi,
      simulation,
      simulationWorker,
    ],
  });
});
