import { z } from "zod";
import { Severity, Status, QCStatusBBT } from "./types";

export const SeverityEnum = z.enum([
    "CRITICAL",
    "HIGH",
    "MEDIUM",
    "LOW",
] as const);

export const StatusEnum = z.enum([
    "OPEN",
    "IN_PROGRESS",
    "CLOSED",
    "ON_HOLD",
] as const);

export const QCStatusBBTEnum = z.enum([
    "PASSED",
    "FAILED",
    "PENDING",
    "REJECTED",
] as const);

export const CreateDefectSchema = z.object({
    dateReported: z.union([z.coerce.date(), z.literal("N/A")]),
    module: z.string().min(1, "Module is required"),
    expectedResult: z.string().min(1, "Expected result is required"),
    actualResult: z.string().min(1, "Actual result is required"),
    severity: SeverityEnum,
    priority: z.string().min(1, "Priority is required"),
    status: StatusEnum,
    dateFixed: z.coerce.date().optional().nullable(),
    qcStatusBbt: QCStatusBBTEnum,
});

export const CSVRowSchema = z.object({
    "Date Reported": z.string().optional(),
    "date reported": z.string().optional(),
    "Fork and Module": z.string().optional(),
    "Module / Component": z.string().optional(),
    "module": z.string().optional(),
    "Expected Result": z.string().optional(),
    "expected result": z.string().optional(),
    "Actual Result": z.string().optional(),
    "actual result": z.string().optional(),
    Severity: z.string().optional(),
    severity: z.string().optional(),
    Priority: z.string().optional(),
    priority: z.string().optional(),
    Status: z.string().optional(),
    status: z.string().optional(),
    "Date Fixed": z.string().optional(),
    "Date Fixed ": z.string().optional(),
    "date fixed": z.string().optional(),
    "QC Status by BBT": z.string().optional(),
    "qc status by bbt": z.string().optional(),
}).passthrough(); // Allow other columns to pass through

export type CreateDefectInput = z.infer<typeof CreateDefectSchema>;
export type CSVRowInput = z.infer<typeof CSVRowSchema>;
