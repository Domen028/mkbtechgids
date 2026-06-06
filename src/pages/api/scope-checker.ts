import type { APIRoute } from 'astro';

export const prerender = false;

// ── Email content per result type ────────────────────────────────────────────

const RESULT_META: Record<string, {
  subject: string;
  badge: string;
  badgeColor: string;
  title: string;
  intro: string;
  steps: string[];
  ctaLabel: string;
  ctaColor: string;
}> = {
  essentieel: {
    subject: 'Uw NIS2 scope resultaat: Essentiele dienstverlener',
    badge: 'ESSENTIËLE DIENSTVERLENER',
    badgeColor: '#14532d',
    title: 'NIS2 is verplicht voor uw organisatie',
    intro: 'Op basis van uw antwoorden valt uw organisatie als <strong>essentiële dienstverlener</strong> onder de strengste NIS2-eisen. U heeft een hogere meldplicht, strengere beveiligingsvereisten en uw bestuurders zijn persoonlijk aansprakelijk bij niet-naleving. Boetes kunnen oplopen tot <strong>€10.000.000 of 10% van de jaaromzet</strong>.',
    steps: [
      'Download en vul Module 1 in — bevestig uw scope officieel met een getekend document',
      'Voer een risicoanalyse uit (Module 2) — breng uw kwetsbaarheden in kaart',
      'Stel een implementatieroadmap op voor alle 8 NIS2-domeinen',
    ],
    ctaLabel: 'Download Module 1 gratis',
    ctaColor: '#14532d',
  },
  belangrijk: {
    subject: 'Uw NIS2 scope resultaat: Belangrijke dienstverlener',
    badge: 'BELANGRIJKE DIENSTVERLENER',
    badgeColor: '#92400e',
    title: 'NIS2 is verplicht voor uw organisatie',
    intro: 'Op basis van uw antwoorden valt uw organisatie als <strong>belangrijke dienstverlener</strong> onder de standaard NIS2-eisen. U heeft meldplichten bij incidenten, beveiligingsmaatregelen te nemen en uw bestuurders zijn persoonlijk aansprakelijk. Boetes kunnen oplopen tot <strong>€7.000.000 of 1,4% van de jaaromzet</strong>.',
    steps: [
      'Download en vul Module 1 in — bevestig uw scope officieel met een getekend document',
      'Bepaal welke beveiligingsmaatregelen prioriteit hebben (Module 3)',
      "Inventariseer uw leveranciers en ketenrisico's (Module 4)",
    ],
    ctaLabel: 'Download Module 1 gratis',
    ctaColor: '#14532d',
  },
  'digitale-aanbieder': {
    subject: 'Uw NIS2 scope resultaat: Digitale dienstverlener — NIS2 verplicht',
    badge: 'DIGITALE DIENSTVERLENER — NIS2 VERPLICHT',
    badgeColor: '#0f2147',
    title: 'NIS2 geldt altijd voor digitale dienstverleners',
    intro: 'Aanbieders van cloud computing, DNS-diensten, datacenters en gerelateerde digitale infrastructuur vallen <strong>altijd onder NIS2</strong> — ongeacht het aantal medewerkers of de omzet. Registratie bij het NCSC is verplicht.',
    steps: [
      'Registreer uw organisatie bij het NCSC (Nationaal Cyber Security Centrum)',
      'Download en vul Module 1 in — bevestig uw scope met een getekend document',
      'Voer een volledige risicoanalyse uit (Module 2) — vereist voor uw categorie',
    ],
    ctaLabel: 'Download Module 1 gratis',
    ctaColor: '#0f2147',
  },
  indirect: {
    subject: 'Uw NIS2 scope resultaat: Mogelijk indirect verplicht',
    badge: 'MOGELIJK INDIRECT VERPLICHT',
    badgeColor: '#92400e',
    title: 'Ketenverantwoordelijkheid kan op u van toepassing zijn',
    intro: 'Uw organisatie valt niet direct onder NIS2 op basis van sector en omvang. Maar omdat u diensten levert aan NIS2-verplichte organisaties, kunnen uw klanten <strong>beveiligingseisen aan u stellen via contracten</strong>. Dit heet ketenverantwoordelijkheid.',
    steps: [
      'Controleer uw contracten met klanten op beveiligingsclausules',
      'Bespreek met uw klanten welke NIS2-eisen zij aan leveranciers stellen',
      'Overweeg minimale NIS2-maatregelen als concurrentievoordeel',
    ],
    ctaLabel: 'Lees meer over NIS2',
    ctaColor: '#14532d',
  },
  'niet-verplicht': {
    subject: 'Uw NIS2 scope resultaat: Waarschijnlijk niet verplicht',
    badge: 'WAARSCHIJNLIJK NIET VERPLICHT',
    badgeColor: '#15803d',
    title: 'NIS2 lijkt momenteel niet verplicht voor uw organisatie',
    intro: 'Op basis van uw antwoorden valt uw organisatie waarschijnlijk <strong>niet direct onder de NIS2-richtlijn</strong>. Controleer dit jaarlijks — als uw organisatie groeit of van sector verandert, kan de situatie wijzigen. Bewaar dit resultaat als onderbouwing van uw besluit.',
    steps: [
      'Bewaar dit e-mailbericht als compliance-bewijs van uw beoordeling',
      'Herhaal deze check jaarlijks of bij grote wijzigingen in omvang of activiteiten',
      'Controleer ketenverantwoordelijkheid als u aan grote of overheidsorganisaties levert',
    ],
    ctaLabel: 'Lees meer over NIS2',
    ctaColor: '#14532d',
  },
};

// ── HTML email builder ───────────────────────────────────────────────────────

function buildEmailHtml(meta: typeof RESULT_META[string], downloadUrl: string): string {
  const stepsHtml = meta.steps
    .map((step, i) => `
      <tr>
        <td style="padding: 6px 0; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width: 28px; height: 28px; background: #14532d; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 13px; font-weight: 700; color: #ffffff; padding: 0; flex-shrink: 0;">
                ${i + 1}
              </td>
              <td style="padding-left: 12px; font-size: 14px; color: #475569; line-height: 1.6;">
                ${step}
              </td>
            </tr>
          </table>
        </td>
      </tr>`)
    .join('');

  const showDownloadBtn = meta.ctaLabel === 'Download Module 1 gratis';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.subject}</title>
</head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px;">

          <!-- Header -->
          <tr>
            <td style="background: #0f2147; border-radius: 12px 12px 0 0; padding: 32px 40px; text-align: center;">
              <p style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">
                MKBTechGids
              </p>
              <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">
                NIS2 Scope Checker — Uw persoonlijke resultaat
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: #ffffff; padding: 40px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">

              <!-- Badge -->
              <p style="margin: 0 0 20px; text-align: center;">
                <span style="display: inline-block; background: ${meta.badgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 16px; border-radius: 4px;">
                  ${meta.badge}
                </span>
              </p>

              <!-- Title -->
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0f2147; line-height: 1.25; text-align: center;">
                ${meta.title}
              </h1>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <!-- Intro -->
              <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.8;">
                ${meta.intro}
              </p>

              <!-- Steps -->
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #0f2147; text-transform: uppercase; letter-spacing: 0.05em;">
                Uw volgende stappen
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; border-radius: 8px; padding: 20px 24px; margin-bottom: 32px;">
                ${stepsHtml}
              </table>

              ${showDownloadBtn ? `
              <!-- Download button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${downloadUrl}"
                       style="display: inline-block; background: ${meta.ctaColor}; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 36px; border-radius: 8px;">
                      ${meta.ctaLabel} →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      Module 1 — NIS2 Zelfevaluatie (Word-document, gratis)
                    </p>
                  </td>
                </tr>
              </table>
              ` : `
              <!-- Articles link -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://www.mkbtechgids.nl/nis2"
                       style="display: inline-block; background: ${meta.ctaColor}; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      ${meta.ctaLabel} →
                    </a>
                  </td>
                </tr>
              </table>
              `}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #0f2147;">MKBTechGids</p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">
                mkbtechgids.nl · info@mkbtechgids.nl · Brielle, Nederland
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                KVK 27348456 · BTW NL004968309B61
              </p>
              <p style="margin: 12px 0 0; font-size: 11px; color: #94a3b8;">
                U ontvangt dit e-mailbericht omdat u de NIS2 Scope Checker heeft ingevuld op mkbtechgids.nl.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── API route ────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, result } = body;

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Ongeldig e-mailadres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = import.meta.env.BREVO_API_KEY;

    if (!apiKey) {
      console.error('BREVO_API_KEY missing');
      return new Response(
        JSON.stringify({ success: true, result, warning: 'email_not_stored' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const listId = 4; // NIS2 Scope Checker list — confirmed 06-06-2026

    // ── 1. Add contact to Brevo list ─────────────────────────────────────────
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
        attributes: {
          NIS2_SCOPE_RESULT: result,
          NIS2_SCOPE_DATE: new Date().toISOString().split('T')[0],
          SOURCE: 'scope-checker',
        },
      }),
    });

    const contactText = await contactRes.text();
    let contactData: Record<string, unknown> = {};
    try { contactData = JSON.parse(contactText); } catch { /* non-JSON */ }

    const contactOk =
      contactRes.ok ||
      contactRes.status === 204 ||
      contactData['code'] === 'duplicate_parameter';

    if (!contactOk) {
      console.error('Brevo contact error:', contactText);
    }

    // ── 2. Send transactional result email ───────────────────────────────────
    const meta = RESULT_META[result] ?? RESULT_META['niet-verplicht'];
    const downloadUrl = 'https://www.mkbtechgids.nl/downloads/NIS2-Module1-Zelfevaluatie.docx';
    const emailHtml = buildEmailHtml(meta, downloadUrl);

    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'MKBTechGids',
          email: 'info@mkbtechgids.nl',
        },
        to: [{ email }],
        subject: meta.subject,
        htmlContent: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const emailError = await emailRes.text();
      console.error('Brevo email send error:', emailError);
      // Still return success — user sees result on screen
    }

    // ── 3. Return success regardless of email status ─────────────────────────
    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Scope checker API error:', err);
    return new Response(
      JSON.stringify({ success: true, warning: 'api_error' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
