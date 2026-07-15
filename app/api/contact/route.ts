import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * Escape user-provided strings for safe insertion into HTML
 */
function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const POST = async (req: NextRequest) => {
  try {
    // Parse JSON body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, email, subject, message } = body;

    // Basic validation
    if (
      !name ||
      typeof name !== "string" ||
      !email ||
      typeof email !== "string" ||
      !message ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 },
      );
    }

    // Ensure SMTP configuration exists
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT);
    const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
    const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const CONTACT_RECEIVER =
      process.env.CONTACT_RECEIVER || process.env.EMAIL_USER;

    if (!SMTP_USER || !SMTP_PASS || !CONTACT_RECEIVER) {
      console.error("Missing SMTP or receiver environment variables.");
      return NextResponse.json(
        { error: "Mail server is not configured" },
        { status: 500 },
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Sanitize inputs for HTML
    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeSubject = escapeHtml(
      (subject || `New inquiry from ${name}`).trim(),
    );
    const safeMessage = escapeHtml(message.trim()).replaceAll("\n", "<br/>");

    // Simple, responsive HTML email with inline CSS
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#f6f8fa;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="680" style="max-width:680px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e6e9ee;">
                <tr>
                  <td style="padding:20px 28px;background:linear-gradient(90deg,#2563eb 0%, #4f46e5 100%);color:#fff;">
                    <h1 style="margin:0;font-size:20px;font-weight:700;">New Contact Form Submission</h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 28px;">
                    <p style="margin:0 0 12px 0;color:#374151;font-size:14px;">
                      You have received a new message from the contact form.
                    </p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                      <tr>
                        <td style="vertical-align:top;padding:8px 0;width:120px;color:#6b7280;font-size:13px;">Name</td>
                        <td style="vertical-align:top;padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${safeName}</td>
                      </tr>

                      <tr>
                        <td style="vertical-align:top;padding:8px 0;color:#6b7280;font-size:13px;">Email</td>
                        <td style="vertical-align:top;padding:8px 0;color:#111827;font-size:14px;font-weight:600;">
                          <a href="mailto:${safeEmail}" style="color:#2563eb;text-decoration:none;">${safeEmail}</a>
                        </td>
                      </tr>

                      <tr>
                        <td style="vertical-align:top;padding:8px 0;color:#6b7280;font-size:13px;">Subject</td>
                        <td style="vertical-align:top;padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${safeSubject}</td>
                      </tr>

                      <tr>
                        <td style="vertical-align:top;padding:8px 0;color:#6b7280;font-size:13px;">Message</td>
                        <td style="vertical-align:top;padding:8px 0;color:#111827;font-size:14px;line-height:1.5;">${safeMessage}</td>
                      </tr>
                    </table>

                    <hr style="border:none;border-top:1px solid #eef2f7;margin:18px 0;" />

                    <p style="margin:0;color:#6b7280;font-size:12px;">
                      This email was generated automatically from your website contact form.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 28px;background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
                    © ${new Date().getFullYear()} Daily Muktimarg. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send mail
    await transporter.sendMail({
      from: `"${safeName}" <${safeEmail}>`,
      to: CONTACT_RECEIVER,
      subject: safeSubject,
      html,
    });

    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
};
