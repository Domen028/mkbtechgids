import type { APIRoute } from 'astro';
import { PRODUCTS } from '../../lib/products.js';
import type { ProductId } from '../../lib/products.js';
import { completeOrder } from '../../lib/orderComplete.js';

// Stripe redirects here after checkout with ?session_id=cs_xxx
export const GET: APIRoute = async ({ url }) => {
  const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  const apiKey = import.meta.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=config-fout`, 303);
  }

  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    console.error('Stripe get session error:', res.status, await res.text());
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  const session = await res.json();

  if (session.status === 'expired') {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=expired`, 303);
  }

  // payment_status can be 'paid', 'unpaid', 'no_payment_required'
  if (session.payment_status !== 'paid') {
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=verwerking`, 303);
  }

  const productId = session.metadata?.product as ProductId | undefined;
  const email: string = session.metadata?.email ?? session.customer_email ?? '';

  if (!productId || !PRODUCTS[productId]) {
    console.error('Unknown product in Stripe session metadata:', session.metadata);
    return Response.redirect(`${siteUrl}/nis2-toolbox?betaling=mislukt`, 303);
  }

  const secret = import.meta.env.DOWNLOAD_SECRET ?? '';
  const brevoKey = import.meta.env.BREVO_API_KEY ?? '';

  const token = await completeOrder(sessionId, productId, email, secret, brevoKey, siteUrl);

  return Response.redirect(`${siteUrl}/bedankt?token=${encodeURIComponent(token)}`, 303);
};
