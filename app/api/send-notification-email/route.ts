import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

export const POST = async (req: NextRequest) => {
  try {
    const { recipients } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response("Recipients are required", { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🚀 Send emails in parallel
    await Promise.all(
      recipients.map((r) =>
        transporter.sendMail({
          from: `"Daily Muktimarg"`,
          to: r.email,
          subject: r.subject || "Message from Daily Muktimarg",
          html:
            r.html ||
            `<p>Hi ${r.name || "there"},</p><p>This is a message.</p>`,
        }),
      ),
    );

    return new Response("Emails sent successfully!", { status: 200 });
  } catch (error) {
    console.error("Send message error:", error);
    return new Response("Failed to send email", { status: 500 });
  }
};
