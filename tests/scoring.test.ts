import { describe, expect, it } from "vitest";
import { calculateSeoScore } from "../src/lib/seo-score";

describe("calculateSeoScore", () => {
  it("returns 100 when every category is perfect", () => {
    const score = calculateSeoScore({
      metadata: 100,
      images: 100,
      links: 100,
      performance: 100,
      accessibility: 100,
      security: 100,
    });
    expect(score).toBe(100);
  });

  it("returns 0 when every category is zero", () => {
    const score = calculateSeoScore({
      metadata: 0,
      images: 0,
      links: 0,
      performance: 0,
      accessibility: 0,
      security: 0,
    });
    expect(score).toBe(0);
  });

  it("applies the configured weights", () => {
    const score = calculateSeoScore({
      metadata: 100,
      images: 0,
      links: 0,
      performance: 0,
      accessibility: 0,
      security: 0,
    });
    expect(score).toBe(20);
  });

  it("clamps out-of-range category scores", () => {
    const score = calculateSeoScore({
      metadata: 150,
      images: -50,
      links: 100,
      performance: 100,
      accessibility: 100,
      security: 100,
    });
    expect(score).toBe(85);
  });
});
