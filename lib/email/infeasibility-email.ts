import { getResendClient, getResendFrom } from "./resend";

/**
 * Infeasibility ("plan at risk") email — the honest FORGE-3 signal delivered over
 * email. Built as a pure template + a consent-aware sender so the template is
 * unit-testable without touching the network or Resend.
 */

export type InfeasibilityEmailData = {
  firstName?: string | null;
  /** Minutes that can't be placed before the exam within guardrails. */
  unplaceableMinutes: number;
  /** The engine's honest headline. */
  message: string;
  examDate?: string;
  /** Absolute link back to the dashboard where they resolve it. */
  dashboardUrl: string;
};

function hoursLabel(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export function buildInfeasibilityEmail(data: InfeasibilityEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const hi = data.firstName ? `Hi ${data.firstName},` : "Hi,";
  const behind = hoursLabel(data.unplaceableMinutes);
  const subject = `Your CFA plan is at risk — ${behind} won’t fit`;

  const options = [
    ["Move your exam date", "Push to the next sitting and recompute against the new runway."],
    ["Cut scope", "Deprioritize the lowest exam-weight topics — we’ll show the coverage cost."],
    ["Study more per week", "Raise your daily target toward your safe ceiling — we’ll show the cost."],
  ];

  const optionsHtml = options
    .map(
      ([t, d]) =>
        `<li style="margin:0 0 10px 0;"><strong style="color:#0f172a;">${t}.</strong> <span style="color:#475569;">${d}</span></li>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f8f5ef;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2d8;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#fffbeb;border-bottom:1px solid #fde68a;padding:12px 24px;font:600 11px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:#b45309;">Plan at risk · honest check</td></tr>
    <tr><td style="padding:24px;">
      <p style="margin:0 0 12px 0;color:#0f172a;">${hi}</p>
      <p style="margin:0 0 4px 0;font:700 30px/1.1 Georgia,serif;color:#0f172a;">${behind} <span style="font:400 15px/1.4 sans-serif;color:#64748b;">can’t be placed before your exam</span></p>
      <p style="margin:14px 0 0 0;font:600 18px/1.35 Georgia,serif;color:#0f172a;">${data.message}</p>
      <p style="margin:10px 0 0 0;color:#475569;">We won’t cram it into the weeks you have left — that’s how plans quietly break. Here’s what actually moves the needle:</p>
      <ul style="margin:16px 0 0 0;padding-left:18px;">${optionsHtml}</ul>
      <p style="margin:24px 0 0 0;"><a href="${data.dashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600;">Review &amp; choose in MentorForge</a></p>
      <p style="margin:20px 0 0 0;font-size:12px;color:#94a3b8;">You’re getting this because plan alerts are on. Manage preferences from your account settings.</p>
    </td></tr>
  </table>
  </td></tr></table>
  </body></html>`;

  const text = [
    hi,
    "",
    `${behind} can't be placed before your exam.`,
    data.message,
    "",
    "We won't cram it into the weeks you have left. Your options:",
    ...options.map(([t, d]) => `- ${t}: ${d}`),
    "",
    `Review & choose: ${data.dashboardUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export type SendInfeasibilityResult = {
  sent: boolean;
  skipped?: "opted-out" | "no-email" | "not-configured";
  id?: string;
  error?: string;
};

/**
 * Consent-aware send. Respects `emailCommunicationsOptIn`, no-ops cleanly when
 * Resend isn't configured, and uses an idempotency key so a retried request
 * never double-sends for the same event.
 */
export async function sendInfeasibilityEmail(params: {
  to: string | null | undefined;
  optedIn: boolean;
  eventId: string;
  data: InfeasibilityEmailData;
}): Promise<SendInfeasibilityResult> {
  if (!params.optedIn) return { sent: false, skipped: "opted-out" };
  if (!params.to) return { sent: false, skipped: "no-email" };
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { sent: false, skipped: "not-configured" };
  }

  const { subject, html, text } = buildInfeasibilityEmail(params.data);
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send(
      {
        from: getResendFrom(),
        to: [params.to],
        subject,
        html,
        text,
      },
      { idempotencyKey: `infeasibility-${params.eventId}` },
    );
    if (error) return { sent: false, error: error.message ?? String(error) };
    return { sent: true, id: data?.id };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}
