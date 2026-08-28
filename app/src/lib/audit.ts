import { prisma } from "./db";

export async function audit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  detail?: string,
) {
  await prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, detail },
  });
}

export async function notify(userId: string, kind: string, body: string, href?: string) {
  await prisma.notification.create({ data: { userId, kind, body, href } });
}

export async function track(name: string, userId?: string, props?: Record<string, unknown>) {
  await prisma.analyticsEvent.create({
    data: { name, userId, props: props ? JSON.stringify(props) : undefined },
  });
}
