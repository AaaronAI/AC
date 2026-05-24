"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Today", icon: "◎" },
  { href: "/week", label: "Week", icon: "▦" },
  { href: "/rip", label: "Rip", icon: "▲" },
  { href: "/coach", label: "Coach", icon: "✎" },
  { href: "/routes", label: "Routes", icon: "⛰" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav md:static md:border-0 md:bg-transparent md:backdrop-blur-0">
      <div className="mx-auto max-w-5xl px-2 py-2 flex md:hidden justify-between">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg " +
                (active ? "text-topo-accent" : "text-ink-mute hover:text-ink-base")
              }
            >
              <span className="text-base leading-none">{it.icon}</span>
              <span className="text-[11px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
