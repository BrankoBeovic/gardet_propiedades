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

/**
 * Derives regiones and comunas that have at least one published property.
 * Used by HeroSearch so filters only show locations with results.
 * @returns {{ regiones: Array<{id: string|number, nombre: string}>, comunasByRegion: Record<string, Array<{id: string|number, nombre: string}>> }}
 */
export async function fetchPublishedLocationOptions(supabase) {
  const { data, error } = await supabase
    .from('propiedades')
    .select(`
      comuna_id,
      comunas (
        id,
        nombre,
        region_id,
        regiones (
          id,
          nombre
        )
      )
    `)
    .eq('estado', 'publicada');

  if (error) throw error;

  const regionesMap = new Map();
  const comunasMaps = new Map();

  for (const prop of data || []) {
    const comuna = prop.comunas;
    if (!comuna?.regiones) continue;

    const region = comuna.regiones;
    const regionKey = String(region.id);

    if (!regionesMap.has(regionKey)) {
      regionesMap.set(regionKey, { id: region.id, nombre: region.nombre });
    }

    if (!comunasMaps.has(regionKey)) {
      comunasMaps.set(regionKey, new Map());
    }
    const byComuna = comunasMaps.get(regionKey);
    if (!byComuna.has(comuna.id)) {
      byComuna.set(comuna.id, { id: comuna.id, nombre: comuna.nombre });
    }
  }

  const regiones = Array.from(regionesMap.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es')
  );

  const comunasByRegion = {};
  for (const [regionKey, byComuna] of comunasMaps) {
    comunasByRegion[regionKey] = Array.from(byComuna.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es')
    );
  }

  return { regiones, comunasByRegion };
}
