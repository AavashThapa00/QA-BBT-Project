import { Pool, QueryResult, QueryResultRow } from "pg";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
}

const globalForDb = global as unknown as { db: Pool };

const pool = globalForDb.db ||
    new Pool({
        connectionString: process.env.DATABASE_URL,
    });

if (process.env.NODE_ENV !== "production") {
    globalForDb.db = pool;
}

export const db = {
    query: <T extends QueryResultRow = QueryResultRow>(text: string, values?: any[]): Promise<QueryResult<T>> => {
        return pool.query(text, values) as Promise<QueryResult<T>>;
    },
    getClient: () => pool.connect(),
    pool,
};
