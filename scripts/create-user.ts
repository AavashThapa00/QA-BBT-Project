import "dotenv/config";
import { createUser } from "@/app/actions/auth";

async function run() {
  const name = process.argv[2];
  const email = process.argv[3];
  const password = process.argv[4];
  const phone = process.argv[5];
  const role = process.argv[6];

  if (!name || !email || !password) {
    console.log("Usage: npm run create-user -- <name> <email> <password> [phone] [admin|super_admin]");
    process.exit(1);
  }

  try {
    await createUser({
      name,
      email,
      password,
      phone,
      role: role as "super_admin" | "admin" | undefined,
    });
    console.log("✅ User created");
  } catch (error) {
    console.error("❌ Failed to create user:", error);
    process.exit(1);
  }
}

run();
