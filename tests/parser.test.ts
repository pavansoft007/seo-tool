import { describe, expect, it } from "vitest";
import { extractInternalLinks } from "../src/features/internal-linking/services/extract-internal-links";
import { parseRobotsTxt } from "../src/features/robots-txt/services/parse-robots";
import { parseSitemapUrls } from "../src/features/sitemap/services/parse-sitemap";

describe("extractInternalLinks", () => {
  const baseUrl = "https://example.com";

  it("returns only internal URLs", () => {
    const html = `
      <a href="/about">About</a>
      <a href="https://example.com/contact">Contact</a>
      <a href="https://external.com/page">External</a>
    `;

    expect(extractInternalLinks(html, baseUrl)).toEqual([
      "https://example.com/about",
      "https://example.com/contact",
    ]);
  });

  it("ignores social, mailto, and javascript links", () => {
    const html = `
      <a href="https://facebook.com/page">FB</a>
      <a href="https://www.twitter.com/user">Twitter</a>
      <a href="https://youtube.com/watch">YouTube</a>
      <a href="https://linkedin.com/in/user">LinkedIn</a>
      <a href="mailto:test@example.com">Email</a>
      <a href="javascript:void(0)">JS</a>
    `;

    expect(extractInternalLinks(html, baseUrl)).toEqual([]);
  });

  it("deduplicates repeated links", () => {
    const html = `<a href="/about">1</a><a href="/about">2</a>`;
    expect(extractInternalLinks(html, baseUrl)).toEqual([
      "https://example.com/about",
    ]);
  });
});

describe("parseRobotsTxt", () => {
  it("parses disallow, allow, and sitemap directives", () => {
    const content = `
      User-agent: *
      Disallow: /admin
      Allow: /admin/public
      Sitemap: https://example.com/sitemap.xml
    `;

    const result = parseRobotsTxt(content);

    expect(result.rules).toEqual([
      { userAgent: "*", disallow: ["/admin"], allow: ["/admin/public"] },
    ]);
    expect(result.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
  });

  it("ignores comments and blank lines", () => {
    const content = `
      # comment
      User-agent: *

      Disallow: /private
    `;

    const result = parseRobotsTxt(content);
    expect(result.rules[0].disallow).toEqual(["/private"]);
  });
});

describe("parseSitemapUrls", () => {
  it("extracts loc values from a urlset", () => {
    const xml = `
      <urlset>
        <url><loc>https://example.com/</loc></url>
        <url><loc>https://example.com/about</loc></url>
      </urlset>
    `;

    expect(parseSitemapUrls(xml)).toEqual([
      "https://example.com/",
      "https://example.com/about",
    ]);
  });

  it("extracts loc values from a sitemap index", () => {
    const xml = `
      <sitemapindex>
        <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
      </sitemapindex>
    `;

    expect(parseSitemapUrls(xml)).toEqual([
      "https://example.com/sitemap-1.xml",
    ]);
  });
});
