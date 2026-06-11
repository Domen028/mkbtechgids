/**
 * Health check endpoint — verifies all critical dependencies.
 * Returns 200 + JSON when all OK, 503 when degraded.
 * Protected by HEALTH_SECRET env var (Bearer token).
 *
 * Called by /api/cron-health (daily) and manually for debugging.
 */

import type { APIRoute } from 'astro';
import { PRODUCTS } from '../../lib/products.js';

export const GET: APIRoute = async ({ request }) => {
  const healthSecret = import.meta.env.HEALTH_SECRET ?? '';
  if (healthSecret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${healthSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');

  const checks: Record<string, boolean | string> = {
    stripe_key:      !!import.meta.env.STRIPE_SECRET_KEY,
    brevo_key:       !!import.meta.env.BREVO_API_KEY,
    download_secret: !!import.meta.env.DOWNLOAD_SECRET,
    site_url:        !!import.meta.env.SITE_URL,
  };

  // Check that each product's ZIP file is reachable as a static asset
  const fileResults: Record<string, boolean> = {};
  await Promise.all(
    Object.values(PRODUCTS).map(async (product) => {
      const zipUrl = `${siteUrl}/downloads/${product.zipFile}`;
      try {
        const res = await fetch(zipUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
        fileResults[product.zipFile] = res.ok;
      } catch {
        fileResults[product.zipFile] = false;
      }
    })
  );

  checks.zip_files = Object.values(fileResults).every(Boolean);

  const allOk = Object.values(checks).every((v) => v === true);

  const result = {
    status: allOk ? 'ok' : 'degraded',
    ts: new Date().toISOString(),
    checks,
    ...(allOk ? {} : { files: fileResults }),
  };

  return new Response(JSON.stringify(result, null, 2), {
    status: allOk ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
};
