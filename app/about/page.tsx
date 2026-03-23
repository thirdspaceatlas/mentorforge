import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MentorForge",
  description:
    "Built by someone who needed it and couldn’t find it. A first-person note from the founder."
};

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-28 sm:space-y-20 sm:pb-36">
      {/* Hero — unchanged title + headline */}
      <header className="mx-auto max-w-3xl border-b border-slate-200/70 pb-14 text-center dark:border-slate-800/80 sm:pb-16">
        <p className="mb-5 font-display text-[0.7rem] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          About MentorForge
        </p>
        <h1 className="mx-auto max-w-[20rem] text-balance font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-slate-900 dark:text-slate-50 sm:max-w-[26rem] sm:text-[2.65rem] sm:leading-[1.12]">
          Built by someone who needed it and couldn&apos;t find it.
        </h1>
      </header>

      {/* Founder letter */}
      <section
        aria-labelledby="founder-letter-label"
        className="mx-auto max-w-[42rem]"
      >
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
            I&apos;m also a husband and a father of eight children, ages three to twenty-one. And a few years ago, inside all of that, I decided to pursue my CFA.
          </p>
          <p>
            Every tool I tried seemed built for someone with clean time, clear focus, and a predictable schedule. That person is not me. I&apos;m not sure that person works in financial services.
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

      {/* Emphasized closing statement */}
      <figure className="mx-auto max-w-[40rem] border-y border-slate-200/80 py-14 dark:border-slate-700/70 sm:py-16">
        <blockquote className="text-center font-display text-[1.45rem] font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.65rem] sm:leading-tight">
          You don&apos;t study your way to these credentials. You get forged.
        </blockquote>
      </figure>

      {/* Disclosure */}
      <section
        aria-label="Disclosure"
        className="mx-auto max-w-[42rem] rounded-xl border border-slate-200/70 bg-slate-50/80 px-5 py-5 dark:border-slate-800/80 dark:bg-slate-900/35 sm:px-6"
      >
        <p className="text-[0.8125rem] leading-relaxed text-slate-600 dark:text-slate-400">
          MentorForge is independent study-planning software and is not affiliated with CFA Institute, CFP Board, or any other credentialing body.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl border-t border-slate-200/70 pt-16 text-center dark:border-slate-800/80 sm:pt-20">
        <h2 className="font-display text-[1.65rem] font-medium leading-[1.25] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.85rem]">
          Ready to build a plan that actually holds?
        </h2>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200 dark:focus-visible:ring-offset-slate-950"
          >
            Create your free account
          </Link>
          <Link
            href="/learn-more"
            className="inline-flex min-w-[10rem] items-center justify-center rounded-full border border-slate-300/90 bg-white/80 px-8 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900/70 dark:focus-visible:ring-offset-slate-950"
          >
            Learn how it works
          </Link>
        </div>
      </section>
    </div>
  );
}
