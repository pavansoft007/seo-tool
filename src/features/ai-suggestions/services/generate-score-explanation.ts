import { anthropic } from "../../../lib/anthropic-client";
import type { CategoryScores } from "../../../lib/seo-score";

export interface ScoreExplanationInput {
  url: string;
  overallScore: number;
  categoryScores: CategoryScores;
}

interface ScoreExplanationResponse {
  explanation: string;
}

export async function generateScoreExplanation(
  input: ScoreExplanationInput
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 512,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            explanation: { type: "string" },
          },
          required: ["explanation"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Explain this SEO score in plain language for a non-technical site owner.

URL: ${input.url}
Overall score: ${input.overallScore}/100

Category scores:
- Metadata: ${input.categoryScores.metadata}/100
- Images: ${input.categoryScores.images}/100
- Links: ${input.categoryScores.links}/100
- Performance: ${input.categoryScores.performance}/100
- Accessibility: ${input.categoryScores.accessibility}/100
- Security: ${input.categoryScores.security}/100

Write a short (3-5 sentence) explanation of what's driving the score, naming the weakest category and why it matters.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return "";

  const parsed = JSON.parse(textBlock.text) as ScoreExplanationResponse;
  return parsed.explanation;
}
