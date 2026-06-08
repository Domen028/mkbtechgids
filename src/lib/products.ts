export type ProductId = 'quick-start' | 'core-bundle' | 'complete-toolkit' | 'full-package' | 'sectorpakket';

export interface Product {
  id: ProductId;
  name: string;
  tagline: string;
  tag: string;
  tagFeatured?: boolean;
  description: string;
  includes: string[];
  priceEurCents: number;
  stripePriceId: string;
  files: string[];
  featured?: boolean;
}

export const PRODUCTS: Record<ProductId, Product> = {
  'quick-start': {
    id: 'quick-start',
    name: 'Quick Start',
    tagline: 'Modules 1–3',
    tag: 'Startpakket',
    description: 'Snel aan de slag: bepaal uw plicht, begrijp de risicolandschap en stel uw beveiligingsmaatregelen op.',
    includes: [
      'M1 — NIS2 Zelfevaluatie (Word)',
      'M2 — Risicoanalyse (Word)',
      'M3 — Beveiligingsmaatregelen (Word)',
    ],
    priceEurCents: 4900,
    stripePriceId: 'price_1Tg2lRV05y71WJqDV3jiPqro',
    files: [
      'NIS2-Module1-Zelfevaluatie-v7.docx',
      'NIS2-Module2-Risicoanalyse-v1.docx',
      'NIS2-Module3-Beveiligingsmaatregelen-v1.docx',
    ],
  },

  'core-bundle': {
    id: 'core-bundle',
    name: 'Core Bundle',
    tagline: 'Modules 1–5 + R1 Risicoregister',
    tag: 'Compleet fundament',
    description: 'Modules 1–5 dekken de kern van NIS2. Inclusief het Excel Risicoregister voor directe compliancedossiervorming.',
    includes: [
      'M1 — Zelfevaluatie (Word)',
      'M2 — Risicoanalyse (Word)',
      'M3 — Beveiligingsmaatregelen (Word)',
      'M4 — Leveranciersbeveiliging (Word)',
      'M5 — Bedrijfscontinuïteit (Word)',
      'R1 — Risicoregister (Excel)',
    ],
    priceEurCents: 12900,
    stripePriceId: 'price_1Tg2lYV05y71WJqDV6teiULO',
    files: [
      'NIS2-Module1-Zelfevaluatie-v7.docx',
      'NIS2-Module2-Risicoanalyse-v1.docx',
      'NIS2-Module3-Beveiligingsmaatregelen-v1.docx',
      'NIS2-Module4-Leveranciersbeveiliging-v1.docx',
      'NIS2-Module5-Bedrijfscontinuiteit-v1.docx',
      'NIS2-Risicoregister-v7.xlsx',
    ],
  },

  'complete-toolkit': {
    id: 'complete-toolkit',
    name: 'Complete Toolkit',
    tagline: 'Alle 8 modules + R1–R7 + 2 instrumenten',
    tag: 'Aanbevolen',
    tagFeatured: true,
    description: 'Alles wat u nodig heeft voor een volledig NIS2-dossier. 8 Word-modules, 7 Excel-registers en 2 analysetools — klaar voor de toezichthouder.',
    includes: [
      'M1–M8 — Alle 8 modules (Word)',
      'R1 — Risicoregister (Excel)',
      'R2 — Activainventaris (Excel)',
      'R3 — Leveranciersregister (Excel)',
      'R4 — Incidentenlog (Excel)',
      'R5 — Compliance Dashboard (Excel)',
      'R6 — Trainingsregister (Excel)',
      'R7 — Logregister (Excel)',
      'Beheersmaatregelkaart (Excel)',
      'Dreigingscatalogus (Excel)',
      'NIS2-Routekaart (PDF)',
      'Gap-Analyse (Excel)',
      'Bewustzijnsverklaring (Word)',
    ],
    priceEurCents: 24900,
    stripePriceId: 'price_1Tg2llV05y71WJqDuPhYYwLD',
    featured: true,
    files: [
      'NIS2-Module1-Zelfevaluatie-v7.docx',
      'NIS2-Module2-Risicoanalyse-v1.docx',
      'NIS2-Module3-Beveiligingsmaatregelen-v1.docx',
      'NIS2-Module4-Leveranciersbeveiliging-v1.docx',
      'NIS2-Module5-Bedrijfscontinuiteit-v1.docx',
      'NIS2-Module6-Medewerkers-v1.docx',
      'NIS2-Module7-Documentatie-v1.docx',
      'NIS2-Module8-JaarlijkseReview-v1.docx',
      'NIS2-Risicoregister-v7.xlsx',
      'NIS2-Activainventaris-v2.xlsx',
      'NIS2-Leveranciersregister-v2.xlsx',
      'NIS2-Incidentenlog-v2.xlsx',
      'NIS2-ComplianceDashboard-v2.xlsx',
      'NIS2-Trainingsregister-v2.xlsx',
      'NIS2-Logregister-v2.xlsx',
      'NIS2-Beheersmaatregelkaart-v1.xlsx',
      'NIS2-Dreigingscatalogus-v2.xlsx',
      'NIS2-Routekaart-v7.pdf',
      'NIS2-GapAnalyse-v1.xlsx',
      'NIS2-Bewustzijnsverklaring-v1.docx',
    ],
  },

  'full-package': {
    id: 'full-package',
    name: 'Full Package',
    tagline: 'Alles inclusief + prioriteitsondersteuning',
    tag: 'Volledig',
    description: 'De complete toolkit plus e-mailondersteuning bij invulvragen. Ideaal voor organisaties zonder eigen IT-compliance kennis.',
    includes: [
      'Alles uit de Complete Toolkit (20 bestanden, incl. Routekaart, Gap-Analyse & Bewustzijnsverklaring)',
      'Boardrapportage: deck (PowerPoint) + werkboek (Excel) — exclusief in Full Package',
      '3 × e-mailondersteuning bij invulvragen',
      'Prioriteit bij toekomstige updates',
    ],
    priceEurCents: 34900,
    stripePriceId: 'price_1Tg2lvV05y71WJqDC4Uzj6aw',
    files: [
      'NIS2-Module1-Zelfevaluatie-v7.docx',
      'NIS2-Module2-Risicoanalyse-v1.docx',
      'NIS2-Module3-Beveiligingsmaatregelen-v1.docx',
      'NIS2-Module4-Leveranciersbeveiliging-v1.docx',
      'NIS2-Module5-Bedrijfscontinuiteit-v1.docx',
      'NIS2-Module6-Medewerkers-v1.docx',
      'NIS2-Module7-Documentatie-v1.docx',
      'NIS2-Module8-JaarlijkseReview-v1.docx',
      'NIS2-Risicoregister-v7.xlsx',
      'NIS2-Activainventaris-v2.xlsx',
      'NIS2-Leveranciersregister-v2.xlsx',
      'NIS2-Incidentenlog-v2.xlsx',
      'NIS2-ComplianceDashboard-v2.xlsx',
      'NIS2-Trainingsregister-v2.xlsx',
      'NIS2-Logregister-v2.xlsx',
      'NIS2-Beheersmaatregelkaart-v1.xlsx',
      'NIS2-Dreigingscatalogus-v2.xlsx',
      'NIS2-Routekaart-v7.pdf',
      'NIS2-GapAnalyse-v1.xlsx',
      'NIS2-Bewustzijnsverklaring-v1.docx',
      'NIS2-Boardrapportage-v2.pptx',
      'NIS2-Boardrapportage-Werkboek-v1.xlsx',
    ],
  },

  'sectorpakket': {
    id: 'sectorpakket',
    name: 'NIS2 Sectorpakket',
    tagline: 'Sectorspecifieke dreigingscatalogus — Energie, Transport & Zorg',
    tag: 'Sectorspecifiek',
    description: '3 afzonderlijke dreigingscatalogussen voor Energie, Transport en Gezondheidszorg. Elk met 38 pre-gescoorde risico\'s (28 generiek + 10 sectorspecifiek), regulatoire context, IEC 62443/ISO 28000/NEN 7510 controlekoppeling en meldplichtoverzicht per toezichthouder.',
    includes: [
      'Dreigingscatalogus Energie v1 (Excel) — IEC 62443, CSIRT-DSP/ACM',
      'Dreigingscatalogus Transport v1 (Excel) — ISO 28000, ILT/RDI',
      'Dreigingscatalogus Gezondheidszorg v1 (Excel) — NEN 7510, IGJ',
      '38 pre-gescoorde risico\'s per sector (W×I)',
      'Regulatoire context + meldplicht per toezichthouder',
      'Direct koppelbaar aan Module 2 Risicoanalyse',
    ],
    priceEurCents: 14900,
    stripePriceId: 'price_1Tg301V05y71WJqDo4anHwv7',
    files: [
      'NIS2-Dreigingscatalogus-Energie-v1.xlsx',
      'NIS2-Dreigingscatalogus-Transport-v1.xlsx',
      'NIS2-Dreigingscatalogus-Gezondheidszorg-v1.xlsx',
    ],
  },
};

export function priceDisplay(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

export function mollieValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
