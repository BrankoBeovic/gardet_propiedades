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
  borrador: 'bg-[#2C2C2C]/8 text-[#4A4A4A] border-[#2C2C2C]/15',
  publicada: 'bg-green-50 text-green-700 border-green-200',
  vendida: 'bg-gold/15 text-[#7E6649] border-gold/40',
  arrendada: 'bg-purple-50 text-purple-700 border-purple-200',
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
