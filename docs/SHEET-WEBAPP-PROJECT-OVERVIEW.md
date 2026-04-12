# SHEET-WEBAPP Project Overview

## Architecture Summary

Sheet WebApp is a Next.js App Router application using MongoDB as the only database backend.

## Core Components

- Frontend pages and components in `app/`
- Server actions in `app/actions/`
- API routes in `app/api/`
- Backend data helpers in `lib/backend/`
- MongoDB connection and collection access in `lib/mongodb.ts`

## Data Flow

1. UI triggers server actions or API routes.
2. Input is validated with shared schemas.
3. Backend modules read/write MongoDB collections.
4. Responses are returned to UI for rendering.

## Environment

Required:

- `MONGODB_URI`

Optional:

- `MONGODB_DB_NAME`
- `APP_BASE_URL`
