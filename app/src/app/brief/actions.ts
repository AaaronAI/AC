"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit, notify, track } from "@/lib/audit";

const BriefSchema = z.object({
  objective: z.string().trim().min(10).max(2000),
  audience: z.string().trim().min(3).max(500),
  city: z.string().trim().min(2).max(80),
  budgetUsd: z.coerce.number().int().min(250).max(1_000_000),
  targetDate: z.string().optional(),
  desiredOutcome: z.string().trim().min(5).max(2000),
  restrictions: z.string().trim().max(2000).optional(),
  deliverables: z.string().trim().max(2000).optional(),
});

export async function submitBriefAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "BUYER") return { error: "Only buyer accounts can post briefs." };

  const parsed = BriefSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const membership = await prisma.membership.findFirst({ where: { userId: session.id } });
  if (!membership) return { error: "Your account has no organization yet." };

  const d = parsed.data;
  const brief = await prisma.brief.create({
    data: {
      orgId: membership.orgId,
      objective: d.objective,
      audience: d.audience,
      city: d.city,
      budgetCents: d.budgetUsd * 100,
      targetDate: d.targetDate ? new Date(d.targetDate) : null,
      desiredOutcome: d.desiredOutcome,
      restrictions: d.restrictions || null,
      deliverables: d.deliverables || null,
    },
  });
  await audit(session.id, "brief.submitted", "BRIEF", brief.id);
  await track("brief_submitted", session.id, { city: d.city, budgetUsd: d.budgetUsd });
  // Notify all admins for concierge matching.
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const a of admins) {
    await notify(a.id, "brief.new", `New brief in ${d.city} ($${d.budgetUsd} budget)`, "/admin/briefs");
  }
  redirect(`/briefs/${brief.id}`);
}
