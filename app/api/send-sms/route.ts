import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { number, message } = await req.json();
    console.log("Sending SMS to:", number, "Message:", message);

    if (!number || !message) {
      return new Response("Number and message are required", { status: 400 });
    }

    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
      console.error("SMS_API_KEY not set");
      return new Response("SMS API key not configured", { status: 500 });
    }

    const senderId = "NRB School";
    const smsUrl = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${encodeURIComponent(
      number,
    )}&senderid=${encodeURIComponent(senderId)}&message=${encodeURIComponent(
      message,
    )}`;

    const res = await fetch(smsUrl, { method: "GET" });
    const text = await res.text();
    console.log("BulksmsBD response:", text);

    if (text.includes("202")) {
      return new Response("SMS sent successfully!", { status: 200 });
    } else {
      return new Response(`SMS failed: ${text}`, { status: 500 });
    }
  } catch (err) {
    console.error("SMS sending error:", err);
    return new Response("Failed to send SMS", { status: 500 });
  }
};
