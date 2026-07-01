import { anthropic } from "../../../lib/anthropic-client";

export interface AltTextSuggestionInput {
  imageSrc: string;
  pageContext: string;
}

interface AltTextSuggestionResponse {
  altText: string;
}

export async function generateAltTextSuggestion(
  input: AltTextSuggestionInput
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 256,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            altText: { type: "string" },
          },
          required: ["altText"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Suggest a concise, descriptive alt text (under 125 characters) for this image.

Image URL: ${input.imageSrc}
Page context: ${input.pageContext}

Describe what the image likely shows based on its filename and page context. Return only the alt text.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return "";

  const parsed = JSON.parse(textBlock.text) as AltTextSuggestionResponse;
  return parsed.altText;
}
