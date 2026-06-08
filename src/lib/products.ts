export type ProductId = 'quick-start' | 'core-bundle' | 'complete-toolkit' | 'full-package';

export interface Product {
  id: ProductId;
  name: string;
  tagline: string;
  tag: string;
  tagFeatured?: boolean;
  description: string;
  includes: string[];
  priceEurCents: number;
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
    files: [
      'NIS2-Module1-Zelfevaluatie.docx',
      'NIS2-Module2-Risicoanalyse.docx',
      'NIS2-Module3-Beveiligingsmaatregelen.docx',
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
    files: [
      'NIS2-Module1-Zelfevaluatie.docx',
      'NIS2-Module2-Risicoanalyse.docx',
      'NIS2-Module3-Beveiligingsmaatregelen.docx',
      'NIS2-Module4-Leveranciers.docx',
      'NIS2-Module5-Continuiteit.docx',
      'NIS2-R1-Risicoregister.xlsx',
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
    ],
    priceEurCents: 24900,
    featured: true,
    files: [
      'NIS2-Module1-Zelfevaluatie.docx',
      'NIS2-Module2-Risicoanalyse.docx',
      'NIS2-Module3-Beveiligingsmaatregelen.docx',
      'NIS2-Module4-Leveranciers.docx',
      'NIS2-Module5-Continuiteit.docx',
      'NIS2-Module6-Medewerkers.docx',
      'NIS2-Module7-Logging.docx',
      'NIS2-Module8-Review.docx',
      'NIS2-R1-Risicoregister.xlsx',
      'NIS2-R2-Activainventaris.xlsx',
      'NIS2-R3-Leveranciersregister.xlsx',
      'NIS2-R4-Incidentenlog.xlsx',
      'NIS2-R5-Compliance-Dashboard.xlsx',
      'NIS2-R6-Trainingsregister.xlsx',
      'NIS2-R7-Logregister.xlsx',
      'NIS2-Beheersmaatregelkaart-v1.xlsx',
      'NIS2-Dreigingscatalogus-v2_1.xlsx',
    ],
  },

  'full-package': {
    id: 'full-package',
    name: 'Full Package',
    tagline: 'Alles inclusief + prioriteitsondersteuning',
    tag: 'Volledig',
    description: 'De complete toolkit plus e-mailondersteuning bij invulvragen. Ideaal voor organisaties zonder eigen IT-compliance kennis.',
    includes: [
      'Alles uit de Complete Toolkit (17 bestanden)',
      '3 × e-mailondersteuning bij invulvragen',
      'Prioriteit bij toekomstige updates',
    ],
    priceEurCents: 34900,
    files: [
      'NIS2-Module1-Zelfevaluatie.docx',
      'NIS2-Module2-Risicoanalyse.docx',
      'NIS2-Module3-Beveiligingsmaatregelen.docx',
      'NIS2-Module4-Leveranciers.docx',
      'NIS2-Module5-Continuiteit.docx',
      'NIS2-Module6-Medewerkers.docx',
      'NIS2-Module7-Logging.docx',
      'NIS2-Module8-Review.docx',
      'NIS2-R1-Risicoregister.xlsx',
      'NIS2-R2-Activainventaris.xlsx',
      'NIS2-R3-Leveranciersregister.xlsx',
      'NIS2-R4-Incidentenlog.xlsx',
      'NIS2-R5-Compliance-Dashboard.xlsx',
      'NIS2-R6-Trainingsregister.xlsx',
      'NIS2-R7-Logregister.xlsx',
      'NIS2-Beheersmaatregelkaart-v1.xlsx',
      'NIS2-Dreigingscatalogus-v2_1.xlsx',
    ],
  },
};

export function priceDisplay(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

export function mollieValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
