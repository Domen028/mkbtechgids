import type { APIRoute } from 'astro';
import { PRODUCTS } from '../../lib/products.js';
import type { ProductId } from '../../lib/products.js';
import { completeOrder } from '../../lib/orderComplete.js';

// Mollie calls this endpoint asynchronously for every payment status change.
// Must always return 200 — any non-2xx response causes Mollie to retry.
export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const paymentId = form.get('id')?.toString();

    if (!paymentId) return new Response('', { status: 200 });

    const apiKey = import.meta.env.MOLLIE_API_KEY;
    if (!apiKey) return new Response('', { status: 200 });

    const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return new Response('', { status: 200 });

    const payment = await res.json();
    if (payment.status !== 'paid') return new Response('', { status: 200 });

    const productId = payment.metadata?.product as ProductId | undefined;
    const email: string = payment.metadata?.email ?? '';

    if (!productId || !PRODUCTS[productId] || !email) return new Response('', { status: 200 });

    const secret = import.meta.env.DOWNLOAD_SECRET ?? '';
    const brevoKey = import.meta.env.BREVO_API_KEY ?? '';
    const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');

    // Generates token and sends receipt email (idempotent — safe to call multiple times)
    await completeOrder(paymentId, productId, email, secret, brevoKey, siteUrl);
  } catch (err) {
    console.error('mollie-webhook error:', err);
  }

  return new Response('', { status: 200 });
};
