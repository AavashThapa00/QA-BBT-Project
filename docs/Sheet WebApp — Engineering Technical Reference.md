# Sheet WebApp — Engineering Technical Reference

Sheet WebApp is a Next.js-based QA issue management platform designed to replace spreadsheet-driven defect tracking.

## Current Data Platform

- MongoDB is the system of record.
- Defects, users, sessions, test cycles, test cases, test executions, and cycle runs are stored in MongoDB collections.
- Server-side APIs and actions read/write through shared MongoDB helpers in `lib/mongodb.ts`.

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (required)
- `MONGODB_DB_NAME`: database name (optional, defaults to `sheet-webapp`)
- `APP_BASE_URL`: application base URL (optional)

## Operational Notes

- Indexes for test execution collections are created lazily by backend services.
- Authentication/session data is persisted in MongoDB collections.
- CSV/manual entry pipelines write defect records directly to MongoDB.
