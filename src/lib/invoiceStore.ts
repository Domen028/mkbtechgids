import { Redis } from '@upstash/redis';

export interface InvoiceRecord {
  number: string; // e.g. WEB-2026-001
  sessionId: string;
  issuedAt: number; // unix seconds
}

const SERIES_PREFIX = 'WEB';

function redis(): Redis | null {
  // Supports both Vercel KV and native Upstash env var names.
  const url =
    import.meta.env.KV_REST_API_URL ??
    import.meta.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    import.meta.env.KV_REST_API_TOKEN ??
    import.meta.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isInvoiceStoreConfigured(): boolean {
  return redis() !== null;
}

/**
 * Returns the invoice record for a Stripe session, creating one exactly once.
 * Idempotent across the redirect (stripe-return) and webhook (stripe-webhook)
 * paths: both can call this for the same session; only one number is issued.
 *
 * Claim-then-number ordering guarantees the sequential counter is only
 * incremented by the path that wins the session claim, so no numbers are
 * burned on a race (gap-free series).
 */
export async function getOrCreateInvoice(sessionId: string, year: number): Promise<InvoiceRecord> {
  const r = redis();
  if (!r) throw new Error('Invoice store (KV/Upstash) is not configured');

  const sessionKey = `invoice:session:${sessionId}`;
  const counterKey = `invoice:counter:${year}`;

  // Fast path: already issued.
  const existing = await r.get<InvoiceRecord>(sessionKey);
  if (existing && typeof existing === 'object') return existing;

  // Claim the session atomically. Only the winner assigns a number.
  const claimed = await r.set(sessionKey, 'pending', { nx: true });
  if (claimed) {
    const seq = await r.incr(counterKey);
    const record: InvoiceRecord = {
      number: `${SERIES_PREFIX}-${year}-${String(seq).padStart(3, '0')}`,
      sessionId,
      issuedAt: Math.floor(Date.now() / 1000),
    };
    await r.set(sessionKey, record); // overwrite the 'pending' marker
    return record;
  }

  // Lost the race: the winner is assigning a number. Poll briefly for it.
  for (let i = 0; i < 20; i++) {
    const rec = await r.get<InvoiceRecord>(sessionKey);
    if (rec && typeof rec === 'object') return rec;
    await new Promise((res) => setTimeout(res, 150));
  }
  throw new Error(`Invoice number was not assigned in time for session ${sessionId}`);
}
