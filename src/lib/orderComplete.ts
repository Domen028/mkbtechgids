import { PRODUCTS } from './products.js';
import { generateToken } from './token.js';
import type { ProductId } from './products.js';
import { getOrCreateInvoice, isInvoiceStoreConfigured } from './invoiceStore.js';
import { buildInvoicePdf, toBase64 } from './invoicePdf.js';

const BCC_EMAIL = 'info@mkbtechgids.nl';

export interface StripeSessionLike {
  id: string;
  amount_subtotal?: number | null;
  amount_total?: number | null;
  total_details?: { amount_tax?: number | null } | null;
  customer_details?: { name?: string | null; email?: string | null } | null;
  customer_email?: string | null;
  metadata?: Record<string, string> | null;
}

export interface CompleteOrderInput {
  session: StripeSessionLike;
  productId: ProductId;
  email: string;
  secret: string;
  brevoKey: string;
  siteUrl: string;
}

/**
 * Idempotent across the redirect (stripe-return) and webhook paths.
 * Returns the download token. Issues exactly one invoice per Stripe session
 * and emails the buyer a receipt with the BTW-factuur PDF attached.
 */
export async function completeOrder(input: CompleteOrderInput): Promise<string> {
  const { session, productId, email, secret, brevoKey, siteUrl } = input;
  const product = PRODUCTS[productId];

  const token = generateToken(secret, productId, email, session.id);
  const downloadUrl = `${siteUrl}/bedankt?token=${encodeURIComponent(token)}`;

  if (!brevoKey || !email) return token;

  // Amounts (cents). Fall back gracefully if tax wasn't applied.
  const totalCents = session.amount_total ?? product.priceEurCents;
  const vatCents = session.total_details?.amount_tax ?? 0;
  const netCents = session.amount_subtotal ?? totalCents - vatCents;
  const buyerName = session.customer_details?.name ?? undefined;

  // Issue the invoice (idempotent). Degrade to a plain receipt if the store
  // isn't configured yet, so a purchase is never blocked by missing infra.
  let invoiceAttachment: { content: string; name: string } | undefined;
  let invoiceNumber: string | undefined;
  if (isInvoiceStoreConfigured()) {
    try {
      const year = new Date().getFullYear();
      const rec = await getOrCreateInvoice(session.id, year);
      invoiceNumber = rec.number;
      const pdf = await buildInvoicePdf({
        invoiceNumber: rec.number,
        issuedAt: new Date(rec.issuedAt * 1000),
        buyerEmail: email,
        buyerName,
        productName: product.name,
        netCents,
        vatCents,
        totalCents,
        vatRatePct: 21,
        paymentRef: session.id,
      });
      invoiceAttachment = { content: toBase64(pdf), name: `Factuur-${rec.number}.pdf` };
    } catch (err) {
      console.error('Invoice generation failed (sending receipt without invoice):', err);
    }
  } else {
    console.error('Invoice store not configured — sending receipt without invoice (set KV_REST_API_* env vars).');
  }

  await sendReceiptEmail({
    apiKey: brevoKey,
    to: email,
    productName: product.name,
    downloadUrl,
    invoiceNumber,
    attachment: invoiceAttachment,
  });

  return token;
}

async function sendReceiptEmail(opts: {
  apiKey: string;
  to: string;
  productName: string;
  downloadUrl: string;
  invoiceNumber?: string;
  attachment?: { content: string; name: string };
}): Promise<void> {
  const body: Record<string, unknown> = {
    sender: { name: 'MKBTechGids', email: 'info@mkbtechgids.nl' },
    to: [{ email: opts.to }],
    bcc: [{ email: BCC_EMAIL }],
    subject: `Uw bestelling: ${opts.productName} — MKBTechGids`,
    htmlContent: receiptHtml(opts.productName, opts.downloadUrl, opts.invoiceNumber),
  };
  if (opts.attachment) {
    body.attachment = [{ content: opts.attachment.content, name: opts.attachment.name }];
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': opts.apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Brevo receipt email failed:', res.status, detail);
  }
}

function receiptHtml(productName: string, downloadUrl: string, invoiceNumber?: string): string {
  const invoiceLine = invoiceNumber
    ? `<p style="color:#475569;font-size:14px;line-height:1.7;">Uw factuur <strong>${invoiceNumber}</strong> vindt u als PDF-bijlage bij deze e-mail.</p>`
    : '';
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
        ${invoiceLine}
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
