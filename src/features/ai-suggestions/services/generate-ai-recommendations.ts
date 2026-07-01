import { anthropic } from "../../../lib/anthropic-client";
import type { ReportJson } from "../../pdf-report/services/generate-report";

interface AiRecommendationsResponse {
  recommendations: string[];
}

const MAX_RECOMMENDATIONS = 10;

export async function generateAiSeoRecommendations(
  report: ReportJson
): Promise<string[]> {
  const issueSummary = [...report.issues, ...report.warnings]
    .map((issue) => `- [${issue.severity}] ${issue.category}: ${issue.message}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["recommendations"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Given this SEO scan for ${report.overview.url} (score: ${report.overview.score}/100), write at most ${MAX_RECOMMENDATIONS} concise, prioritized, actionable SEO recommendations.

Issues found:
${issueSummary || "None"}

Each recommendation should be one sentence, specific, and actionable. Prioritize by impact.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const parsed = JSON.parse(textBlock.text) as AiRecommendationsResponse;
  return parsed.recommendations.slice(0, MAX_RECOMMENDATIONS);
}
