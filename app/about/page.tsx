import type { Metadata } from "next";
import { MarketingBottomCTA } from "@/components/marketing/MarketingBottomCTA";

export const metadata: Metadata = {
  title: "About MentorForge",
  description:
    "Built by someone who needed it and couldn’t find it. A first-person note from the founder."
};

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-16 sm:space-y-20 sm:pb-20">
      <header className="mx-auto max-w-3xl border-b border-slate-200/70 pb-14 text-center dark:border-slate-800/80 sm:pb-16">
        <p className="mb-5 font-display text-[0.7rem] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          About MentorForge
        </p>
        <h1 className="mx-auto max-w-[20rem] text-balance font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-slate-900 dark:text-slate-50 sm:max-w-[26rem] sm:text-[2.65rem] sm:leading-[1.12]">
          Built by someone who needed it and couldn&apos;t find it.
        </h1>
      </header>

      <section aria-labelledby="founder-letter-label" className="mx-auto max-w-[42rem]">
        <p
          id="founder-letter-label"
          className="mb-6 font-display text-[0.7rem] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
        >
          From the founder
        </p>
        <div className="space-y-6 text-base leading-[1.75] text-slate-700 dark:text-slate-300">
          <p>
            I&apos;ve spent years earning the licenses this industry demands. Each one felt like an epic battle — the kind that leaves a mark. At some point, those battles stopped feeling like a résumé and started feeling like something else. The word that came to mind was forged. It stayed with me.
          </p>
          <p>
            I&apos;ve spent most of my career in wealth management and financial services, in environments where real clients, real money, and real decisions do not wait for a convenient moment. I know what this career actually demands because I&apos;ve lived it.
          </p>
          <p>
            A few years ago, inside all of that, I decided to pursue my CFA.
          </p>
          <p>
            Every tool I tried seemed built for someone with clean time, clear focus, and a predictable schedule. That wasn&apos;t me.
          </p>
          <p>
            At forty-three, I was diagnosed with Inattentive ADHD. It didn&apos;t slow me down. It gave me better information. And it pushed me to build the tool I had always needed — the one that didn&apos;t exist.
          </p>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            MentorForge is that tool.
          </p>
          <p>
            I&apos;m going to earn my CFA using it. That is not marketing. It is a public commitment from a real user building and using his own product. After that, the FRM. And from there, we are building toward the serious designations working professionals carry next.
          </p>
        </div>
      </section>

      <figure className="mx-auto max-w-[40rem] border-y border-slate-200/80 py-14 dark:border-slate-700/70 sm:py-16">
        <blockquote className="text-center font-display text-[1.45rem] font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.65rem] sm:leading-tight">
          You don&apos;t study your way to these credentials. You get forged.
        </blockquote>
      </figure>

      <section className="pt-12 sm:pt-16">
        <MarketingBottomCTA
          variant="band"
          headline="Ready to build a plan that actually holds?"
          supporting="Start free — no credit card required."
          primaryLabel="Create your free account"
          secondaryLabel="Learn how it works"
          secondaryHref="/learn-more"
        />
      </section>
    </div>
  );
}
