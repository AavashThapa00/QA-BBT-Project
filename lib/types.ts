// Type definitions for Defect
export type Severity = "MAJOR" | "HIGH" | "MEDIUM" | "LOW";
export type Status = "OPEN" | "IN_PROGRESS" | "CLOSED" | "ON_HOLD" | "AS_IT_IS";
export type QCStatusBBT = "PASSED" | "FAILED" | "PENDING" | "REJECTED";

export interface Defect {
    id: string;
    testCaseId?: string;
    dateReported: Date | null;
    module: string;
    summary?: string;
    expectedResult: string;
    actualResult: string;
    severity: Severity;
    priority: string;
    assignedTo?: string;
    status: Status;
    dateFixed: Date | null;
    qcStatusBbt: QCStatusBBT;
    createdAt: Date;
}

// Export enum values
export const SeverityEnum = {
    MAJOR: "MAJOR" as Severity,
    HIGH: "HIGH" as Severity,
    MEDIUM: "MEDIUM" as Severity,
    LOW: "LOW" as Severity,
} as const;

export const StatusEnum = {
    OPEN: "OPEN" as Status,
    IN_PROGRESS: "IN_PROGRESS" as Status,
    CLOSED: "CLOSED" as Status,
    ON_HOLD: "ON_HOLD" as Status,
    AS_IT_IS: "AS_IT_IS" as Status,
} as const;

export const QCStatusBBTEnum = {
    PASSED: "PASSED" as QCStatusBBT,
    FAILED: "FAILED" as QCStatusBBT,
    PENDING: "PENDING" as QCStatusBBT,
    REJECTED: "REJECTED" as QCStatusBBT,
} as const;

export interface DefectFilters {
    dateFrom?: Date;
    dateTo?: Date;
    severity?: Severity[];
    module?: string[];
    status?: Status[];
    searchTerm?: string;
}

export interface DashboardMetrics {
    totalDefects: number;
    openDefects: number;
    closedDefects: number;
    highSeverityCount: number;
}

export interface DefectByModule {
    module: string;
    count: number;
}

export interface DefectBySeverity {
    severity: Severity;
    count: number;
}

export interface DefectTrend {
    date: string;
    count: number;
}

export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: "date" | "severity" | "status";
    sortOrder?: "asc" | "desc";
}

export interface DefectWithResolutionTime extends Defect {
    resolutionDays?: number;
    daysOpen?: number;
}
