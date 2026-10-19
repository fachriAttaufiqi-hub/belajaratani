import { Planting, ScaleUnit } from '../types';

export interface ScaleUnitOption {
  id: ScaleUnit;
  label: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  category: 'plant' | 'area';
  categoryLabel: string;
  description: string;
  placeholder: string;
  min: number;
  max: number;
  step: number;
  defaultQty: number;
  presets: number[];
  sqmPerUnitDefault: number;
}

export const SCALE_UNITS: Record<ScaleUnit, ScaleUnitOption> = {
  pohon: {
    id: 'pohon',
    label: 'Pohon (Tanaman Skala Kecil, Buah & Hortikultura)',
    shortLabel: 'Pohon',
    icon: '🌳',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
    category: 'plant',
    categoryLabel: 'Skala Pohon (Rekomendasi)',
    description: 'Sangat praktis untuk tanaman buah (alpukat, durian, pepaya, jambu) atau hortikultura (cabai, tomat, terong) dalam jumlah pohon',
    placeholder: 'Contoh: 50 pohon',
    min: 1,
    max: 50000,
    step: 1,
    defaultQty: 50,
    presets: [10, 25, 50, 100, 250, 500],
    sqmPerUnitDefault: 1.0 // 1 pohon setara ~1 m2 (atau 0.5 - 25 m2 tergantung tanaman)
  },
  batang: {
    id: 'batang',
    label: 'Batang (Hortikultura Sayur & Palawija)',
    shortLabel: 'Batang',
    icon: '🌱',
    badgeBg: 'bg-green-100 border-green-300',
    badgeText: 'text-green-900',
    category: 'plant',
    categoryLabel: 'Skala Batang',
    description: 'Hitungan per batang tanaman (cabai, tomat, jagung manis, terong, singkong) untuk skala kebun rumah & pekarangan',
    placeholder: 'Contoh: 100 batang',
    min: 1,
    max: 50000,
    step: 1,
    defaultQty: 100,
    presets: [25, 50, 100, 250, 500],
    sqmPerUnitDefault: 0.5
  },
  polybag: {
    id: 'polybag',
    label: 'Polybag (Pekarangan & Urban Farming)',
    shortLabel: 'Polybag',
    icon: '🪴',
    badgeBg: 'bg-teal-100 border-teal-300',
    badgeText: 'text-teal-900',
    category: 'plant',
    categoryLabel: 'Skala Polybag',
    description: 'Ideal untuk budidaya teras rumah, pekarangan, rooftop, greenhouse, atau dak beton dengan polybag',
    placeholder: 'Contoh: 100 polybag',
    min: 1,
    max: 20000,
    step: 1,
    defaultQty: 100,
    presets: [15, 30, 50, 100, 200, 500],
    sqmPerUnitDefault: 0.25 // 4 polybag per 1 m2
  },
  pot: {
    id: 'pot',
    label: 'Pot / Planter Bag (Tabulampot & Teras)',
    shortLabel: 'Pot',
    icon: '🪴',
    badgeBg: 'bg-cyan-100 border-cyan-300',
    badgeText: 'text-cyan-900',
    category: 'plant',
    categoryLabel: 'Skala Pot / Planter Bag',
    description: 'Untuk tanaman buah dalam pot (tabulampot) atau sayuran dalam pot hias pekarangan rumah',
    placeholder: 'Contoh: 20 pot',
    min: 1,
    max: 5000,
    step: 1,
    defaultQty: 20,
    presets: [5, 10, 20, 50, 100],
    sqmPerUnitDefault: 0.5
  },
  lubang_tanam: {
    id: 'lubang_tanam',
    label: 'Lubang Tanam (Mulsa Plastik / Hidroponik)',
    shortLabel: 'Lubang',
    icon: '🔘',
    badgeBg: 'bg-indigo-100 border-indigo-300',
    badgeText: 'text-indigo-900',
    category: 'plant',
    categoryLabel: 'Skala Lubang Tanam',
    description: 'Hitungan per lubang tanam bedengan mulsa perak atau instalasi netpot hidroponik',
    placeholder: 'Contoh: 500 lubang',
    min: 10,
    max: 100000,
    step: 10,
    defaultQty: 500,
    presets: [100, 250, 500, 1000, 2000],
    sqmPerUnitDefault: 0.25
  },
  rumpun: {
    id: 'rumpun',
    label: 'Rumpun (Pisang, Serai, Bambu, Jahe, Lengkuas)',
    shortLabel: 'Rumpun',
    icon: '🌾',
    badgeBg: 'bg-lime-100 border-lime-300',
    badgeText: 'text-lime-900',
    category: 'plant',
    categoryLabel: 'Tanaman Berumpun',
    description: 'Satuan rumpun untuk komoditas yang tumbuh bertunas atau bergerombol',
    placeholder: 'Contoh: 30 rumpun',
    min: 1,
    max: 10000,
    step: 1,
    defaultQty: 30,
    presets: [10, 25, 50, 100],
    sqmPerUnitDefault: 2.5
  },
  bedeng: {
    id: 'bedeng',
    label: 'Bedengan / Larik (Guludan Sayuran)',
    shortLabel: 'Bedeng',
    icon: '🪵',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-950',
    category: 'area',
    categoryLabel: 'Bedengan / Larikan',
    description: 'Standar 1 bedengan berukuran lebar 1 m x panjang 10 m (~10 m²)',
    placeholder: 'Contoh: 10 bedeng',
    min: 1,
    max: 1000,
    step: 1,
    defaultQty: 10,
    presets: [3, 5, 10, 20, 50],
    sqmPerUnitDefault: 10.0
  },
  m2: {
    id: 'm2',
    label: 'Meter Persegi (m²) - Standar Lahan',
    shortLabel: 'm²',
    icon: '📐',
    badgeBg: 'bg-stone-100 border-stone-300',
    badgeText: 'text-stone-800',
    category: 'area',
    categoryLabel: 'Luas Lahan Standar',
    description: 'Satuan standar metrik untuk kebun, pekarangan sedang, dan petak sawah',
    placeholder: 'Contoh: 1500 m²',
    min: 10,
    max: 1000000,
    step: 10,
    defaultQty: 2000,
    presets: [250, 500, 1000, 2000, 5000],
    sqmPerUnitDefault: 1.0
  },
  hektar: {
    id: 'hektar',
    label: 'Hektar (Ha) - Perkebunan & Sawah Luas',
    shortLabel: 'Ha',
    icon: '🚜',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    category: 'area',
    categoryLabel: 'Lahan Luas (Hektar)',
    description: '1 Hektar = 10.000 m². Cocok untuk hamparan sawah dan perkebunan luas',
    placeholder: 'Contoh: 1.5 Ha',
    min: 0.1,
    max: 1000,
    step: 0.1,
    defaultQty: 1,
    presets: [0.5, 1, 2, 5],
    sqmPerUnitDefault: 10000
  },
  ru: {
    id: 'ru',
    label: 'Ru / Bata / Tumbak (Satuan Tradisional Jawa & Sunda)',
    shortLabel: 'Ru',
    icon: '🌾',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-orange-950',
    category: 'area',
    categoryLabel: 'Satuan Tradisional',
    description: '1 Ru / Bata / Tumbak = 14 m² (standar agraria Nusantara)',
    placeholder: 'Contoh: 50 ru',
    min: 1,
    max: 50000,
    step: 1,
    defaultQty: 50,
    presets: [25, 50, 100, 200],
    sqmPerUnitDefault: 14.0
  }
};

export const SCALE_UNIT_LIST = Object.values(SCALE_UNITS);

/**
 * Konversi kuantitas unit ke estimasi luas meter persegi (m2)
 */
export function calculateEquivalentSqm(qty: number, unit: ScaleUnit, cropId?: string): number {
  const safeQty = Number(qty) || 0;
  if (safeQty <= 0) return 0;

  switch (unit) {
    case 'pohon':
    case 'batang': {
      if (cropId === 'semangka') return Math.round(safeQty * 2.5);
      if (cropId === 'cabai' || cropId === 'tomat') return Math.max(1, Math.round(safeQty * 0.5));
      if (cropId === 'jagung') return Math.max(1, Math.round(safeQty * 0.2));
      if (cropId === 'bawang_merah') return Math.max(1, Math.round(safeQty * 0.05));
      if (cropId === 'kedelai') return Math.max(1, Math.round(safeQty * 0.1));
      return Math.round(safeQty * 1.0);
    }
    case 'polybag':
      return Math.max(1, Math.round(safeQty * 0.25));
    case 'pot':
      return Math.max(1, Math.round(safeQty * 0.5));
    case 'lubang_tanam':
      return Math.max(1, Math.round(safeQty * 0.25));
    case 'rumpun':
      return Math.round(safeQty * 2.5);
    case 'bedeng':
      return Math.round(safeQty * 10.0);
    case 'hektar':
      return Math.round(safeQty * 10000);
    case 'ru':
      return Math.round(safeQty * 14.0);
    case 'm2':
    default:
      return Math.round(safeQty);
  }
}

/**
 * Format representasi skala suatu lahan (misal: "50 Pohon", "100 Polybag", "2.000 m²", "1,5 Ha")
 */
export function formatPlantingScale(planting: Planting): {
  primary: string;
  secondary: string;
  icon: string;
  badgeLabel: string;
  unit: ScaleUnit;
  isSmallScale: boolean;
} {
  const unit: ScaleUnit = (planting.scale_unit as ScaleUnit) || (planting.area_sqm >= 10000 && planting.area_sqm % 10000 === 0 ? 'hektar' : 'm2');
  const qty = planting.scale_quantity !== undefined && planting.scale_quantity > 0 
    ? planting.scale_quantity 
    : (unit === 'hektar' ? planting.area_sqm / 10000 : planting.area_sqm);
  
  const sqm = Number(planting.area_sqm) || 0;
  const cfg = SCALE_UNITS[unit] || SCALE_UNITS.m2;

  let primary = '';
  let secondary = '';

  switch (unit) {
    case 'pohon':
      primary = `${qty.toLocaleString('id-ID')} Pohon`;
      secondary = sqm > 0 ? `~${sqm.toLocaleString('id-ID')} m²` : '';
      break;
    case 'batang':
      primary = `${qty.toLocaleString('id-ID')} Batang`;
      secondary = sqm > 0 ? `~${sqm.toLocaleString('id-ID')} m²` : '';
      break;
    case 'polybag':
      primary = `${qty.toLocaleString('id-ID')} Polybag`;
      secondary = sqm > 0 ? `~${sqm.toLocaleString('id-ID')} m²` : '';
      break;
    case 'pot':
      primary = `${qty.toLocaleString('id-ID')} Pot`;
      secondary = sqm > 0 ? `~${sqm.toLocaleString('id-ID')} m²` : '';
      break;
    case 'lubang_tanam':
      primary = `${qty.toLocaleString('id-ID')} Lubang`;
      secondary = sqm > 0 ? `~${sqm.toLocaleString('id-ID')} m²` : '';
      break;
    case 'rumpun':
      primary = `${qty.toLocaleString('id-ID')} Rumpun`;
      secondary = sqm > 0 ? `~${sqm.toLocaleString('id-ID')} m²` : '';
      break;
    case 'bedeng':
      primary = `${qty.toLocaleString('id-ID')} Bedeng`;
      secondary = sqm > 0 ? `~${sqm.toLocaleString('id-ID')} m²` : '';
      break;
    case 'hektar':
      primary = `${qty.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha`;
      secondary = `${sqm.toLocaleString('id-ID')} m²`;
      break;
    case 'ru':
      primary = `${qty.toLocaleString('id-ID')} Ru`;
      secondary = `${sqm.toLocaleString('id-ID')} m²`;
      break;
    case 'm2':
    default:
      primary = `${sqm.toLocaleString('id-ID')} m²`;
      secondary = sqm >= 1000 ? `${(sqm / 10000).toFixed(2)} Ha` : '';
      break;
  }

  return {
    primary,
    secondary,
    icon: cfg.icon,
    badgeLabel: cfg.shortLabel,
    unit,
    isSmallScale: cfg.category === 'plant'
  };
}

/**
 * Ringkasan gabungan seluruh lahan: membedakan lahan hamparan luas dan tanaman skala kecil (pohon/polybag)
 */
export function summarizePlantingsScale(plantings: Planting[]): {
  totalSqm: number;
  totalHa: string;
  totalPohon: number;
  totalPolybag: number;
  summaryText: string;
  hasSmallScale: boolean;
} {
  let totalSqm = 0;
  let totalPohon = 0;
  let totalPolybag = 0;
  let hasSmallScale = false;

  for (const p of plantings) {
    totalSqm += Number(p.area_sqm) || 0;
    const unit = p.scale_unit;
    const qty = Number(p.scale_quantity) || Number(p.area_sqm) || 0;

    if (unit === 'pohon' || unit === 'batang') {
      totalPohon += qty;
      hasSmallScale = true;
    } else if (unit === 'polybag' || unit === 'pot' || unit === 'lubang_tanam') {
      totalPolybag += qty;
      hasSmallScale = true;
    } else if (unit === 'rumpun') {
      hasSmallScale = true;
    }
  }

  const totalHa = (totalSqm / 10000).toFixed(2);
  const parts: string[] = [];

  if (totalPohon > 0) {
    parts.push(`${totalPohon.toLocaleString('id-ID')} Pohon/Batang`);
  }
  if (totalPolybag > 0) {
    parts.push(`${totalPolybag.toLocaleString('id-ID')} Polybag/Pot`);
  }
  if (totalSqm > 0) {
    parts.push(`${totalHa} Ha (${totalSqm.toLocaleString('id-ID')} m²)`);
  }

  const summaryText = parts.length > 0 ? parts.join(' • ') : '0 m²';

  return {
    totalSqm,
    totalHa,
    totalPohon,
    totalPolybag,
    summaryText,
    hasSmallScale
  };
}
