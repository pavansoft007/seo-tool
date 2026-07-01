import * as cheerio from "cheerio";

export interface ImageData {
  src: string | null;
  alt: string | null;
  lazy: boolean;
  width: string | null;
  height: string | null;
}

export function extractImages(html: string): ImageData[] {
  const $ = cheerio.load(html);
  const images: ImageData[] = [];

  $("img").each((_, element) => {
    const el = $(element);
    const loading = el.attr("loading")?.trim().toLowerCase();

    images.push({
      src: el.attr("src")?.trim() || null,
      alt: el.attr("alt")?.trim() || null,
      lazy: loading === "lazy",
      width: el.attr("width")?.trim() || null,
      height: el.attr("height")?.trim() || null,
    });
  });

  return images;
}
