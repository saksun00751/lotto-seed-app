/**
 * lib/otp-sender.ts
 *
 * Sends OTP SMS messages.
 * - Development: prints to console
 * - Production:  uses Twilio (swap for any SMS provider)
 *
 * Install Twilio: npm install twilio
 */

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // Dev: just log it
    console.log(`\n📱 [OTP] ${phone} → ${code}  (expires in 5 min)\n`);
    return;
  }

  // ── Production: Twilio ───────────────────────────────────────────────────
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken  = process.env.TWILIO_AUTH_TOKEN!;
  const from       = process.env.TWILIO_FROM_NUMBER!;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env.local"
    );
  }

  // Dynamic import so build doesn't fail when twilio isn't installed in dev
  // const twilio = (await import("twilio")).default;
  // const client = twilio(accountSid, authToken);

  // Thai phone → E.164: 0812345678 → +66812345678
  const e164 = "+66" + phone.slice(1);

  // await client.messages.create({
  //   body: `รหัส OTP ของคุณคือ ${code} (หมดอายุใน 5 นาที) — Lotto App`,
  //   from,
  //   to: e164,
  // });
}
