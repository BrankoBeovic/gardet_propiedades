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

/** Available units, cheapest list price first. */
export function availableUnits(unidades) {
  return (unidades || [])
    .filter((u) => u.disponible !== false)
    .sort((a, b) => Number(a.precio_lista_uf) - Number(b.precio_lista_uf));
}

/** "38–71" m² range of the given units, or null. */
export function m2Range(unidades) {
  const values = (unidades || []).map((u) => Number(u.m2_total)).filter((n) => n > 0);
  if (!values.length) return null;
  const min = Math.floor(Math.min(...values));
  const max = Math.ceil(Math.max(...values));
  return min === max ? `${min}` : `${min}–${max}`;
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

const roundPct = (n) => Math.round(n * 1e6) / 1e6;

/**
 * Payment breakdown ("Detalle del pago") for a unit, using the project's payment plan.
 * Percentages are fractions of the list price. The developer's contribution (bono pie)
 * covers part of the pie; the remaining pie is split into abono, pie antes de entrega and
 * pie después de entrega (the remainder).
 */
export function calcDetallePago(unidad, proyecto) {
  const precio = Number(unidad?.precio_lista_uf) || 0;
  const piePct = Number(proyecto?.pie_pct ?? 0.2);
  const aportePct = Math.min(Number(proyecto?.bono_pie_max) || 0, piePct);
  const saldoPct = roundPct(piePct - aportePct);
  const abonoPct = Math.min(Number(proyecto?.abono_pct ?? 0.01), saldoPct);
  const antesPct = Math.min(Number(proyecto?.pie_antes_pct ?? 0.05), roundPct(saldoPct - abonoPct));
  const despuesPct = roundPct(saldoPct - abonoPct - antesPct);
  const creditoPct = roundPct(1 - piePct);

  const uf = (pct) => precio * pct;
  return {
    precio,
    pie: { pct: piePct, uf: uf(piePct) },
    aporte: { pct: aportePct, uf: uf(aportePct) },
    saldo: { pct: saldoPct, uf: uf(saldoPct) },
    abono: { pct: abonoPct, uf: uf(abonoPct), cuotas: 1 },
    antes: { pct: antesPct, uf: uf(antesPct), cuotas: Number(proyecto?.pie_antes_cuotas) || 1 },
    despues: { pct: despuesPct, uf: uf(despuesPct), cuotas: Number(proyecto?.pie_despues_cuotas) || 1 },
    credito: { pct: creditoPct, uf: uf(creditoPct) },
    total: { pct: 1, uf: precio },
    saldoTotal: { uf: uf(roundPct(1 - aportePct)) },
  };
}
