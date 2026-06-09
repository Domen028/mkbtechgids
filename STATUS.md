# MKBTechGids — Live status (source of truth)
*Geverifieerd 09-06-2026. Dit bestand is de actuele waarheid voor de NIS2 Compliance Toolkit.*

## 🟢 LIVE
De NIS2 Compliance Toolkit is **volledig live** op https://www.mkbtechgids.nl.
BTW 21% + automatische BTW-factuur (PDF, met logo) geverifieerd via een echte testaankoop (Quick Start €49 → €59,29).

## Producten (live Stripe price IDs, excl. btw)
| Pakket | Prijs | Stripe price ID | Inhoud |
|--------|-------|-----------------|--------|
| Module 1 — Gratis | €0 | — | M1 Zelfevaluatie (lead magnet) |
| Quick Start | €49 | price_1Tg2lRV05y71WJqDV3jiPqro | M1–M3 |
| Core Bundle | €129 | price_1Tg2lYV05y71WJqDV6teiULO | M1–M5 + R1 Risicoregister |
| **Complete Toolkit** ⭐ | €249 | price_1Tg2llV05y71WJqDuPhYYwLD | Alle 8 modules + R1–R7 + 5 instrumenten = **20 bestanden** |
| Full Package | €349 | price_1Tg2lvV05y71WJqDC4Uzj6aw | Complete + Boardrapportage (PPTX-deck + Excel-werkboek) + support = **22 bestanden** |
| Sectorpakket | €149 | price_1Tg301V05y71WJqDo4anHwv7 | 3 sector-dreigingscatalogi (Energie/Transport/Zorg) |

## Toolkit-inventaris (bron: `Domen028/mkbtechgids_nis2`, privé)
- **8 modules (DOCX):** M1 Zelfevaluatie · M2 Risicoanalyse · M3 Beveiligingsmaatregelen · M4 Leveranciersbeveiliging · M5 Bedrijfscontinuïteit · M6 Medewerkers · M7 Documentatie · M8 Jaarlijkse Review
- **7 registers (XLSX):** R1 Risicoregister · R2 Activainventaris · R3 Leveranciersregister · R4 Incidentenlog · R5 Compliance Dashboard · R6 Trainingsregister · R7 Logregister
- **Instrumenten:** Beheersmaatregelkaart · Dreigingscatalogus · NIS2-Routekaart · Gap-Analyse · Bewustzijnsverklaring (V1) · Boardrapportage (deck + werkboek) · 3 sector-dreigingscatalogi

## Levering
- Bestanden staan in `public/downloads/` (productlijst: `src/lib/products.ts`).
- Na betaling (iDEAL/creditcard): HMAC-getekende downloadtokens op `/bedankt` + BTW-factuur per e-mail (BCC info@).

## Security
- Geen secrets in deze repo. Alle keys in env vars (Vercel) / lokale gitignored `.env`.
- GitHub PAT, Brevo key, Stripe sk_live op 08-06-2026 geroteerd; oude keys dood.

## SEO
- Stub-pagina's (`/crm`, `/ai-tools`, `/ai-governance`) op `noindex` + uit sitemap.
- Correcte `sitemap-index.xml` ingediend in Google Search Console (Succesvol).
- Alle NIS2-pagina's ingediend voor indexering.

> Volledige inhoudelijke onderbouwing: zie `TechLead-Imperium` repo →
> `MKBTechGids/Content/NIS2-Toolkit-Evidence.md` en `PROJECT_MEMORY.md`.
