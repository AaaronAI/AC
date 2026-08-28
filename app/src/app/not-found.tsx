import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="stamp text-signal">404</p>
      <h1 className="headline mt-6 text-5xl">This moment isn&apos;t sponsorable.</h1>
      <p className="mt-4 text-ink-soft">
        The page you&apos;re looking for doesn&apos;t exist — but plenty of real ones do.
      </p>
      <Link
        href="/browse"
        className="mt-8 inline-block rounded bg-signal px-6 py-3 font-bold text-white hover:bg-signal-dark"
      >
        Browse the marketplace
      </Link>
    </div>
  );
}
