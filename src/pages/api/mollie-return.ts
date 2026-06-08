import type { APIRoute } from 'astro';
import { PRODUCTS } from '../../lib/products.js';
import type { ProductId } from '../../lib/products.js';
import { completeOrder } from '../../lib/orderComplete.js';

export const GET: APIRoute = async ({ url }) => {
  const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');
  const paymentId = url.searchParams.get('id');

  if (!paymentId) {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  const apiKey = import.meta.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=config-fout`, 303);
  }

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    console.error('Mollie get payment error:', res.status, await res.text());
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  const payment = await res.json();

  if (payment.status === 'canceled' || payment.status === 'failed' || payment.status === 'expired') {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=${payment.status}`, 303);
  }

  // For open/pending payments the webhook will fire once paid — show a pending page
  if (payment.status !== 'paid') {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=verwerking`, 303);
  }

  const productId = payment.metadata?.product as ProductId | undefined;
  const email: string = payment.metadata?.email ?? '';

  if (!productId || !PRODUCTS[productId]) {
    console.error('Unknown product in payment metadata:', payment.metadata);
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  const secret = import.meta.env.DOWNLOAD_SECRET ?? '';
  const brevoKey = import.meta.env.BREVO_API_KEY ?? '';

  const token = await completeOrder(paymentId, productId, email, secret, brevoKey, siteUrl);

  return Response.redirect(`${siteUrl}/bedankt?token=${encodeURIComponent(token)}`, 303);
};
