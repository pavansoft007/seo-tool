export type MobileFriendlyIssueCode = "VIEWPORT_MISSING" | "VIEWPORT_NOT_RESPONSIVE";

export interface MobileFriendlyIssue {
  code: MobileFriendlyIssueCode;
  message: string;
}

export function analyzeMobileFriendly(viewport: string | null): MobileFriendlyIssue[] {
  if (!viewport) {
    return [
      {
        code: "VIEWPORT_MISSING",
        message: "Page is missing a viewport meta tag",
      },
    ];
  }

  if (!/width\s*=\s*device-width/i.test(viewport)) {
    return [
      {
        code: "VIEWPORT_NOT_RESPONSIVE",
        message: "Viewport meta tag does not set width=device-width",
      },
    ];
  }

  return [];
}
