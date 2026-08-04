/**
 * Shared property query fragments and UI helpers.
 */

export const PROPERTY_CARD_SELECT = `
  *,
  propiedades_imagenes (
    url,
    es_portada
  ),
  tipos_propiedad (
    id,
    nombre
  ),
  tipos_operacion (
    id,
    nombre
  )
`;

export const PROPERTY_DETAIL_SELECT = `
  *,
  propiedades_imagenes (
    url,
    es_portada,
    orden
  ),
  tipos_propiedad (
    id,
    nombre
  ),
  tipos_operacion (
    id,
    nombre
  ),
  comunas (
    id,
    nombre,
    regiones (
      id,
      nombre
    )
  )
`;

export const PROPERTY_DASHBOARD_SELECT = `
  *,
  propiedades_imagenes (
    url,
    es_portada,
    orden
  )
`;

export const PROPERTY_LIST_SELECT = `
  *,
  propiedades_imagenes (
    url,
    es_portada
  ),
  tipos_propiedad (
    id,
    nombre
  ),
  tipos_operacion (
    id,
    nombre
  ),
  comunas (
    id,
    nombre,
    region_id
  )
`;

const ESTADO_BADGE_CLASSES = {
  borrador: 'bg-ivory/10 text-ivory/50 border-ivory/20',
  publicada: 'bg-green-500/20 text-green-400 border-green-500/30',
  vendida: 'bg-gold/20 text-gold border-gold/30',
  arrendada: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

/**
 * Returns Tailwind classes for an estado badge.
 */
export function getEstadoBadgeClasses(estado) {
  return ESTADO_BADGE_CLASSES[estado] || ESTADO_BADGE_CLASSES.borrador;
}

/**
 * Loads comunas for a region_id (shared by HeroSearch / PropertyForm).
 */
export async function fetchComunasByRegion(supabase, regionId) {
  if (!regionId) return [];
  const { data, error } = await supabase
    .from('comunas')
    .select('id, nombre, region_id')
    .eq('region_id', regionId)
    .order('nombre');
  if (error) throw error;
  return data || [];
}
