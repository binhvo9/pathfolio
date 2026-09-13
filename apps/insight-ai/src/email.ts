import { Resend } from "resend";

// docs/specs/07-insight-ai.md's Email behavior — sends the signed R2 URL
// as a link rather than attaching the PDF bytes: the URL already carries
// its own 24h expiry (r2.ts), so a link keeps the same guarantee without
// duplicating the file into the email itself.

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL!;

export async function sendReportEmail(toEmail: string, portfolioName: string, signedUrl: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Your PathFolio report: ${portfolioName}`,
    html:
      `<p>Your scenario report for "${portfolioName}" is ready.</p>` +
      `<p><a href="${signedUrl}">Download the PDF</a> (link expires in 24 hours).</p>`,
  });
}
