import "dotenv/config";
import { db } from "@/lib/prisma";

async function addUserRoleColumn() {
  try {
    console.log("Adding role column to user table...");

    await db.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'admin'
    `);

    await db.query(`
      UPDATE "user" SET role = 'admin' WHERE role IS NULL OR role = 'user'
    `);

    console.log("✅ role column added/updated successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addUserRoleColumn();
