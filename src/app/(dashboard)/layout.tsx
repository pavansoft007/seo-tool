import { DashboardNav } from "../../components/layout/dashboard-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main>{children}</main>
    </div>
  );
}
