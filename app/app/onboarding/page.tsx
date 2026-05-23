"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Events,
  track,
  bucketHoursPerWeek,
  bucketDaysToExam,
} from "@/lib/analytics";
import { isPushSupported, subscribeToPush } from "@/lib/push/client";

/**
 * Calendar Coach onboarding — linear wizard at /app/onboarding.
 * Pre-fills exam rhythm + CRM fields from SavedStudyPlan and Profile when present.
 */

type CfaLevel = "I" | "II" | "III";

type CredentialType = "" | "CFA" | "CFP_waitlist" | "other";
type PrimaryChallenge =
  | ""
  | "cant_find_time"
  | "lose_focus"
  | "fall_behind"
  | "dont_know_pace"
  | "other";
type EmployerType =
  | ""
  | "buy_side"
  | "sell_side"
  | "corporate_finance"
  | "wealth_management"
  | "banking"
  | "student"
  | "other";

const TOTAL_STEPS = 8;

const STEP_TITLES = [
  "Get started",
  "Exam level",
  "Connect calendars",
  "Study preferences",
  "Notifications",
  "Install app",
  "About you",
  "You're all set",
];

const PRIMARY_CHALLENGE_OPTIONS: { value: Exclude<PrimaryChallenge, "">; label: string }[] = [
  { value: "cant_find_time", label: "I can't find time to study" },
  { value: "lose_focus", label: "I lose focus when I start" },
  { value: "fall_behind", label: "I fall behind the plan" },
  { value: "dont_know_pace", label: "I don't know if I'm on pace" },
  { value: "other", label: "Something else" }
];

const EMPLOYER_OPTIONS: { value: Exclude<EmployerType, "">; label: string }[] = [
  { value: "buy_side", label: "Buy-side" },
  { value: "sell_side", label: "Sell-side" },
  { value: "wealth_management", label: "Wealth Management" },
  { value: "banking", label: "Banking" },
  { value: "corporate_finance", label: "Corporate Finance" },
  { value: "student", label: "Student / Between Jobs" },
  { value: "other", label: "Other" }
];

const ATTRIBUTION_OPTIONS = [
  "LinkedIn",
  "Reddit",
  "Friend / Word of Mouth",
  "Search",
  "Other"
] as const;

/** ISO exam dates used by POST /api/onboarding-preferences → window label in step 4. */
const EXAM_ISO_TO_WINDOW_LABEL: Record<string, string> = {
  "2026-05-12": "May 2026",
  "2026-08-18": "August 2026",
  "2026-11-15": "November 2026",
  "2027-02-02": "February 2027",
};

function isCfaLevel(v: string): v is CfaLevel {
  return v === "I" || v === "II" || v === "III";
}

function examIsoToWindowLabel(iso: string): string {
  return EXAM_ISO_TO_WINDOW_LABEL[iso] ?? "May 2026";
}

function nearestMinSessionOption(minutes: number): string {
  const opts = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];
  const clamped = Math.max(5, Math.min(180, Math.round(minutes)));
  let best = opts[0]!;
  let bestDist = Infinity;
  for (const o of opts) {
    const d = Math.abs(o - clamped);
    if (d < bestDist) {
      bestDist = d;
      best = o;
    }
  }
  return String(best);
}

function safeCredentialType(v: string | null): CredentialType {
  if (!v) return "";
  if (v === "CFA" || v === "CFP_waitlist" || v === "other") return v;
  return "";
}

function safePrimaryChallenge(v: string | null): PrimaryChallenge {
  if (!v) return "";
  const ok = PRIMARY_CHALLENGE_OPTIONS.some((o) => o.value === v);
  return ok ? (v as PrimaryChallenge) : "";
}

function safeEmployerType(v: string | null): EmployerType {
  if (!v) return "";
  const ok = EMPLOYER_OPTIONS.some((o) => o.value === v);
  return ok ? (v as EmployerType) : "";
}

function attributionFromDb(raw: string | null): string {
  if (!raw) return "";
  if ((ATTRIBUTION_OPTIONS as readonly string[]).includes(raw)) return raw;
  const lower = raw.trim().toLowerCase();
  for (const o of ATTRIBUTION_OPTIONS) {
    if (o.toLowerCase() === lower) return o;
  }
  if (lower.startsWith("other")) return "Other";
  return "";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [gate, setGate] = useState<"loading" | "wizard" | "ready">("loading");
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<CfaLevel>("I");
  const [hoursPerWeek, setHoursPerWeek] = useState(8);
  const [minSession, setMinSession] = useState("10");
  const [examWindow, setExamWindow] = useState("May 2026");

  // CRM fields — all optional (step 7: "About you")
  const [lastName, setLastName] = useState("");
  const [credentialType, setCredentialType] = useState<CredentialType>("");
  const [primaryChallenge, setPrimaryChallenge] = useState<PrimaryChallenge>("");
  const [employerType, setEmployerType] = useState<EmployerType>("");
  const [attribution, setAttribution] = useState("");
  const [credentialOther, setCredentialOther] = useState("");
  const [primaryChallengeOther, setPrimaryChallengeOther] = useState("");
  const [employerOther, setEmployerOther] = useState("");
  const [attributionOther, setAttributionOther] = useState("");
  const [emailCommunicationsOptIn, setEmailCommunicationsOptIn] = useState(false);
  /** True once we loaded a saved study plan from the API (used to explain pre-filled rhythm). */
  const [rhythmFromSavedPlan, setRhythmFromSavedPlan] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/study-plan").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/profile/onboarding").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/calendar/stats").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([planRes, profRes, statsRes]) => {
        if (!active) return;
        const plan = planRes?.plan;
        if (plan && typeof plan.examLevel === "string" && isCfaLevel(plan.examLevel)) {
          setLevel(plan.examLevel);
        }
        if (
          plan &&
          typeof plan.weeklyHours === "number" &&
          plan.weeklyHours >= 1 &&
          plan.weeklyHours <= 40
        ) {
          setHoursPerWeek(plan.weeklyHours);
        }
        if (plan && typeof plan.calendarPreferredSessionMin === "number") {
          setMinSession(nearestMinSessionOption(plan.calendarPreferredSessionMin));
        }
        if (plan && typeof plan.examDate === "string") {
          setExamWindow(examIsoToWindowLabel(plan.examDate));
          setRhythmFromSavedPlan(true);
        }
        const pr = profRes?.profile;
        if (pr) {
          if (typeof pr.lastName === "string" && pr.lastName) setLastName(pr.lastName);
          setCredentialType(safeCredentialType(pr.credentialType));
          setPrimaryChallenge(safePrimaryChallenge(pr.primaryChallenge));
          setEmployerType(safeEmployerType(pr.employerType));
          const att = attributionFromDb(pr.attribution);
          if (att) setAttribution(att);
        }

        const weekCount = Array.isArray(plan?.weekPlan) ? plan.weekPlan.length : 0;
        const calendarsConnected =
          typeof statsRes?.calendarsConnected === "number" ? statsRes.calendarsConnected : 0;
        setGate(weekCount > 0 && calendarsConnected > 0 ? "ready" : "wizard");
      })
      .catch(() => setGate("wizard"));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.title = `${STEP_TITLES[step - 1]} · MentorForge`;
  }, [step]);

  // Handle OAuth callback redirect — skip to step 4 if calendar was just connected
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      const provider = params.get("provider");
      track(Events.calendarConnected, {
        provider: provider === "google" ? "google" : "outlook",
        is_first_connection: "true",
        connection_count: "1",
      });
      setStep(4);
      setGate("wizard");
      // Clean up URL
      window.history.replaceState({}, "", "/app/onboarding");
    }
  }, []);

  function goTo(s: number) {
    setStep(s);
    window.scrollTo(0, 0);
    // Trigger calendar sync and save preferences when reaching the final step
    if (s === TOTAL_STEPS) {
      fetch("/api/calendar/sync", { method: "POST" }).catch(() => {});
      savePreferences();
    }
  }

  function savePreferences() {
    // Map exam window label to an approximate ISO date for the planner
    const examMonthMap: Record<string, string> = {
      "May 2026": "2026-05-12",
      "August 2026": "2026-08-18",
      "November 2026": "2026-11-15",
      "February 2027": "2027-02-02",
    };
    const examDate = examMonthMap[examWindow] || "2026-05-12";

    const daysToExam = Math.max(
      0,
      Math.round(
        (new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    );

    track(Events.onboardingComplete, {
      level,
      credential: credentialType || "CFA",
      hours_per_week_bucket: bucketHoursPerWeek(hoursPerWeek),
      days_to_exam_bucket: bucketDaysToExam(daysToExam),
      employer_type: employerType || "skipped",
    });

    fetch("/api/onboarding-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examLevel: level,
        examDate,
        weeklyHours: hoursPerWeek,
        weekStartDay: "1", // Monday default
        lastName: lastName || undefined,
        credentialType: credentialType || undefined,
        credentialOther: credentialType === "other" ? (credentialOther || undefined) : undefined,
        primaryChallenge: primaryChallenge || undefined,
        primaryChallengeOther: primaryChallenge === "other" ? (primaryChallengeOther || undefined) : undefined,
        employerType: employerType || undefined,
        employerTypeOther: employerType === "other" ? (employerOther || undefined) : undefined,
        attribution: attribution === "Other"
          ? (attributionOther ? `Other: ${attributionOther}` : "Other")
          : (attribution || undefined),
        emailCommunicationsOptIn,
      }),
    }).catch(() => {});
  }

  // Keyboard: Enter to advance, Escape to go back
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if ((e.target as HTMLElement).contentEditable === "true") return;
      if (e.key === "Enter" && step < TOTAL_STEPS) goTo(step + 1);
      if (e.key === "Escape" && step > 1) goTo(step - 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fafaf9] dark:bg-slate-950">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-[#fafaf9] px-4 pt-5 dark:bg-slate-950">
        <div className="mx-auto flex max-w-md gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                i < step
                  ? "bg-emerald-600 dark:bg-emerald-500"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <p className="mx-auto mt-2 max-w-md text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Step content */}
      <div className="flex flex-1 items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {gate === "loading" ? (
            <StepShell>
              <StepTitle>Loading your setup…</StepTitle>
              <StepSubtitle>
                Checking your saved plan and calendars.
              </StepSubtitle>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent dark:border-emerald-500" />
                Loading…
              </div>
            </StepShell>
          ) : gate === "ready" ? (
            <StepShell>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-500">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M7 14l5 5 9-9" />
                </svg>
              </div>
              <StepTitle>You&apos;re already set up.</StepTitle>
              <StepSubtitle>
                Your plan and at least one calendar connection are already on this account.
                Jump straight into Calendar Coach — no need to redo setup.
              </StepSubtitle>
              <PrimaryButton onClick={() => router.push("/app/today")}>
                Open Calendar Coach
              </PrimaryButton>
              <SecondaryButton onClick={() => router.push("/app")}>
                Review study plan
              </SecondaryButton>
              <SecondaryButton onClick={() => setGate("wizard")}>
                Review setup steps
              </SecondaryButton>
            </StepShell>
          ) : null}

          {/* ── Step 1: Welcome ── */}
          {gate === "wizard" && step === 1 && (
            <StepShell>
              <StepTitle>Your calendar, your study coach.</StepTitle>
              <StepSubtitle>
                Calendar Coach finds study windows in your real schedule and nudges
                you when it&apos;s time. No willpower required.
              </StepSubtitle>
              <PrimaryButton onClick={() => goTo(2)}>Get started</PrimaryButton>
            </StepShell>
          )}

          {/* ── Step 2: Exam Level ── */}
          {gate === "wizard" && step === 2 && (
            <StepShell>
              <StepTitle>Which exam are you preparing for?</StepTitle>
              <StepSubtitle>
                This determines your topic weights and study benchmarks.
              </StepSubtitle>
              <div className="mb-8 flex overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                {(["I", "II", "III"] as CfaLevel[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`min-h-[44px] flex-1 border-r border-slate-200 py-3 text-sm font-semibold transition-colors last:border-r-0 dark:border-slate-700 ${
                      level === l
                        ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
                        : "bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    } [-webkit-tap-highlight-color:transparent]`}
                    aria-pressed={level === l}
                  >
                    Level {l}
                  </button>
                ))}
              </div>
              <PrimaryButton onClick={() => goTo(3)}>Continue</PrimaryButton>
              <SecondaryButton onClick={() => goTo(1)}>Back</SecondaryButton>
            </StepShell>
          )}

          {/* ── Step 3: Calendar Connect ── */}
          {gate === "wizard" && step === 3 && (
            <StepShell>
              <StepTitle>Connect your calendars</StepTitle>
              <StepSubtitle>
                We look at when you&apos;re busy, not what you&apos;re doing.
              </StepSubtitle>

              {/* Privacy grid */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-emerald-50 p-4 text-[13px] leading-relaxed dark:bg-emerald-950/40">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    We see
                  </span>
                  <PrivacyItem>Start time</PrivacyItem>
                  <PrivacyItem>End time</PrivacyItem>
                  <PrivacyItem>Busy / free</PrivacyItem>
                </div>
                <div className="rounded-md bg-slate-100 p-4 text-[13px] leading-relaxed dark:bg-slate-800">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    We never see
                  </span>
                  <PrivacyItem muted>Meeting titles</PrivacyItem>
                  <PrivacyItem muted>Attendees</PrivacyItem>
                  <PrivacyItem muted>Descriptions</PrivacyItem>
                </div>
              </div>

              <OAuthButton onClick={() => { window.location.href = "/api/calendar/oauth/google"; }} icon="google">
                Connect Google Calendar
              </OAuthButton>
              <OAuthButton onClick={() => { window.location.href = "/api/calendar/oauth/outlook"; }} icon="outlook">
                Connect Outlook Calendar
              </OAuthButton>
              <SecondaryButton onClick={() => goTo(4)}>Skip for now</SecondaryButton>
              <SecondaryButton onClick={() => goTo(2)}>Back</SecondaryButton>
            </StepShell>
          )}

          {/* ── Step 4: Study Preferences ── */}
          {gate === "wizard" && step === 4 && (
            <StepShell>
              <StepTitle>Your study rhythm</StepTitle>
              <StepSubtitle>
                We&apos;ll find windows that fit how you actually work.
              </StepSubtitle>
              {rhythmFromSavedPlan ? (
                <p className="-mt-4 mb-6 text-left text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  These fields match your saved study plan from Plan. Adjust only
                  if something changed — you don&apos;t need to rebuild your roadmap.
                </p>
              ) : null}

              <Field label="Available hours per week" hint="Be realistic, not ideal.">
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </Field>

              <Field label="Minimum session length" hint="Shorter sessions work. Even 5 minutes counts.">
                <select
                  value={minSession}
                  onChange={(e) => setMinSession(e.target.value)}
                  className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="25">25 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </Field>

              <Field label="Exam window">
                <select
                  value={examWindow}
                  onChange={(e) => setExamWindow(e.target.value)}
                  className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option>May 2026</option>
                  <option>August 2026</option>
                  <option>November 2026</option>
                  <option>February 2027</option>
                </select>
              </Field>

              <PrimaryButton onClick={() => goTo(5)}>Continue</PrimaryButton>
              <SecondaryButton onClick={() => goTo(3)}>Back</SecondaryButton>
            </StepShell>
          )}

          {/* ── Step 5: Notifications ── */}
          {gate === "wizard" && step === 5 && (
            <NotificationsStep
              onNext={() => goTo(6)}
              onBack={() => goTo(4)}
            />
          )}

          {/* ── Step 6: Install App (browser-adaptive) ── */}
          {gate === "wizard" && step === 6 && <InstallStep onNext={() => goTo(7)} onBack={() => goTo(5)} />}

          {/* ── Step 7: About you (all optional) ── */}
          {gate === "wizard" && step === 7 && (
            <StepShell>
              <StepTitle>Help us make MentorForge better for you.</StepTitle>
              <StepSubtitle>
                All optional. Skip anything you&apos;d rather not share — you can always update
                this later in your account. If you already filled this on another device,
                we&apos;ve pre-filled what we have on file.
              </StepSubtitle>

              <Field label="Last name">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={50}
                  autoComplete="family-name"
                  className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </Field>

              <Field label="Credential you're preparing for">
                <select
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value as CredentialType)}
                  className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Prefer not to say</option>
                  <option value="CFA">CFA</option>
                  <option value="CFP_waitlist">CFP (coming soon — add me to the waitlist)</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              {credentialType === "other" ? (
                <Field label="Other (optional)">
                  <input
                    type="text"
                    value={credentialOther}
                    onChange={(e) => setCredentialOther(e.target.value)}
                    maxLength={80}
                    placeholder="Tell us what you're preparing for"
                    className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </Field>
              ) : null}

              <Field label="Biggest study challenge">
                <select
                  value={primaryChallenge}
                  onChange={(e) =>
                    setPrimaryChallenge(e.target.value as PrimaryChallenge)
                  }
                  className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Prefer not to say</option>
                  {PRIMARY_CHALLENGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {primaryChallenge === "other" ? (
                <Field label="Something else (optional)">
                  <input
                    type="text"
                    value={primaryChallengeOther}
                    onChange={(e) => setPrimaryChallengeOther(e.target.value)}
                    maxLength={120}
                    placeholder="Optional"
                    className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </Field>
              ) : null}

              <Field label="What best describes your work?">
                <select
                  value={employerType}
                  onChange={(e) => setEmployerType(e.target.value as EmployerType)}
                  className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Prefer not to say</option>
                  {EMPLOYER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {employerType === "other" ? (
                <Field label="Other (optional)">
                  <input
                    type="text"
                    value={employerOther}
                    onChange={(e) => setEmployerOther(e.target.value)}
                    maxLength={120}
                    placeholder="Optional"
                    className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </Field>
              ) : null}

              <Field label="How did you hear about us?">
                <select
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                  className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Prefer not to say</option>
                  {ATTRIBUTION_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              {attribution === "Other" ? (
                <Field label="Other (optional)">
                  <input
                    type="text"
                    value={attributionOther}
                    onChange={(e) => setAttributionOther(e.target.value)}
                    maxLength={120}
                    placeholder="Optional"
                    className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </Field>
              ) : null}

              <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3.5 py-3 text-left text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={emailCommunicationsOptIn}
                  onChange={(e) => setEmailCommunicationsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 dark:border-slate-600 dark:bg-slate-900"
                />
                <span>
                  Email me the weekly study digest and occasional product updates. You can change this anytime in account settings.
                </span>
              </label>

              <PrimaryButton onClick={() => goTo(8)}>Continue</PrimaryButton>
              <SecondaryButton onClick={() => goTo(8)}>Skip for now</SecondaryButton>
              <SecondaryButton onClick={() => goTo(6)}>Back</SecondaryButton>
            </StepShell>
          )}

          {/* ── Step 8: All Set ── */}
          {gate === "wizard" && step === 8 && (
            <StepShell>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-500">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M7 14l5 5 9-9" />
                </svg>
              </div>
              <StepTitle>You&apos;re all set.</StepTitle>
              <StepSubtitle>
                We&apos;re syncing your calendars now. Your first study windows
                will appear within a few minutes.
              </StepSubtitle>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                Syncing calendars...
              </div>
              <div className="mt-8 space-y-2">
                <PrimaryButton onClick={() => router.push("/app/today")}>
                  Open Calendar Coach
                </PrimaryButton>
                <SecondaryButton onClick={() => router.push("/app")}>
                  Review study plan
                </SecondaryButton>
              </div>
            </StepShell>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared UI Components ─── */

function StepShell({ children }: { children: React.ReactNode }) {
  return <div className="text-center">{children}</div>;
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
      {children}
    </h1>
  );
}

function StepSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 mb-8 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "flex min-h-[48px] w-full items-center justify-center rounded-md bg-emerald-700 px-6 py-3 text-[15px] font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-emerald-500 dark:text-emerald-950 [-webkit-tap-highlight-color:transparent] " +
        (disabled
          ? "cursor-not-allowed opacity-45"
          : "hover:bg-emerald-800 dark:hover:bg-emerald-400")
      }
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-md text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 [-webkit-tap-highlight-color:transparent]"
    >
      {children}
    </button>
  );
}

function OAuthButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: "google" | "outlook";
}) {
  return (
    <button
      onClick={onClick}
      className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 [-webkit-tap-highlight-color:transparent]"
    >
      {icon === "google" && <GoogleIcon />}
      {icon === "outlook" && <OutlookIcon />}
      {children}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 text-left">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function PrivacyItem({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-start gap-1.5">
      <span
        className={`mt-[0.45em] h-1 w-1 shrink-0 rounded-full ${
          muted ? "bg-slate-400" : "bg-emerald-600 dark:bg-emerald-500"
        }`}
      />
      <span className={muted ? "text-slate-500 dark:text-slate-400" : "text-ink dark:text-emerald-300"}>
        {children}
      </span>
    </div>
  );
}

/* ─── Notifications Step (real push subscribe) ─── */

function NotificationsStep({
  onNext,
  onBack
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [state, setState] = useState<
    "idle" | "requesting" | "enabled" | "denied" | "unsupported" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!isPushSupported()) {
      setState("unsupported");
      setMessage(
        "This browser doesn't support push notifications. You'll still get the weekly digest email."
      );
      return;
    }
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    if (!vapid) {
      setState("unsupported");
      setMessage(
        "Push isn't configured on this build. You'll still get the weekly digest email."
      );
    }
  }, []);

  async function enable() {
    setState("requesting");
    setMessage(null);
    const outcome = await subscribeToPush();
    if (outcome.ok) {
      setState("enabled");
      return;
    }
    if (outcome.reason === "unsupported") {
      setState("unsupported");
      setMessage(
        "This browser doesn't support push notifications. You'll still get the weekly digest email."
      );
      return;
    }
    if (outcome.reason === "denied") {
      setState("denied");
      setMessage(
        "Notifications were blocked. Enable them later from your browser site settings — or skip for now."
      );
      return;
    }
    if (outcome.reason === "not_configured") {
      setState("unsupported");
      setMessage(
        "Push isn't configured on this build. You'll still get the weekly digest email."
      );
      return;
    }
    setState("error");
    setMessage(outcome.message ?? "Something went wrong enabling notifications.");
  }

  const showContinueOnly =
    state === "enabled" || state === "unsupported";

  return (
    <StepShell>
      <StepTitle>Get nudged at the right time</StepTitle>
      <StepSubtitle>
        Calendar Coach sends study prompts when your calendar opens up.
        You decide whether to start.
      </StepSubtitle>

      <div className="mb-6 rounded-lg border border-emerald-200/60 bg-emerald-50 p-5 text-left dark:border-emerald-900/40 dark:bg-emerald-950/40">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">
          How it works
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-emerald-900/80 dark:text-slate-400">
          Your 3pm meeting gets cancelled. Your phone buzzes: &ldquo;New 20-min
          window. Ethics &amp; Standards review?&rdquo; You tap Start.
          That&apos;s it.
        </p>
      </div>

      {state === "enabled" ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-[13px] leading-relaxed text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          Notifications enabled. You&apos;re set.
        </div>
      ) : null}
      {message ? (
        <div className="mb-5 rounded-md border border-slate-200 bg-white px-4 py-3 text-left text-[13px] leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {message}
          {state === "unsupported" && isAppleMobile() ? (
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              On many iPhones and iPads, web push isn&apos;t available in the browser.
              The weekly digest email is the reliable fallback.
            </p>
          ) : null}
        </div>
      ) : null}

      {showContinueOnly ? (
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
      ) : (
        <>
          <PrimaryButton onClick={() => void enable()} disabled={state === "requesting"}>
            {state === "requesting" ? "Requesting permission…" : "Enable notifications"}
          </PrimaryButton>
          <SecondaryButton onClick={onNext}>Maybe later</SecondaryButton>
        </>
      )}
      <SecondaryButton onClick={onBack}>Back</SecondaryButton>
    </StepShell>
  );
}

/* ─── Install Step (browser-adaptive) ─── */

type Browser = "safari" | "chrome" | "edge" | "edge_ios" | "firefox";

function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "chrome";
  const ua = navigator.userAgent;
  if (/Edg/i.test(ua) && isAppleMobile()) return "edge_ios";
  if (/Edg/i.test(ua)) return "edge";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Chrome/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua)) return "safari";
  return "chrome";
}

const INSTALL_STEPS: Record<Browser, { steps: string[] }> = {
  safari: {
    steps: [
      'Tap the <strong>Share</strong> button (square with arrow)',
      'Scroll the menu and tap <strong>Add to Home Screen</strong>',
      'Tap <strong>Add</strong> in the top right',
    ],
  },
  chrome: {
    steps: [
      'Tap the <strong>⋮</strong> menu (usually top right on Android; bottom toolbar on some phones)',
      'Tap <strong>Install app</strong> or <strong>Add to Home screen</strong> if you see it',
      'Confirm <strong>Install</strong> or <strong>Add</strong>',
    ],
  },
  edge: {
    steps: [
      'Tap <strong>⋯</strong> (More) — often bottom bar on Android, top right on Windows',
      'Choose <strong>Add to phone</strong> or <strong>Install this site as an app</strong> (wording varies by version)',
      'Confirm <strong>Install</strong> or <strong>Add</strong>',
    ],
  },
  edge_ios: {
    steps: [
      'On iPhone and iPad, Edge uses Apple&apos;s WebKit — installing works like Safari',
      'Tap <strong>⋯</strong> (More) at the bottom, then look for <strong>Add to Phone</strong> or open the share sheet',
      'If you see <strong>Share</strong>, tap it and choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>',
    ],
  },
  firefox: {
    steps: [
      'Tap the <strong>⋮</strong> menu',
      'Tap <strong>Install</strong> or <strong>Add to Home screen</strong> if shown',
      'Confirm <strong>Add</strong> or <strong>Install</strong>',
    ],
  },
};

const BROWSER_SWITCH_LABEL: Record<Browser, string> = {
  safari: "Safari",
  chrome: "Chrome",
  edge: "Edge",
  edge_ios: "Edge · iOS",
  firefox: "Firefox",
};

function InstallStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [browser, setBrowser] = useState<Browser>("chrome");

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const { steps } = INSTALL_STEPS[browser];

  return (
    <StepShell>
      <StepTitle>Install as an app</StepTitle>
      <StepSubtitle>
        MentorForge works best as a standalone app. One tap to your next session,
        no browser tabs.
      </StepSubtitle>

      <div className="mb-5 text-left">
        {steps.map((html, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 py-3 ${
              i < steps.length - 1 ? "border-b border-slate-200 dark:border-slate-700" : ""
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white dark:bg-emerald-500 dark:text-emerald-950">
              {i + 1}
            </span>
            <span
              className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        ))}
      </div>

      {/* Browser switcher — auto-detected, but user can override */}
      <div className="mb-6 flex flex-wrap justify-center gap-1">
        {(["safari", "chrome", "edge", "edge_ios", "firefox"] as Browser[]).map((b) => (
          <button
            key={b}
            onClick={() => setBrowser(b)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              browser === b
                ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
                : "border border-slate-200 text-slate-400 hover:text-slate-600 dark:border-slate-700 dark:hover:text-slate-300"
            } [-webkit-tap-highlight-color:transparent]`}
          >
            {BROWSER_SWITCH_LABEL[b]}
          </button>
        ))}
      </div>

      <PrimaryButton onClick={onNext}>Done</PrimaryButton>
      <SecondaryButton onClick={onNext}>Skip</SecondaryButton>
      <SecondaryButton onClick={onBack}>Back</SecondaryButton>
    </StepShell>
  );
}

/* ─── SVG Icons ─── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.2 8.1h-8v3.4h4.6c-.4 2-2.1 3.4-4.6 3.4a5 5 0 010-10c1.3 0 2.4.5 3.3 1.2l2.5-2.5A8.5 8.5 0 109.2 17c4.5 0 8.3-3 8.3-8.3 0-.5-.1-1.1-.2-1.6z" fill="#4285F4" />
      <path d="M2.2 5.5L5 7.6a5 5 0 017.8-2.4l2.5-2.5A8.5 8.5 0 002.2 5.5z" fill="#EA4335" />
      <path d="M9.2 17a8.4 8.4 0 006-2.4l-2.8-2.2a5 5 0 01-7.5-2.6L2.2 12a8.5 8.5 0 007 5z" fill="#34A853" />
      <path d="M2.2 12l2.7-2.2A5 5 0 014.2 8c0-.6.1-1.2.3-1.8L2.2 5.5A8.5 8.5 0 001 9c0 1.1.2 2.1.5 3z" fill="#FBBC05" />
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect width="18" height="18" rx="2" fill="#0078D4" />
      <path d="M4 5h6v6H4z" fill="#fff" opacity=".8" />
      <path d="M7 3h7v7H7z" fill="#fff" />
    </svg>
  );
}
