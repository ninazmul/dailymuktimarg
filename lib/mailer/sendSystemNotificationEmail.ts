import nodemailer from "nodemailer";

function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendSystemNotificationEmail({
  subject,
  message,
}: {
  subject: string;
  message: string;
}) {
  try {
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT);
    const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
    const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const CONTACT_RECEIVER = process.env.CONTACT_RECEIVER; // your notification recipient

    if (!SMTP_USER || !SMTP_PASS || !CONTACT_RECEIVER) {
      console.error("SMTP or CONTACT_RECEIVER not configured");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    const html = `
      <html>
      <body style="background:#f6f8fa;font-family:Arial;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;border:1px solid #eee;">
          
          <div style="padding:20px;background:linear-gradient(90deg,#dc2626,#b91c1c);color:#fff;">
            <h2 style="margin:0;">System Notification ⚡</h2>
          </div>

          <div style="padding:20px;">
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <p><strong>Message:</strong> ${safeMessage}</p>
          </div>

          <div style="padding:10px;text-align:center;font-size:12px;color:#777;">
            © ${new Date().getFullYear()} Daily Muktimarg
          </div>

        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"System Notifications"`,
      to: CONTACT_RECEIVER,
      subject: `System Notification: ${subject}`,
      html,
    });
  } catch (err) {
    console.error("Notification email failed:", err);
  }
}
