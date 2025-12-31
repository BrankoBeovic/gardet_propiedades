-- Functions for PostGIS location handling
-- Run these in your Supabase SQL Editor

-- Function to update property location
CREATE OR REPLACE FUNCTION update_property_location(
    property_id BIGINT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE propiedades
    SET ubicacion = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    WHERE id = property_id;
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
SECURITY DEFINER
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
    WHERE p.id = property_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_property_location TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_with_location TO anon, authenticated;
