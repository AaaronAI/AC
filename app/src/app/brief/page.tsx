import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { submitBriefAction } from "./actions";
import { ActionForm, Field, TextArea } from "@/components/form";

export const metadata: Metadata = { title: "Post a campaign brief" };

export default async function BriefPage() {
  const session = await getSession();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-6xl">Post a campaign brief</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        Tell us what you&apos;re trying to achieve. Our team matches your brief against curated
        real-world inventory and sends back concrete proposals — typically within two business
        days.
      </p>

      {!session ? (
        <div className="mt-8 rounded-lg border-2 border-ink bg-white p-8">
          <p className="font-bold">Sign in as a buyer to post a brief.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/login" className="rounded bg-signal px-5 py-2.5 font-bold text-white hover:bg-signal-dark">
              Sign in
            </Link>
            <Link href="/signup" className="rounded border-2 border-ink px-5 py-2.5 font-bold hover:bg-ink hover:text-paper">
              Create account
            </Link>
          </div>
        </div>
      ) : session.role !== "BUYER" ? (
        <div className="mt-8 rounded-lg border-2 border-ink bg-white p-8">
          <p className="font-bold">Briefs are for buyer accounts.</p>
          <p className="mt-2 text-sm text-ink-soft">
            You&apos;re signed in as a {session.role.toLowerCase()}. Sellers list packages instead.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border-2 border-ink bg-white p-6 sm:p-8">
          <ActionForm action={submitBriefAction} submitLabel="Submit brief">
            <TextArea
              label="Objective"
              name="objective"
              placeholder="Launch buzz for our new cold brew line among Denver cyclists…"
              hint="What should this campaign achieve?"
            />
            <Field label="Audience" name="audience" placeholder="Active 25–40, outdoorsy, local" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" name="city" defaultValue="Denver, CO" />
              <Field label="Budget (USD)" name="budgetUsd" type="number" placeholder="2500" hint="Minimum $250." />
              <Field label="Target date" name="targetDate" type="date" required={false} />
            </div>
            <TextArea
              label="Desired outcome"
              name="desiredOutcome"
              rows={2}
              placeholder="Three real-world moments with shareable short-form content"
            />
            <TextArea
              label="Brand restrictions"
              name="restrictions"
              required={false}
              rows={2}
              placeholder="No alcohol venues, family-friendly only…"
            />
            <TextArea
              label="Required deliverables"
              name="deliverables"
              required={false}
              rows={2}
              placeholder="Vertical video, edited photos, usage rights…"
            />
          </ActionForm>
        </div>
      )}
    </div>
  );
}
