import { Db, MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "sheet-webapp";

if (!uri) {
  throw new Error("MONGODB_URI environment variable is required");
}

type GlobalMongo = {
  mongoClient?: MongoClient;
};

const globalForMongo = global as unknown as GlobalMongo;

const client =
  globalForMongo.mongoClient ||
  new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = client;
}

let dbPromise: Promise<Db> | null = null;

export async function getMongoDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = client.connect().then(() => client.db(dbName));
  }
  return dbPromise;
}

export const mongoCollections = {
  defects: async () => (await getMongoDb()).collection("defects"),
  users: async () => (await getMongoDb()).collection("users"),
  sessions: async () => (await getMongoDb()).collection("sessions"),
  loginVerificationCodes: async () =>
    (await getMongoDb()).collection("login_verification_codes"),
  passwordResetTokens: async () =>
    (await getMongoDb()).collection("password_reset_tokens"),
  testCycles: async () => (await getMongoDb()).collection("test_cycles"),
  testCases: async () => (await getMongoDb()).collection("test_cases"),
  testExecutions: async () =>
    (await getMongoDb()).collection("test_executions"),
  testCycleRuns: async () => (await getMongoDb()).collection("test_cycle_runs"),
};
