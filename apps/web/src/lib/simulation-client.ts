// Server-side-only client for calling apps/simulation, via the API
// Gateway (docs/specs/08-api-gateway.md) rather than Simulation's own
// URL directly — apps/web only needs to know one address for every
// backend service now. Never imported by client components — the
// internal API key must never reach the browser. This is the
// trusted-caller boundary described in apps/simulation/.env next to
// INTERNAL_API_KEY: apps/web verifies the NextAuth session, then
// forwards the real userId here; the Gateway itself doesn't check this
// key, it's a pure router, so Simulation still enforces it same as ever.

const BASE_URL = `${process.env.GATEWAY_URL}/simulation`;
const API_KEY = process.env.INTERNAL_API_KEY!;

function headers(userId: string) {
  return {
    "Content-Type": "application/json",
    "x-internal-api-key": API_KEY,
    "x-user-id": userId,
  };
}

export async function listScenarios(userId: string) {
  const res = await fetch(`${BASE_URL}/portfolios`, { headers: headers(userId), cache: "no-store" });
  if (!res.ok) throw new Error(`Simulation service error: ${res.status}`);
  return res.json();
}

export class SimulationServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function createScenario(userId: string, name: string, allocation: unknown) {
  const res = await fetch(`${BASE_URL}/portfolios`, {
    method: "POST",
    headers: headers(userId),
    body: JSON.stringify({ name, allocation }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new SimulationServiceError(res.status, body.error ?? `Simulation service error: ${res.status}`);
  }
  return res.json();
}

export async function deleteScenario(userId: string, id: string) {
  const res = await fetch(`${BASE_URL}/portfolios/${id}`, { method: "DELETE", headers: headers(userId) });
  if (!res.ok && res.status !== 204) throw new Error(`Simulation service error: ${res.status}`);
}

export async function setScenarioStatus(userId: string, id: string, action: "activate" | "archive") {
  const res = await fetch(`${BASE_URL}/portfolios/${id}/${action}`, { method: "PATCH", headers: headers(userId) });
  if (!res.ok) throw new Error(`Simulation service error: ${res.status}`);
  return res.json();
}
