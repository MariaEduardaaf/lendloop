import { LandingAction } from "@/components/landing-action";
import { PublicTools } from "@/components/public-tools";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <p className="text-lg font-semibold tracking-tight text-accent">LendLoop</p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Borrow what you need. Lend what you don&apos;t.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-stone-700">
        List the tools you can spare, ask a neighbor for the ones you need, and get an email when a request is
        answered or a loan is due back.
      </p>
      <div className="mt-8">
        <LandingAction />
      </div>

      <section aria-labelledby="available" className="mt-16">
        <h2 id="available" className="mb-4 text-lg font-semibold tracking-tight">
          Available now
        </h2>
        <PublicTools />
      </section>
    </main>
  );
}
