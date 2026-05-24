import React from "react";

export function Section({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-4 md:p-5 ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between mb-3">
          {title ? <h2 className="text-sm font-semibold tracking-wide text-ink-mute uppercase">{title}</h2> : <span />}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
