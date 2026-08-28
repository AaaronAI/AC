import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "../actions";
import { ActionForm, Field } from "@/components/form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="headline text-4xl">Sign in</h1>
      <p className="mt-2 text-ink-soft">Welcome back.</p>
      <div className="mt-8 rounded-lg border-2 border-ink bg-white p-6">
        <ActionForm action={loginAction} submitLabel="Sign in">
          <Field label="Email" name="email" type="email" placeholder="you@brand.com" />
          <Field label="Password" name="password" type="password" />
        </ActionForm>
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        No account?{" "}
        <Link href="/signup" className="font-bold text-signal">
          Get started
        </Link>
      </p>
      <div className="mt-8 rounded border-2 border-dashed border-ink/30 p-4 text-xs text-ink-soft">
        <p className="font-bold uppercase tracking-wide">Demo accounts (password: demo1234)</p>
        <ul className="mt-2 space-y-1">
          <li>buyer@sponsorthis.demo — brand buyer</li>
          <li>agency@sponsorthis.demo — agency buyer</li>
          <li>seller@sponsorthis.demo — seller (Aaron)</li>
          <li>admin@sponsorthis.demo — admin / concierge ops</li>
        </ul>
      </div>
    </div>
  );
}
