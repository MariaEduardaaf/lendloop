import Link from "next/link";
import { LandingAction } from "@/components/landing-action";
import { ExamplePlate, HowItWorks } from "@/components/landing-examples";
import { PublicTools } from "@/components/public-tools";
import { TRUSTED_LENDER_MEANING } from "@/components/trusted-seal";

const WRAP = "mx-auto max-w-6xl px-4 sm:px-6";
const SECTION = `${WRAP} py-16 sm:py-20`;

export default function Home() {
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-10 rounded-md bg-plate px-4 py-2 font-semibold text-navy focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="on-navy bg-navy text-white">
        <div className={`${WRAP} flex h-14 items-center justify-between gap-4 sm:h-15`}>
          <Link href="/" className="text-xl font-bold tracking-tight">
            LendLoop
          </Link>
          <LandingAction onNavy compact />
        </div>
      </header>

      <main id="main" tabIndex={-1} className="focus:outline-none">
        <section className={`${SECTION} grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-20`}>
          <div>
            <h1 className="text-[2.5rem] leading-[1.08] font-bold tracking-[-0.02em] text-balance sm:text-[3.5rem]">
              Borrow what you need. <br className="hidden sm:block" />
              Lend what you don&apos;t.
            </h1>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted">
              LendLoop is a tool-lending board for one neighborhood. List what you rarely use, borrow what you need
              for a few days, and let the e&#8209;mails handle the follow-up.
            </p>
            <div className="mt-8">
              <LandingAction />
            </div>
          </div>
          <ExamplePlate />
        </section>

        <section aria-labelledby="how" className="border-t border-steel">
          <div className={SECTION}>
            <h2 id="how" className="text-h2 font-bold">
              How it works
            </h2>
            <div className="mt-10">
              <HowItWorks />
            </div>
            <p className="mt-12 max-w-prose text-sm text-muted">{TRUSTED_LENDER_MEANING} You will see their seal on the board.</p>
          </div>
        </section>

        <section aria-labelledby="available" className="border-t border-steel">
          <div className={SECTION}>
            <h2 id="available" className="text-h2 font-bold">
              Available now
            </h2>
            <p className="mt-1 max-w-prose text-muted">Sign in to see when each tool is free and to ask for the dates you need.</p>
            <div className="mt-6">
              <PublicTools />
            </div>
          </div>
        </section>
      </main>

      <footer className="on-navy bg-navy text-white">
        <div className={`${WRAP} py-14 sm:py-16`}>
          <h2 className="text-h2 font-bold">Something on your list this week?</h2>
          <p className="mt-1 max-w-prose text-on-navy">Borrowing is free between neighbors. Sign in to list a tool or ask for one.</p>
          <div className="mt-6">
            <LandingAction onNavy />
          </div>
          <p className="mt-12 border-t border-white/10 pt-5 text-sm text-on-navy">
            LendLoop. Borrow what you need. Lend what you don&apos;t.
          </p>
        </div>
      </footer>
    </div>
  );
}
