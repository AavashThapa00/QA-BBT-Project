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
    subject: "Reset your QA-BBT password",
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px;">
        <h2 style="margin: 0 0 12px; color: #93c5fd;">Reset Your Password</h2>
        <p style="line-height: 1.6; margin: 0 0 16px;">
          We received a request to reset your password for QA-BBT.
        </p>
        <p style="line-height: 1.6; margin: 0 0 20px;">
          Click the button below to set a new password. This link expires in 30 minutes.
        </p>
        <p style="margin: 0 0 20px;">
          <a href="${params.resetLink}" style="display: inline-block; background: linear-gradient(90deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin: 0;">
          If you did not request this, you can safely ignore this email.
        </p>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin: 8px 0 0; word-break: break-all;">
          ${params.resetLink}
        </p>
      </div>
    `,
    text: `Reset your QA-BBT password:\n\n${params.resetLink}\n\nThis link expires in 30 minutes.`,
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
