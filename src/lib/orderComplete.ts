import { PRODUCTS } from './products.js';
import { generateToken } from './token.js';
import type { ProductId } from './products.js';
import { buildInvoicePdf, toBase64 } from './invoicePdf.js';
import { sendAlert } from './alert.js';

const BCC_EMAIL = 'info@mkbtechgids.nl';

export interface StripeSessionLike {
  id: string;
  created?: number | null;
  amount_subtotal?: number | null;
  amount_total?: number | null;
  total_details?: { amount_tax?: number | null } | null;
  customer_details?: { name?: string | null; email?: string | null } | null;
  customer_email?: string | null;
  payment_intent?: string | { id?: string } | null;
  metadata?: Record<string, string> | null;
}

export interface CompleteOrderInput {
  session: StripeSessionLike;
  productId: ProductId;
  email: string;
  secret: string;
  brevoKey: string;
  siteUrl: string;
  stripeKey?: string;
}

/**
 * Idempotent across the redirect (stripe-return) and webhook paths.
 * Returns the download token. Issues one invoice per order and emails the
 * buyer a receipt with the BTW-factuur PDF attached.
 *
 * No external store: the invoice number is derived deterministically from the
 * Stripe session, so both paths compute the SAME number. A best-effort flag on
 * the PaymentIntent metadata prevents the email being sent twice.
 */
export async function completeOrder(input: CompleteOrderInput): Promise<string> {
  const { session, productId, email, secret, brevoKey, siteUrl, stripeKey } = input;
  const product = PRODUCTS[productId];

  const token = generateToken(secret, productId, email, session.id);
  const downloadUrl = `${siteUrl}/bedankt?token=${encodeURIComponent(token)}`;

  if (!brevoKey || !email) return token;

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  // Idempotency guard: skip if this order's invoice was already sent.
  if (stripeKey && paymentIntentId) {
    try {
      if (await invoiceAlreadySent(stripeKey, paymentIntentId)) return token;
    } catch (err) {
      console.error('Invoice idempotency check failed (continuing):', err);
    }
  }

  // Amounts (cents). Fall back gracefully if tax wasn't applied.
  const totalCents = session.amount_total ?? product.priceEurCents;
  const vatCents = session.total_details?.amount_tax ?? 0;
  const netCents = session.amount_subtotal ?? totalCents - vatCents;
  const buyerName = session.customer_details?.name ?? undefined;

  const issuedAt = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000);
  const invoiceNumber = deriveInvoiceNumber(session.id, issuedAt);

  let attachment: { content: string; name: string } | undefined;
  try {
    const pdf = await buildInvoicePdf({
      invoiceNumber,
      issuedAt,
      buyerEmail: email,
      buyerName,
      productName: product.name,
      netCents,
      vatCents,
      totalCents,
      vatRatePct: 21,
      paymentRef: session.id,
    });
    attachment = { content: toBase64(pdf), name: `Factuur-${invoiceNumber}.pdf` };
  } catch (err) {
    console.error('Invoice PDF generation failed (sending receipt without invoice):', err);
  }

  const emailSent = await sendReceiptEmailWithRetry(
    { apiKey: brevoKey, to: email, productName: product.name, downloadUrl, invoiceNumber: attachment ? invoiceNumber : undefined, attachment },
    3,
  );

  if (!emailSent) {
    await sendAlert({
      subject: `Bestelmail NIET verzonden — ${email}`,
      body: [
        `Product:    ${product.name} (${productId})`,
        `Klant:      ${email}`,
        `Factuur:    ${invoiceNumber}`,
        `Session:    ${session.id}`,
        `Download:   ${downloadUrl}`,
        '',
        'Stuur handmatig een e-mail naar de klant met de downloadlink hierboven.',
      ].join('\n'),
      brevoKey,
    });
  }

  // Mark sent so the other path (return/webhook) doesn't email again.
  if (stripeKey && paymentIntentId) {
    try {
      await markInvoiceSent(stripeKey, paymentIntentId);
    } catch (err) {
      console.error('Marking invoice as sent failed (possible duplicate email):', err);
    }
  }

  return token;
}

/** WEB-YYYYMMDD-XXXXXX — deterministic, date-ordered, unique per Stripe session. */
function deriveInvoiceNumber(sessionId: string, issuedAt: Date): string {
  const y = issuedAt.getUTCFullYear();
  const m = String(issuedAt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(issuedAt.getUTCDate()).padStart(2, '0');
  const suffix = sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `WEB-${y}${m}${d}-${suffix}`;
}

async function invoiceAlreadySent(stripeKey: string, paymentIntentId: string): Promise<boolean> {
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!res.ok) return false;
  const pi = await res.json();
  return pi?.metadata?.invoice_sent === 'true';
}

async function markInvoiceSent(stripeKey: string, paymentIntentId: string): Promise<void> {
  const body = new URLSearchParams();
  body.set('metadata[invoice_sent]', 'true');
  await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendReceiptEmailWithRetry(
  opts: Parameters<typeof sendReceiptEmail>[0],
  maxAttempts: number,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await sendReceiptEmail(opts);
      return true;
    } catch (err) {
      console.error(`sendReceiptEmail attempt ${attempt}/${maxAttempts} failed:`, err);
      if (attempt < maxAttempts) await delay(2000 * attempt);
    }
  }
  return false;
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
    throw new Error(`Brevo receipt email failed: ${res.status} ${detail}`);
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
