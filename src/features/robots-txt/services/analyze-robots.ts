import type { RobotsTxtResult } from "./parse-robots";

export type RobotsIssueCode = "ROBOTS_META_NOINDEX" | "BLOCKED_BY_ROBOTS_TXT";

export interface RobotsIssue {
  code: RobotsIssueCode;
  message: string;
}

function matchesRobotsRule(pathname: string, rule: string): boolean {
  if (!rule) return false;
  const pattern = rule.replace(/\*/g, ".*").replace(/\$$/, "$");
  return new RegExp(`^${pattern}`).test(pathname);
}

export function analyzeRobots(
  pageUrl: string,
  robotsMeta: string | null,
  robotsTxt: RobotsTxtResult
): RobotsIssue[] {
  const issues: RobotsIssue[] = [];

  if (robotsMeta && /noindex/i.test(robotsMeta)) {
    issues.push({
      code: "ROBOTS_META_NOINDEX",
      message: "Page has a robots meta tag set to noindex",
    });
  }

  const pathname = new URL(pageUrl).pathname;
  const applicableRules = robotsTxt.rules.filter(
    (rule) => rule.userAgent === "*" || rule.userAgent.toLowerCase() === "googlebot"
  );

  for (const rule of applicableRules) {
    const isAllowed = rule.allow.some((allowRule) => matchesRobotsRule(pathname, allowRule));
    if (isAllowed) continue;

    const isDisallowed = rule.disallow.some((disallowRule) =>
      matchesRobotsRule(pathname, disallowRule)
    );

    if (isDisallowed) {
      issues.push({
        code: "BLOCKED_BY_ROBOTS_TXT",
        message: `Page path "${pathname}" is blocked by robots.txt`,
      });
      break;
    }
  }

  return issues;
}
