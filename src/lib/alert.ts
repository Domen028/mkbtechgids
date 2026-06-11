/**
 * Sends an alert email to support@ when something in the purchase/delivery
 * flow breaks. Uses the same Brevo key as order emails — no extra service.
 */

const ALERT_TO = 'support@mkbtechgids.nl';
const ALERT_FROM = { name: 'MKBTechGids Monitor', email: 'info@mkbtechgids.nl' };

export async function sendAlert(opts: {
  subject: string;
  body: string;
  brevoKey: string;
}): Promise<void> {
  if (!opts.brevoKey) return; // dev / missing key — skip silently

  const html = `
    <div style="font-family:monospace;font-size:13px;line-height:1.6;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:20px 24px;max-width:600px;">
      <p style="margin:0 0 12px;font-weight:700;color:#991b1b;font-size:15px;">⚠ MKBTechGids — ${htmlEscape(opts.subject)}</p>
      <pre style="margin:0;white-space:pre-wrap;color:#1f2937;">${htmlEscape(opts.body)}</pre>
      <p style="margin:16px 0 0;font-size:11px;color:#6b7280;">Tijdstip: ${new Date().toISOString()}</p>
    </div>`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': opts.brevoKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: ALERT_FROM,
        to: [{ email: ALERT_TO }],
        subject: `[ALERT] ${opts.subject}`,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      console.error('[alert] Failed to send alert email:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[alert] Exception sending alert:', err);
  }
}

function htmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
