export type TestExecutionStatus = "NOT_RUN" | "PASS" | "FAIL";

export interface TestCycle {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestCase {
  id: string;
  testCaseId: string;
  title: string;
  steps: string;
  expectedResult: string;
  cycleId: string;
  createdAt: Date;
}

export interface TestCaseWithExecution extends TestCase {
  executionStatus: TestExecutionStatus;
  executionRemarks: string;
  executionSeverity: "MAJOR" | "HIGH" | "MEDIUM" | "LOW" | null;
  executionId: string | null;
}

export interface TestExecution {
  id: string;
  cycleId: string;
  testCaseId: string;
  status: TestExecutionStatus;
  remarks?: string;
  severity?: "MAJOR" | "HIGH" | "MEDIUM" | "LOW";
  executedOn: Date;
  executedBy?: string;
}

export interface TestExecutionInput {
  cycleId: string;
  testCaseId: string;
  status: TestExecutionStatus;
  remarks?: string;
  severity?: "MAJOR" | "HIGH" | "MEDIUM" | "LOW";
  createDefect?: boolean;
  defectTitle?: string;
  defectDescription?: string;
}
