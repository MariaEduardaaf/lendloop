import { ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/app-shell";
import { LandingAction } from "@/components/landing-action";
import { ExampleToolCard, HowItWorks } from "@/components/landing-examples";
import { PublicTools } from "@/components/public-tools";
import { TRUSTED_LENDER_MEANING } from "@/components/trusted-seal";

const WRAP = "mx-auto max-w-[76rem] px-4 sm:px-8";
const SECTION = `${WRAP} py-12 sm:py-16`;
const H2 = "text-h2 font-bold tracking-[-0.02em] sm:text-[2.25rem] sm:leading-[2.5rem]";

export default function Home() {
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-10 rounded-full bg-ink px-5 py-2.5 font-bold text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className={`${WRAP} flex items-center justify-between gap-4 pt-4 sm:pt-7`}>
        <Wordmark href="/" />
        <LandingAction compact />
      </header>

      <main id="main" tabIndex={-1} className="focus:outline-none">
        <section className={`${WRAP} grid items-center gap-10 pt-12 pb-12 sm:pt-20 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_27rem] lg:gap-16`}>
          <div>
            <h1 className="text-[2.75rem] leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-[4rem] lg:text-[4.5rem]">
              Borrow what you need. Lend what you don&apos;t.
            </h1>
            <p className="mt-6 max-w-[44ch] text-lg text-muted sm:text-xl">
              LendLoop is a tool-lending board for one neighborhood. List what you rarely use, borrow what you need
              for a few days, and let the e&#8209;mails handle the follow-up.
            </p>
            <div className="mt-9">
              <LandingAction />
            </div>
          </div>
          <ExampleToolCard />
        </section>

        <section aria-labelledby="how" className={SECTION}>
          <h2 id="how" className={H2}>
            How it works
          </h2>
          <div className="mt-8">
            <HowItWorks />
          </div>
          <p className="mx-1 mt-6 flex max-w-prose items-start gap-2 text-[0.9375rem] text-muted">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-moss" strokeWidth={2} />
            <span>
              {TRUSTED_LENDER_MEANING} You will see the Trusted mark next to their name on the board.
            </span>
          </p>
        </section>

        <section aria-labelledby="available" className={SECTION}>
          <h2 id="available" className={H2}>
            Available now
          </h2>
          <p className="mt-2 max-w-prose text-lg text-muted">
            These are free today. Sign in to see the days ahead and to ask.
          </p>
          <div className="mt-8">
            <PublicTools />
          </div>
        </section>

        <section aria-labelledby="close" className={`${WRAP} pt-12 sm:pt-16`}>
          <div className="flex flex-col items-start justify-between gap-7 rounded-card bg-surface p-7 shadow-soft sm:p-10 md:flex-row md:items-center">
            <div>
              <h2 id="close" className={H2}>
                Something on your list this week?
              </h2>
              <p className="mt-2 max-w-prose text-lg text-muted">
                Borrowing is free between neighbors. Sign in to list a tool or ask for one.
              </p>
            </div>
            <LandingAction />
          </div>
        </section>
      </main>

      <footer className={`${WRAP} py-10 text-sm text-muted`}>
        <p className="mx-1">LendLoop · Borrow what you need. Lend what you don&apos;t.</p>
      </footer>
    </div>
  );
}
