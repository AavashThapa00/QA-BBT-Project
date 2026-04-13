import nodemailer from "nodemailer";
import env from "@/lib/env";

const hasSmtpConfig =
  !!env.SMTP_HOST &&
  !!env.SMTP_PORT &&
  !!env.SMTP_USER &&
  !!env.SMTP_PASS &&
  !!env.SMTP_FROM;

function createTransport() {
  if (!hasSmtpConfig) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetLink: string;
}) {
  const transport = createTransport();

  if (!transport) {
    console.warn("SMTP not configured. Skipping email send.");
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject: "Reset your IssueFixu password",
    html: `
      <div style="font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; background: #f5f7f6; padding: 24px; color: #333333;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 28px rgba(27, 94, 32, 0.08);">
          <div style="height: 6px; background: linear-gradient(90deg, #4caf50, #a5d6a7);"></div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #757575;">IssueFixu</p>
            <h2 style="margin: 0 0 12px; color: #1b5e20; font-size: 24px; line-height: 1.3;">Reset your password</h2>
            <p style="line-height: 1.65; margin: 0 0 14px; color: #333333;">
              We received a request to reset your IssueFixu account password.
            </p>
            <p style="line-height: 1.65; margin: 0 0 20px; color: #333333;">
              Use the button below to set a new password. This reset link expires in 30 minutes.
            </p>
            <p style="margin: 0 0 20px;">
              <a href="${params.resetLink}" style="display: inline-block; background: #4caf50; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 10px; font-weight: 600;">
                Reset Password
              </a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #757575; line-height: 1.6;">
              If you did not request this, you can safely ignore this email.
            </p>
            <p style="font-size: 12px; color: #757575; line-height: 1.6; margin: 10px 0 0; word-break: break-all;">
              ${params.resetLink}
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Reset your IssueFixu password:\n\n${params.resetLink}\n\nThis link expires in 30 minutes.`,
  });

  return { sent: true as const };
}

export async function sendLoginVerificationCodeEmail(params: {
  to: string;
  code: string;
  expiresInMinutes: number;
}) {
  const transport = createTransport();

  if (!transport) {
    console.warn("SMTP not configured. Skipping email send.");
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject: "Your QA-BBT sign-in verification code",
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px;">
        <h2 style="margin: 0 0 12px; color: #93c5fd;">Verify Your Sign In</h2>
        <p style="line-height: 1.6; margin: 0 0 16px;">
          Use the code below to finish signing in to QA-BBT.
        </p>
        <p style="margin: 0 0 20px; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #f8fafc;">
          ${params.code}
        </p>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin: 0;">
          This code expires in ${params.expiresInMinutes} minutes.
        </p>
      </div>
    `,
    text: `Your QA-BBT sign-in verification code is ${params.code}. It expires in ${params.expiresInMinutes} minutes.`,
  });

  return { sent: true as const };
}
