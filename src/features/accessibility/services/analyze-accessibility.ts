import * as cheerio from "cheerio";

export type AccessibilityIssueCode =
  | "LANG_ATTRIBUTE_MISSING"
  | "IMAGE_ALT_MISSING"
  | "EMPTY_LINK_TEXT"
  | "FORM_INPUT_MISSING_LABEL";

export interface AccessibilityIssue {
  code: AccessibilityIssueCode;
  message: string;
}

export function analyzeAccessibility(html: string): AccessibilityIssue[] {
  const $ = cheerio.load(html);
  const issues: AccessibilityIssue[] = [];

  if (!$("html").first().attr("lang")?.trim()) {
    issues.push({
      code: "LANG_ATTRIBUTE_MISSING",
      message: "The <html> element is missing a lang attribute",
    });
  }

  $("img").each((_, element) => {
    if (!$(element).attr("alt")?.trim()) {
      issues.push({
        code: "IMAGE_ALT_MISSING",
        message: "Image is missing alt text",
      });
    }
  });

  $("a").each((_, element) => {
    const text = $(element).text().trim();
    const ariaLabel = $(element).attr("aria-label")?.trim();
    if (!text && !ariaLabel) {
      issues.push({
        code: "EMPTY_LINK_TEXT",
        message: "Link has no accessible text",
      });
    }
  });

  $("input, textarea, select").each((_, element) => {
    const id = $(element).attr("id");
    const ariaLabel = $(element).attr("aria-label")?.trim();
    const ariaLabelledBy = $(element).attr("aria-labelledby")?.trim();
    const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false;

    if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
      issues.push({
        code: "FORM_INPUT_MISSING_LABEL",
        message: "Form field has no associated label",
      });
    }
  });

  return issues;
}
