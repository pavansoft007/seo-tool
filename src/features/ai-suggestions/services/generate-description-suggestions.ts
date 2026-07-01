import { anthropic } from "../../../lib/anthropic-client";

export interface DescriptionSuggestionInput {
  url: string;
  currentDescription: string | null;
  title: string | null;
  contentSummary: string;
}

interface DescriptionSuggestionResponse {
  suggestions: string[];
}

export async function generateDescriptionSuggestions(
  input: DescriptionSuggestionInput
): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 512,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            suggestions: { type: "array", items: { type: "string" } },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Suggest 3 SEO-optimized meta descriptions (150-160 characters each) for this page.

URL: ${input.url}
Title: ${input.title ?? "(missing)"}
Current description: ${input.currentDescription ?? "(missing)"}
Content summary: ${input.contentSummary}

Return only the descriptions, no explanation.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const parsed = JSON.parse(textBlock.text) as DescriptionSuggestionResponse;
  return parsed.suggestions;
}
