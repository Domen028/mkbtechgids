import type { APIRoute } from 'astro';
import { PRODUCTS, mollieValue } from '../../lib/products.js';
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

  const apiKey = import.meta.env.MOLLIE_API_KEY;
  const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');

  if (!apiKey) {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=config-fout`, 303);
  }

  const product = PRODUCTS[productId];

  const res = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: { currency: 'EUR', value: mollieValue(product.priceEurCents) },
      description: `MKBTechGids — ${product.name}`,
      redirectUrl: `${siteUrl}/api/mollie-return`,
      webhookUrl: `${siteUrl}/api/mollie-webhook`,
      metadata: { product: productId, email },
      locale: 'nl_NL',
    }),
  });

  if (!res.ok) {
    console.error('Mollie create payment error:', res.status, await res.text());
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  const payment = await res.json();
  const checkoutUrl: string | undefined = payment._links?.checkout?.href;

  if (!checkoutUrl) {
    console.error('No checkout URL in Mollie response:', JSON.stringify(payment));
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  return Response.redirect(checkoutUrl, 303);
};
