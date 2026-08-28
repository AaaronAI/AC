import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export async function Nav() {
  const session = await getSession();
  const dashboardHref =
    session?.role === "ADMIN" ? "/admin" : session?.role === "SELLER" ? "/seller" : "/dashboard";
  return (
    <header className="border-b-2 border-ink bg-paper">
      <nav
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4"
        aria-label="Main"
      >
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Sponsor<span className="text-signal">This</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
          <Link href="/browse" className="hover:text-signal">
            Browse
          </Link>
          <Link href="/brief" className="hover:text-signal">
            Post a brief
          </Link>
          <Link href="/sell" className="hover:text-signal">
            List something
          </Link>
          <Link href="/how-it-works" className="hover:text-signal">
            How it works
          </Link>
          <Link href="/pricing" className="hover:text-signal">
            Pricing
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm font-semibold">
          {session ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded border-2 border-ink px-3 py-1.5 hover:bg-ink hover:text-paper"
              >
                {session.role === "ADMIN"
                  ? "Admin"
                  : session.role === "SELLER"
                    ? "Seller dashboard"
                    : "Dashboard"}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="text-ink-soft hover:text-signal">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-signal">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded bg-signal px-3 py-1.5 text-white hover:bg-signal-dark"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
