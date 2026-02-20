const env = {
    DATABASE_URL: process.env.DATABASE_URL || "",
};

if (!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL environment variable");
}

export default env;
