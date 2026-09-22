// Backend/services/resendMailer.js
//
// Sends email over Resend's HTTP API instead of SMTP. SMTP (ports 25/465/587)
// is silently blocked on Render's free tier and on several other hosts —
// the connection just hangs until it times out. An HTTPS call on port 443
// has no such problem, since it's the same port every other API call
// (Cloudinary, Pathao) already uses.
//
// RESEND_FROM defaults to Resend's shared sandbox sender, which works with
// no setup but can only send to the email address you signed up with. To
// send to real customers, verify your own domain in Resend and set
// RESEND_FROM to an address on it (e.g. "Govaly <noreply@govaly.com>").
const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Govaly <onboarding@resend.dev>';

const sendMail = async ({ from, to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set.');
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || process.env.RESEND_FROM || DEFAULT_FROM,
      to,
      subject,
      text,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Resend's error body has a `message`; surface it so the caller's
    // catch block (and its logs) show the real reason, not just "failed".
    throw new Error(data.message || `Resend request failed (${res.status}).`);
  }

  return data;
};

module.exports = { sendMail };
