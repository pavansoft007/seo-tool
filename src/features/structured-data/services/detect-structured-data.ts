import * as cheerio from "cheerio";

export interface StructuredDataResult {
  jsonLd: unknown[];
  faq: boolean;
  article: boolean;
  product: boolean;
  organization: boolean;
  breadcrumb: boolean;
}

const TYPE_MATCHERS: Record<Exclude<keyof StructuredDataResult, "jsonLd">, string[]> = {
  faq: ["FAQPage"],
  article: ["Article", "NewsArticle", "BlogPosting"],
  product: ["Product"],
  organization: ["Organization"],
  breadcrumb: ["BreadcrumbList"],
};

function collectTypes(node: unknown, types: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((item) => collectTypes(item, types));
    return;
  }

  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;

    if (typeof obj["@type"] === "string") {
      types.add(obj["@type"]);
    } else if (Array.isArray(obj["@type"])) {
      obj["@type"].forEach((t) => typeof t === "string" && types.add(t));
    }

    if (Array.isArray(obj["@graph"])) {
      collectTypes(obj["@graph"], types);
    }
  }
}

export function detectStructuredData(html: string): StructuredDataResult {
  const $ = cheerio.load(html);
  const jsonLd: unknown[] = [];
  const types = new Set<string>();

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).contents().text().trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      jsonLd.push(parsed);
      collectTypes(parsed, types);
    } catch {
      return;
    }
  });

  const hasType = (candidates: string[]) =>
    candidates.some((candidate) => types.has(candidate));

  return {
    jsonLd,
    faq: hasType(TYPE_MATCHERS.faq),
    article: hasType(TYPE_MATCHERS.article),
    product: hasType(TYPE_MATCHERS.product),
    organization: hasType(TYPE_MATCHERS.organization),
    breadcrumb: hasType(TYPE_MATCHERS.breadcrumb),
  };
}
