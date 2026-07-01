import { anthropic } from "../../../lib/anthropic-client";

export interface ContentImprovementInput {
  url: string;
  content: string;
}

interface ContentImprovementResponse {
  improvements: string[];
}

export async function generateContentImprovements(
  input: ContentImprovementInput
): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            improvements: { type: "array", items: { type: "string" } },
          },
          required: ["improvements"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Review this page content for SEO and readability, and suggest concrete improvements.

URL: ${input.url}
Content: ${input.content}

Return a list of specific, actionable improvement suggestions (e.g. add missing sections, improve keyword coverage, clarify structure, fix thin content). Each item should be one sentence.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const parsed = JSON.parse(textBlock.text) as ContentImprovementResponse;
  return parsed.improvements;
}
