import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });
  return (
    <div>
      <h2 className="headline text-3xl">Audit log</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Every state change, moderation action, and money movement, most recent first (last 100).
      </p>
      <div className="mt-6 overflow-x-auto rounded-lg border-2 border-ink bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="p-3">When</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-line align-top last:border-0">
                <td className="whitespace-nowrap p-3 text-xs text-ink-soft">
                  {l.createdAt.toLocaleString("en-US")}
                </td>
                <td className="p-3">{l.actor?.name ?? "system"}</td>
                <td className="p-3 font-mono text-xs">{l.action}</td>
                <td className="p-3 text-xs text-ink-soft">
                  {l.entityType} {l.entityId.slice(-6)}
                </td>
                <td className="p-3 text-xs">{l.detail ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
