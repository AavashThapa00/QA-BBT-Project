import { Defect, Severity, DefectWithResolutionTime } from "./types";

export function calculateResolutionDays(defect: Defect): number | undefined {
    if (!defect.dateFixed || !defect.dateReported) return undefined;
    const diffTime = Math.abs(
        defect.dateFixed.getTime() - (defect.dateReported as Date).getTime()
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateDaysOpen(defect: Defect): number {
    if (!defect.dateReported) return 0;
    
    // If dateFixed exists, calculate from dateReported to dateFixed
    // Otherwise, calculate from dateReported to current date
    const endDate = defect.dateFixed ? new Date(defect.dateFixed) : new Date();
    const startDate = new Date(defect.dateReported);
    
    const diffTime = Math.abs(
        endDate.getTime() - startDate.getTime()
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function enrichDefectsWithCalculations(
    defects: Defect[]
): DefectWithResolutionTime[] {
    return defects.map((defect) => ({
        ...defect,
        resolutionDays: calculateResolutionDays(defect),
        daysOpen: calculateDaysOpen(defect),
    }));
}

export function formatDate(date: Date | string | null): string {
    if (!date || date === "N/A") {
        return "N/A";
    }
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatDateForInput(date: Date): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}

export function parseCSVDate(dateString: string): Date | null {
    if (!dateString || typeof dateString !== "string") return null;

    const trimmed = dateString.trim();
    if (!trimmed) return null;

    // Try multiple date formats
    const formats = [
        // ISO format: 2024-01-15
        /^\d{4}-\d{2}-\d{2}$/,
        // US format: 01/15/2024
        /^\d{1,2}\/\d{1,2}\/\d{4}$/,
        // DD-MM-YYYY
        /^\d{1,2}-\d{1,2}-\d{4}$/,
    ];

    let date: Date | null = null;

    if (formats[0].test(trimmed)) {
        date = new Date(trimmed);
    } else if (formats[1].test(trimmed)) {
        const [month, day, year] = trimmed.split("/");
        date = new Date(`${year}-${month}-${day}`);
    } else if (formats[2].test(trimmed)) {
        const [day, month, year] = trimmed.split("-");
        date = new Date(`${year}-${month}-${day}`);
    }

    return date && !isNaN(date.getTime()) ? date : null;
}

export function normalizeColumnName(columnName: string): string {
    return columnName.toLowerCase().trim();
}

export function extractColumnValue(
    row: Record<string, string>,
    possibleNames: string[]
): string {
    for (const name of possibleNames) {
        const key = Object.keys(row).find(
            (k) => normalizeColumnName(k) === normalizeColumnName(name)
        );
        if (key) return row[key] || "";
    }
    return "";
}

export function normalizeEnumValue(
    value: string,
    validValues: string[]
): string | null {
    const normalized = value.toUpperCase().trim();
    const match = validValues.find((v) => v.toUpperCase() === normalized);
    return match || null;
}

// Helper function to properly escape CSV values according to RFC 4180
function escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
        return "";
    }
    
    const stringValue = String(value);
    
    // If the value contains comma, newline, or double quotes, wrap it in quotes
    if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
        // Escape double quotes by doubling them
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
}

export function exportToCSV(
    defects: DefectWithResolutionTime[],
    filename: string = "defects.csv"
): void {
    const headers = [
        "Date Reported",
        "Module",
        "Severity",
        "Priority",
        "Status",
        "Expected Result",
        "Actual Result",
        "Date Fixed",
        "Resolution Days",
        "Days Open",
    ];

    const rows = defects.map((defect: DefectWithResolutionTime) => [
        formatDate(defect.dateReported),
        defect.module || "N/A",
        defect.severity || "N/A",
        defect.priority || "N/A",
        defect.status || "N/A",
        defect.expectedResult || "N/A",
        defect.actualResult || "N/A",
        defect.dateFixed ? formatDate(defect.dateFixed) : "N/A",
        defect.resolutionDays !== undefined ? String(defect.resolutionDays) : "N/A",
        defect.daysOpen !== undefined ? String(defect.daysOpen) : "N/A",
    ]);

    // Build CSV with proper escaping
    const csvLines = [
        headers.map(escapeCSVValue).join(","),
        ...rows.map((row) =>
            row.map(escapeCSVValue).join(",")
        ),
    ];

    const csv = csvLines.join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function getMonthYear(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
    });
}

export function getAverageResolutionTime(
    defects: DefectWithResolutionTime[]
): number {
    const closedDefects = defects.filter((d) => d.resolutionDays !== undefined);
    if (closedDefects.length === 0) return 0;
    const total = closedDefects.reduce((sum, d) => sum + (d.resolutionDays || 0), 0);
    return Math.round(total / closedDefects.length);
}
