import nodemailer from "nodemailer";

function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendRegistrationSuccessEmail({
  name,
  email,
  courseName,
  transactionId,
}: {
  name: string;
  email: string;
  courseName?: string;
  transactionId?: string;
}) {
  try {
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT);
    const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
    const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!SMTP_USER || !SMTP_PASS) {
      console.error("SMTP not configured");
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

    const safeName = escapeHtml(name);
    const safeCourse = escapeHtml(courseName || "Your Course");

    const html = `
      <html>
      <body style="background:#f6f8fa;font-family:Arial;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;border:1px solid #eee;">
          
          <div style="padding:20px;background:linear-gradient(90deg,#16a34a,#059669);color:#fff;">
            <h2 style="margin:0;">Registration Successful 🎉</h2>
          </div>

          <div style="padding:20px;">
            <p>Hi <strong>${safeName}</strong>,</p>
            <p>Your registration has been successfully completed.</p>

            <p><strong>Course:</strong> ${safeCourse}</p>
            <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>

            <p>We will contact you soon.</p>
          </div>

          <div style="padding:10px;text-align:center;font-size:12px;color:#777;">
            © ${new Date().getFullYear()} Daily Muktimarg
          </div>

        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Daily Muktimarg"`,
      to: email,
      subject: "Registration Successful 🎉",
      html,
    });
  } catch (err) {
    console.error("Email failed:", err);
  }
}
