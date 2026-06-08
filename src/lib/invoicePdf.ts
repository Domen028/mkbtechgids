import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { MKB_LOGO_PNG_BASE64 } from './logoBase64.js';

export interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date;
  buyerEmail: string;
  buyerName?: string;
  productName: string;
  netCents: number; // amount excl. BTW (Stripe amount_subtotal)
  vatCents: number; // BTW amount (Stripe total_details.amount_tax)
  totalCents: number; // amount incl. BTW (Stripe amount_total)
  vatRatePct: number; // e.g. 21
  paymentRef: string; // Stripe session / payment id
  paymentMethod?: string; // 'iDEAL' | 'creditcard' | ...
}

// Seller — MKBTechGids / LF-SF
const SELLER = {
  name: 'MKBTechGids',
  legal: 'Jacques Domenie',
  address: 'Brielle, Nederland',
  kvk: '27348456',
  btw: 'NL004968309B61',
  email: 'info@mkbtechgids.nl',
  web: 'www.mkbtechgids.nl',
};

const NAVY = rgb(0.059, 0.129, 0.278);
const GREEN = rgb(0.078, 0.325, 0.176);
const SLATE = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.886, 0.91, 0.941);
const BLACK = rgb(0.1, 0.12, 0.16);

function euro(cents: number): string {
  const v = (cents / 100).toFixed(2); // "301.29"
  const [int, dec] = v.split('.');
  const withThousands = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `€ ${withThousands},${dec}`;
}

function dutchDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

// Keep long Stripe ids short so the value never overlaps its label.
function shortRef(ref: string): string {
  return ref.length <= 20 ? ref : `${ref.slice(0, 11)}…${ref.slice(-6)}`;
}

export async function buildInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Factuur ${data.invoiceNumber}`);
  doc.setAuthor(SELLER.name);
  doc.setSubject('BTW-factuur MKBTechGids');

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const M = 56; // margin
  const right = width - M;
  let y = height - M;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 10,
    f = font,
    color = BLACK,
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  const textRight = (
    s: string,
    xr: number,
    yy: number,
    size = 10,
    f = font,
    color = BLACK,
  ) => page.drawText(s, { x: xr - f.widthOfTextAtSize(s, size), y: yy, size, font: f, color });

  // ── Header (logo + wordmark left, FACTUUR right) ─────────────────────────
  const logo = await doc.embedPng(MKB_LOGO_PNG_BASE64);
  page.drawImage(logo, { x: M, y: y - 24, width: 40, height: 40 });
  const tx = M + 52;
  text(SELLER.name, tx, y, 22, bold, NAVY);
  text('NIS2 Compliance Toolkit', tx, y - 16, 9, font, SLATE);
  textRight('FACTUUR', right, y, 20, bold, NAVY);
  y -= 54;

  // ── Seller / meta two columns ─────────────────────────────────────────────
  const sellerLines = [
    SELLER.legal,
    SELLER.address,
    `KVK ${SELLER.kvk}`,
    `BTW ${SELLER.btw}`,
    SELLER.email,
  ];
  let sy = y;
  text('Van', M, sy, 8, bold, SLATE);
  sy -= 14;
  for (const l of sellerLines) {
    text(l, M, sy, 10, font, BLACK);
    sy -= 14;
  }

  // meta block (right) — label left, value right-aligned; never let them collide
  const metaX = 308;
  const metaValX = right;
  let my = y;
  const metaRow = (label: string, value: string, vBold = false, small = false) => {
    text(label, metaX, my, 9, font, SLATE);
    textRight(value, metaValX, my, small ? 9 : 10, vBold ? bold : font, BLACK);
    my -= 16;
  };
  metaRow('Factuurnummer', data.invoiceNumber, true);
  metaRow('Factuurdatum', dutchDate(data.issuedAt));
  metaRow('Betaalreferentie', shortRef(data.paymentRef), false, true);
  if (data.paymentMethod) metaRow('Betaalwijze', data.paymentMethod);

  y = Math.min(sy, my) - 18;

  // ── Bill to ───────────────────────────────────────────────────────────────
  text('Factuur aan', M, y, 8, bold, SLATE);
  y -= 14;
  if (data.buyerName) {
    text(data.buyerName, M, y, 10, font, BLACK);
    y -= 14;
  }
  text(data.buyerEmail, M, y, 10, font, BLACK);
  y -= 30;

  // ── Line items table ───────────────────────────────────────────────────────
  const colDesc = M;
  const colQty = 360;
  const colAmt = right;

  page.drawRectangle({ x: M, y: y - 6, width: width - 2 * M, height: 24, color: rgb(0.965, 0.973, 0.984) });
  text('Omschrijving', colDesc + 8, y + 2, 9, bold, NAVY);
  textRight('Aantal', colQty + 28, y + 2, 9, bold, NAVY);
  textRight('Bedrag (excl. btw)', colAmt - 8, y + 2, 9, bold, NAVY);
  y -= 24;

  // row
  text(data.productName, colDesc + 8, y, 10, font, BLACK);
  textRight('1', colQty + 28, y, 10, font, BLACK);
  textRight(euro(data.netCents), colAmt - 8, y, 10, font, BLACK);
  y -= 16;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.75, color: LINE });
  y -= 22;

  // ── Totals ──────────────────────────────────────────────────────────────
  const totLabelX = 360;
  const totalsRow = (label: string, value: string, opts: { bold?: boolean; color?: any } = {}) => {
    text(label, totLabelX, y, opts.bold ? 11 : 10, opts.bold ? bold : font, opts.color ?? BLACK);
    textRight(value, right - 8, y, opts.bold ? 11 : 10, opts.bold ? bold : font, opts.color ?? BLACK);
    y -= 18;
  };
  totalsRow('Subtotaal (excl. btw)', euro(data.netCents));
  totalsRow(`BTW ${data.vatRatePct}%`, euro(data.vatCents));
  y -= 2;
  page.drawLine({ start: { x: totLabelX, y: y + 8 }, end: { x: right, y: y + 8 }, thickness: 0.75, color: LINE });
  y -= 6;
  totalsRow('Totaal (incl. btw)', euro(data.totalCents), { bold: true, color: NAVY });

  y -= 18;
  text(`Voldaan op ${dutchDate(data.issuedAt)}. Niets verschuldigd.`, M, y, 10, bold, GREEN);

  // ── Footer ────────────────────────────────────────────────────────────────
  const fy = M + 8;
  page.drawLine({ start: { x: M, y: fy + 26 }, end: { x: right, y: fy + 26 }, thickness: 0.75, color: LINE });
  text(
    `${SELLER.name} · ${SELLER.legal} · ${SELLER.address} · KVK ${SELLER.kvk} · BTW ${SELLER.btw}`,
    M,
    fy + 12,
    8,
    font,
    SLATE,
  );
  text(`${SELLER.email} · ${SELLER.web}`, M, fy, 8, font, SLATE);

  return doc.save();
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
