-- ═══════════════════════════════════════════════════════════════════════════
-- TABLA novedades
-- ═══════════════════════════════════════════════════════════════════════════
-- Mensajes asincrónicos entre socios para casos donde no se pueden
-- comunicar en vivo. Visible para los 3 roles sin distinción.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.novedades (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contenido   text NOT NULL CHECK (length(contenido) BETWEEN 1 AND 280),
  autor_id    uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  vista_por   uuid[] NOT NULL DEFAULT '{}'::uuid[],
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_novedades_creado_en_desc ON public.novedades (creado_en DESC);
CREATE INDEX idx_novedades_autor_id        ON public.novedades (autor_id);

-- RLS · todos los autenticados pueden ver y crear; updates abiertos para
-- soportar el toggle de vista_por.
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "novedades_select_authenticated"
  ON public.novedades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "novedades_insert_own"
  ON public.novedades FOR INSERT
  TO authenticated
  WITH CHECK (autor_id = auth.uid());

CREATE POLICY "novedades_update_vista_por"
  ON public.novedades FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed inicial · 3 novedades demo
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.novedades (contenido, autor_id, vista_por, creado_en)
SELECT
  'El dueño de Cabildo 2840 quiere subir el precio publicado. Llamarlo el lunes para conversar.',
  (SELECT id FROM public.usuarios WHERE rol = 'socio_operativo' LIMIT 1),
  ARRAY[(SELECT id FROM public.usuarios WHERE rol = 'socia_titular' LIMIT 1)]::uuid[],
  now() - interval '2 hours';

INSERT INTO public.novedades (contenido, autor_id, vista_por, creado_en)
SELECT
  'Reagendé la visita de Holmberg con María González. Confirmar el jueves antes de las 18.',
  (SELECT id FROM public.usuarios WHERE rol = 'socia_titular' LIMIT 1),
  ARRAY[
    (SELECT id FROM public.usuarios WHERE rol = 'socio_operativo' LIMIT 1),
    (SELECT id FROM public.usuarios WHERE rol = 'administrativa' LIMIT 1)
  ]::uuid[],
  now() - interval '1 day';

INSERT INTO public.novedades (contenido, autor_id, vista_por, creado_en)
SELECT
  'El contador pidió el cierre del mes para el viernes. Necesito los comprobantes de comisiones de mayo.',
  (SELECT id FROM public.usuarios WHERE rol = 'administrativa' LIMIT 1),
  ARRAY[
    (SELECT id FROM public.usuarios WHERE rol = 'socia_titular' LIMIT 1),
    (SELECT id FROM public.usuarios WHERE rol = 'socio_operativo' LIMIT 1)
  ]::uuid[],
  now() - interval '3 days';
