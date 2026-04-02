/**
 * modules/auth/notification.service.ts
 *
 * Delivery pipe for OTP messages.
 * OTP generation, hashing, storage, and verification are all in auth.service.ts.
 * This file only delivers an already-generated OTP string to the user.
 *
 * Provider is selected via SMS_PROVIDER / EMAIL_PROVIDER env vars.
 * If unset (development), OTP is logged to console.
 */

import { env } from "../../config/env";
import { logger } from "../../core/logger";

// ── Typed HTTP helper ─────────────────────────────────────────────────────────

async function post<T>(
  url: string,
  headers: Record<string, string>,
  body: T,
): Promise<void> {
  const isForm =
    headers["Content-Type"] === "application/x-www-form-urlencoded";

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: isForm
      ? new URLSearchParams(body as Record<string, string>).toString()
      : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Notification] HTTP ${res.status} from ${url}: ${text}`);
  }
}

// ── NotificationService ───────────────────────────────────────────────────────

export abstract class NotificationService {
  /**
   * Send OTP via SMS.
   * Called from: AuthService.sendOtp(), PinService.requestReset()
   */
  static async sendSms(phone: string, otp: string): Promise<void> {
    switch (env.SMS_PROVIDER) {
      case "msg91":
        await NotificationService._msg91(phone, otp);
        break;
      case "fast2sms":
        await NotificationService._fast2sms(phone, otp);
        break;
      case "twilio":
        await NotificationService._twilio(
          phone,
          `Your OTP is ${otp}. Valid for ${env.OTP_TTL_MIN} minutes. Do not share it.`,
        );
        break;
      default:
        logger.info({ phone, otp }, "[DEV] SMS OTP");
    }
  }

  /**
   * Send OTP via Email.
   * Called from: OtpService.request() when purpose targets an email
   */
  static async sendEmail(email: string, otp: string): Promise<void> {
    const subject = "Your OTP Code";
    const html = `<p>Your OTP is <strong>${otp}</strong>. Valid for ${env.OTP_TTL_MIN} minutes. Do not share it.</p>`;

    switch (env.EMAIL_PROVIDER) {
      case "resend":
        await NotificationService._resend(email, subject, html);
        break;
      case "sendgrid":
        await NotificationService._sendgrid(email, subject, html);
        break;
      default:
        logger.info({ email, otp }, "[DEV] Email OTP");
    }
  }

  /**
   * Sends to phone, email, or both depending on what is provided.
   * Called from: OtpService.request()
   */
  static async send(
    target: { phone?: string | null; email?: string | null },
    otp: string,
  ): Promise<void> {
    if (target.phone) await NotificationService.sendSms(target.phone, otp);
    if (target.email) await NotificationService.sendEmail(target.email, otp);
  }

  // ── SMS providers ───────────────────────────────────────────────────────────

  private static async _msg91(phone: string, otp: string): Promise<void> {
    const authKey = env.MSG91_AUTH_KEY;
    const templateId = env.MSG91_TEMPLATE_ID;
    if (!authKey || !templateId)
      throw new Error("MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are required");

    await post(
      "https://control.msg91.com/api/v5/otp",
      { authkey: authKey, "Content-Type": "application/json" },
      {
        template_id: templateId,
        mobile: phone.replace("+", ""), // MSG91 wants no leading +
        otp,
      },
    );
  }

  private static async _fast2sms(phone: string, otp: string): Promise<void> {
    const apiKey = env.FAST2SMS_API_KEY;
    if (!apiKey) throw new Error("FAST2SMS_API_KEY is required");

    await post(
      "https://www.fast2sms.com/dev/bulkV2",
      { authorization: apiKey, "Content-Type": "application/json" },
      {
        route: "otp",
        variables_values: otp,
        numbers: phone.replace("+91", ""), // India only
      },
    );
  }

  private static async _twilio(phone: string, message: string): Promise<void> {
    const sid = env.TWILIO_ACCOUNT_SID;
    const authToken = env.TWILIO_AUTH_TOKEN;
    const fromNumber = env.TWILIO_PHONE_NUMBER;
    if (!sid || !authToken || !fromNumber)
      throw new Error(
        "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER are required",
      );

    const cred = Buffer.from(`${sid}:${authToken}`).toString("base64");

    await post(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        Authorization: `Basic ${cred}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      { To: phone, From: fromNumber, Body: message },
    );
  }

  // ── Email providers ─────────────────────────────────────────────────────────

  private static async _resend(
    email: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const apiKey = env.RESEND_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail)
      throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL are required");

    await post(
      "https://api.resend.com/emails",
      { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      { from: fromEmail, to: email, subject, html },
    );
  }

  private static async _sendgrid(
    email: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const apiKey = env.SENDGRID_API_KEY;
    const fromEmail = env.SENDGRID_FROM_EMAIL;
    if (!apiKey || !fromEmail)
      throw new Error("SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are required");

    await post(
      "https://api.sendgrid.com/v3/mail/send",
      {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      {
        personalizations: [{ to: [{ email }] }],
        from: { email: fromEmail },
        subject,
        content: [{ type: "text/html", value: html }],
      },
    );
  }
}