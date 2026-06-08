import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'crypto';
import { PRODUCTS } from '../../lib/products.js';
import type { ProductId } from '../../lib/products.js';
import { completeOrder } from '../../lib/orderComplete.js';

function verifySignature(rawBody: string, header: string, secret: string): boolean {
  const parts = header.split(',');
  const tPart = parts.find((p) => p.startsWith('t='));
  const v1Parts = parts.filter((p) => p.startsWith('v1='));

  if (!tPart || v1Parts.length === 0) return false;

  const timestamp = tPart.slice(2);
  const signed = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(signed).digest('hex');

  return v1Parts.some((v1) => {
    const provided = v1.slice(3);
    const a = Buffer.from(provided, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  });
}

// Stripe sends POST for every event — must always return 200
export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('stripe-signature') ?? '';
    const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET ?? '';

    if (webhookSecret && !verifySignature(rawBody, signatureHeader, webhookSecret)) {
      console.error('Stripe webhook: invalid signature');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;

      if (session?.payment_status === 'paid') {
        const productId = session.metadata?.product as ProductId | undefined;
        const email: string = session.metadata?.email ?? session.customer_email ?? '';

        if (productId && PRODUCTS[productId] && email) {
          const secret = import.meta.env.DOWNLOAD_SECRET ?? '';
          const brevoKey = import.meta.env.BREVO_API_KEY ?? '';
          const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');

          await completeOrder(session.id, productId, email, secret, brevoKey, siteUrl);
        }
      }
    }
  } catch (err) {
    console.error('stripe-webhook error:', err);
  }

  return new Response('', { status: 200 });
};
