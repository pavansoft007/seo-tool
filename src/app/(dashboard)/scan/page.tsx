"use client";

import { useState, type FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { cn } from "../../../lib/utils";

type ScanMode = "single" | "site";

interface ScanResponse {
  scanId?: string;
  error?: string;
}

const MODE_OPTIONS: { value: ScanMode; title: string; description: string }[] = [
  {
    value: "single",
    title: "Single URL",
    description: "Analyze this page only",
  },
  {
    value: "site",
    title: "Full site",
    description: "Crawl internal URLs too",
  },
];

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<ScanMode>("single");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setScanId(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode }),
      });

      const data = (await response.json()) as ScanResponse;

      if (!response.ok || !data.scanId) {
        setError(data.error ?? "Scan failed");
        return;
      }

      setScanId(data.scanId);
    } catch {
      setError("Could not reach the scan API");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">New Scan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a URL to check its SEO health.
      </p>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">URL</span>
              <input
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Scan mode</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MODE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors",
                      mode === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={mode === option.value}
                      onChange={() => setMode(option.value)}
                      className="sr-only"
                    />
                    <span className="block font-medium">{option.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Scanning..." : "Start scan"}
            </button>
          </form>
        </CardContent>
      </Card>

      {scanId && (
        <Card className="mt-6">
          <CardHeader>
            <CardDescription>Scan complete</CardDescription>
            <CardTitle className="text-lg">{scanId}</CardTitle>
          </CardHeader>
          <a
            href={`/scan/${scanId}`}
            className="block px-6 pb-6 text-sm font-medium text-primary underline underline-offset-2"
          >
            View results →
          </a>
        </Card>
      )}
    </div>
  );
}
