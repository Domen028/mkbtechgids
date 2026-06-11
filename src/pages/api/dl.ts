/**
 * Download proxy — all file downloads go through here.
 * - Verifies token for paid files
 * - Logs every download as structured JSON (visible in Vercel logs)
 * - Detects return downloads (token > 1h old)
 * - Redirects to static file
 *
 * Usage:
 *   /api/dl?file=NIS2-CompleteToolkit-v1.zip&token=xxx   (paid)
 *   /api/dl?file=NIS2-Module1-Zelfevaluatie-v7.docx      (free)
 */

import type { APIRoute } from 'astro';
import { verifyToken } from '../../lib/token.js';
import { PRODUCTS } from '../../lib/products.js';

// Files available without a token
const FREE_FILES = new Set(['NIS2-Module1-Zelfevaluatie-v7.docx']);

// Build lookup: filename → product id
const FILE_TO_PRODUCT = new Map<string, string>();
for (const product of Object.values(PRODUCTS)) {
  FILE_TO_PRODUCT.set(product.zipFile, product.id);
  for (const f of product.files) FILE_TO_PRODUCT.set(f, product.id);
}

const ALL_KNOWN_FILES = new Set([...FILE_TO_PRODUCT.keys(), ...FREE_FILES]);

export const GET: APIRoute = async ({ url, request }) => {
  const siteUrl = (import.meta.env.SITE_URL ?? 'https://www.mkbtechgids.nl').replace(/\/$/, '');
  const file = url.searchParams.get('file') ?? '';
  const tokenParam = url.searchParams.get('token') ?? '';

  // Block path traversal and unknown files
  if (!file || file.includes('/') || file.includes('..') || !ALL_KNOWN_FILES.has(file)) {
    return new Response('Bestand niet gevonden.', { status: 404 });
  }

  const isFree = FREE_FILES.has(file);
  let emailDomain = 'anonymous';
  let productId = FILE_TO_PRODUCT.get(file) ?? 'unknown';
  let isReturn = false;

  if (!isFree) {
    const secret = import.meta.env.DOWNLOAD_SECRET ?? '';
    const payload = verifyToken(secret, tokenParam);

    if (!payload) {
      // Invalid / expired token → send back to bedankt (shows error state)
      return Response.redirect(`${siteUrl}/bedankt?token=${encodeURIComponent(tokenParam)}`, 302);
    }

    emailDomain = payload.email.includes('@') ? payload.email.split('@')[1] : 'unknown';
    productId = payload.product;

    // Token created = exp − 7 days. Return visit if > 1 hour after purchase.
    const createdAt = payload.exp - 7 * 24 * 60 * 60 * 1000;
    isReturn = Date.now() - createdAt > 60 * 60 * 1000;
  }

  // Structured event log — queryable in Vercel log drain / log viewer
  console.log(JSON.stringify({
    event: 'file_download',
    file,
    product: productId,
    email_domain: emailDomain,
    is_free: isFree,
    is_return: isReturn,
    ua: (request.headers.get('user-agent') ?? '').slice(0, 100),
    ts: new Date().toISOString(),
  }));

  return Response.redirect(`${siteUrl}/downloads/${encodeURIComponent(file)}`, 302);
};
