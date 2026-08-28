import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createListingAction } from "../../actions";
import { ActionForm, Field, Select, TextArea } from "@/components/form";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SELLER") redirect("/dashboard");
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="headline text-4xl">Create a listing</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Package a specific, provable moment. Listings go through human moderation before going
        live — honest, concrete packages pass fastest.
      </p>
      <div className="mt-8 rounded-lg border-2 border-ink bg-white p-6 sm:p-8">
        <ActionForm action={createListingAction} submitLabel="Save draft listing">
          <Field label="Title" name="title" placeholder="Sponsor my 10K race debut in City Park" />
          <Field
            label="One-line pitch"
            name="pitch"
            placeholder="Kit placement + race-day content from a Denver 10K"
            hint="Shown on marketplace cards. 20–240 characters."
          />
          <TextArea
            label="Full description"
            name="description"
            rows={5}
            hint="What happens, where, what the sponsor gets, and what this is not. Minimum 50 characters."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Category"
              name="categoryId"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Field label="City" name="city" defaultValue="Denver, CO" />
            <Field label="Package price (USD)" name="priceUsd" type="number" placeholder="750" hint="Minimum $250." />
          </div>
          <TextArea
            label="Deliverables (one per line)"
            name="deliverables"
            rows={5}
            placeholder={"Logo on race kit (event-permitting)\nPre-race announcement with #sponsored disclosure\nTimestamped race photos\nProof-of-completion package"}
          />
          <TextArea
            label="What's not included"
            name="exclusions"
            required={false}
            rows={2}
            placeholder="No guaranteed impressions…"
          />
          <Field
            label="Proof method"
            name="proofMethod"
            placeholder="Timestamped photos + GPS file + finish-line video"
            hint="How you'll prove the campaign happened. Required."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Audience estimate"
              name="audienceEstimate"
              required={false}
              placeholder="~800 race participants (organizer's cap)"
            />
            <Field
              label="Estimate methodology"
              name="audienceEvidence"
              required={false}
              placeholder="Race registration cap published by organizer"
              hint="Required if you give an estimate. Never invent reach."
            />
          </div>
          <TextArea
            label="Sponsor restrictions"
            name="sponsorRestrictions"
            required={false}
            rows={2}
            placeholder="No alcohol brands (family event)…"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Cancellation policy"
              name="cancellationPolicy"
              defaultValue="STANDARD"
              options={[
                { value: "FLEXIBLE", label: "Flexible" },
                { value: "STANDARD", label: "Standard" },
                { value: "STRICT", label: "Strict" },
              ]}
            />
            <Field label="Usage rights (days)" name="usageRightsDays" type="number" defaultValue="30" />
            <div className="space-y-2 pt-6">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="venueApprovalRequired" /> Venue approval required
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="permitsRequired" /> Permits required
              </label>
            </div>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
