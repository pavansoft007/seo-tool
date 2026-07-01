import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export interface SocialMeta {
  ogTitle: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  ogType: string | null;
  twitterTitle: string | null;
  twitterImage: string | null;
}

function getMetaByProperty($: CheerioAPI, property: string): string | null {
  const content = $(`meta[property="${property}"]`).first().attr("content");
  return content ? content.trim() : null;
}

function getMetaByName($: CheerioAPI, name: string): string | null {
  const content = $(`meta[name="${name}"]`).first().attr("content");
  return content ? content.trim() : null;
}

export function extractSocialMeta(html: string): SocialMeta {
  const $ = cheerio.load(html);

  return {
    ogTitle: getMetaByProperty($, "og:title"),
    ogImage: getMetaByProperty($, "og:image"),
    ogUrl: getMetaByProperty($, "og:url"),
    ogType: getMetaByProperty($, "og:type"),
    twitterTitle: getMetaByName($, "twitter:title"),
    twitterImage: getMetaByName($, "twitter:image"),
  };
}
