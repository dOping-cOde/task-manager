import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

// Email is considered configured only when we have a host + credentials.
export const isMailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE) === "true" || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Verify the SMTP connection at startup so misconfiguration surfaces early.
 * Never throws — just logs.
 */
export const verifyMailer = async () => {
  if (!transporter) {
    console.log(
      "✉️  Email is DISABLED (no SMTP_* env vars). Messages will be logged, not sent."
    );
    return;
  }
  try {
    await transporter.verify();
    console.log("✉️  SMTP connection verified — email is ENABLED.");
  } catch (err) {
    console.error(`✉️  SMTP verification failed: ${err.message}`);
  }
};

/**
 * Send an email. When email isn't configured this is a safe no-op that logs,
 * so the rest of the app never breaks. Errors are swallowed + logged so a
 * failed send can never crash a request or the cron job.
 */
export const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`✉️  [mail disabled] would send "${subject}" → ${to}`);
    return { skipped: true };
  }
  try {
    const from = MAIL_FROM || SMTP_USER;
    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log(`✉️  Sent "${subject}" → ${to} (${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`✉️  Failed to send "${subject}" → ${to}: ${err.message}`);
    return { error: err.message };
  }
};