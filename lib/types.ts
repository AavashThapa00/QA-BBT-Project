// Type definitions for Defect
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Status = "OPEN" | "IN_PROGRESS" | "CLOSED" | "ON_HOLD";
export type QCStatusBBT = "PASSED" | "FAILED" | "PENDING" | "REJECTED";

export interface Defect {
    id: string;
    dateReported: Date | null;
    module: string;
    expectedResult: string;
    actualResult: string;
    severity: Severity;
    priority: string;
    status: Status;
    dateFixed: Date | null;
    qcStatusBbt: QCStatusBBT;
    createdAt: Date;
}

// Export enum values
export const SeverityEnum = {
    CRITICAL: "CRITICAL" as Severity,
    HIGH: "HIGH" as Severity,
    MEDIUM: "MEDIUM" as Severity,
    LOW: "LOW" as Severity,
} as const;

export const StatusEnum = {
    OPEN: "OPEN" as Status,
    IN_PROGRESS: "IN_PROGRESS" as Status,
    CLOSED: "CLOSED" as Status,
    ON_HOLD: "ON_HOLD" as Status,
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
