import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { getDashboardStats, listScans } from "../../../server/db/scan-storage";

const STATUS_VARIANT: Record<string, "success" | "warning" | "critical" | "neutral"> = {
  COMPLETED: "success",
  RUNNING: "warning",
  FAILED: "critical",
  PENDING: "neutral",
};

export default async function DashboardPage() {
  const [stats, scans] = await Promise.all([getDashboardStats(), listScans(10)]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview across all scans in this workspace.
          </p>
        </div>
        <Link
          href="/scan"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          New Scan
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Scans</CardDescription>
            <CardTitle className="text-3xl">{stats.scanCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pages Scanned</CardDescription>
            <CardTitle className="text-3xl">{stats.pageCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Critical Issues</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {stats.criticalIssueCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Warnings</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {stats.warningIssueCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent Scans</h2>
        <Card>
          {scans.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No scans yet — start one from the New Scan button above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {scans.map((scan) => (
                <li key={scan.id}>
                  <Link
                    href={`/scan/${scan.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{scan.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[scan.status] ?? "neutral"}>
                      {scan.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
