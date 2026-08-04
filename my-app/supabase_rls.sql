-- =============================================================================
-- GARDET Propiedades — Row Level Security & Storage policies
-- =============================================================================
-- IMPORTANT: You cannot apply RLS from the app repo alone.
-- Run this entire script in the Supabase SQL Editor, then VERIFY live:
--   Dashboard → Authentication / Table Editor → each table shows RLS enabled
--   Dashboard → Storage → bucket "propiedades" → policies match below
--
-- Assumed RLS was missing in-repo; apply before relying on the anon key in production.
-- Storage bucket name used by the app: "propiedades" (see PropertyForm uploads).
-- Also run the updated supabase_functions.sql (ownership-checked RPCs).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propiedades_imagenes ENABLE ROW LEVEL SECURITY;

-- Public can only read published properties
DROP POLICY IF EXISTS "Public can read published properties" ON public.propiedades;
CREATE POLICY "Public can read published properties"
  ON public.propiedades
  FOR SELECT
  USING (estado = 'publicada');

-- Owners can read their own (including drafts)
DROP POLICY IF EXISTS "Owners can read own properties" ON public.propiedades;
CREATE POLICY "Owners can read own properties"
  ON public.propiedades
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can insert own properties" ON public.propiedades;
CREATE POLICY "Owners can insert own properties"
  ON public.propiedades
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update own properties" ON public.propiedades;
CREATE POLICY "Owners can update own properties"
  ON public.propiedades
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can delete own properties" ON public.propiedades;
CREATE POLICY "Owners can delete own properties"
  ON public.propiedades
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Images: public read only when parent property is publicada
DROP POLICY IF EXISTS "Public can read images of published properties" ON public.propiedades_imagenes;
CREATE POLICY "Public can read images of published properties"
  ON public.propiedades_imagenes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.propiedades p
      WHERE p.id = propiedades_imagenes.propiedad_id
        AND p.estado = 'publicada'
    )
  );

DROP POLICY IF EXISTS "Owners can read images of own properties" ON public.propiedades_imagenes;
CREATE POLICY "Owners can read images of own properties"
  ON public.propiedades_imagenes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.propiedades p
      WHERE p.id = propiedades_imagenes.propiedad_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can insert images for own properties" ON public.propiedades_imagenes;
CREATE POLICY "Owners can insert images for own properties"
  ON public.propiedades_imagenes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.propiedades p
      WHERE p.id = propiedades_imagenes.propiedad_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update images for own properties" ON public.propiedades_imagenes;
CREATE POLICY "Owners can update images for own properties"
  ON public.propiedades_imagenes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.propiedades p
      WHERE p.id = propiedades_imagenes.propiedad_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.propiedades p
      WHERE p.id = propiedades_imagenes.propiedad_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete images for own properties" ON public.propiedades_imagenes;
CREATE POLICY "Owners can delete images for own properties"
  ON public.propiedades_imagenes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.propiedades p
      WHERE p.id = propiedades_imagenes.propiedad_id
        AND p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Lookup / catalog tables (public read for filters & forms)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tipos_propiedad') THEN
    EXECUTE 'ALTER TABLE public.tipos_propiedad ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read property types" ON public.tipos_propiedad';
    EXECUTE 'CREATE POLICY "Anyone can read property types" ON public.tipos_propiedad FOR SELECT USING (true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tipos_operacion') THEN
    EXECUTE 'ALTER TABLE public.tipos_operacion ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read operation types" ON public.tipos_operacion';
    EXECUTE 'CREATE POLICY "Anyone can read operation types" ON public.tipos_operacion FOR SELECT USING (true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'regiones') THEN
    EXECUTE 'ALTER TABLE public.regiones ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read regions" ON public.regiones';
    EXECUTE 'CREATE POLICY "Anyone can read regions" ON public.regiones FOR SELECT USING (true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comunas') THEN
    EXECUTE 'ALTER TABLE public.comunas ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read comunas" ON public.comunas';
    EXECUTE 'CREATE POLICY "Anyone can read comunas" ON public.comunas FOR SELECT USING (true)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Storage bucket: propiedades
-- Create the bucket if missing (public read for published listing images).
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('propiedades', 'propiedades', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can read property images" ON storage.objects;
CREATE POLICY "Public can read property images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'propiedades');

DROP POLICY IF EXISTS "Authenticated can upload property images" ON storage.objects;
CREATE POLICY "Authenticated can upload property images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'propiedades');

DROP POLICY IF EXISTS "Authenticated can update own property images" ON storage.objects;
CREATE POLICY "Authenticated can update own property images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'propiedades')
  WITH CHECK (bucket_id = 'propiedades');

DROP POLICY IF EXISTS "Authenticated can delete property images" ON storage.objects;
CREATE POLICY "Authenticated can delete property images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'propiedades');
