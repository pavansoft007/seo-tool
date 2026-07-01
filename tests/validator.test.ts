import { describe, expect, it } from "vitest";
import { isValidUrl, validateUrl } from "../src/lib/validator";

describe("validateUrl", () => {
  it("accepts a valid https URL", () => {
    expect(validateUrl("https://example.com").valid).toBe(true);
  });

  it("rejects http URLs", () => {
    const result = validateUrl("http://example.com");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/https/i);
  });

  it("rejects localhost", () => {
    expect(validateUrl("https://localhost").valid).toBe(false);
    expect(validateUrl("https://sub.localhost").valid).toBe(false);
  });

  it("rejects IPv4 addresses", () => {
    expect(validateUrl("https://192.168.1.1").valid).toBe(false);
  });

  it("rejects IPv6 addresses", () => {
    expect(validateUrl("https://[::1]").valid).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(validateUrl("not-a-url").valid).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("returns a boolean shortcut for validateUrl", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://example.com")).toBe(false);
  });
});
