import type { APIRoute } from 'astro';
import { PRODUCTS } from '../../lib/products.js';
import type { ProductId } from '../../lib/products.js';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const productId = form.get('product')?.toString() as ProductId;
  const email = form.get('email')?.toString().trim() ?? '';

  if (!productId || !PRODUCTS[productId]) {
    return new Response('Ongeldig product.', { status: 400 });
  }
  if (!email || !email.includes('@')) {
    return new Response('Ongeldig e-mailadres.', { status: 400 });
  }

  const apiKey = import.meta.env.STRIPE_SECRET_KEY;
  const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');

  if (!apiKey) {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=config-fout`, 303);
  }

  const product = PRODUCTS[productId];

  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('customer_email', email);
  body.append('payment_method_types[]', 'card');
  body.append('payment_method_types[]', 'ideal');
  body.set('line_items[0][price]', product.stripePriceId);
  body.set('line_items[0][quantity]', '1');
  // 21% BTW added on top (prices are excl. btw). Rate is exclusive.
  const taxRateId = import.meta.env.STRIPE_TAX_RATE_ID;
  if (taxRateId) {
    body.append('line_items[0][tax_rates][]', taxRateId);
  }
  body.set('success_url', `${siteUrl}/api/stripe-return?session_id={CHECKOUT_SESSION_ID}`);
  body.set('cancel_url', `${siteUrl}/nis2-toolbox?betaling=canceled`);
  body.set('metadata[product]', productId);
  body.set('metadata[email]', email);
  body.set('locale', 'nl');

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    console.error('Stripe create session error:', res.status, await res.text());
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  const session = await res.json();

  if (!session.url) {
    console.error('No session URL in Stripe response:', JSON.stringify(session));
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  return Response.redirect(session.url, 303);
};
