# Sheet WebApp — Project Documentation

## 1. Project Overview

**Project Name:** Sheet WebApp  
**Description:** Sheet WebApp is a centralized QA issue management platform built to replace spreadsheet-heavy defect tracking with a structured, scalable, and analytics-first workflow. It standardizes how teams ingest issue data, validate quality records, track ownership, and generate decision-ready reports from a single source of truth.  
**Primary Goal:** Eliminate dependency on Excel-based processes and establish a reliable system for real-time issue tracking, collaboration, and performance analytics.

### Why this project exists

In spreadsheet-driven workflows, teams often face inconsistent formats, duplicated records, delayed reporting, and fragmented accountability. Sheet WebApp addresses these gaps by introducing:

- Controlled ingestion with validation.
- Unified issue lifecycle management.
- Role-based ownership and secure access.
- Visual analytics that update from current system data.

---

## 2. Objectives

- Replace manual Excel workflows with a unified platform.
- Provide near real-time visibility into issue lifecycle and ownership.
- Enable analytics-driven QA and management decisions.
- Reduce redundancy, formatting drift, and manual entry errors.
- Centralize data access with role-based governance.

---

## 3. System Architecture

### 3.1 Technology Stack

#### Frontend

- Next.js (App Router)
- React
- TailwindCSS
- Recharts

#### Backend

- Next.js API Routes / Server Actions
- Prisma ORM
- Zod-based validation layer

#### Database

- PostgreSQL (current production database)
- MongoDB (planned migration/expansion path)

#### Supporting Tools

- XLSX (Excel parsing)
- PapaParse (CSV parsing)
- Nodemailer (email services)

### 3.2 Architecture principles

- **Server-controlled writes:** Client never writes directly to the database.
- **Validation-first ingestion:** Every imported or manually entered record is checked.
- **Traceability:** Ownership fields such as source file and uploaded user are preserved.
- **Composable analytics:** Dashboards are powered by filtered, query-driven aggregates.

---

## 4. Overall Application Flow

The overall flow starts with authenticated access, then branches into ingestion, issue operations, and analytics consumption. All branches converge at the same centralized issue repository.

```mermaid
flowchart LR
    U[User] --> A[Login or Google OAuth]
    A --> R{Role Resolved}

    R -->|User/Admin| D1[Dashboard / Manual Entry]
    R -->|Super Admin| D2[Admin + User Controls]

    D1 --> I[Import Excel/CSV or Add Manual Issue]
    I --> V[Parse + Validate + Normalize]
    V --> DB[(PostgreSQL)]

    DB --> Q1[Issue List and Detail Views]
    DB --> Q2[Analytics, Trends, QC, Team Performance]
    DB --> Q3[Exports and Operational Reports]

    D2 --> M[User and Role Management]
    M --> DB
```

---

## 5. Core Features

### 5.1 Excel Import System

The import module allows teams to upload Excel/CSV files and convert them into normalized issue records.

- Upload `.xlsx` or `.csv` files.
- Parse rows and map column aliases.
- Validate mandatory fields and enum values.
- Reject invalid rows with structured error feedback.
- Persist only valid records.

### 5.2 Issue Tracking System

The issue system acts as the operational backbone of the platform.

- Centralized issue repository for all teams.
- Editable issue lifecycle (status, severity, assignee, QC state).
- Detail and list views for triage and follow-up.
- Core issue fields:

  - Test Case ID
  - Summary
  - Severity
  - Assigned To
  - Source File
  - Uploaded By

### 5.3 Analytics Dashboard

The analytics area provides visibility from high-level KPIs to trend-level detail.

- Severity distribution and backlog composition.
- Workload split by assignee/team.
- Trend charts over time (volume and closure behavior).
- Filter-aware visualizations for faster decision support.

### 5.4 User and Access Management

- Role-based access (Admin / Super Admin).
- Session-based authentication and route protection.
- Google OAuth support.
- Super Admin controls for privileged user lifecycle actions.

---

## 6. Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Next.js UI
    participant Auth as Auth Layer
    participant DB as PostgreSQL

    User->>UI: Submit credentials / OAuth callback
    UI->>Auth: Start authentication
    Auth->>DB: Verify user + fetch role
    DB-->>Auth: User identity + permissions
    Auth-->>UI: Create session cookie
    UI-->>User: Redirect by role and access policy
```

### Role enforcement flow

```mermaid
flowchart TD
    RQ[Request Protected Route] --> CK{Session Valid?}
    CK -->|No| LG[Redirect to Login]
    CK -->|Yes| RL{Role Check}
    RL -->|Insufficient| NA[Show Unauthorized or Redirect]
    RL -->|Allowed| OK[Allow Page/Action Execution]
```

---

## 7. Data Ingestion and Processing Flow

This flow applies to both bulk import and structured manual entry.

```mermaid
flowchart TD
    F[File Upload / Manual Input] --> P[Parse Input]
    P --> M[Map Fields and Normalize Values]
    M --> Z[Zod Validation]
    Z -->|Invalid| E[Validation Error Report]
    Z -->|Valid| D[Deduplication / Business Rules]
    D --> S[Persist to PostgreSQL]
    S --> T[Update Metrics, Lists, and Charts]
```

---

## 8. Issue Management Workflow

```mermaid
flowchart LR
    C[Create Issue] --> A1[Assign Owner]
    A1 --> O[Status OPEN]
    O --> IP[Status IN_PROGRESS]
    IP --> H[Status ON_HOLD]
    H --> IP
    IP --> CL[Status CLOSED]
    IP --> AI[Status AS_IT_IS]
    CL --> QC[QC Validation]
    QC --> PASS[QC Passed]
    QC --> FAIL[QC Failed/Rework]
    FAIL --> IP
```

### Operational steps

1. Issue enters system from upload or manual sheet.
2. Required fields are validated and stored.
3. Owner is assigned for actionability.
4. Status transitions are tracked for lifecycle reporting.
5. QC state reflects validation outcomes.
6. Dashboards update from latest persisted state.

---

## 9. Analytics Generation Flow

```mermaid
flowchart TD
    U[User Applies Filters] --> Q[Server Query Builder]
    Q --> M1[Metrics Aggregation]
    Q --> M2[Severity and Module Distribution]
    Q --> M3[Trend Computation]
    Q --> M4[Team Performance Computation]
    M1 --> V[Recharts Visualization Layer]
    M2 --> V
    M3 --> V
    M4 --> V
    V --> UI[Interactive Dashboard Views]
```

---

## 10. Planned Real-Time Sync Flow

```mermaid
flowchart LR
    DB[(PostgreSQL)] --> EVT[Change Event Stream]
    EVT --> RT[Realtime Service / WebSocket Layer]
    RT --> SUB[Connected Clients]
    SUB --> REF[Patch UI State + Refresh Aggregates]
```

---

## 11. Database Design (High-Level)

### Entities

- Users
- Issues
- SourceFiles
- Roles
- Auth Tables

### Relationships

- One User → Many Issues
- One File → Many Issues
- One Issue → One Assigned User
- One User → Many Sessions

### Data design intent

- Maintain auditability for upload origin and ownership.
- Support filtered analytics with indexed dimensions.
- Keep extensibility for planned dual-store evolution.

---

## 12. Current Implementation Status

| Feature | Status |
| --- | --- |
| Excel Import | ✅ Completed |
| Issue Tracking | ✅ Completed |
| Analytics Dashboard | ✅ Completed |
| Authentication | ✅ Completed |
| Role Management | ✅ Completed |

---

## 13. Future Enhancements

### High Priority

- Enforce signup verification before activation.
- Tighten Super Admin credential and access controls.
- Deliver real-time updates through event-driven sync.

### Medium Priority

- Incremental MongoDB migration strategy.
- UI/UX improvements for faster triage and issue resolution.

---

## 14. Scripts and Utilities

| Script | Purpose |
| --- | --- |
| `init-db` | Initialize database schema and baseline setup |
| `add-testCaseId` | Add or patch Test Case ID support |
| `migrate-critical-to-major` | Normalize severity values |
| `add-auth-tables` | Create authentication-related tables |
| `create-user` | Create standard user accounts |
| `create-super-admin` | Create privileged super admin account |

---

## 15. Challenges and Risks

- **Data inconsistency risk:** Varying upload templates and column naming patterns.
- **Real-time complexity risk:** Ordering, duplication, and reconciliation during live updates.
- **Migration risk:** Schema-model mismatch risk while introducing MongoDB pathways.
- **Adoption risk:** Transition friction for teams accustomed to spreadsheet operations.

---

## 16. Roadmap

### Phase 1 (Completed)

- Ingestion pipeline, issue repository, analytics, authentication, and role controls.

### Phase 2 (In Progress)

- Security hardening and policy enforcement for account lifecycle operations.

### Phase 3 (Planned)

- Realtime collaboration and synchronization.
- Hybrid data strategy evolution (PostgreSQL + MongoDB).
- Usability and performance enhancements for scale.

---

## 17. Conclusion

Sheet WebApp provides a professional, scalable replacement for Excel-centric issue tracking. By combining structured ingestion, centralized lifecycle ownership, and analytics-ready reporting, it improves QA governance, reduces avoidable manual errors, and positions the organization for real-time and large-scale operational maturity.
