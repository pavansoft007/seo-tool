import type { SocialMeta } from "../../open-graph/services/extract-social-meta";

export type TwitterCardIssueCode = "TWITTER_TITLE_MISSING" | "TWITTER_IMAGE_MISSING";

export interface TwitterCardIssue {
  code: TwitterCardIssueCode;
  message: string;
}

export function analyzeTwitterCards(social: SocialMeta): TwitterCardIssue[] {
  const issues: TwitterCardIssue[] = [];

  if (!social.twitterTitle) {
    issues.push({
      code: "TWITTER_TITLE_MISSING",
      message: "Missing twitter:title tag",
    });
  }

  if (!social.twitterImage) {
    issues.push({
      code: "TWITTER_IMAGE_MISSING",
      message: "Missing twitter:image tag",
    });
  }

  return issues;
}
