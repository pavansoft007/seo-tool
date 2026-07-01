import type { StructuredDataResult } from "./detect-structured-data";

export type StructuredDataIssueCode = "STRUCTURED_DATA_MISSING";

export interface StructuredDataIssue {
  code: StructuredDataIssueCode;
  message: string;
}

export function analyzeStructuredData(
  result: StructuredDataResult
): StructuredDataIssue[] {
  if (result.jsonLd.length === 0) {
    return [
      {
        code: "STRUCTURED_DATA_MISSING",
        message: "Page has no JSON-LD structured data",
      },
    ];
  }

  return [];
}
