import rawCatalog from '../data/catalog.json';
import rawPreviews from '../data/previews.json';

type RawWork = {
  slug: string;
  collection?: string | null;
  title: string;
  artist?: string | null;
  year?: string | null;
  year_sort?: number | null;
  material?: string | null;
  museum?: string | null;
  source_institution?: string | null;
  source_url?: string | null;
  license?: string | null;
  note?: string | null;
  tier?: number | null;
  index?: number | null;
  total?: number | null;
  model?: {
    sourcePath?: string | null;
    format?: string | null;
    sizeBytes?: number | null;
  } | null;
  search?: string | null;
};

type Preview = {
  url: string;
  bytes: number;
  sourceBytes?: number;
  sourceFormat?: string;
  faces?: number;
  sourceFaces?: number;
};

export type Work = {
  id: string;
  slug: string;
  route: string;
  legacyRoute: string;
  title: string;
  subtitle: string;
  maker: string;
  makerDates: string;
  culture: string;
  yearStart: number | null;
  yearEnd: number | null;
  displayDate: string;
  era: string;
  movement: string;
  geography: string;
  sourceMuseum: string;
  department: string;
  medium: string;
  materials: string[];
  dimensions: string;
  accession: string;
  creditLine: string;
  rights: string;
  description: string;
  curatorialNote: string;
  provenance: string;
  tags: string[];
  relatedWorks: string[];
  posterImage: string;
  thumbnailImage: string;
  modelGlb: string;
  modelStats: string;
  featuredWeight: number;
  heroCrop: string;
  index: number;
  search: string;
  hasPreview: boolean;
  sourceUrl: string;
  internalModelSource: string;
};

export type Facet = {
  label: string;
  value: string;
  count: number;
};

const rawWorks = rawCatalog as RawWork[];
const previewMap = rawPreviews as Record<string, Preview>;

const makerCollections = new Set(['michelangelo', 'donatello', 'verrocchio', 'lorenzi', 'bouchardon', 'rodin']);

const collectionLabels: Record<string, string> = {
  americas: 'Americas and Oceania',
  asia: 'Asia',
  assyrian: 'Assyrian',
  bouchardon: 'Bouchardon',
  donatello: 'Donatello',
  lorenzi: 'Lorenzi',
  michelangelo: 'Michelangelo',
  palmyra: 'Palmyra',
  rodin: 'Rodin',
  'sub-saharan-africa': 'Sub-Saharan Africa',
  verrocchio: 'Verrocchio',
};

const collectionGeography: Record<string, string> = {
  americas: 'Americas and Oceania',
  asia: 'Asia',
  assyrian: 'Ancient Near East',
  bouchardon: 'Europe',
  donatello: 'Europe',
  lorenzi: 'Europe',
  michelangelo: 'Europe',
  palmyra: 'Ancient Near East',
  rodin: 'Europe',
  'sub-saharan-africa': 'Sub-Saharan Africa',
  verrocchio: 'Europe',
};

const collectionCulture: Record<string, string> = {
  americas: 'Americas and Oceania',
  asia: 'Asian',
  assyrian: 'Assyrian',
  palmyra: 'Palmyrene',
  'sub-saharan-africa': 'Sub-Saharan African',
};

const movementByCollection: Record<string, string> = {
  americas: 'Indigenous and Pacific sculpture',
  asia: 'Asian sculpture',
  assyrian: 'Assyrian relief',
  bouchardon: 'French neoclassical sculpture',
  donatello: 'Early Renaissance sculpture',
  lorenzi: 'Renaissance sculpture',
  michelangelo: 'High Renaissance sculpture',
  palmyra: 'Palmyrene funerary sculpture',
  rodin: 'Modern sculpture',
  'sub-saharan-africa': 'African sculpture',
  verrocchio: 'Renaissance sculpture',
};

const internalNotePatterns = [
  'mesh',
  'source stl',
  'source mesh',
  'viewer uses',
  'viewer basis',
  'museum-style lighting',
  'mobile-friendly controls',
  'post-load rotation',
  'camera unchanged',
  'upright in this viewer',
];

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function titleCaseSlug(value: string): string {
  return value
    .split(/[-/]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function valueKey(value: string): string {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export function yearLabel(work: Work): string {
  if (work.yearStart === null) return 'Date not yet recorded';
  if (work.yearEnd !== null && work.yearEnd !== work.yearStart) {
    return `${formatYear(work.yearStart)}-${formatYear(work.yearEnd)}`;
  }
  return formatYear(work.yearStart);
}

function parseYearRange(raw: RawWork): { start: number | null; end: number | null } {
  const yearSort = typeof raw.year_sort === 'number' && Number.isFinite(raw.year_sort) ? Math.trunc(raw.year_sort) : null;
  const text = clean(raw.year);
  if (yearSort === null) return { start: null, end: null };

  const bceRange = text.match(/(\d{1,4})\s*[-–]\s*(\d{1,4})\s*BCE/i);
  if (bceRange) {
    return { start: -Number(bceRange[1]), end: -Number(bceRange[2]) };
  }

  const ceRange = text.match(/(\d{3,4})\s*[-–]\s*(\d{2,4})/);
  if (ceRange && !/BCE/i.test(text)) {
    const start = Number(ceRange[1]);
    let end = Number(ceRange[2]);
    if (end < 100 && start >= 1000) end += Math.floor(start / 100) * 100;
    return { start, end };
  }

  return { start: yearSort, end: yearSort };
}

function eraFor(raw: RawWork): string {
  const year = typeof raw.year_sort === 'number' && Number.isFinite(raw.year_sort) ? raw.year_sort : null;
  const collection = clean(raw.collection);

  if (year !== null) {
    if (year < 500) return 'Ancient';
    if (year < 1400) return 'Medieval';
    if (year < 1700) return 'Renaissance';
    if (year < 1850) return 'Early modern';
    if (year < 1970) return 'Modern';
    return 'Contemporary';
  }

  if (['michelangelo', 'donatello', 'verrocchio', 'lorenzi'].includes(collection)) return 'Renaissance';
  if (collection === 'bouchardon') return 'Early modern';
  if (collection === 'rodin') return 'Modern';
  return 'Undated';
}

function geographyFor(raw: RawWork): string {
  const collection = clean(raw.collection);
  const search = `${raw.title ?? ''} ${raw.year ?? ''} ${raw.note ?? ''}`.toLowerCase();

  if (collectionGeography[collection]) return collectionGeography[collection];
  if (/cypriot|gudea|amarna|horus|egypt|assyrian|nimrud|nineveh|mesopotamia/.test(search)) {
    return 'Ancient Near East and Egypt';
  }
  if (/roman|greek|hellenistic|athena|apollo|venus|dionysos|herakles|zeus|cybele|laocoon|discobolus|doryphoros|gaul|germanicus|capitoline|belvedere|hermes|antinoos|juno|thalia|vulcan|artemision|wrestlers|hestia|perseus|medici/.test(search)) {
    return 'Mediterranean';
  }
  return 'Unassigned geography';
}

function cultureFor(raw: RawWork, geography: string): string {
  const collection = clean(raw.collection);
  if (collectionCulture[collection]) return collectionCulture[collection];
  if (makerCollections.has(collection)) return 'European';
  if (geography !== 'Unassigned geography') return geography;
  return '';
}

function materialsFor(raw: RawWork): string[] {
  const values = new Set<string>();
  const explicit = clean(raw.material);
  if (explicit) {
    for (const item of explicit.split(/[,;/]+/g)) {
      const label = clean(item);
      if (label) values.add(label);
    }
  }

  const text = `${raw.title ?? ''} ${raw.year ?? ''} ${publicNote(raw)}`.toLowerCase();
  const inferred: Array<[RegExp, string]> = [
    [/bronze/, 'Bronze'],
    [/marble/, 'Marble'],
    [/limestone/, 'Limestone'],
    [/silver/, 'Silver'],
    [/wood|post|mask|pole|box|drum|gong/, 'Wood'],
    [/terracotta|ceramic|clay/, 'Ceramic'],
    [/stone|stele|relief|sarcophagus|capital|corbel|lintel|voussoir|sphinx/, 'Stone'],
  ];

  for (const [pattern, label] of inferred) {
    if (pattern.test(text)) values.add(label);
  }

  return [...values];
}

function publicNote(raw: RawWork): string {
  const note = clean(raw.note);
  if (!note) return '';
  const lower = note.toLowerCase();
  if (internalNotePatterns.some((pattern) => lower.includes(pattern))) return '';
  return note;
}

function movementFor(raw: RawWork, era: string): string {
  const collection = clean(raw.collection);
  if (movementByCollection[collection]) return movementByCollection[collection];
  if (era === 'Ancient') return 'Ancient sculpture';
  if (era === 'Renaissance') return 'Renaissance sculpture';
  if (era === 'Modern') return 'Modern sculpture';
  if (era === 'Undated') return 'Movement not yet recorded';
  return `${era} sculpture`;
}

function makerFor(raw: RawWork): string {
  const artist = clean(raw.artist);
  if (artist.toLowerCase() === 'rodin') return 'Auguste Rodin';
  if (artist) return artist;
  const collection = clean(raw.collection);
  if (makerCollections.has(collection)) return titleCaseSlug(collection);
  return '';
}

function summaryFor(raw: RawWork, fields: { maker: string; era: string; sourceMuseum: string; geography: string }): string {
  const note = publicNote(raw);
  if (note) return note;

  const pieces = [
    fields.maker ? `maker: ${fields.maker}` : '',
    clean(raw.year) ? `date: ${clean(raw.year)}` : '',
    fields.geography && fields.geography !== 'Unassigned geography' ? `geography: ${fields.geography}` : '',
    fields.sourceMuseum ? `source: ${fields.sourceMuseum}` : '',
  ].filter(Boolean);

  if (pieces.length) {
    return `This record is currently grounded in source metadata (${pieces.join('; ')}). A fuller curatorial note is reserved for editorial review.`;
  }

  return 'This object is part of the imported sculpture corpus. The public page keeps the record visible while fuller source metadata and curatorial writing are reviewed.';
}

function modelStatsFor(preview: Preview | undefined, raw: RawWork): string {
  if (!preview) return '3D preview queued';
  const size = preview.bytes ? `${Math.round(preview.bytes / 1024)} KB` : 'web preview';
  const faces = preview.faces ? `${preview.faces.toLocaleString()} faces` : 'optimized mesh';
  const source = raw.model?.format ? raw.model.format.toUpperCase() : 'source mesh';
  return `${size}, ${faces}, prepared from ${source}`;
}

function normalize(raw: RawWork, fallbackIndex: number): Work {
  const collection = clean(raw.collection);
  const { start, end } = parseYearRange(raw);
  const era = eraFor(raw);
  const geography = geographyFor(raw);
  const maker = makerFor(raw);
  const materials = materialsFor(raw);
  const sourceMuseum = clean(raw.museum) || clean(raw.source_institution);
  const preview = previewMap[raw.slug];
  const movement = movementFor(raw, era);
  const description = summaryFor(raw, { maker, era, sourceMuseum, geography });
  const medium = clean(raw.material) || materials.join(', ');
  const title = clean(raw.title) || titleCaseSlug(raw.slug);

  const tags = [
    era,
    geography,
    movement,
    maker,
    sourceMuseum,
    ...materials,
    collectionLabels[collection] || '',
  ].filter((value) => value && !/not yet recorded|pending|unassigned/i.test(value));

  return {
    id: raw.slug.replaceAll('/', '--'),
    slug: raw.slug,
    route: `/works/${raw.slug}/`,
    legacyRoute: `/${raw.slug}/`,
    title,
    subtitle: collectionLabels[collection] || era,
    maker,
    makerDates: '',
    culture: cultureFor(raw, geography),
    yearStart: start,
    yearEnd: end,
    displayDate: clean(raw.year) || 'Date not yet recorded',
    era,
    movement,
    geography,
    sourceMuseum,
    department: '',
    medium,
    materials,
    dimensions: '',
    accession: '',
    creditLine: '',
    rights: clean(raw.license) || 'Rights review pending',
    description,
    curatorialNote: publicNote(raw),
    provenance: '',
    tags: [...new Set(tags)],
    relatedWorks: [],
    posterImage: `/previews/posters/${raw.slug}/poster.svg`,
    thumbnailImage: `/previews/posters/${raw.slug}/poster.svg`,
    modelGlb: preview?.url || '',
    modelStats: modelStatsFor(preview, raw),
    featuredWeight: Math.max(1, 5 - Number(raw.tier || 3)),
    heroCrop: 'center',
    index: raw.index || fallbackIndex + 1,
    search: clean(raw.search) || `${title} ${maker} ${era} ${geography} ${materials.join(' ')}`.toLowerCase(),
    hasPreview: Boolean(preview?.url),
    sourceUrl: clean(raw.source_url),
    internalModelSource: clean(raw.model?.sourcePath),
  };
}

function relatedFor(work: Work, works: Work[]): string[] {
  return works
    .filter((candidate) => candidate.slug !== work.slug)
    .map((candidate) => {
      const materialOverlap = candidate.materials.filter((material) => work.materials.includes(material)).length;
      let score = 0;
      if (work.maker && candidate.maker === work.maker) score += 6;
      if (candidate.geography === work.geography) score += 3;
      if (candidate.era === work.era) score += 2;
      if (candidate.movement === work.movement) score += 2;
      score += materialOverlap * 2;
      if (work.yearStart !== null && candidate.yearStart !== null) {
        score += Math.max(0, 2 - Math.abs(work.yearStart - candidate.yearStart) / 500);
      }
      return { slug: candidate.slug, score, index: candidate.index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .map((item) => item.slug);
}

const normalized = rawWorks.map(normalize);
export const works: Work[] = normalized.map((work) => ({ ...work, relatedWorks: relatedFor(work, normalized) }));
export const worksBySlug = new Map(works.map((work) => [work.slug, work]));

export function workBySlug(slug: string): Work | undefined {
  return worksBySlug.get(slug);
}

export function facetValue(label: string): string {
  return valueKey(label);
}

function facetCounts(values: string[]): Facet[] {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, value: facetValue(label), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const facets = {
  eras: facetCounts(works.map((work) => work.era)),
  geography: facetCounts(works.map((work) => work.geography)),
  materials: facetCounts(works.flatMap((work) => (work.materials.length ? work.materials : ['Material not yet recorded']))),
  movements: facetCounts(works.map((work) => work.movement)),
  makers: facetCounts(works.map((work) => work.maker || 'Maker not yet recorded')),
};

export function worksForFacet(field: 'era' | 'geography' | 'movement' | 'maker', label: string): Work[] {
  return works.filter((work) => {
    const value = field === 'maker' ? work.maker || 'Maker not yet recorded' : work[field];
    return value === label;
  });
}

export function worksForMaterial(label: string): Work[] {
  return works.filter((work) => (work.materials.length ? work.materials : ['Material not yet recorded']).includes(label));
}

export function featuredWorkForDate(date = new Date()): Work {
  const eligible = works.filter((work) => work.era !== 'Undated');
  const groups = [...new Set(eligible.map((work) => work.era))].sort();
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  const era = groups[day % groups.length];
  const group = eligible.filter((work) => work.era === era).sort((a, b) => a.index - b.index);
  return group[Math.floor(day / groups.length) % group.length] || works[0];
}

export function collectionHighlights(): Work[] {
  const preferred = [
    'michelangelo/david',
    'michelangelo/tondo-pitti',
    'donatello/saint-george',
    'rodin/the-thinker',
    'venus-de-milo',
    'laocoon',
    'capitoline-venus',
    'assyrian/ashurnasirpal-lion-hunt',
  ];
  const selected = preferred.map((slug) => workBySlug(slug)).filter(Boolean) as Work[];
  return selected.length >= 6 ? selected : works.slice(0, 8);
}

export function recentlyPrepared(limit = 8): Work[] {
  return [...works].sort((a, b) => b.index - a.index).slice(0, limit);
}

export function clampTimelineYear(year: number | null): number | null {
  if (year === null) return null;
  return Math.max(-3000, Math.min(new Date().getUTCFullYear(), year));
}

export function timelinePercent(year: number | null): number {
  const min = -3000;
  const max = new Date().getUTCFullYear();
  const clamped = clampTimelineYear(year);
  if (clamped === null) return 50;
  return ((clamped - min) / (max - min)) * 100;
}

export function publicDataset(work: Work): Record<string, string> {
  return {
    slug: work.slug,
    title: work.title,
    search: `${work.title} ${work.maker} ${work.displayDate} ${work.era} ${work.geography} ${work.materials.join(' ')} ${work.movement}`.toLowerCase(),
    year: String(clampTimelineYear(work.yearStart) ?? ''),
    era: facetValue(work.era),
    geography: facetValue(work.geography),
    maker: facetValue(work.maker || 'Maker not yet recorded'),
    movement: facetValue(work.movement),
    materials: (work.materials.length ? work.materials : ['Material not yet recorded']).map(facetValue).join(' '),
  };
}
