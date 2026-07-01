export type ThinContentIssueCode = "THIN_CONTENT";

export interface ThinContentIssue {
  code: ThinContentIssueCode;
  message: string;
}

const MIN_WORD_COUNT = 300;

export function analyzeThinContent(wordCount: number): ThinContentIssue[] {
  if (wordCount < MIN_WORD_COUNT) {
    return [
      {
        code: "THIN_CONTENT",
        message: `Page has only ${wordCount} words, below the recommended minimum of ${MIN_WORD_COUNT}`,
      },
    ];
  }

  return [];
}
