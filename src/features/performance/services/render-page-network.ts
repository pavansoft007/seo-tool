import { chromium, type Request } from "playwright";

export interface NetworkRequestInfo {
  url: string;
  resourceType: string;
  method: string;
  statusCode: number | null;
  sizeBytes: number | null;
  timingMs: number | null;
}

export interface RenderedImageInfo {
  src: string;
  loadedDynamically: boolean;
}

export interface RenderPageResult {
  networkRequests: NetworkRequestInfo[];
  renderedImages: RenderedImageInfo[];
}

const NAVIGATION_TIMEOUT_MS = 30000;

export async function renderPageWithNetworkCapture(
  url: string,
  staticImageSrcs: ReadonlySet<string>
): Promise<RenderPageResult> {
  const browser = await chromium.launch();
  const networkRequests: NetworkRequestInfo[] = [];
  const pendingRequests: { request: Request; entry: NetworkRequestInfo }[] = [];

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on("response", (response) => {
      const request = response.request();
      const contentLength = response.headers()["content-length"];

      const entry: NetworkRequestInfo = {
        url: request.url(),
        resourceType: request.resourceType(),
        method: request.method(),
        statusCode: response.status(),
        sizeBytes: contentLength ? Number(contentLength) : null,
        timingMs: null,
      };

      networkRequests.push(entry);
      pendingRequests.push({ request, entry });
    });

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    for (const { request, entry } of pendingRequests) {
      const timing = request.timing();
      entry.timingMs = timing.responseEnd >= 0 ? Math.round(timing.responseEnd) : null;
    }

    const renderedImageSrcs = await page.$$eval("img", (elements) =>
      Array.from(new Set(elements.map((element) => element.src).filter(Boolean)))
    );

    const renderedImages: RenderedImageInfo[] = renderedImageSrcs.map((src) => ({
      src,
      loadedDynamically: !staticImageSrcs.has(src),
    }));

    return { networkRequests, renderedImages };
  } finally {
    await browser.close();
  }
}
