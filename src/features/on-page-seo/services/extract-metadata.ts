import * as cheerio from "cheerio";

export interface HeadingData {
  tag: string;
  text: string;
}

export interface PageMetadata {
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  viewport: string | null;
  language: string | null;
  headings: HeadingData[];
}

export function extractMetadata(html: string): PageMetadata {
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim() || null;

  const description =
    $('meta[name="description"]').first().attr("content")?.trim() || null;

  const canonical =
    $('link[rel="canonical"]').first().attr("href")?.trim() || null;

  const robots =
    $('meta[name="robots"]').first().attr("content")?.trim() || null;

  const viewport =
    $('meta[name="viewport"]').first().attr("content")?.trim() || null;

  const language = $("html").first().attr("lang")?.trim() || null;

  const headings: HeadingData[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, element) => {
    const tag = element.tagName?.toLowerCase() ?? "";
    const text = $(element).text().trim();
    headings.push({ tag, text });
  });

  return {
    title,
    description,
    canonical,
    robots,
    viewport,
    language,
    headings,
  };
}
