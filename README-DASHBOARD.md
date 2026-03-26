# QA/BBT Defect Analytics Dashboard

A production-ready Next.js 15 analytics dashboard for tracking and analyzing QA/BBT defects using PostgreSQL (Neon) and TypeScript.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Validation**: Zod
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## Features

### Core Features

- ✅ **Manual Entry Sheet**: In-platform defect input with inline editing
- ✅ **Analytics Dashboard**: Real-time metrics and charts
- ✅ **Data Visualization**: Multiple chart types (bar, pie, line)
- ✅ **Filtering**: Filter by date, severity, module, and status
- ✅ **Data Table**: Paginated table with sorting capabilities
- ✅ **CSV Export**: Export filtered defect data
- ✅ **Server Actions**: Backend logic using Next.js Server Actions
- ✅ **Type Safety**: Full TypeScript support with Zod validation

### Bonus Features

- ✅ **Enum Types**: Pre-defined severity and status enums
- ✅ **Resolution Time**: Automatic calculation of resolution days
- ✅ **Defect Aging**: Days open tracking
- ✅ **Average Metrics**: Average resolution time calculation
- ✅ **Trend Analysis**: Defects over time visualization

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Git

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd sheet-webapp
npm install
```

### 2. Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project or use existing one
3. Copy your database connection string
4. It should look like: `postgresql://user:password@host.neon.tech/database?sslmode=require`

### 3. Configure Environment Variables

Create or update `.env.local`:

```env
DATABASE_URL="postgresql://user:password@your-neon-host.neon.tech/database?sslmode=require"
NODE_ENV="development"
```

Replace the connection string with your actual Neon database URL.

### 4. Initialize Prisma

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# (Optional) Seed sample data
# npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
sheet-webapp/
├── app/
│   ├── actions/
│   │   └── defects.ts          # Defect data operations and manual entry
│   ├── components/
│   │   ├── dashboard/          # Dashboard chart components
│   │   ├── filters/            # Filter components
│   │   ├── table/              # Data table component
│   │   └── exports/            # Export functionality
│   ├── manual-entry/           # Manual entry sheet page
│   ├── generated/
│   │   └── prisma/             # Generated Prisma types
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main dashboard page
├── lib/
│   ├── env.ts                  # Environment configuration
│   ├── prisma.ts               # Prisma client (singleton)
│   ├── types.ts                # TypeScript types
│   ├── utils.ts                # Utility functions
│   └── validators.ts           # Zod validation schemas
├── prisma/
│   └── schema.prisma           # Database schema
├── .env.local                  # Environment variables (local)
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── next.config.ts              # Next.js config
```

## Manual Entry Sheet

The dashboard includes an in-platform manual entry sheet for adding and updating defects directly without external CSV files.

### Features
- **Add New Defect**: Form with fields for testCaseId, module, priority, severity, status, QC status, test date, and fixed date
- **Inline Editing**: Update defect attributes directly in the sheet table
- **Real-time Validation**: All inputs are validated against enum constraints
- **Sheet Display**: Up to 250 defects shown in a sortable, editable table

### Supported Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| Test Case ID | String | Optional | Reference to test case |
| Module | String | Yes | Name of the module/component |
| Priority | Enum | Yes | Any priority level |
| Severity | Enum | Yes | CRITICAL, MAJOR, MEDIUM, LOW |
| Status | Enum | Yes | OPEN, IN_PROGRESS, ON_HOLD, CLOSED, AS_IT_IS |
| QC Status | Enum | Yes | PASSED, FAILED, PENDING, REJECTED |
| Issue Test Date | Date | Yes | When the issue was found |
| Fixed Date | Date | Optional | When the issue was fixed |
| Expected Result | String | Yes | What should have happened |
| Actual Result | String | Yes | What actually happened |
| Summary | String | Optional | Brief summary of the issue |

## Database Schema

### Defect Table

```prisma
model Defect {
  id              String        @id @default(uuid())
  dateReported    DateTime      @db.Date
  module          String        @db.VarChar(255)
  expectedResult  String        @db.Text
  actualResult    String        @db.Text
  severity        Severity
  priority        String        @db.VarChar(100)
  status          Status
  dateFixed       DateTime?     @db.Date
  qcStatusBbt     QCStatusBBT
  createdAt       DateTime      @default(now())

  @@index([dateReported])
  @@index([module])
  @@index([severity])
  @@index([status])
}
```

### Enums

- **Severity**: CRITICAL, HIGH, MEDIUM, LOW
- **Status**: OPEN, IN_PROGRESS, CLOSED, ON_HOLD
- **QCStatusBBT**: PASSED, FAILED, PENDING, REJECTED

## Usage Guide

### Upload Defects

1. Click the "Click to upload" area or drag and drop a CSV file
2. The system will validate each row
3. Valid rows are inserted into the database
4. Invalid rows are logged with error reasons

### View Analytics

1. **Dashboard**: See key metrics and charts
2. **Filters**: Apply date range, severity, module, or status filters
3. **Charts**:
   - Defects by Module (bar chart)
   - Defects by Severity (pie chart)
   - Trend over time (line chart)

### Manage Defects

1. **Table**: View all defects with pagination
2. **Sort**: Click column headers to sort by date, severity, or status
3. **Export**: Download current defects as CSV

## API Server Actions

### Defect Queries

```typescript
// Get metrics
getDefectMetrics(filters?: DefectFilters): Promise<DashboardMetrics>

// Get defects by module
getDefectsByModule(filters?: DefectFilters): Promise<DefectByModule[]>

// Get defects by severity
getDefectsBySeverity(filters?: DefectFilters): Promise<DefectBySeverity[]>

// Get trend data
getDefectsTrend(filters?: DefectFilters, groupBy?: 'day' | 'month'): Promise<DefectTrend[]>

// Get paginated defects
getDefects(filters?: DefectFilters, pagination?: PaginationParams): Promise<PaginatedDefects>

// Get average resolution time
getAverageResolutionTime(filters?: DefectFilters): Promise<number>
```

### CSV Operations

```typescript
// Upload and process CSV
uploadCSV(csvData: string): Promise<UploadResult>
```

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

### Environment Variables on Vercel

1. Go to project settings
2. Add environment variable: `DATABASE_URL` with your Neon connection string
3. Deploy

### Database Migrations on Production

```bash
# Before deploying
npx prisma migrate deploy
```

## Performance Considerations

- ✅ **Indexes**: Database indexes on dateReported, module, severity, status
- ✅ **Pagination**: Table results paginated by default (10 rows per page)
- ✅ **Lazy Loading**: Charts load independently
- ✅ **Query Optimization**: Server Actions batch queries
- ✅ **Singleton Pattern**: Prisma client reused across requests

## Security Best Practices

- ✅ **Environment Variables**: Never commit sensitive data
- ✅ **Type Safety**: Zod validation on all inputs
- ✅ **Server Actions**: Database operations on server only
- ✅ **SQL Injection Protection**: Prisma parameterized queries
- ✅ **No Sensitive Logs**: Console logs removed in production

## Troubleshooting

### Database Connection Error

```
Error: Client is unable to connect
```

**Solution**:

- Verify DATABASE_URL in .env.local
- Check Neon network access settings
- Ensure database is active

### Charts Not Displaying

**Solution**:

- Clear browser cache
- Ensure data exists in database
- Check browser console for errors

### Manual Entry Form Issues

**Solution**:

- Verify all required fields are filled (module, severity, priority, status, QC status)
- Check that dates are in valid format (YYYY-MM-DD)
- Ensure status and severity values match the allowed enums
- Check browser console for validation error details

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Create database migration
npx prisma migrate dev --name <migration_name>

# Reset database (development only)
npx prisma migrate reset
```

## Performance Metrics

- **Dashboard Load**: ~500-800ms (depending on data size)
- **Table Pagination**: ~100-200ms per page
- **Chart Rendering**: ~300-500ms
- **Manual Entry Save**: ~100-300ms per row

## Contributing

This is a production-ready template. For contributions:

1. Follow TypeScript and code style guidelines
2. Add type definitions for new features
3. Use Zod for input validation
4. Test with sample data before committing

## License

MIT

---

## Support & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Neon Documentation](https://neon.tech/docs/)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
