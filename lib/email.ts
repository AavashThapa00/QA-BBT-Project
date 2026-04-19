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
      <div style="font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; background: #0f1419; padding: 24px; color: #e0e0e0;">
        <div style="max-width: 560px; margin: 0 auto; background: #1a1f2e; border: 1px solid #2a3f5f; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 28px rgba(30, 136, 229, 0.12);">
          <div style="height: 6px; background: linear-gradient(90deg, #1e88e5, #42a5f5);"></div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #90caf9;">IssueFixu</p>
            <h2 style="margin: 0 0 12px; color: #42a5f5; font-size: 24px; line-height: 1.3;">Reset your password</h2>
            <p style="line-height: 1.65; margin: 0 0 14px; color: #e0e0e0;">
              We received a request to reset your IssueFixu account password.
            </p>
            <p style="line-height: 1.65; margin: 0 0 20px; color: #e0e0e0;">
              Use the button below to set a new password. This reset link expires in 30 minutes.
            </p>
            <p style="margin: 0 0 20px;">
              <a href="${params.resetLink}" style="display: inline-block; background: #1e88e5; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 10px; font-weight: 600;">
                Reset Password
              </a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #b0bec5; line-height: 1.6;">
              If you did not request this, you can safely ignore this email.
            </p>
            <p style="font-size: 12px; color: #b0bec5; line-height: 1.6; margin: 10px 0 0; word-break: break-all;">
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
    subject: "Your IssueFixu sign-in verification code",
    html: `
      <div style="font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; background: #0f1419; padding: 24px; color: #e0e0e0;">
        <div style="max-width: 560px; margin: 0 auto; background: #1a1f2e; border: 1px solid #2a3f5f; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 28px rgba(30, 136, 229, 0.12);">
          <div style="height: 6px; background: linear-gradient(90deg, #1e88e5, #42a5f5);"></div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #90caf9;">IssueFixu</p>
            <h2 style="margin: 0 0 12px; color: #42a5f5; font-size: 24px; line-height: 1.3;">Verify your sign in</h2>
            <p style="line-height: 1.65; margin: 0 0 14px; color: #e0e0e0;">
              Use the verification code below to complete your IssueFixu sign in.
            </p>
            <div style="margin: 0 0 16px; padding: 14px; border-radius: 12px; background: #1e3a8a; border: 1px solid #2a5aa0; text-align: center;">
              <p style="margin: 0; font-size: 30px; font-weight: 700; letter-spacing: 6px; color: #42a5f5;">
                ${params.code}
              </p>
            </div>
            <p style="font-size: 12px; color: #b0bec5; line-height: 1.6; margin: 0;">
              This code expires in ${params.expiresInMinutes} minutes.
            </p>
            <p style="font-size: 12px; color: #b0bec5; line-height: 1.6; margin: 8px 0 0;">
              If you did not try to sign in, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Your IssueFixu sign-in verification code is ${params.code}. It expires in ${params.expiresInMinutes} minutes.`,
  });

  return { sent: true as const };
}
