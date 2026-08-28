"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  clearSessionCookie,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { audit, track } from "@/lib/audit";

const SignupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["BUYER", "SELLER"]),
  over18: z.literal("on", { message: "You must confirm you are at least 18." }),
  orgOrCity: z.string().trim().min(2).max(120),
});

export async function signupAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, role, orgOrCity } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      isAtLeast18: true,
      ...(role === "BUYER"
        ? { buyerProfile: { create: { brandName: orgOrCity } } }
        : {
            sellerProfile: {
              create: { displayName: name, city: orgOrCity, payoutAccount: { create: {} } },
            },
          }),
    },
  });
  if (role === "BUYER") {
    await prisma.organization.create({
      data: {
        name: orgOrCity,
        kind: "BRAND",
        memberships: { create: { userId: user.id, role: "OWNER" } },
      },
    });
  }
  await audit(user.id, "user.signup", "USER", user.id, role);
  await track("signup", user.id, { role });
  await setSessionCookie(user.id);
  redirect(role === "SELLER" ? "/seller" : "/dashboard");
}

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { error: "Incorrect email or password." };
  }
  await setSessionCookie(user.id);
  await track("login", user.id);
  redirect(user.role === "ADMIN" ? "/admin" : user.role === "SELLER" ? "/seller" : "/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
