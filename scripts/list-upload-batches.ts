import "dotenv/config";
import { db } from "../lib/prisma";

async function main() {
  const result = await db.query<{
    source: string;
    count: number;
    latest: string;
  }>(
    `SELECT COALESCE("sourceFile", 'manual') AS source,
            COUNT(*)::int AS count,
            MAX("createdAt")::text AS latest
     FROM defect
     GROUP BY 1
     ORDER BY MAX("createdAt") DESC`
  );

  console.table(result.rows);
}

main()
  .catch((error) => {
    console.error("Failed to list upload batches:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
