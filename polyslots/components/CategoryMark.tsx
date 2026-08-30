import type { CategoryKey } from "@/lib/types";

/**
 * Reel symbols, drawn rather than set in emoji.
 *
 * Emoji render differently on every platform and read as clip art next to
 * typeset numerals — these are the machine's own symbol set, like the BARs and
 * bells on a real cabinet.
 */
export function CategoryMark({ category }: { category: CategoryKey }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={LABELS[category]}>
      <title>{LABELS[category]}</title>
      {category === "geopolitics" && (
        <g {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
        </g>
      )}
      {category === "sports" && (
        <g {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M6 5.6c3 3.4 3 9.4 0 12.8M18 5.6c-3 3.4-3 9.4 0 12.8" />
        </g>
      )}
      {category === "crypto" && (
        <g {...stroke}>
          <path d="M8 6h5.5a3 3 0 0 1 0 6H8zM8 12h6a3 3 0 0 1 0 6H8zM8 6v12M11 3.6V6M11 18v2.4M14.4 3.6V6M14.4 18v2.4" />
        </g>
      )}
      {category === "politics" && (
        <g {...stroke}>
          <rect x="3.5" y="10.5" width="17" height="10" rx="1.6" />
          <path d="M8 10.5V4.2h8v6.3M9.8 14.6h4.4" />
        </g>
      )}
      {category === "culture" && (
        <path
          d="M12 3.4l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.9l6.1-.9z"
          fill="currentColor"
        />
      )}
      {category === "economics" && (
        <g {...stroke}>
          <path d="M3.5 17.6l5.4-5.9 4 3.4 7.6-8.1M15.6 7h5.3v5.3" />
        </g>
      )}
      {category === "any" && (
        <>
          <g {...stroke}>
            <rect x="4" y="4" width="16" height="16" rx="3.4" />
          </g>
          <g fill="currentColor">
            <circle cx="9" cy="9" r="1.45" />
            <circle cx="12" cy="12" r="1.45" />
            <circle cx="15" cy="15" r="1.45" />
          </g>
        </>
      )}
    </svg>
  );
}

const LABELS: Record<CategoryKey, string> = {
  any: "Wildcard",
  geopolitics: "World",
  sports: "Sports",
  crypto: "Crypto",
  politics: "Politics",
  culture: "Culture",
  economics: "Economics",
};
