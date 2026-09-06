const { Resend } = require('resend');

// Sends invite/notification emails via Resend. Safe to run without an API
// key configured — emails are just skipped (logged once) instead of
// crashing, same pattern as the optional Gemini client in routes/ai.js.
const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'SettleUp <onboarding@resend.dev>';
const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

let resend = null;
if (apiKey && apiKey.trim().length > 5) {
  resend = new Resend(apiKey.trim());
} else {
  console.warn('RESEND_API_KEY not set — invite/notification emails will not be sent.');
}

async function sendMail({ to, subject, html }) {
  if (!resend) return { skipped: true };
  try {
    return await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return { error: err.message };
  }
}

// Sent when the invited email has no SettleUp account yet — invites them to
// sign up, after which they're added to the group automatically (see
// routes/auth.js register()).
function sendGroupInviteEmail({ to, groupName, inviterName }) {
  return sendMail({
    to,
    subject: `${inviterName} added you to "${groupName}" on SettleUp`,
    html: `
      <p>Hi,</p>
      <p><strong>${inviterName}</strong> added you to the group <strong>${groupName}</strong> on SettleUp to split expenses.</p>
      <p>Create a free account using this same email address (<strong>${to}</strong>) to join the group and start tracking shared expenses:</p>
      <p><a href="${APP_URL}/register">${APP_URL}/register</a></p>
    `,
  });
}

// Sent when the invited email already has a SettleUp account and was added
// to the group immediately.
function sendAddedToGroupEmail({ to, groupName, inviterName }) {
  return sendMail({
    to,
    subject: `${inviterName} added you to "${groupName}" on SettleUp`,
    html: `
      <p>Hi,</p>
      <p><strong>${inviterName}</strong> added you to the group <strong>${groupName}</strong> on SettleUp.</p>
      <p><a href="${APP_URL}">Open SettleUp</a> to see the group and start splitting expenses.</p>
    `,
  });
}

module.exports = { sendGroupInviteEmail, sendAddedToGroupEmail };
