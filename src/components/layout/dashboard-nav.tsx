import Link from "next/link";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/scan", label: "New Scan" },
];

export function DashboardNav() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          SEO Tool
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
