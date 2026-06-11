/**
 * Daily health check — called by Vercel Cron at 07:00 UTC.
 * Runs all health checks and emails support@ if anything is degraded.
 * Only sends a "all OK" email on Mondays (weekly summary), not daily.
 */

import type { APIRoute } from 'astro';
import { PRODUCTS } from '../../lib/products.js';
import { sendAlert } from '../../lib/alert.js';

export const GET: APIRoute = async ({ request }) => {
  // Vercel cron requests include this header — basic protection against
  // accidental public triggers. Optional: add CRON_SECRET env var for stricter auth.
  const cronSecret = import.meta.env.CRON_SECRET ?? '';
  if (cronSecret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');
  const brevoKey = import.meta.env.BREVO_API_KEY ?? '';

  const issues: string[] = [];

  // Check env vars
  if (!import.meta.env.STRIPE_SECRET_KEY)  issues.push('❌ STRIPE_SECRET_KEY is niet ingesteld');
  if (!import.meta.env.BREVO_API_KEY)       issues.push('❌ BREVO_API_KEY is niet ingesteld');
  if (!import.meta.env.DOWNLOAD_SECRET)     issues.push('❌ DOWNLOAD_SECRET is niet ingesteld');

  // Check ZIP files
  const fileChecks = await Promise.all(
    Object.values(PRODUCTS).map(async (product) => {
      const zipUrl = `${siteUrl}/downloads/${product.zipFile}`;
      try {
        const res = await fetch(zipUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
        return { file: product.zipFile, ok: res.ok, status: res.status };
      } catch (err) {
        return { file: product.zipFile, ok: false, status: 0 };
      }
    })
  );

  for (const fc of fileChecks) {
    if (!fc.ok) issues.push(`❌ ZIP niet bereikbaar: ${fc.file} (HTTP ${fc.status})`);
  }

  // Check Stripe API reachability
  if (import.meta.env.STRIPE_SECRET_KEY) {
    try {
      const stripeRes = await fetch('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${import.meta.env.STRIPE_SECRET_KEY}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!stripeRes.ok) issues.push(`⚠ Stripe API antwoordt met ${stripeRes.status}`);
    } catch {
      issues.push('❌ Stripe API niet bereikbaar');
    }
  }

  const isMonday = new Date().getUTCDay() === 1;

  if (issues.length > 0) {
    const body = [
      `Dagelijkse health check: ${new Date().toISOString()}`,
      '',
      'Gevonden problemen:',
      ...issues,
      '',
      `Controleer: ${siteUrl}/api/health`,
    ].join('\n');

    await sendAlert({ subject: 'Health check gefaald — actie vereist', body, brevoKey });

    console.log('[cron-health] DEGRADED:', issues);
    return new Response(JSON.stringify({ status: 'degraded', issues }), { status: 200 });
  }

  // All OK — only send weekly summary on Monday
  if (isMonday && brevoKey) {
    const okFiles = fileChecks.map((f) => `✓ ${f.file}`).join('\n');
    const body = [
      `Wekelijkse health check — alles in orde: ${new Date().toISOString()}`,
      '',
      'ZIP bestanden:',
      okFiles,
      '',
      '✓ STRIPE_SECRET_KEY aanwezig',
      '✓ BREVO_API_KEY aanwezig',
      '✓ DOWNLOAD_SECRET aanwezig',
    ].join('\n');

    await sendAlert({ subject: 'Wekelijkse status — alles OK ✓', body, brevoKey });
  }

  console.log('[cron-health] OK');
  return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
};
