import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Contact form backend. Sends an email via SMTP (reuses the MAIL_* env used by
// Ghost) to CONTACT_TO. Includes a honeypot for basic spam protection.
export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const { name, email, message, website } = body ?? {};

  // Honeypot: bots fill hidden fields. Pretend success, send nothing.
  if (website) return NextResponse.json({ ok: true });

  if (
    !name ||
    !email ||
    !message ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    message.length > 5000
  ) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const host = process.env.MAIL_HOST;
  const to = process.env.CONTACT_TO;
  if (!host || !to) {
    console.error("[contact] MAIL_HOST / CONTACT_TO not configured");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  try {
    const port = Number(process.env.MAIL_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: process.env.MAIL_USER
        ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM ?? to,
      to,
      replyTo: `${name} <${email}>`,
      subject: `Kontaktformular: ${name}`,
      text: `Von: ${name} <${email}>\n\n${message}`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] send failed:", err);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }
}
