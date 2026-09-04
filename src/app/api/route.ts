import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Production health probe: verifies process uptime and database
// connectivity. Returns 503 so load balancers / orchestrators can
// pull the instance when the database is unreachable.
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await (db as unknown as { $queryRaw: (q: TemplateStringsArray) => Promise<unknown> })
      .$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "up",
      latencyMs: Date.now() - startedAt,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        db: "down",
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
