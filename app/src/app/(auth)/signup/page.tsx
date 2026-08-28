import type { Metadata } from "next";
import Link from "next/link";
import { signupAction } from "../actions";
import { ActionForm, Field, Select } from "@/components/form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const defaultRole = role === "seller" ? "SELLER" : "BUYER";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="headline text-4xl">Create your account</h1>
      <p className="mt-2 text-ink-soft">
        Buyers book sponsorships. Sellers make things sponsorable. You must be at least 18.
      </p>
      <div className="mt-8 rounded-lg border-2 border-ink bg-white p-6">
        <ActionForm action={signupAction} submitLabel="Create account">
          <Field label="Full name" name="name" placeholder="Jordan Doe" />
          <Field label="Email" name="email" type="email" placeholder="you@brand.com" />
          <Field
            label="Password"
            name="password"
            type="password"
            hint="At least 8 characters."
          />
          <Select
            label="I want to…"
            name="role"
            defaultValue={defaultRole}
            options={[
              { value: "BUYER", label: "Sponsor things (brand or agency buyer)" },
              { value: "SELLER", label: "Get sponsored (seller)" },
            ]}
          />
          <Field
            label="Brand / organization name — or your city if selling"
            name="orgOrCity"
            placeholder="Acme Coffee — or Denver, CO"
            hint="Buyers: your organization. Sellers: your home city."
          />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="over18" required className="mt-1" />
            <span>
              I confirm I am at least 18 years old and agree to the{" "}
              <Link href="/legal/terms" className="font-bold text-signal">
                draft Terms
              </Link>
              .
            </span>
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
