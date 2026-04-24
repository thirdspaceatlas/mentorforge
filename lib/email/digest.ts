import { createSurveyToken } from "@/lib/survey/signed-link";
import type { SurveyQuestion } from "@/lib/survey/questions";
import { getPublicSiteOrigin } from "@/lib/site";

/**
 * Weekly digest email. Minimal text-first markup per DESIGN.md —
 * no heavy HTML template, no logos, no tracking pixels.
 */

export type DigestStats = {
  sessionsThisWeek: number;
  minutesThisWeek: number;
  /** "Nice week." / "Quiet week, no worries." — per DESIGN.md notification copy. */
  toneLine: string;
};

export type DigestInput = {
  userId: string;
  firstName: string | null;
  stats: DigestStats;
  question: SurveyQuestion;
};

export function buildDigestSubject(stats: DigestStats): string {
  if (stats.sessionsThisWeek === 0) {
    return "Quiet week, no worries.";
  }
  const s = stats.sessionsThisWeek === 1 ? "" : "s";
  return `Your week: ${stats.sessionsThisWeek} session${s}, ${stats.minutesThisWeek} minutes.`;
}

export function buildDigestToneLine(sessionsThisWeek: number): string {
  return sessionsThisWeek === 0 ? "Quiet week, no worries." : "Nice week.";
}

export function buildDigestHtml(input: DigestInput): string {
  const origin = getPublicSiteOrigin();
  const greeting = input.firstName ? `Hi ${escapeHtml(input.firstName)},` : "Hi,";
  const { sessionsThisWeek, minutesThisWeek, toneLine } = input.stats;

  const optionsHtml = input.question.options
    .map((opt) => {
      const token = createSurveyToken(input.userId, input.question.id, opt.key);
      const url = `${origin}/api/survey/answer?t=${encodeURIComponent(token)}`;
      return `
        <tr>
          <td style="padding:6px 0;">
            <a href="${url}"
               style="display:inline-block;padding:8px 14px;border:1px solid #cbd5e1;border-radius:9999px;color:#0f172a;text-decoration:none;font-size:14px;font-weight:500;">
              ${escapeHtml(opt.label)}
            </a>
          </td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafaf9;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="margin:0 0 20px 0;font-size:14px;color:#64748b;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">
      MentorForge — Weekly digest
    </p>

    <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">${greeting}</p>

    <p style="margin:0 0 8px 0;font-size:22px;font-weight:600;line-height:1.25;">${escapeHtml(toneLine)}</p>

    <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#334155;">
      This week you logged <strong>${sessionsThisWeek}</strong> study session${sessionsThisWeek === 1 ? "" : "s"}
      for a total of <strong>${minutesThisWeek}</strong> minute${minutesThisWeek === 1 ? "" : "s"}.
    </p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />

    <p style="margin:0 0 4px 0;font-size:13px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
      One question
    </p>
    <p style="margin:0 0 16px 0;font-size:17px;line-height:1.5;font-weight:500;">
      ${escapeHtml(input.question.prompt)}
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
      ${optionsHtml}
    </table>

    <p style="margin:24px 0 0 0;font-size:13px;color:#64748b;line-height:1.6;">
      One click records your answer — no typing, no login needed. We look at the pattern across all answers, not any single reply.
    </p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />

    <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">
      Ready to pick up where you left off?
      <a href="${origin}/app" style="color:#047857;text-decoration:underline;">Open your plan</a>.
    </p>
    <p style="margin:0 0 0 0;font-size:12px;color:#94a3b8;">
      You're receiving this because you have a MentorForge account.
      <a href="${origin}/app/account" style="color:#94a3b8;text-decoration:underline;">Manage preferences</a>.
    </p>
  </div>
</body>
</html>`;
}

export function buildDigestText(input: DigestInput): string {
  const origin = getPublicSiteOrigin();
  const greeting = input.firstName ? `Hi ${input.firstName},` : "Hi,";
  const { sessionsThisWeek, minutesThisWeek, toneLine } = input.stats;
  const optionsText = input.question.options
    .map((opt) => {
      const token = createSurveyToken(input.userId, input.question.id, opt.key);
      return `  ${opt.label} → ${origin}/api/survey/answer?t=${encodeURIComponent(token)}`;
    })
    .join("\n");

  return `${greeting}

${toneLine}

This week you logged ${sessionsThisWeek} study session${sessionsThisWeek === 1 ? "" : "s"} for a total of ${minutesThisWeek} minute${minutesThisWeek === 1 ? "" : "s"}.

One question: ${input.question.prompt}

${optionsText}

One click records your answer.

Open your plan: ${origin}/app
Manage preferences: ${origin}/app/account
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
