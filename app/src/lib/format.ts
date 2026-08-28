export { formatCents } from "./fees";

export function formatState(state: string): string {
  return state.replaceAll("_", " ").toLowerCase();
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
