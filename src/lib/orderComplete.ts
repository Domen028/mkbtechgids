import { PRODUCTS } from './products.js';
import { generateToken } from './token.js';
import type { ProductId } from './products.js';

export async function completeOrder(
  paymentId: string,
  productId: ProductId,
  email: string,
  secret: string,
  brevoKey: string,
  siteUrl: string,
): Promise<string> {
  const token = generateToken(secret, productId, email, paymentId);
  const downloadUrl = `${siteUrl}/bedankt?token=${encodeURIComponent(token)}`;

  if (brevoKey && email) {
    const product = PRODUCTS[productId];
    try {
      await sendReceiptEmail(brevoKey, email, product.name, downloadUrl);
    } catch (err) {
      console.error('Receipt email failed:', err);
    }
  }

  return token;
}

async function sendReceiptEmail(
  apiKey: string,
  to: string,
  productName: string,
  downloadUrl: string,
): Promise<void> {
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'MKBTechGids', email: 'info@mkbtechgids.nl' },
      to: [{ email: to }],
      subject: `Uw bestelling: ${productName} — MKBTechGids`,
      htmlContent: receiptHtml(productName, downloadUrl),
    }),
  });
}

function receiptHtml(productName: string, downloadUrl: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
      <tr><td style="background:#0f2147;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">MKBTechGids</p>
        <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">NIS2 Compliance Toolkit</p>
      </td></tr>
      <tr><td style="background:#fff;padding:40px;border:1px solid #e2e8f0;border-top:none;">
        <h1 style="margin:0 0 16px;font-size:22px;color:#0f2147;">Bedankt voor uw bestelling!</h1>
        <p style="color:#475569;font-size:15px;line-height:1.8;">U heeft de <strong>${productName}</strong> besteld. Uw downloadlinks zijn direct beschikbaar.</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
          <tr><td align="center">
            <a href="${downloadUrl}" style="display:inline-block;background:#14532d;color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:8px;">
              Download uw bestelling →
            </a>
          </td></tr>
        </table>
        <p style="color:#94a3b8;font-size:12px;">Deze link is 7 dagen geldig. Sla uw bestanden direct op na het downloaden.</p>
        <p style="color:#94a3b8;font-size:12px;">Vragen? Stuur een e-mail naar <a href="mailto:info@mkbtechgids.nl" style="color:#15803d;">info@mkbtechgids.nl</a>.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">MKBTechGids · info@mkbtechgids.nl · KVK 27348456 · Brielle, Nederland</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
