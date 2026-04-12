# QA/BBT Defect Analytics Dashboard

A Next.js analytics dashboard for tracking and analyzing QA/BBT defects with MongoDB.

## Tech Stack

- Next.js (App Router)
- TypeScript
- MongoDB
- Zod
- Recharts
- Tailwind CSS

## Setup

1. Install dependencies:
   - `npm install`
2. Configure environment variables in `.env.local`:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME` (optional, defaults to `sheet-webapp`)
   - `APP_BASE_URL` (optional)
3. Seed initial data if needed:
   - `npm run seed-mongodb`
4. Start the app:
   - `npm run dev`

## Useful Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run upload-csv`
- `npm run create-user`
- `npm run create-super-admin`
- `npm run seed-mongodb`
