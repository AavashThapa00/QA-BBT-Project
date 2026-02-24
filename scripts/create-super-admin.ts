import "dotenv/config";
import { createUser } from "@/app/actions/auth";

async function run() {
  const name = process.argv[2];
  const email = process.argv[3];
  const password = process.argv[4];
  const phone = process.argv[5];

  if (!name || !email || !password) {
    console.log("Usage: npm run create-super-admin -- <name> <email> <password> [phone]");
    process.exit(1);
  }

  try {
    await createUser({ name, email, password, phone, role: "super_admin" });
    console.log("✅ Super admin created");
  } catch (error) {
    console.error("❌ Failed to create super admin:", error);
    process.exit(1);
  }
}

run();
