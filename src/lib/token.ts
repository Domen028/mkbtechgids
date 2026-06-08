import { createHmac, timingSafeEqual } from 'crypto';
import type { ProductId } from './products.js';

interface TokenPayload {
  product: ProductId;
  email: string;
  paymentId: string;
  exp: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateToken(
  secret: string,
  product: ProductId,
  email: string,
  paymentId: string,
): string {
  const payload: TokenPayload = {
    product,
    email,
    paymentId,
    exp: Date.now() + TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyToken(secret: string, token: string): TokenPayload | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;

    const payloadB64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const expectedSig = createHmac('sha256', secret).update(payloadB64).digest('base64url');

    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
