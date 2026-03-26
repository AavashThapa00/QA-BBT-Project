# QA-BBT Complete Project Documentation

## 1. Executive Summary

QA-BBT is a full-stack quality assurance dashboard designed to centralize defect tracking, reporting, and team-level performance visibility. The system enables teams to upload defect logs from CSV files, store and standardize records in PostgreSQL, and generate actionable analytics from a single web application.

The core problem this project solves is fragmented QA reporting. In many testing workflows, defect data lives in isolated spreadsheets, making it difficult to maintain consistency, monitor trends, and evaluate team progress. QA-BBT addresses this by providing one unified platform for ingestion, validation, analysis, and operational decision-making.

The platform is intended for:
- QA testers and black-box testing teams who need day-to-day defect visibility.
- QA leads and managers who need trend insights, severity distribution, and fix performance metrics.
- Administrators and super administrators who manage users, access control, and uploaded data lifecycle.
- New developers and maintainers who need a clear, production-oriented architecture with predictable workflows.

## 2. System Overview

QA-BBT is a Next.js App Router application backed by PostgreSQL. It accepts CSV-based defect logs, validates and normalizes each row, stores valid records, and powers multiple dashboards for operational and strategic QA analysis.

End-to-end, the system does the following:
- Accepts defect entry through an in-platform manual entry form and sheet interface.
- Supports direct data entry with inline editing of status, priority, severity, and QC status.
- Validates all inputs with type-safe enums and required field checks.
- Stores normalized defect records with traceability fields such as uploadedBy and dates.
- Presents metrics, charts, tables, QC status, and team performance pages.
- Supports role-based user management and protected access.

Key capabilities include:
- Interactive dashboard cards, charts, filters, and paginated defect table.
- Export of filtered defects to CSV.
- QC completion monitoring with done/pending indicators.
- Team-level open/fixed workload and average fix time drilldowns.
- Admin and super admin operations for account management.

## 3. Objectives

The QA-BBT system is designed around the following objectives:

1. Standardize defect data ingestion from diverse spreadsheet formats.
2. Reduce manual effort in defect reporting and trend computation.
3. Provide real-time insight into backlog, closure, and critical issue distribution.
4. Improve accountability through assignee-based performance visibility.
5. Strengthen QA governance through authentication and role-based operations.
6. Offer a maintainable codebase with clear separation between UI, business logic, and data access.

## 4. Technology Stack

### 4.1 Frontend

- Next.js 16 (App Router) and React 19
  Chosen for integrated routing, server/client component model, strong production support, and seamless full-stack workflows.
- Tailwind CSS 4
  Chosen for rapid UI implementation, predictable utility-based styling, and consistency across pages.
- Recharts
  Chosen for reliable, configurable charting with React-first APIs.
- react-icons
  Chosen for lightweight and readable icon usage across dashboard interfaces.

### 4.2 Backend and Data Access

- Next.js Server Actions
  Chosen to keep backend operations close to domain logic while avoiding separate API boilerplate for internal app actions.
- PostgreSQL
  Chosen for reliable relational modeling, transactional safety, indexing, and strong query performance for analytics-style aggregations.
- pg (Node PostgreSQL)
  Chosen for direct SQL control and explicit query tuning.

### 4.3 Validation and Utilities

- Zod
  Chosen for runtime validation of user-provided and CSV-derived inputs before database writes.
- TypeScript
  Chosen for compile-time safety, strong editor tooling, and maintainable contracts between components and actions.

### 4.4 Tooling

- Prisma schema and generated artifacts
  Maintained primarily for typed schema definition and ecosystem compatibility, while runtime queries are handled through raw SQL.
- tsx scripts
  Chosen for quick operational scripts such as migration helpers, backfills, and diagnostics.

## 5. System Architecture

### 5.1 Architecture in Simple Terms

QA-BBT follows a three-layer web application pattern:
- Presentation layer: Next.js pages and reusable React components.
- Application layer: Server Actions implementing business rules, validation, and database operations.
- Data layer: PostgreSQL tables for defects, users, and sessions.

The browser never writes directly to the database. All write and read operations flow through controlled Server Actions.

### 5.2 Interaction Between Frontend, Backend, and Database

1. User interacts with a page component.
2. Page calls one or more Server Actions.
3. Server Actions validate inputs and execute parameterized SQL queries.
4. PostgreSQL returns data.
5. UI renders metrics, lists, or status updates.

### 5.3 Role of Server Actions

Server Actions are the core backend surface of this system. They handle:
- CSV ingestion and normalization logic.
- Metrics and chart data aggregation queries.
- Defect listing, filtering, sorting, and pagination.
- Authentication, session lifecycle, and profile updates.
- Admin and super admin operations.

This approach keeps domain logic in one place and reduces API route complexity for internal operations.

## 6. End-to-End Workflow

From a user perspective, the standard system flow is:

1. Open application and authenticate.
2. Navigate to dashboard or Manual Sheet.
3. Enter defect details using the manual entry form.
4. Update defect status, priority, severity, and QC status using the inline editable sheet.
5. Apply filters to focus on date ranges, modules, status, severity, and search terms.
6. Review KPI cards and chart distributions.
7. Inspect detailed defect rows and open record detail pages where needed.
8. Use analytics, trends, QC dashboard, and team performance views for deeper review.
9. Export filtered defects for sharing or reporting.
10. Use profile/admin areas for account and data administration tasks (role dependent).

## 7. Features (Detailed)

### 7.1 Dashboard

What it does:
The dashboard is the central operational page combining upload, filtering, summary metrics, visual analytics, and tabular defect browsing.

How it works:
- Fetches metrics, module counts, severity distribution, trend data, defect rows, and average resolution time.
- Uses paginated table loading to avoid expensive full-page reload behavior during pagination/sorting.
- Supports quick metric-card clicks that apply predefined filter sets.

Why it is important:
It gives teams a single command center for daily QA decision-making and reporting.

### 7.2 Manual Entry Sheet

What it does:
Allows users to directly input defect details and update defect attributes through an in-platform sheet interface.

How it works:
- Provides a form for adding new defects with testCaseId, module, priority, severity, status, QC status, issue test date, fixed date, and test results.
- Displays up to 250 defects in a sheet-style table with inline editable cells.
- Supports editing of issueTestDate, fixedDate, priority, severity, status, and qcStatusBbt directly in the table.
- Each row has a Save button to persist changes to the database.
- Form validation prevents empty required fields.
- Real-time feedback shows success or error messages.

Why it is important:
Eliminates spreadsheet fragmentation and provides a centralized platform for all defect entry and tracking.

### 7.3 Defect Management

What it does:
Enables review and exploration of defect records at list and detail levels.

How it works:
- Defect table supports server-driven filtering, sorting, and pagination.
- All-defects page offers broad status-priority ordering and module shortcuts.
- Detail page surfaces complete defect information, including expected versus actual results.

Why it is important:
Teams can quickly move from high-level metrics to root-cause-level context.

### 7.4 Analytics and Trends

What it does:
Provides aggregate insights for defect status, fix speed, monthly reporting, severity mix, and module distribution.

How it works:
- Executes grouped SQL queries for status counts and trend timelines.
- Uses module normalization rules to bucket related module names into consistent families.
- Presents visual summaries through pie, line, and bar charts.

Why it is important:
Supports management decisions on quality hotspots and remediation effectiveness.

### 7.5 QC Dashboard

What it does:
Tracks quality control completion from BBT perspective.

How it works:
- Aggregates QC status into Done versus Pending.
- Shows summary totals and recent defects with status labels.
- Maps low-level QC enums into reader-friendly operational labels.

Why it is important:
Provides clear visibility into verification completion and outstanding QA checks.

### 7.6 Team Performance

What it does:
Shows assignee-based workload, closure performance, and average fix time.

How it works:
- Aggregates defects by assignedTo.
- Computes open/fixed buckets and high-severity involvement.
- Supports modal drilldown into open or fixed defect subsets per member or across all teams.

Why it is important:
Improves accountability and helps balance workload across team members.

### 7.7 Admin Panel

What it does:
Enables controlled user administration based on role.

How it works:
- Admin users can review user list and access overview.
- Super admins can create accounts, reset passwords, change roles, and delete users.
- Self-deletion is explicitly blocked.

Why it is important:
Ensures operational governance and secure delegation of access.

## 8. Application Routing

### 8.1 Primary Routes

| Route | Purpose |
|---|---|
| / | Main dashboard, upload, filters, charts, defect table, export |
| /login | Authentication entry point |
| /profile | Profile update, password change, uploaded-file management |
| /admin | Admin panel and user overview |
| /super-admin | Super admin controls: role changes, account create/delete |
| /all-defects | Full defect browsing with module shortcuts |
| /defects/[id] | Defect detail view |
| /analytics | Combined analytics and trend visualization |
| /trends | Trend-focused visualization page |
| /qc-dashboard | QC completion and recent QC-related defects |
| /team-performance | Assignee metrics and drilldown modal |

### 8.2 Navigation Behavior

- Top navigation links to dashboard, analytics, all defects, team performance, and QC status.
- Profile menu appears when authenticated.
- Super admin users get shortcut access to super-admin operations.

## 9. Data Model

### 9.1 Core Entities

Defect:
- Stores QA issue details and lifecycle metadata.

User:
- Stores authenticated account identity, contact details, password hash, and role.

Session:
- Stores persistent login session with expiry and user association.

### 9.2 Key Relationships

- One user can have many sessions.
- Each session belongs to exactly one user.
- Defects are independent operational records but include uploader traceability and assignee context.

### 9.3 Enums and Their Meaning

Severity:
- MAJOR: business-critical or highly disruptive issue.
- HIGH: significant impact, urgent attention required.
- MEDIUM: moderate impact.
- LOW: minor impact, lower urgency.

Status:
- OPEN: newly identified and not started.
- IN_PROGRESS: actively being addressed.
- CLOSED: fixed and considered resolved.
- ON_HOLD: pending or blocked.
- AS_IT_IS: accepted without further change.

QCStatusBBT:
- PASSED: QC completed successfully.
- FAILED: QC failed validation.
- PENDING: QC not completed.
- REJECTED: QC explicitly rejected.

### 9.4 Real-World Meaning of Important Fields

- testCaseId: links defect back to testing artifact.
- module: product area or subsystem.
- summary: quick issue title for triage readability.
- expectedResult and actualResult: defect evidence pair.
- assignedTo: responsible owner/team member.
- dateReported and dateFixed: lifecycle timing anchors.
- sourceFile: origin CSV traceability.
- uploadedBy: accountability for ingestion activity.

## 10. Authentication and Authorization

### 10.1 Login Flow

1. User submits email and password.
2. System reads user record by email.
3. Password is verified using scrypt-derived hash and timing-safe comparison.
4. Session record is created in session table.
5. HTTP-only bbt_session cookie is set with expiry.
6. User is redirected to dashboard.

### 10.2 Session Handling

- Cookie name: bbt_session.
- Session persistence: database-backed.
- Expiry policy: 7-day session window.
- Logout removes database session and expires cookie.

### 10.3 Route Protection and Access Control

- Middleware redirects unauthenticated access to login.
- Authenticated users opening login are redirected to profile.
- Role checks in server actions control privileged operations.
- Super admin permissions gate role changes, account creation, password reset, and deletion.

## 11. Core Workflows (Detailed)

### 11.1 CSV Processing Pipeline

1. File content is read on client and sent to upload action.
2. Parser handles quoted cells, escaped quotes, and multiline rows.
3. Header aliases are resolved for flexible input compatibility.
4. Dates are parsed across common formats.
5. Severity and status values are normalized.
6. Zod schema validates required and typed fields.
7. Duplicate check runs against key defect attributes.
8. Valid rows are inserted with generated UUID and metadata.
9. Result summary includes inserted/skipped counts and detailed reasons.

### 11.2 Dashboard Data Flow

1. Dashboard loads and dispatches parallel data requests.
2. Filters are converted into SQL where-clause parameters.
3. Metrics and charts are recalculated from live database state.
4. Table calls include sort and pagination arguments.
5. Export action fetches all filtered rows and triggers client CSV generation.

### 11.3 QC Tracking Workflow

1. QC summary query computes total, done, and pending counts.
2. Status mapping converts PASSED to done and all others to pending.
3. Recent defects list is sorted by reporting date for quick review.

### 11.4 Team Performance Calculation Workflow

1. Aggregate query groups defects by assignee.
2. Status groups classify open workload versus fixed outcomes.
3. Average fix time is computed for resolvable records with valid dates.
4. Drilldown query fetches open/fixed subsets for selected assignee or all teams.

### 11.5 Admin Operations Workflow

1. Current user is checked for role eligibility.
2. Requested operation is validated.
3. User table is updated through parameterized queries.
4. Success or failure messages are returned to UI.

## 12. Repository Structure

### 12.1 app

- Route pages for dashboard, analytics, QC, team, auth, admin, and detail views.
- actions subfolder containing all server-side business operations.
- components subfolder with reusable UI units (charts, filters, uploads, tables, export modal, common UI).

### 12.2 lib

- prisma.ts for PostgreSQL pool and query wrapper.
- types.ts for shared domain types and enums.
- validators.ts for Zod schemas.
- utils.ts for date parsing, CSV export, and derived metric helpers.
- env.ts for required environment variable validation.

### 12.3 prisma

- schema.prisma with enums and entity definitions.
- generated artifacts for Prisma client typing.

### 12.4 scripts

- Operational scripts for setup, migrations, backfills, checks, and user bootstrap.

### 12.5 docs

- Project-level technical documentation.

### 12.6 public

- Static asset area for web delivery.

## 13. Key Files Explanation

- app/page.tsx
  Main orchestration page for upload, metrics, charts, filters, table, and export triggers.

- app/actions/csv.ts
  Central ingestion pipeline with parsing, normalization, validation, duplicate checks, and inserts.

- app/actions/defects.ts
  Core query layer for dashboard metrics, charts, table data, and export reads.

- app/actions/auth.ts
  Login, logout, profile update, password change, and current-user lookup.

- app/actions/admin.ts
  Privileged user administration and role-controlled actions.

- app/actions/teamPerformance.ts
  Team performance aggregation and drilldown endpoints.

- app/actions/qcDashboard.ts
  QC status summary and recent QC defect feed.

- app/actions/trends.ts and app/actions/analytics.ts
  Trend-oriented and analytics-oriented aggregate reporting queries.

- middleware.ts
  Global route gate for session presence and login redirection logic.

- prisma/schema.prisma
  Canonical schema reference for defect, user, and session models.

## 14. Scripts and Utilities

### 14.1 Setup and Schema Scripts

- init-db.ts: creates defect table, indexes, and status constraints.
- add-auth-tables.ts: creates user/session auth schema and indexes.
- add-testCaseId.ts, add-summary.ts, add-assigned-to.ts, add-source-file.ts, add-uploadedBy.ts, add-user-role.ts: incremental schema evolution helpers.
- migrate-critical-to-major.ts: migrates old severity values and updates constraint.

### 14.2 Backfill and Correction Scripts

- backfill-assigned-to.ts: populates assignee from CSV reference matching.
- backfill-sourceFile.ts: infers source file metadata for historical records.
- backfill-uploadedBy.ts and fix-uploadedBy.ts: repairs uploader attribution.

### 14.3 Diagnostic Scripts

- check-assigned-to.ts and check-assigned-to-raw.ts: assignment quality diagnostics.
- check-fixed-defects.ts: fixed defect/date integrity checks.
- check-missing-defects.ts: targeted duplicate/missing verification.
- check-severities.ts: severity value distribution check.
- check-st-defects.ts: test-case ID subset verification.
- test-module-extraction.ts: validates module bucketing and fix-time logic.

### 14.4 User Bootstrap and Data Import

- create-user.ts: CLI-based account creation.
- create-super-admin.ts: CLI super-admin bootstrap.
- upload-csv.ts: command-line CSV ingestion helper using the same upload action pipeline.

## 15. Security Considerations

Implemented practices:
- Password hashing with scrypt and per-password salt.
- Timing-safe password comparison to reduce side-channel risk.
- HTTP-only session cookie to reduce client-side script exposure.
- Production-only secure cookie mode.
- Session expiry tracking in database.
- Parameterized SQL across data operations.
- Input validation before writes using Zod.
- Role checks for privileged admin operations.
- Self-account deletion prevention for super admins.

Why these matter:
- They reduce credential compromise risk, unauthorized access risk, injection risk, and accidental privilege abuse.

## 16. Performance and Scalability

### 16.1 Current Strengths

- Indexed columns on dateReported, module, severity, and status improve filter and aggregation performance.
- Server-side pagination limits payload size for large datasets.
- Parallel data fetches on dashboard reduce perceived load time.
- SQL-side aggregation avoids expensive client-side computation.

### 16.2 Scalability Path

As data volume and user count increase, the system can scale by:
- Adding composite indexes based on common filter combinations.
- Introducing database read replicas for analytics-heavy reads.
- Caching stable aggregates where near-real-time updates are not required.
- Splitting heavy report queries into materialized views.
- Introducing background jobs for very large CSV ingestion batches.

## 17. Deployment Overview

### 17.1 Platform

The application is designed for deployment on Vercel, with PostgreSQL hosted externally (for example, Neon).

### 17.2 Required Environment Setup

Minimum environment variables:
- DATABASE_URL: PostgreSQL connection string.
- NODE_ENV: environment mode.

### 17.3 Deployment Flow

1. Install dependencies.
2. Configure environment variables in deployment platform.
3. Ensure database schema is prepared.
4. Build and deploy Next.js application.
5. Run any pending operational scripts if schema/data alignment is needed.

## 18. Usage Guide

### 18.1 Daily Operational Usage

1. Sign in using admin credentials.
2. Upload latest defect CSV from current cycle.
3. Review upload outcomes and resolve skipped rows in source data if needed.
4. Apply filters to isolate target module, status, or severity.
5. Review metrics and chart trends.
6. Open defect detail entries for analysis.
7. Visit QC dashboard for validation completion tracking.
8. Visit team performance page for assignee-level progress.
9. Export filtered data for stakeholder sharing.

### 18.2 Administrative Usage

1. Open profile/admin/super-admin pages based on role.
2. Create users and assign role where appropriate.
3. Reset credentials when required.
4. Remove obsolete users and uploaded file data with caution.

## 19. Design Decisions

### 19.1 Server Actions Instead of Separate API Layer

Decision:
Use Server Actions for internal app operations.

Why:
Reduces boilerplate and keeps domain logic close to page/component usage.

Trade-off:
External API reuse is less direct than a dedicated REST or GraphQL service boundary.

### 19.2 Raw SQL via pg Instead of Full ORM Runtime

Decision:
Run production queries through pg query wrapper.

Why:
Explicit control over SQL aggregations and fine-grained query design.

Trade-off:
Requires stricter discipline for query maintenance and schema consistency.

### 19.3 Flexible CSV Header Mapping

Decision:
Support multiple header aliases and loose source variations.

Why:
Real-world QA spreadsheets are inconsistent across cycles and teams.

Trade-off:
Parsing logic becomes more complex and requires careful maintenance.

### 19.4 Role-Segmented Admin Controls

Decision:
Separate admin and super admin capabilities.

Why:
Supports least-privilege governance and safer operational control.

Trade-off:
Additional complexity in UI and permission handling.

## 20. Limitations and Known Issues

1. Limited automated test coverage is currently visible in repository structure.
2. Session cleanup automation for expired sessions is not explicitly implemented as a scheduled process.
3. Raw SQL and Prisma schema are both present, which requires proactive schema drift control.
4. Some analytics logic relies on naming heuristics for module normalization.
5. Manual entry sheet displays up to 250 records; very large defect sets may require pagination enhancements.

## 21. Future Enhancements

1. Introduce automated test suites for manual entry validation, auth, and query workflows.
2. Implement scheduled cleanup for expired sessions and archival routines.
3. Add audit logs for admin and super admin actions.
4. Expand role model beyond admin/super admin for read-only stakeholders.
5. Add configurable module taxonomy management instead of hardcoded heuristics.
6. Add observability dashboards for query latency and ingestion health.
7. Support bulk multi-row entry for high-volume defect addition.

## 22. Developer Onboarding Guide

### 22.1 Where to Start

1. Read this documentation fully.
2. Review data model in prisma schema.
3. Study main dashboard page and core actions.
4. Follow route-to-action mapping to understand feature boundaries.

### 22.2 Recommended Learning Path

1. Understand shared types and validators.
2. Trace manual entry from form submission to database update.
3. Trace dashboard load pipeline from filters to SQL query builder.
4. Review auth and middleware flow.
5. Review admin and super admin permission checks.

### 22.3 Local Setup Checklist

1. Install dependencies.
2. Configure DATABASE_URL.
3. Initialize database schema and required columns/tables.
4. Create first admin or super admin account.
5. Run app and verify login, upload, dashboard, and export flows.

### 22.4 Contribution Guidance

- Keep shared types and validation schemas updated with any data model change.
- Maintain parameterized SQL patterns.
- Preserve role checks for privileged operations.
- Add migration/backfill scripts when schema evolution requires production-safe transitions.
- Update this documentation when behavior changes.

## 23. Conclusion

QA-BBT is a practical, production-oriented QA analytics platform that transforms spreadsheet-driven defect tracking into a centralized operational system. It combines structured data ingestion, role-aware access control, and multi-perspective analytics to support both daily QA execution and higher-level quality governance.

The project is well-suited for internal enterprise documentation, final project submission, and onboarding of new contributors because it provides clear feature boundaries, explicit workflows, and maintainable full-stack architecture patterns.
