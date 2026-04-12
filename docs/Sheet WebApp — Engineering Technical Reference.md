# Sheet WebApp — Engineering Technical Reference

## 1. Summary for Engineers

Sheet WebApp is a Next.js-based QA issue management platform designed to replace spreadsheet-driven defect tracking. It standardizes ingestion (CSV/XLSX and manual input), enforces validation and role-based access, and exposes analytics-oriented dashboards backed by PostgreSQL.

Key goals:

- Centralize all QA issue data and ownership.
- Reduce ingestion errors via schema validation and normalization.
- Provide consistent, query-driven analytics for teams and leadership.

## 2. System Scope and Boundaries

This document focuses on the **technical** operating model, internal data flows, and system boundaries. It is intentionally different in structure from other docs in this directory and should be treated as the engineering reference.

Out of scope:

- Product marketing description
- UX walkthroughs beyond data flow specifics

## 3. Stack and Runtime Model

### 3.1 Frontend runtime

- Next.js (App Router) with React
- TailwindCSS and Recharts for UI and visualization
- UI state is filter-driven; the data source remains server-authoritative

### 3.2 Backend execution

- Server Actions and API Routes host business logic
- Zod validation guards every ingest and mutation entry point
- Prisma is used for schema definitions and typed artifacts

### 3.3 Data platform

- PostgreSQL as the current system of record
- MongoDB planned for selective read models in a staged migration

## 4. Data Lifecycle (Technical)

### 4.1 Ingestion pipeline

1. Input is accepted from XLSX/CSV or manual form entry.
2. Parser handles headers, quoted values, and normalization rules.
3. Validation enforces required fields and enum constraints.
4. Dedup checks run before persistence.
5. Valid rows are stored with audit fields (source file, uploader, timestamps).

### 4.2 Issue lifecycle

- Issue status transitions are tracked across OPEN → IN_PROGRESS → ON_HOLD → CLOSED/AS_IT_IS.
- QC state provides a second verification lifecycle (PASSED/FAILED/PENDING/REJECTED).
- All states are designed for analytics aggregation and compliance tracking.

### 4.3 Analytics generation

- Aggregations are server-side and filter-aware.
- Metrics are derived from current persisted state and exposed to dashboards.
- Export endpoints reuse the same query filters to prevent mismatch.

### 4.4 Validation and normalization rules (engineering)

- Dates accept multiple formats and normalize to a canonical ISO date for storage.
- Severity, status, and QC enums are normalized to strict allowed values.
- Column aliases map heterogeneous spreadsheet headers into a stable field set.
- Missing required fields result in rejection with a row-level error report.

### 4.5 Error handling and failure modes

- Upload errors return a structured error payload including row index and reason.
- Partial batch success is allowed; invalid rows are skipped with reasons.
- Persistence failures return user-safe errors without leaking SQL details.
- Admin actions return explicit success/failure messages for audit clarity.

## 5. Security and Access Control

- Authenticated sessions are stored server-side and enforced in middleware.
- Authorization uses role segmentation (User/Admin/Super Admin).
- Privileged operations are guarded in server actions to avoid client bypass.
- Cookies are HTTP-only with explicit expiry for session lifecycle control.

### 5.1 Authentication mechanisms (engineering)

- Credentials are validated server-side against stored hashes.
- OAuth flows resolve user identity then attach role permissions.
- Middleware enforces authentication for protected routes before page load.

### 5.2 Authorization enforcement

- Role checks are performed within server actions, not only in UI.
- Super Admin gates include: role changes, user creation, deletion, resets.
- Self-delete is blocked to prevent accidental privilege loss.

## 6. Data Model Snapshot

### 6.1 Core entities

- Users
- Issues
- SourceFiles
- Roles
- Sessions/Auth tables

### 6.2 Relationships

- User → many Issues
- SourceFile → many Issues
- Issue → one Assigned User
- User → many Sessions

### 6.3 Key fields and intent

- `testCaseId`: links issue to QA test case
- `assignedTo`: responsibility tracking
- `sourceFile` / `uploadedBy`: ingestion auditability
- `dateReported`, `dateFixed`: lifecycle and trend anchors

### 6.4 Enum coverage (engineering)

- Status: OPEN, IN_PROGRESS, ON_HOLD, CLOSED, AS_IT_IS
- Severity: CRITICAL, MAJOR/HIGH, MEDIUM, LOW
- QC: PASSED, FAILED, PENDING, REJECTED

## 7. Query and Index Strategy (Engineering Notes)

Recommended focus for index coverage:

- Time-based trend queries: `dateReported`, `dateFixed`
- Filter dimensions: `severity`, `status`, `module`
- Ownership: `assignedTo`, `uploadedBy`

Composite indexes should be added based on recurring filter combinations.

### 7.1 Query patterns

- Metrics and charts use grouped aggregations with filter predicates.
- List views use pagination + sorting to keep payload size bounded.
- Export queries reuse the exact filter clause used in lists and charts.

### 7.2 Pagination model

- Server-side pagination avoids loading all defects at once.
- Sort keys are constrained to indexed columns to reduce scan overhead.

## 8. Operational Scripts (Engineering Use)

Scripts in /scripts provide:

- Schema evolution (add/alter fields, backfills)
- Data integrity checks
- Admin bootstrap operations

Use them to maintain data quality during live operations and migrations.

### 8.1 Script safety guidelines

- Run in a controlled environment with backups for production datasets.
- Prefer dry-run validation scripts before backfills.
- Track script usage in release notes to support auditability.

## 9. Known Constraints

- Limited automated testing coverage
- Schema drift risk due to raw SQL + Prisma coexistence
- Manual entry view currently capped at 250 visible records

Additional considerations:

- Module normalization relies on heuristics and may need periodic tuning.
- Realtime sync is not yet implemented; UI refresh is pull-based.
- High-volume imports may require background processing in future phases.

## 10. Roadmap (Engineering Focus)

- Realtime synchronization via event-driven updates
- Controlled MongoDB adoption for read-optimized workloads
- Background jobs for large batch ingestion and cleanup
- Audit logging for privileged admin actions

### 10.1 Observability and reliability goals

- Add structured logging for ingestion and admin operations.
- Introduce latency metrics for dashboard queries.
- Add alerting on failed import batches or auth anomalies.

## 11. Engineering Runbook

### 11.1 Required configuration

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: runtime mode
- OAuth credentials when Google login is enabled

### 11.2 Local development flow

1. Install dependencies and configure `.env.local`.
2. Generate Prisma artifacts when schema changes.
3. Run database migrations or helper scripts as required.
4. Start the Next.js dev server and validate auth + upload flow.

### 11.3 Deployment checklist

- Apply migrations before deployment if schema changes exist.
- Verify environment variables in hosting platform.
- Validate admin and super admin access after deployment.
- Smoke test upload + dashboard + export flows.

### 11.4 Testing strategy (current and recommended)

- Current: manual regression via upload, filters, and dashboards.
- Recommended: add unit tests for validators and parsers, integration tests for uploads.

## 12. Manager-Friendly Summary (Non-Technical)

This system replaces manual Excel tracking with a controlled, centralized QA platform. Teams can upload issue data, assign ownership, and review dashboards that reflect real-time status. It improves accountability and reduces reporting delay, while enabling leadership to view severity trends and workload distribution without relying on spreadsheets.
