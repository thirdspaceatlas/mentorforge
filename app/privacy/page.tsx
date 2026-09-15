import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — MentorForge",
  description:
    "What MentorForge collects, how calendar data is handled, and step-by-step instructions to delete your data or account."
};

const lastUpdated = "2026-08-27";

type Section = { id: string; heading: string };

const toc: Section[] = [
  { id: "summary", heading: "The short version" },
  { id: "what-we-collect", heading: "What we collect" },
  { id: "calendar-data", heading: "Calendar data" },
  { id: "how-we-use", heading: "How we use your data" },
  { id: "third-parties", heading: "Third parties" },
  { id: "delete-data", heading: "How to delete your data" },
  { id: "your-rights", heading: "Your legal rights" },
  { id: "retention", heading: "Retention" },
  { id: "security", heading: "Security" },
  { id: "children", heading: "Children" },
  { id: "changes", heading: "Changes to this policy" },
  { id: "contact", heading: "Contact" }
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 font-display text-[1.4rem] font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.55rem]"
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.97rem] leading-[1.75] text-slate-700 dark:text-slate-300">{children}</p>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-2.5 text-[0.97rem] leading-[1.7] text-slate-700 dark:text-slate-300">
      {children}
    </ul>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[0.65em] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-[1.1rem] font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-50">
      {children}
    </h3>
  );
}

function OrderedList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal space-y-2.5 pl-5 text-[0.97rem] leading-[1.7] text-slate-700 dark:text-slate-300 marker:font-medium marker:text-slate-500 dark:marker:text-slate-400">
      {children}
    </ol>
  );
}

export default function PrivacyPage() {
  return (
    <div className="relative left-1/2 -my-8 -ml-[50vw] w-screen bg-paper sm:-my-14">
      <div className="mx-auto max-w-[1200px] space-y-14 px-4 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
      <header className="mx-auto max-w-3xl border-b border-slate-200/70 pb-12 text-center dark:border-slate-800/80 sm:pb-14">
        <p className="mb-5 font-display text-[0.7rem] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Privacy policy
        </p>
        <h1 className="font-display text-[2rem] font-medium leading-[1.12] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2.5rem] sm:leading-[1.08]">
          What we collect, and what we don&apos;t.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Last updated {lastUpdated}. Written to be read, not to hide behind.
        </p>
      </header>

      <nav
        aria-label="Privacy policy sections"
        className="mx-auto max-w-3xl rounded-2xl border border-slate-200/95 bg-white/90 px-6 py-5 dark:border-slate-700/75 dark:bg-slate-900/55 sm:px-7"
      >
        <p className="mb-3 font-display text-[0.65rem] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          On this page
        </p>
        <ol className="grid gap-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:grid-cols-2">
          {toc.map((s, i) => (
            <li key={s.id} className="flex gap-2.5">
              <span className="w-5 shrink-0 text-right tabular-nums text-slate-400 dark:text-slate-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <a
                href={`#${s.id}`}
                className="text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-accent hover:text-accent dark:text-slate-300 dark:decoration-slate-600"
              >
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section aria-labelledby="summary" className="mx-auto max-w-3xl space-y-4">
        <H2 id="summary">The short version</H2>
        <P>
          MentorForge is a study-planning and scheduling tool. We collect the minimum we need to build your plan,
          nudge you at the right times, and keep your account secure. We do not sell your data, we do not run ads,
          and we do not train AI models on your study history. When you delete your account, we delete your data.
        </P>
      </section>

      <section aria-labelledby="what-we-collect" className="mx-auto max-w-3xl space-y-4">
        <H2 id="what-we-collect">What we collect</H2>
        <P>At sign-up:</P>
        <List>
          <Bullet>Your email address and a hashed password (we never see the password in plain text).</Bullet>
          <Bullet>Your first name, so we can address you like a person.</Bullet>
        </List>
        <P>During onboarding (all optional unless marked otherwise):</P>
        <List>
          <Bullet>CFA level, exam date, weekly hours, preferred study times — required for plan generation.</Bullet>
          <Bullet>Last name, credential type, primary study challenge, employer type, and how you heard about us — all optional, used to improve the product and personalize communications.</Bullet>
        </List>
        <P>As you use the product:</P>
        <List>
          <Bullet>Study sessions you log, rebalances you run, and Calendar Coach windows you accept or skip.</Bullet>
          <Bullet>Survey responses you choose to answer in weekly digests or cap-hit prompts.</Bullet>
          <Bullet>
            Product analytics: Plausible (aggregate page views, no cookies) and Amplitude (events, session
            context, and optional Session Replay of how you use the site so we can fix friction). Amplitude may
            use cookies or similar identifiers.
          </Bullet>
          <Bullet>
            If AI insights are enabled for your account, prompts and model responses for those blurbs may be
            sent to Amplitude Agent Analytics (with automated PII redaction) so we can monitor quality and cost —
            not to train public models.
          </Bullet>
        </List>
      </section>

      <section aria-labelledby="calendar-data" className="mx-auto max-w-3xl space-y-4">
        <H2 id="calendar-data">Calendar data</H2>
        <P>
          Calendar Coach needs to know when you&apos;re busy so it can find study windows in your real schedule.
          When you connect Google Calendar or Outlook we store:
        </P>
        <List>
          <Bullet>Event start and end times.</Bullet>
          <Bullet>Busy / free / tentative status.</Bullet>
        </List>
        <P>We never store, read, or display:</P>
        <List>
          <Bullet>Event titles or descriptions.</Bullet>
          <Bullet>Attendees, organizers, or meeting links.</Bullet>
          <Bullet>Attachments, locations, or any other event content.</Bullet>
        </List>
        <P>
          OAuth access tokens and refresh tokens are encrypted at rest. You can disconnect a calendar from{" "}
          <Link href="/app/account" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
            your account settings
          </Link>{" "}
          at any time — we immediately stop syncing and delete the stored busy/free windows.
        </P>
      </section>

      <section aria-labelledby="how-we-use" className="mx-auto max-w-3xl space-y-4">
        <H2 id="how-we-use">How we use your data</H2>
        <List>
          <Bullet>Generate and maintain your study plan.</Bullet>
          <Bullet>Find study windows in your calendar and send notifications or emails about them.</Bullet>
          <Bullet>Send transactional email (welcome, weekly digest, cap-reached, receipts).</Bullet>
          <Bullet>Process payments via Stripe if you subscribe to All Access.</Bullet>
          <Bullet>Understand how people use the product so we can improve it.</Bullet>
          <Bullet>Respond to you when you contact support.</Bullet>
        </List>
        <P>
          We do not sell your personal information. We do not use your data to train machine-learning models
          outside of MentorForge. We do not target advertising at you.
        </P>
      </section>

      <section aria-labelledby="third-parties" className="mx-auto max-w-3xl space-y-4">
        <H2 id="third-parties">Third parties</H2>
        <P>We use a small number of service providers to run MentorForge:</P>
        <List>
          <Bullet>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Supabase</strong> — authentication and database hosting.
          </Bullet>
          <Bullet>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Vercel</strong> — application hosting.
          </Bullet>
          <Bullet>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Stripe</strong> — payment processing for All Access subscriptions. We never see your full card number.
          </Bullet>
          <Bullet>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Resend</strong> — transactional and digest email delivery.
          </Bullet>
          <Bullet>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Google &amp; Microsoft</strong> — OAuth providers for calendar sync and sign-in.
          </Bullet>
          <Bullet>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Plausible</strong> — privacy-respecting page analytics (no cookies, no IP storage).
          </Bullet>
          <Bullet>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Amplitude</strong> — product analytics, Session Replay, and Agent Analytics for AI insights.
            Used to understand product usage and improve MentorForge; not for advertising. Session Replay may
            capture on-page interactions (we do not use it to sell ads). See{" "}
            <a
              href="https://amplitude.com/privacy"
              className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
              rel="noopener noreferrer"
              target="_blank"
            >
              Amplitude&apos;s privacy policy
            </a>
            .
          </Bullet>
          <Bullet>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">OpenPhone</strong> — the phone number we use for direct support. Only used if you reach out to us.
          </Bullet>
        </List>
      </section>

      <section aria-labelledby="delete-data" className="mx-auto max-w-3xl space-y-6">
        <H2 id="delete-data">How to delete your data</H2>
        <P>
          MentorForge lets you delete specific data without closing your account, or delete your entire account
          and associated data. These steps work on the web app and for mobile users who sign in at{" "}
          <Link href="/login" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
            mentorforge.co
          </Link>
          .
        </P>

        <div className="space-y-3">
          <H3>Delete some data (keep your account)</H3>
          <P>Use this when you want to remove part of your MentorForge data but keep signing in.</P>
          <OrderedList>
            <li>
              Sign in at{" "}
              <Link href="/login" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
                mentorforge.co/login
              </Link>
              .
            </li>
            <li>
              Open{" "}
              <Link href="/app/account" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
                Account settings
              </Link>
              .
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">Remove calendar data:</strong> under{" "}
              <em>Connected Calendars</em>, click <strong>Disconnect</strong> next to a calendar. We stop syncing
              immediately and delete stored busy/free windows for that connection. Your account and study plan stay.
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">Reset Calendar Coach history:</strong> in{" "}
              <em>Danger Zone</em>, choose <strong>Reset Calendar Coach</strong>, type <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] dark:bg-slate-800">reset</code>, and confirm.
              This disconnects all calendars and deletes study windows, logged sessions, and sync data. Your study plan stays.
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">Reset your study plan:</strong> in{" "}
              <em>Danger Zone</em>, choose <strong>Reset study plan</strong>, type <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] dark:bg-slate-800">reset</code>, and confirm.
              This clears your saved plan and logged hours. Calendar connections stay unless you disconnect them separately.
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">Stop marketing email:</strong> use the unsubscribe link in any weekly digest footer, or turn off email communications in Account settings.
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">Other requests:</strong> email{" "}
              <a
                href="mailto:privacy@mentorforge.co"
                className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
              >
                privacy@mentorforge.co
              </a>{" "}
              to correct or remove a specific data point. We respond within 30 days.
            </li>
          </OrderedList>
        </div>

        <div className="space-y-3">
          <H3>Delete your entire account</H3>
          <P>Use this when you want to permanently close your MentorForge account.</P>
          <OrderedList>
            <li>
              Sign in at{" "}
              <Link href="/login" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
                mentorforge.co/login
              </Link>
              .
            </li>
            <li>
              Open{" "}
              <Link href="/app/account" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
                Account settings
              </Link>
              .
            </li>
            <li>
              Scroll to <em>Delete account</em> at the bottom of the page.
            </li>
            <li>
              Type <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] dark:bg-slate-800">delete</code> and
              click <strong>Delete account</strong>. Deletion is immediate and cannot be undone.
            </li>
          </OrderedList>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200/95 bg-white/90 px-5 py-5 dark:border-slate-700/75 dark:bg-slate-900/55 sm:px-6">
          <H3>What we delete vs. what we keep</H3>
          <P>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Deleted when you remove specific data:</strong>{" "}
            calendar busy/free windows, Calendar Coach history (windows, sessions, heatmap, sync data), and/or your saved study plan — depending on which action you choose above.
          </P>
          <P>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Deleted when you delete your account:</strong>{" "}
            your profile, email and auth account, study plan, calendar connections and cached calendar data, study sessions,
            survey responses, push notification tokens, and other app data tied to your user ID.
          </P>
          <P>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Kept after account deletion:</strong>{" "}
            payment and billing records that Stripe or applicable law requires us to retain (see{" "}
            <a href="#retention" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
              Retention
            </a>
            ). Active subscriptions are canceled when you delete your account.
          </P>
          <P>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Retention timing:</strong> self-service
            deletions above take effect immediately. Email requests are handled within 30 days. See{" "}
            <a href="#retention" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
              Retention
            </a>{" "}
            for category-by-category details.
          </P>
        </div>
      </section>

      <section aria-labelledby="your-rights" className="mx-auto max-w-3xl space-y-4">
        <H2 id="your-rights">Your legal rights</H2>
        <P>
          For step-by-step deletion instructions, see{" "}
          <a href="#delete-data" className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
            How to delete your data
          </a>
          .
        </P>
        <P>You can also:</P>
        <List>
          <Bullet>
            Export or download the personal data we hold on you by emailing{" "}
            <a
              href="mailto:privacy@mentorforge.co"
              className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            >
              privacy@mentorforge.co
            </a>
            .
          </Bullet>
          <Bullet>Unsubscribe from the weekly digest via the link in the email footer.</Bullet>
        </List>
        <P>
          If you&apos;re in the EU, UK, or California and want to exercise formal rights under GDPR, UK-GDPR, or the CCPA, email{" "}
          <a
            href="mailto:privacy@mentorforge.co"
            className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          >
            privacy@mentorforge.co
          </a>{" "}
          with your request and we&apos;ll respond within 30 days.
        </P>
      </section>

      <section aria-labelledby="retention" className="mx-auto max-w-3xl space-y-4">
        <H2 id="retention">Retention</H2>
        <List>
          <Bullet>Account and profile data: kept for as long as your account exists. Deleted on request.</Bullet>
          <Bullet>Calendar busy/free windows: re-synced regularly and expire automatically after they&apos;re no longer relevant for scheduling.</Bullet>
          <Bullet>Payment records: retained per Stripe&apos;s requirements and applicable accounting law.</Bullet>
          <Bullet>Support conversations: kept until the issue is resolved plus up to two years, then deleted.</Bullet>
        </List>
      </section>

      <section aria-labelledby="security" className="mx-auto max-w-3xl space-y-4">
        <H2 id="security">Security</H2>
        <P>
          All traffic is served over HTTPS. Passwords are hashed; we never see them in plain text. OAuth tokens are encrypted at rest.
          Our database enforces row-level security so a user can only read their own rows. No system is perfect — if you discover a security issue,
          please email us at the address below and we&apos;ll respond quickly.
        </P>
      </section>

      <section aria-labelledby="children" className="mx-auto max-w-3xl space-y-4">
        <H2 id="children">Children</H2>
        <P>
          MentorForge is built for working professionals preparing for adult financial credentialing exams. It is not intended for children under 16,
          and we do not knowingly collect data from them.
        </P>
      </section>

      <section aria-labelledby="changes" className="mx-auto max-w-3xl space-y-4">
        <H2 id="changes">Changes to this policy</H2>
        <P>
          If we materially change this policy we&apos;ll update the &quot;Last updated&quot; date at the top and, for significant changes,
          email registered users before the change takes effect.
        </P>
      </section>

      <section aria-labelledby="contact" className="mx-auto max-w-3xl space-y-4">
        <H2 id="contact">Contact</H2>
        <P>
          Questions, deletion requests, or data-export requests: email{" "}
          <a
            href="mailto:privacy@mentorforge.co"
            className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          >
            privacy@mentorforge.co
          </a>
          . A real person reads the inbox.
        </P>
      </section>
      </div>
    </div>
  );
}
