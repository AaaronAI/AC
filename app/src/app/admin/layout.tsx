import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

const TABS: [string, string][] = [
  ["Overview", "/admin"],
  ["Moderation", "/admin/moderation"],
  ["Briefs", "/admin/briefs"],
  ["Campaigns", "/admin/campaigns"],
  ["Payments", "/admin/payments"],
  ["Disputes", "/admin/disputes"],
  ["Approvals", "/admin/approvals"],
  ["Audit log", "/admin/audit"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-extrabold uppercase tracking-wider">
          Ops<span className="text-signal">·</span>Console
        </h1>
        <nav className="flex flex-wrap gap-1" aria-label="Admin sections">
          {TABS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-paper"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
