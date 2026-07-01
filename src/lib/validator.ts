const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
}

function isIPv4(hostname: string): boolean {
  const match = hostname.match(IPV4_REGEX);
  if (!match) return false;
  return match.slice(1, 5).every((octet) => Number(octet) >= 0 && Number(octet) <= 255);
}

function isIPv6(hostname: string): boolean {
  const stripped = hostname.replace(/^\[|\]$/g, "");
  return stripped.includes(":") && /^[0-9a-fA-F:]+$/.test(stripped);
}

function isLocalhost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0" ||
    normalized === "[::1]" ||
    normalized === "::1"
  );
}

export function validateUrl(input: string): UrlValidationResult {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  if (url.protocol !== "https:") {
    return { valid: false, reason: "Only https URLs are allowed" };
  }

  if (!url.hostname || !url.hostname.includes(".")) {
    return { valid: false, reason: "Invalid URL format" };
  }

  if (isLocalhost(url.hostname)) {
    return { valid: false, reason: "Localhost URLs are not allowed" };
  }

  if (isIPv4(url.hostname) || isIPv6(url.hostname)) {
    return { valid: false, reason: "IP address URLs are not allowed" };
  }

  return { valid: true };
}

export function isValidUrl(input: string): boolean {
  return validateUrl(input).valid;
}
