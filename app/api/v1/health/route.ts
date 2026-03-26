import { ok } from "@/lib/backend/http";

export async function GET() {
  return ok({
    service: "sheet-webapp-api",
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "v1",
  });
}
