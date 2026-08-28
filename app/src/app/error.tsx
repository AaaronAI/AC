"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="stamp text-danger">Something broke</p>
      <h1 className="headline mt-6 text-4xl">That didn&apos;t go as planned.</h1>
      <p className="mt-4 text-ink-soft">
        {error.message || "An unexpected error occurred."} The action was not completed.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded bg-signal px-6 py-3 font-bold text-white hover:bg-signal-dark"
      >
        Try again
      </button>
    </div>
  );
}
