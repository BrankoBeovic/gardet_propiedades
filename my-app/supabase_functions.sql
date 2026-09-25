-- Functions for PostGIS location handling
-- Run these in your Supabase SQL Editor (after or with supabase_rls.sql)
--
-- Ownership: update_property_location requires auth.uid() = property owner.
-- get_property_with_location is callable by authenticated users only (used by
-- the Dashboard). Both functions run as SECURITY INVOKER, so RLS on propiedades
-- applies on top of the checks inside each function.

-- Function to update property location (owner only)
CREATE OR REPLACE FUNCTION update_property_location(
    property_id BIGINT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE propiedades
    SET ubicacion = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    WHERE id = property_id
      AND user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Property not found or not owned by current user';
    END IF;
END;
$$;

-- Function to get property with extracted lat/lng
CREATE OR REPLACE FUNCTION get_property_with_location(property_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    titulo TEXT,
    descripcion TEXT,
    precio_uf NUMERIC,
    mt2_construidos NUMERIC,
    mt2_terreno NUMERIC,
    habitaciones INT,
    banos INT,
    direccion_referencial TEXT,
    estado TEXT,
    ubicacion_lat DOUBLE PRECISION,
    ubicacion_lng DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.titulo,
        p.descripcion,
        p.precio_uf,
        p.mt2_construidos,
        p.mt2_terreno,
        p.habitaciones,
        p.banos,
        p.direccion_referencial,
        p.estado,
        ST_Y(p.ubicacion::geometry) as ubicacion_lat,
        ST_X(p.ubicacion::geometry) as ubicacion_lng
    FROM propiedades p
    WHERE p.id = property_id
      AND (
        p.estado IN ('publicada', 'vendida', 'arrendada')
        OR (auth.uid() IS NOT NULL AND p.user_id = auth.uid())
      );
END;
$$;

-- Restrict dangerous mutation RPC to authenticated only; revoke from anon
REVOKE ALL ON FUNCTION update_property_location(BIGINT, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_property_location(BIGINT, DOUBLE PRECISION, DOUBLE PRECISION) FROM anon;
GRANT EXECUTE ON FUNCTION update_property_location(BIGINT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Read RPC: authenticated only
REVOKE ALL ON FUNCTION get_property_with_location(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_property_with_location(BIGINT) FROM anon;
GRANT EXECUTE ON FUNCTION get_property_with_location(BIGINT) TO authenticated;
