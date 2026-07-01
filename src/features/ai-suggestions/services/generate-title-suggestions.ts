import { anthropic } from "../../../lib/anthropic-client";

export interface TitleSuggestionInput {
  url: string;
  currentTitle: string | null;
  h1: string | null;
  contentSummary: string;
}

interface TitleSuggestionResponse {
  suggestions: string[];
}

export async function generateTitleSuggestions(
  input: TitleSuggestionInput
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
        content: `Suggest 3 SEO-optimized page titles (50-60 characters each) for this page.

URL: ${input.url}
Current title: ${input.currentTitle ?? "(missing)"}
H1: ${input.h1 ?? "(none)"}
Content summary: ${input.contentSummary}

Return only the titles, no explanation.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const parsed = JSON.parse(textBlock.text) as TitleSuggestionResponse;
  return parsed.suggestions;
}
