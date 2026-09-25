/**
 * Shared query fragments, constants and finance helpers for Proyectos.
 */
import {
  Waves,
  Dumbbell,
  Flame,
  WashingMachine,
  Sofa,
  Trees,
  PawPrint,
  CalendarClock,
  Leaf,
} from 'lucide-react';

export const PROYECTO_CARD_SELECT = `
  *,
  proyectos_imagenes (
    url,
    es_portada,
    orden
  ),
  proyectos_unidades (
    id,
    tipologia,
    precio_final_uf,
    disponible
  ),
  comunas (
    id,
    nombre
  )
`;

export const PROYECTO_DETAIL_SELECT = `
  *,
  proyectos_imagenes (
    url,
    es_portada,
    orden
  ),
  proyectos_unidades (*),
  comunas (
    id,
    nombre,
    regiones (
      id,
      nombre
    )
  )
`;

/** Estados visible on the public site (excludes borrador). */
export const PUBLIC_ESTADOS_PROYECTO = ['publicado', 'agotado'];

export const ESTADOS_PROYECTO = ['borrador', 'publicado', 'agotado'];

const ESTADO_BADGE_CLASSES = {
  borrador: 'bg-[#2C2C2C]/8 text-[#4A4A4A] border-[#2C2C2C]/15',
  publicado: 'bg-green-50 text-green-700 border-green-200',
  agotado: 'bg-gold/15 text-[#7E6649] border-gold/40',
};

export function getProyectoEstadoBadgeClasses(estado) {
  return ESTADO_BADGE_CLASSES[estado] || ESTADO_BADGE_CLASSES.borrador;
}

/** Amenities shown on the detail page — keys match boolean columns in `proyectos`. */
export const AMENIDADES = [
  { key: 'piscina', label: 'Piscina', icon: Waves },
  { key: 'gimnasio', label: 'Gimnasio', icon: Dumbbell },
  { key: 'quincho', label: 'Quincho', icon: Flame },
  { key: 'lavanderia', label: 'Lavandería', icon: WashingMachine },
  { key: 'sala_multiuso', label: 'Sala multiuso', icon: Sofa },
  { key: 'areas_verdes', label: 'Áreas verdes', icon: Trees },
  { key: 'pet_zone', label: 'Pet zone', icon: PawPrint },
  { key: 'renta_corta', label: 'Apto renta corta', icon: CalendarClock },
  { key: 'eco_friendly', label: 'Eco-friendly', icon: Leaf },
];

/** Pie options offered in the investment summary. */
export const PIE_OPCIONES = [0.1, 0.15, 0.2];

/** Reference mortgage assumptions (dividendo referencial sin seguros). */
export const TASA_HIPOTECARIA_ANUAL = 0.045;
export const PLAZO_HIPOTECARIO_ANOS = 25;

const ufFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const ufFormatterDecimals = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "UF 2.210" (or "UF 2.210,38" with decimals). */
export function formatUf(value, { decimals = false } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const formatter = decimals ? ufFormatterDecimals : ufFormatter;
  return `UF ${formatter.format(Number(value))}`;
}

/** 0.26 → "26%", 0.0549 → "5,5%". */
export function formatPct(value, digits = 0) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${(Number(value) * 100).toLocaleString('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

/** "2D-1B" → { dormitorios: 2, banos: 1 }, "Estudio" → { 0, 1 }. */
export function parseTipologia(tipologia) {
  const match = String(tipologia || '').match(/(\d+)\s*D\s*-\s*(\d+)\s*B/i);
  if (match) return { dormitorios: Number(match[1]), banos: Number(match[2]) };
  return { dormitorios: 0, banos: 1 };
}

/** Human label: "2D-1B" → "2 dorm · 1 baño", "Estudio" → "Estudio". */
export function formatTipologia(tipologia) {
  if (/estudio/i.test(tipologia || '')) return 'Estudio';
  const { dormitorios, banos } = parseTipologia(tipologia);
  return `${dormitorios} dorm · ${banos} ${banos === 1 ? 'baño' : 'baños'}`;
}

/** Sorted unique typologies of the given units ("Estudio" first, then by dorms/baños). */
export function uniqueTipologias(unidades) {
  const set = new Set((unidades || []).map((u) => u.tipologia).filter(Boolean));
  return Array.from(set).sort((a, b) => {
    const pa = /estudio/i.test(a) ? { dormitorios: -1, banos: 0 } : parseTipologia(a);
    const pb = /estudio/i.test(b) ? { dormitorios: -1, banos: 0 } : parseTipologia(b);
    return pa.dormitorios - pb.dormitorios || pa.banos - pb.banos;
  });
}

/** Available units, cheapest first. */
export function availableUnits(unidades) {
  return (unidades || [])
    .filter((u) => u.disponible !== false)
    .sort((a, b) => Number(a.precio_final_uf) - Number(b.precio_final_uf));
}

/** Cover image URL (es_portada → first by orden → null). */
export function getCoverImage(imagenes) {
  if (!imagenes?.length) return null;
  const sorted = [...imagenes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  return (sorted.find((img) => img.es_portada) || sorted[0]).url;
}

/** "Inmediata" → "Entrega inmediata", "2027 2do sem" → "Entrega 2027 2do sem". */
export function formatEntrega(entrega) {
  if (!entrega) return 'Entrega por confirmar';
  if (/inmediata/i.test(entrega)) return 'Entrega inmediata';
  return `Entrega ${entrega}`;
}

/**
 * Monthly mortgage payment in UF (French amortization), without insurance.
 */
export function calcDividendoUf(
  montoCreditoUf,
  tasaAnual = TASA_HIPOTECARIA_ANUAL,
  anos = PLAZO_HIPOTECARIO_ANOS
) {
  const monto = Number(montoCreditoUf);
  if (!monto || monto <= 0) return 0;
  const r = tasaAnual / 12;
  const n = anos * 12;
  return (monto * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Investment summary for a unit given the chosen pie %.
 * Bono pie is paid by the developer, so the buyer's out-of-pocket pie is pie − bono.
 */
export function calcResumenInversion(unidad, piePct, bonoPieMax = 0) {
  const precio = Number(unidad?.precio_final_uf) || 0;
  const bonoPct = Math.min(Number(bonoPieMax) || 0, piePct);
  const pieTotalUf = precio * piePct;
  const bonoPieUf = precio * bonoPct;
  const pieAPagarUf = Math.max(0, pieTotalUf - bonoPieUf);
  const creditoUf = precio - pieTotalUf;
  return {
    precio,
    pieTotalUf,
    bonoPieUf,
    pieAPagarUf,
    creditoUf,
    dividendoUf: calcDividendoUf(creditoUf),
  };
}
