import Link from "next/link";

const cols: [string, [string, string][]][] = [
  [
    "Marketplace",
    [
      ["Browse listings", "/browse"],
      ["Post a brief", "/brief"],
      ["List something sponsorable", "/sell"],
      ["Pricing", "/pricing"],
    ],
  ],
  [
    "Company",
    [
      ["How it works", "/how-it-works"],
      ["About", "/about"],
      ["Contact", "/contact"],
      ["FAQ", "/faq"],
    ],
  ],
  [
    "Trust",
    [
      ["Trust & safety", "/trust-safety"],
      ["Prohibited campaigns", "/trust-safety#prohibited"],
      ["Terms (draft)", "/legal/terms"],
      ["Privacy (draft)", "/legal/privacy"],
    ],
  ],
];

export function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-ink bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-extrabold">
            Sponsor<span className="text-signal">This</span>
          </p>
          <p className="mt-2 text-sm opacity-80">Make anything sponsorable.</p>
          <p className="mt-4 text-xs opacity-60">
            Demo build. Legal documents are placeholders pending attorney review.
          </p>
        </div>
        {cols.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <p className="text-sm font-bold uppercase tracking-wider opacity-70">{title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {links.map(([label, href]) => (
                <li key={href + label}>
                  <Link href={href} className="hover:text-signal">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
