import { Redis } from "@upstash/redis";
import { USER_ONBOARDED_STREAM, type UserOnboardedEvent } from "@pathfolio/shared";
import { createPortfolio } from "./repository";

// Consumes UserOnboarded — docs/diagrams/sequence/onboarding.md,
// docs/specs/04-portfolio-simulation.md's "Seeding" behavior.
//
// Upstash Redis is REST-based (no persistent connection), so a real
// blocking XREAD isn't possible here — this polls XREADGROUP on an
// interval instead. Trade-off: a few seconds of latency before the first
// scenario appears, which is fine since the user already saw their
// allocation on the Onboarding result screen (docs/diagrams/wireframes/
// onboarding-flow.md screen 7) — this just seeds data quietly behind it.

const GROUP = "simulation-workers";
const CONSUMER = `worker-${process.pid}`;
const POLL_INTERVAL_MS = 2000;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type StreamEntry = [id: string, fields: unknown[]];
type XReadGroupResult = [stream: string, entries: StreamEntry[]][];

function fieldsToPayload(fields: unknown[]): UserOnboardedEvent {
  const record = Object.fromEntries(
    Array.from({ length: fields.length / 2 }, (_, i) => [fields[i * 2], fields[i * 2 + 1]])
  );
  const raw = record.payload;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as UserOnboardedEvent);
}

async function ensureGroup() {
  try {
    await redis.xgroup(USER_ONBOARDED_STREAM, {
      type: "CREATE",
      group: GROUP,
      id: "0",
      options: { MKSTREAM: true },
    });
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("BUSYGROUP")) throw err;
  }
}

async function pollOnce() {
  // Explicit tuple typing so TS picks the (key: string) overload, not the
  // (key: string[]) one — with plain string args it can't disambiguate.
  const args: [string, string, string, string, { count: number }] = [
    GROUP,
    CONSUMER,
    USER_ONBOARDED_STREAM,
    ">",
    { count: 10 },
  ];
  const result = (await redis.xreadgroup(...args)) as XReadGroupResult | null;

  if (!result) return;

  for (const [, entries] of result) {
    for (const [id, fields] of entries) {
      const event = fieldsToPayload(fields);
      await createPortfolio(event.userId, "My First Portfolio", event.defaultAllocation, "onboarding-default");
      await redis.xack(USER_ONBOARDED_STREAM, GROUP, id);
      console.log(`[worker] seeded first portfolio for user ${event.userId}`);
    }
  }
}

async function main() {
  await ensureGroup();
  console.log(`[worker] polling ${USER_ONBOARDED_STREAM} every ${POLL_INTERVAL_MS}ms`);
  setInterval(() => {
    pollOnce().catch((err) => console.error("[worker] poll error:", err));
  }, POLL_INTERVAL_MS);
}

main();
