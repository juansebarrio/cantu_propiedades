-- ═══════════════════════════════════════════════════════════════════════════
-- CANTÚ PROPIEDADES · SETUP COMPLETO PARA SUPABASE CLOUD
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cómo usar:
--   1. Ir al dashboard del proyecto en supabase.com
--   2. Sidebar → SQL Editor
--   3. Click en "+ New query"
--   4. Pegar TODO este archivo
--   5. Click en "Run" (botón abajo a la derecha, o Cmd+Enter)
--   6. Esperar ~10-30 segundos
--   7. Verificar las queries del final del archivo (deberían devolver counts > 0)
--
-- Generado: 2026-05-20
-- Repo: github.com/juansebarrio/cantu_propiedades
--
-- Extensiones requeridas (Supabase Cloud las trae preinstaladas):
--   - pgcrypto · usada por gen_random_uuid() y crypt() en el seed
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · SCHEMA · tablas, indices, funciones, triggers, RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── desde supabase/migrations/20260520192607_schema_inicial.sql ───

-- ════════════════════════════════════════════════════════════════════
-- Cantú Propiedades · Schema inicial
-- Generado a partir de docs/modelo-datos.md v0.2
-- ════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────────

CREATE TYPE rol_usuario AS ENUM (
  'socia_titular',
  'socio_operativo',
  'administrativa'
);

CREATE TYPE canal_contacto_dueno AS ENUM (
  'mail',
  'whatsapp_pdf',
  'llamada',
  'no_contactar'
);

CREATE TYPE frecuencia_reporte AS ENUM (
  'mensual',
  'trimestral',
  'on_demand',
  'ninguna'
);

CREATE TYPE tipo_propiedad AS ENUM (
  'depto',
  'casa',
  'ph',
  'local',
  'oficina',
  'cochera',
  'terreno'
);

CREATE TYPE operacion AS ENUM (
  'alquiler',
  'venta',
  'temporada'
);

CREATE TYPE estado_propiedad AS ENUM (
  'captada',
  'publicada',
  'con_visitas',
  'con_oferta',
  'reservada',
  'cerrada',
  'pausada',
  'archivada'
);

CREATE TYPE moneda AS ENUM (
  'ars',
  'usd'
);

CREATE TYPE portal AS ENUM (
  'zonaprop',
  'argenprop',
  'mercadolibre',
  'soloduenos',
  'fb_marketplace',
  'wsp_inmobiliarias_coghlan'
);

CREATE TYPE estado_en_portal AS ENUM (
  'publicada',
  'pausada',
  'vencida',
  'no_publicada'
);

CREATE TYPE canal_origen_lead AS ENUM (
  'whatsapp_oficina',
  'whatsapp_zulma',
  'whatsapp_martin',
  'mail',
  'formulario_web',
  'zonaprop',
  'argenprop',
  'mercadolibre',
  'soloduenos',
  'fb_marketplace',
  'referido_zulma',
  'wsp_inmobiliarias_coghlan',
  'otro'
);

CREATE TYPE estado_lead AS ENUM (
  'nuevo',
  'contactado',
  'con_visita',
  'con_oferta',
  'sin_interes',
  'cerrado_exitoso',
  'archivado'
);

CREATE TYPE estado_visita AS ENUM (
  'agendada',
  'confirmada',
  'realizada',
  'cancelada',
  'no_asistio'
);

CREATE TYPE tipo_comunicacion AS ENUM (
  'whatsapp_entrante',
  'whatsapp_saliente',
  'mail_entrante',
  'mail_saliente',
  'llamada',
  'nota_interna'
);

CREATE TYPE estado_reporte AS ENUM (
  'borrador',
  'listo_para_enviar',
  'enviado',
  'no_enviar',
  'fallido'
);

-- ──────────────────────────────────────────────────────────────────
-- TRIGGER GENÉRICO PARA actualizado_en
-- ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────
-- TABLA: usuarios
-- Perfil extendido de los usuarios autenticados de Supabase
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rol rol_usuario NOT NULL,
  email text NOT NULL UNIQUE,
  telefono text,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- Restricción: solo puede haber UN socio titular (Zulma)
CREATE UNIQUE INDEX idx_unico_socio_titular
  ON usuarios(rol)
  WHERE rol = 'socia_titular' AND activo = true;

-- ──────────────────────────────────────────────────────────────────
-- TABLA: duenos
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE duenos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text,
  telefono text,
  canal_preferido canal_contacto_dueno NOT NULL DEFAULT 'mail',
  frecuencia_reporte frecuencia_reporte NOT NULL DEFAULT 'mensual',
  en_grupo_whatsapp boolean NOT NULL DEFAULT false,
  notas_internas text,
  confidencial boolean NOT NULL DEFAULT false,
  acuerdo_especial text,
  creado_por_id uuid REFERENCES usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_duenos_telefono ON duenos(telefono);
CREATE INDEX idx_duenos_email ON duenos(email);
CREATE INDEX idx_duenos_confidencial ON duenos(confidencial) WHERE confidencial = true;

CREATE TRIGGER trg_duenos_actualizado_en
  BEFORE UPDATE ON duenos
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ──────────────────────────────────────────────────────────────────
-- TABLA: propiedades
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE propiedades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direccion text NOT NULL,
  tipo tipo_propiedad NOT NULL,
  operacion operacion NOT NULL,
  estado estado_propiedad NOT NULL DEFAULT 'captada',
  precio_actual numeric(14, 2),
  moneda moneda NOT NULL DEFAULT 'usd',
  dueno_id uuid NOT NULL REFERENCES duenos(id) ON DELETE RESTRICT,
  descripcion_comercial text,
  fotos jsonb NOT NULL DEFAULT '[]'::jsonb,
  fecha_captacion date NOT NULL DEFAULT CURRENT_DATE,
  confidencial boolean NOT NULL DEFAULT false,
  notas_internas text,
  creado_por_id uuid REFERENCES usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_propiedades_estado ON propiedades(estado);
CREATE INDEX idx_propiedades_dueno ON propiedades(dueno_id);
CREATE INDEX idx_propiedades_operacion ON propiedades(operacion);
CREATE INDEX idx_propiedades_fecha_captacion ON propiedades(fecha_captacion);

CREATE TRIGGER trg_propiedades_actualizado_en
  BEFORE UPDATE ON propiedades
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ──────────────────────────────────────────────────────────────────
-- TABLA: portales_propiedad
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE portales_propiedad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id uuid NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  portal portal NOT NULL,
  estado_en_portal estado_en_portal NOT NULL DEFAULT 'no_publicada',
  url_publicacion text,
  fecha_publicacion date,
  notas text,
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE(propiedad_id, portal)
);

CREATE INDEX idx_portales_propiedad ON portales_propiedad(propiedad_id);

CREATE TRIGGER trg_portales_actualizado_en
  BEFORE UPDATE ON portales_propiedad
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ──────────────────────────────────────────────────────────────────
-- TABLA: leads
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text,
  email text,
  propiedad_id uuid REFERENCES propiedades(id) ON DELETE SET NULL,
  canal_origen canal_origen_lead NOT NULL,
  referido_por_dueno_id uuid REFERENCES duenos(id) ON DELETE SET NULL,
  estado estado_lead NOT NULL DEFAULT 'nuevo',
  responsable_id uuid REFERENCES usuarios(id),
  proxima_accion text,
  fecha_proxima_accion timestamptz,
  notas_internas text,
  criterio_busqueda jsonb,
  creado_por_id uuid REFERENCES usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_referido_solo_si_zulma
    CHECK (
      (canal_origen = 'referido_zulma' AND referido_por_dueno_id IS NOT NULL)
      OR canal_origen != 'referido_zulma'
    )
);

CREATE INDEX idx_leads_telefono ON leads(telefono);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_propiedad ON leads(propiedad_id);
CREATE INDEX idx_leads_canal ON leads(canal_origen);

CREATE TRIGGER trg_leads_actualizado_en
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ──────────────────────────────────────────────────────────────────
-- TABLA: consultas_lead
-- Cada vez que un lead consulta por una propiedad
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE consultas_lead (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  propiedad_id uuid NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  fecha timestamptz NOT NULL DEFAULT now(),
  canal_origen canal_origen_lead NOT NULL,
  notas text,
  creado_por_id uuid REFERENCES usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultas_lead ON consultas_lead(lead_id);
CREATE INDEX idx_consultas_propiedad ON consultas_lead(propiedad_id);
CREATE INDEX idx_consultas_fecha ON consultas_lead(fecha DESC);

-- ──────────────────────────────────────────────────────────────────
-- TABLA: visitas
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE visitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  propiedad_id uuid NOT NULL REFERENCES propiedades(id) ON DELETE RESTRICT,
  responsable_id uuid REFERENCES usuarios(id),
  fecha_agendada timestamptz NOT NULL,
  estado estado_visita NOT NULL DEFAULT 'agendada',
  confirmacion_enviada_en timestamptz,
  confirmacion_respondida_en timestamptz,
  devolucion_prospecto text,
  devolucion_cargada_por_id uuid REFERENCES usuarios(id),
  devolucion_audio_url text,
  notas text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_visitas_fecha ON visitas(fecha_agendada);
CREATE INDEX idx_visitas_estado ON visitas(estado);
CREATE INDEX idx_visitas_propiedad ON visitas(propiedad_id);
CREATE INDEX idx_visitas_lead ON visitas(lead_id);

CREATE TRIGGER trg_visitas_actualizado_en
  BEFORE UPDATE ON visitas
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ──────────────────────────────────────────────────────────────────
-- TABLA: comunicaciones
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE comunicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_comunicacion NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  dueno_id uuid REFERENCES duenos(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  registrada_por_id uuid REFERENCES usuarios(id),
  CONSTRAINT chk_lead_o_dueno
    CHECK (
      (lead_id IS NOT NULL AND dueno_id IS NULL)
      OR (lead_id IS NULL AND dueno_id IS NOT NULL)
    )
);

CREATE INDEX idx_comunicaciones_lead ON comunicaciones(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_comunicaciones_dueno ON comunicaciones(dueno_id) WHERE dueno_id IS NOT NULL;
CREATE INDEX idx_comunicaciones_fecha ON comunicaciones(fecha DESC);

-- ──────────────────────────────────────────────────────────────────
-- TABLA: reportes_mensuales
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE reportes_mensuales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id uuid NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  dueno_id uuid NOT NULL REFERENCES duenos(id) ON DELETE CASCADE,
  periodo date NOT NULL,
  estado estado_reporte NOT NULL DEFAULT 'borrador',
  nota_personalizada text,
  pdf_url text,
  canal_envio canal_contacto_dueno,
  enviado_a text,
  enviado_en timestamptz,
  error_envio text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE(propiedad_id, periodo)
);

CREATE INDEX idx_reportes_periodo ON reportes_mensuales(periodo);
CREATE INDEX idx_reportes_estado ON reportes_mensuales(estado);
CREATE INDEX idx_reportes_dueno ON reportes_mensuales(dueno_id);

CREATE TRIGGER trg_reportes_actualizado_en
  BEFORE UPDATE ON reportes_mensuales
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ──────────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS · usadas por las RLS policies
-- ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rol_actual()
RETURNS rol_usuario
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid() AND activo = true
$$;

CREATE OR REPLACE FUNCTION es_socia_titular()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
      AND rol = 'socia_titular'
      AND activo = true
  )
$$;

CREATE OR REPLACE FUNCTION es_socio()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
      AND rol IN ('socia_titular', 'socio_operativo')
      AND activo = true
  )
$$;

CREATE OR REPLACE FUNCTION es_usuario_activo()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND activo = true
  )
$$;


-- ─── desde supabase/migrations/20260520192608_rls_policies.sql ───

-- ════════════════════════════════════════════════════════════════════
-- Cantú Propiedades · Row-Level Security Policies
-- ════════════════════════════════════════════════════════════════════

-- Activar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE duenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE portales_propiedad ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_mensuales ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────
-- USUARIOS
-- Todos los usuarios activos se ven entre sí (es un equipo de 3)
-- Solo socia titular puede modificar roles
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY usuarios_select ON usuarios
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY usuarios_update_propio ON usuarios
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND rol = (SELECT rol FROM usuarios WHERE id = auth.uid()));

CREATE POLICY usuarios_update_socia ON usuarios
  FOR UPDATE USING (es_socia_titular());

CREATE POLICY usuarios_insert_socia ON usuarios
  FOR INSERT WITH CHECK (es_socia_titular());

-- ──────────────────────────────────────────────────────────────────
-- DUENOS
-- Todos los usuarios activos ven los dueños (las restricciones por
-- columna se manejan a nivel app, no a nivel fila)
-- Solo socios pueden modificar o crear dueños
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY duenos_select ON duenos
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY duenos_insert ON duenos
  FOR INSERT WITH CHECK (es_socio());

CREATE POLICY duenos_update ON duenos
  FOR UPDATE USING (es_socio());

CREATE POLICY duenos_delete ON duenos
  FOR DELETE USING (es_socia_titular());

-- ──────────────────────────────────────────────────────────────────
-- PROPIEDADES
-- Mismo patrón que duenos
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY propiedades_select ON propiedades
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY propiedades_insert ON propiedades
  FOR INSERT WITH CHECK (es_socio());

CREATE POLICY propiedades_update ON propiedades
  FOR UPDATE USING (es_socio());

CREATE POLICY propiedades_delete ON propiedades
  FOR DELETE USING (es_socia_titular());

-- ──────────────────────────────────────────────────────────────────
-- PORTALES_PROPIEDAD
-- Cualquier usuario activo puede leer
-- Cualquier usuario activo puede insertar/actualizar (Carolina sube
-- propiedades a portales en su día a día)
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY portales_select ON portales_propiedad
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY portales_insert ON portales_propiedad
  FOR INSERT WITH CHECK (es_usuario_activo());

CREATE POLICY portales_update ON portales_propiedad
  FOR UPDATE USING (es_usuario_activo());

CREATE POLICY portales_delete ON portales_propiedad
  FOR DELETE USING (es_socio());

-- ──────────────────────────────────────────────────────────────────
-- LEADS
-- Todos los usuarios pueden leer y crear leads
-- Eliminación solo socia titular
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY leads_select ON leads
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY leads_insert ON leads
  FOR INSERT WITH CHECK (es_usuario_activo());

CREATE POLICY leads_update ON leads
  FOR UPDATE USING (es_usuario_activo());

CREATE POLICY leads_delete ON leads
  FOR DELETE USING (es_socia_titular());

-- ──────────────────────────────────────────────────────────────────
-- CONSULTAS_LEAD
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY consultas_select ON consultas_lead
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY consultas_insert ON consultas_lead
  FOR INSERT WITH CHECK (es_usuario_activo());

CREATE POLICY consultas_update ON consultas_lead
  FOR UPDATE USING (es_usuario_activo());

CREATE POLICY consultas_delete ON consultas_lead
  FOR DELETE USING (es_socio());

-- ──────────────────────────────────────────────────────────────────
-- VISITAS
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY visitas_select ON visitas
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY visitas_insert ON visitas
  FOR INSERT WITH CHECK (es_usuario_activo());

CREATE POLICY visitas_update ON visitas
  FOR UPDATE USING (es_usuario_activo());

CREATE POLICY visitas_delete ON visitas
  FOR DELETE USING (es_socio());

-- ──────────────────────────────────────────────────────────────────
-- COMUNICACIONES
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY comunicaciones_select ON comunicaciones
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY comunicaciones_insert ON comunicaciones
  FOR INSERT WITH CHECK (es_usuario_activo());

CREATE POLICY comunicaciones_update ON comunicaciones
  FOR UPDATE USING (es_usuario_activo() AND registrada_por_id = auth.uid());

CREATE POLICY comunicaciones_delete ON comunicaciones
  FOR DELETE USING (es_socia_titular());

-- ──────────────────────────────────────────────────────────────────
-- REPORTES_MENSUALES
-- Lectura: todos
-- Solo Zulma puede editar nota_personalizada y aprobar envío
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY reportes_select ON reportes_mensuales
  FOR SELECT USING (es_usuario_activo());

CREATE POLICY reportes_insert ON reportes_mensuales
  FOR INSERT WITH CHECK (es_usuario_activo());

CREATE POLICY reportes_update_socia ON reportes_mensuales
  FOR UPDATE USING (es_socia_titular());

CREATE POLICY reportes_update_socio ON reportes_mensuales
  FOR UPDATE USING (es_socio() AND estado IN ('borrador', 'fallido'));

CREATE POLICY reportes_delete ON reportes_mensuales
  FOR DELETE USING (es_socia_titular());

-- ─── desde supabase/migrations/20260521150000_novedades.sql ───

-- ════════════════════════════════════════════════════════════════════
-- TABLA novedades · mensajes asincrónicos entre socios
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE public.novedades (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contenido   text NOT NULL CHECK (length(contenido) BETWEEN 1 AND 280),
  autor_id    uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  vista_por   uuid[] NOT NULL DEFAULT '{}'::uuid[],
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_novedades_creado_en_desc ON public.novedades (creado_en DESC);
CREATE INDEX idx_novedades_autor_id        ON public.novedades (autor_id);

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
-- SECCIÓN 2 · SEED · usuarios (auth.users + identities) + datos demo
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── desde supabase/seed.sql ───

-- ════════════════════════════════════════════════════════════════════
-- Cantú Propiedades · Seed de desarrollo
-- Datos basados en los personajes del discovery (docs/discovery.md)
-- NO correr en producción
-- ════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- USUARIOS DE PRUEBA
-- Notar: estos UUIDs deben coincidir con usuarios creados en auth.users
-- En desarrollo local, los creamos abajo en auth.users primero
-- ──────────────────────────────────────────────────────────────────

-- Crear los usuarios de auth (solo en local · en prod los crea Supabase Auth).
-- Importante: GoTrue espera '' (string vacío) en varias columnas de texto, NO NULL,
-- y requiere fila en auth.identities por provider · sin eso, signInWithPassword
-- falla con "Database error querying schema".
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  reauthentication_token, phone_change, phone_change_token,
  is_super_admin, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'zulma@cantu.local',    crypt('zulma123',    gen_salt('bf')), now(), '{"nombre":"Zulma Cantú"}',     '{"provider":"email","providers":["email"]}', '', '', '', '', '', '', '', '', false, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'martin@cantu.local',   crypt('martin123',   gen_salt('bf')), now(), '{"nombre":"Martín Larrea"}',  '{"provider":"email","providers":["email"]}', '', '', '', '', '', '', '', '', false, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'carolina@cantu.local', crypt('carolina123', gen_salt('bf')), now(), '{"nombre":"Carolina Méndez"}', '{"provider":"email","providers":["email"]}', '', '', '', '', '', '', '', '', false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Identidad email por cada usuario (requerido por GoTrue para password login)
INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  'email',
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
FROM auth.users u
WHERE u.email IN ('zulma@cantu.local', 'martin@cantu.local', 'carolina@cantu.local')
ON CONFLICT DO NOTHING;

-- Perfiles
INSERT INTO usuarios (id, nombre, rol, email, telefono) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Zulma Cantú', 'socia_titular', 'zulma@cantu.local', '+5491145678901'),
  ('22222222-2222-2222-2222-222222222222', 'Martín Larrea', 'socio_operativo', 'martin@cantu.local', '+5491145678902'),
  ('33333333-3333-3333-3333-333333333333', 'Carolina Méndez', 'administrativa', 'carolina@cantu.local', '+5491145678903');

-- ──────────────────────────────────────────────────────────────────
-- DUEÑOS
-- ──────────────────────────────────────────────────────────────────

INSERT INTO duenos (id, nombre, email, telefono, canal_preferido, frecuencia_reporte, en_grupo_whatsapp, notas_internas, confidencial, acuerdo_especial, creado_por_id) VALUES
  ('aaaaaaaa-0001-0000-0000-000000000001', 'Mariana Rodríguez', 'mariana.r@gmail.com', '+5491133224455', 'mail', 'mensual', true, 'Cliente desde 2018. Tiene dos deptos.', false, NULL, '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0001-0000-0000-000000000002', 'Roberto Saggese', 'roberto.s@hotmail.com', '+5491155667788', 'whatsapp_pdf', 'mensual', true, 'Abogado. Quiere todo en orden.', false, NULL, '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0001-0000-0000-000000000003', 'Familia Pérez', NULL, '+5491166778899', 'llamada', 'trimestral', false, 'Padres mayores, no usan mail. Se contactan por teléfono fijo.', false, NULL, '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0001-0000-0000-000000000004', 'Don Eduardo Vázquez', NULL, '+5491177889900', 'llamada', 'on_demand', false, 'Dueño histórico desde 2010. Le manda audios a Zulma. Trato cercano.', true, 'Comisión reducida al 2.5% por antigüedad. Atención prioritaria de Zulma personalmente.', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0001-0000-0000-000000000005', 'Inés Maldonado', 'ines.m@gmail.com', '+5491122334455', 'mail', 'mensual', true, NULL, false, NULL, '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0001-0000-0000-000000000006', 'Sucesión Gómez Iturri', 'admin.gomez@estudio.com.ar', '+5491198765432', 'mail', 'mensual', false, 'Sucesión gestionada por el estudio jurídico. Contacto vía Dra. Iturri.', true, 'Cuatro hermanos, decisiones por unanimidad. Solo Zulma maneja la comunicación.', '11111111-1111-1111-1111-111111111111');

-- ──────────────────────────────────────────────────────────────────
-- PROPIEDADES
-- ──────────────────────────────────────────────────────────────────

INSERT INTO propiedades (id, direccion, tipo, operacion, estado, precio_actual, moneda, dueno_id, descripcion_comercial, fecha_captacion, creado_por_id) VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', 'Av. Congreso 3400 5° B, Coghlan', 'depto', 'alquiler', 'publicada', 380000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000001', 'Hermoso 2 ambientes a estrenar, balcón a la calle, cocina integrada.', '2026-04-15', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-0001-0000-0000-000000000002', 'Estomba 1547 3° A, Villa Urquiza', 'depto', 'venta', 'con_visitas', 165000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000002', '3 ambientes amplios, dependencia, cochera fija, mucho sol.', '2026-03-01', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-0001-0000-0000-000000000003', 'Olazábal 5234 PB, Villa Urquiza', 'ph', 'venta', 'con_oferta', 280000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000003', 'PH al frente, patio, parrilla, dos plantas. Refaccionado a nuevo.', '2026-02-10', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-0001-0000-0000-000000000004', 'Tronador 2890 8° C, Parque Chas', 'depto', 'alquiler', 'publicada', 320000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000001', 'Monoambiente luminoso, balcón con vista despejada.', '2026-05-05', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-0001-0000-0000-000000000005', 'Av. Triunvirato 4520 12° A, Coghlan', 'depto', 'venta', 'publicada', 195000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000004', 'Cuatro ambientes con dependencia, vista panorámica, edificio con amenities.', '2026-01-20', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0001-0000-0000-000000000006', 'Pampa 2389 PB, Villa Urquiza', 'casa', 'venta', 'captada', 420000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000006', 'Casa chorizo en lote propio, tres dormitorios, garage, jardín.', '2026-05-12', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0001-0000-0000-000000000007', 'Plaza 4100 2° B, Coghlan', 'depto', 'alquiler', 'publicada', 295000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000005', 'Dos ambientes amplios, balcón francés, cocina equipada.', '2026-04-28', '22222222-2222-2222-2222-222222222222');

-- Marcar como confidencial las propiedades de dueños confidenciales
UPDATE propiedades SET confidencial = true
WHERE dueno_id IN (
  SELECT id FROM duenos WHERE confidencial = true
);

-- ──────────────────────────────────────────────────────────────────
-- PORTALES
-- ──────────────────────────────────────────────────────────────────

INSERT INTO portales_propiedad (propiedad_id, portal, estado_en_portal, url_publicacion, fecha_publicacion) VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', 'zonaprop', 'publicada', 'https://zonaprop.com.ar/prop-1', '2026-04-16'),
  ('bbbbbbbb-0001-0000-0000-000000000001', 'argenprop', 'publicada', 'https://argenprop.com/prop-1', '2026-04-16'),
  ('bbbbbbbb-0001-0000-0000-000000000002', 'zonaprop', 'publicada', 'https://zonaprop.com.ar/prop-2', '2026-03-02'),
  ('bbbbbbbb-0001-0000-0000-000000000002', 'mercadolibre', 'publicada', 'https://inmuebles.mercadolibre.com.ar/prop-2', '2026-03-02'),
  ('bbbbbbbb-0001-0000-0000-000000000003', 'zonaprop', 'pausada', NULL, '2026-02-11'),
  ('bbbbbbbb-0001-0000-0000-000000000004', 'zonaprop', 'publicada', 'https://zonaprop.com.ar/prop-4', '2026-05-06'),
  ('bbbbbbbb-0001-0000-0000-000000000004', 'soloduenos', 'publicada', 'https://soloduenos.com.ar/prop-4', '2026-05-06'),
  ('bbbbbbbb-0001-0000-0000-000000000007', 'zonaprop', 'publicada', 'https://zonaprop.com.ar/prop-7', '2026-04-29');

-- ──────────────────────────────────────────────────────────────────
-- LEADS
-- Incluye un referido_zulma y un lead duplicado (mismo teléfono)
-- ──────────────────────────────────────────────────────────────────

INSERT INTO leads (id, nombre, telefono, email, propiedad_id, canal_origen, referido_por_dueno_id, estado, responsable_id, proxima_accion, fecha_proxima_accion, creado_por_id) VALUES
  ('cccccccc-0001-0000-0000-000000000001', 'Lucía Fernández', '+5491155112233', 'lucia.f@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000001', 'zonaprop', NULL, 'con_visita', '22222222-2222-2222-2222-222222222222', 'Coordinar visita el sábado', '2026-05-24 11:00', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-0001-0000-0000-000000000002', 'Diego Marini', '+5491166998877', 'diego.marini@yahoo.com', 'bbbbbbbb-0001-0000-0000-000000000002', 'whatsapp_oficina', NULL, 'contactado', '22222222-2222-2222-2222-222222222222', 'Mandarle ficha técnica', '2026-05-22 10:00', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-0001-0000-0000-000000000003', 'Ariel Sobrino (sobrino de Inés)', '+5491144556677', 'ariel.s@gmail.com', NULL, 'referido_zulma', 'aaaaaaaa-0001-0000-0000-000000000005', 'nuevo', '11111111-1111-1111-1111-111111111111', 'Llamar para entender criterios de búsqueda', '2026-05-21 16:00', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-0001-0000-0000-000000000004', 'Pareja Castro-Núñez', '+5491133445566', 'castro.nunez@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000003', 'argenprop', NULL, 'con_oferta', '22222222-2222-2222-2222-222222222222', 'Esperando contraoferta del dueño', '2026-05-23 09:00', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-0001-0000-0000-000000000005', 'Lucía Fernández', '+5491155112233', 'lucia.f@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000004', 'zonaprop', NULL, 'nuevo', '22222222-2222-2222-2222-222222222222', 'Detectado como posible duplicado de lead 001', '2026-05-21 14:00', '33333333-3333-3333-3333-333333333333');

-- Criterio de búsqueda del referido (sin propiedad asignada)
UPDATE leads SET criterio_busqueda = '{"zona":["Villa Urquiza","Coghlan"],"tipo":"depto","ambientes":2,"presupuesto_max":150000,"moneda":"usd","operacion":"venta"}'::jsonb
WHERE id = 'cccccccc-0001-0000-0000-000000000003';

-- ──────────────────────────────────────────────────────────────────
-- CONSULTAS_LEAD (historial cross-propiedad)
-- ──────────────────────────────────────────────────────────────────

INSERT INTO consultas_lead (lead_id, propiedad_id, fecha, canal_origen, notas, creado_por_id) VALUES
  ('cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', '2026-05-15 10:30', 'zonaprop', 'Primera consulta · pidió ficha', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000004', '2026-05-20 14:00', 'zonaprop', 'Segunda consulta · ahora interesada en el monoambiente', '33333333-3333-3333-3333-333333333333');

-- ──────────────────────────────────────────────────────────────────
-- VISITAS
-- ──────────────────────────────────────────────────────────────────

INSERT INTO visitas (id, lead_id, propiedad_id, responsable_id, fecha_agendada, estado, devolucion_prospecto, devolucion_cargada_por_id) VALUES
  ('dddddddd-0001-0000-0000-000000000001', 'cccccccc-0001-0000-0000-000000000002', 'bbbbbbbb-0001-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-05-18 16:00', 'realizada', 'Le gustó mucho la luminosidad y la cocina. Le preocupa el ruido del frente. Va a hablar con la esposa y nos confirma el viernes.', '33333333-3333-3333-3333-333333333333'),
  ('dddddddd-0001-0000-0000-000000000002', 'cccccccc-0001-0000-0000-000000000004', 'bbbbbbbb-0001-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '2026-05-17 11:00', 'realizada', 'Pareja muy entusiasmada con el patio. Ofrecieron USD 265.000 (dueño pide 280k). Quedaron en pensar contraoferta.', '33333333-3333-3333-3333-333333333333'),
  ('dddddddd-0001-0000-0000-000000000003', 'cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '2026-05-24 11:00', 'agendada', NULL, NULL);

-- ──────────────────────────────────────────────────────────────────
-- COMUNICACIONES
-- ──────────────────────────────────────────────────────────────────

INSERT INTO comunicaciones (tipo, lead_id, contenido, fecha, registrada_por_id) VALUES
  ('whatsapp_entrante', 'cccccccc-0001-0000-0000-000000000001', 'Hola! Vi el depto de Av. Congreso, ¿lo puedo visitar este finde?', '2026-05-15 10:30', '33333333-3333-3333-3333-333333333333'),
  ('whatsapp_saliente', 'cccccccc-0001-0000-0000-000000000001', 'Hola Lucía! Sí, te paso opciones. ¿Sábado a las 11?', '2026-05-15 10:45', '33333333-3333-3333-3333-333333333333'),
  ('llamada', 'cccccccc-0001-0000-0000-000000000003', 'Llamada inicial. Sobrino de Inés. Busca dos amb en Villa Urquiza, hasta USD 150k. Pidió que le mande opciones por mail.', '2026-05-20 16:30', '11111111-1111-1111-1111-111111111111');

INSERT INTO comunicaciones (tipo, dueno_id, contenido, fecha, registrada_por_id) VALUES
  ('llamada', 'aaaaaaaa-0001-0000-0000-000000000004', 'Don Eduardo llamó para preguntar por el depto de Av. Triunvirato. Le confirmé que hubo 4 consultas esta semana, ninguna concretó visita aún. Quedó tranquilo.', '2026-05-19 11:00', '11111111-1111-1111-1111-111111111111'),
  ('mail_saliente', 'aaaaaaaa-0001-0000-0000-000000000001', 'Mariana, te paso el resumen del mes. Las dos propiedades tuvieron buen movimiento, sobre todo el de Congreso.', '2026-05-01 09:00', '11111111-1111-1111-1111-111111111111');

-- ──────────────────────────────────────────────────────────────────
-- REPORTES MENSUALES (borradores de abril)
-- ──────────────────────────────────────────────────────────────────

INSERT INTO reportes_mensuales (propiedad_id, dueno_id, periodo, estado, nota_personalizada, canal_envio) VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', '2026-04-01', 'enviado', 'Mariana, gran mes. Hay interés concreto en el de Av. Congreso, te llamo esta semana para conversar.', 'mail'),
  ('bbbbbbbb-0001-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000002', '2026-04-01', 'enviado', 'Roberto, seguimos con buen flujo de consultas. La cocina chica sigue siendo el principal objection. ¿Lo conversamos?', 'whatsapp_pdf'),
  ('bbbbbbbb-0001-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000004', '2026-04-01', 'no_enviar', NULL, 'llamada');

-- ──────────────────────────────────────────────────────────────────
-- NOVEDADES (tablón de mensajes asincrónicos entre socios)
-- ──────────────────────────────────────────────────────────────────

INSERT INTO novedades (contenido, autor_id, vista_por, creado_en) VALUES
  ('El dueño de Cabildo 2840 quiere subir el precio publicado. Llamarlo el lunes para conversar.',
   '22222222-2222-2222-2222-222222222222',
   ARRAY['11111111-1111-1111-1111-111111111111']::uuid[],
   now() - interval '2 hours'),
  ('Reagendé la visita de Holmberg con María González. Confirmar el jueves antes de las 18.',
   '11111111-1111-1111-1111-111111111111',
   ARRAY['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333']::uuid[],
   now() - interval '1 day'),
  ('El contador pidió el cierre del mes para el viernes. Necesito los comprobantes de comisiones de mayo.',
   '33333333-3333-3333-3333-333333333333',
   ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']::uuid[],
   now() - interval '3 days');


-- ═══════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2.5 · FUNCIONES de reset/reseed para el cron diario
-- ═══════════════════════════════════════════════════════════════════════════
-- El endpoint /api/cron/reset-seed llama a reset_and_seed_demo_data() cada
-- 7 UTC. Sin estas funciones, el cron no podría repoblar la base.
-- IMPORTANTE: si este archivo se corre sobre una base ya viva, las
-- funciones se reemplazan (CREATE OR REPLACE) sin tocar datos.

-- ─── desde supabase/migrations/20260521_seed_demo_function.sql ───

CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_zulma_id    uuid;
  v_martin_id   uuid;
  v_carolina_id uuid;
BEGIN
  SELECT id INTO v_zulma_id    FROM public.usuarios WHERE rol = 'socia_titular'   AND activo LIMIT 1;
  SELECT id INTO v_martin_id   FROM public.usuarios WHERE rol = 'socio_operativo' AND activo LIMIT 1;
  SELECT id INTO v_carolina_id FROM public.usuarios WHERE rol = 'administrativa'  AND activo LIMIT 1;

  IF v_zulma_id IS NULL OR v_martin_id IS NULL OR v_carolina_id IS NULL THEN
    RAISE EXCEPTION 'No se encontraron los 3 usuarios base (socia_titular/socio_operativo/administrativa). Re-corré cantu_cloud_setup.sql.';
  END IF;

  -- DUEÑOS
  INSERT INTO public.duenos (id, nombre, email, telefono, canal_preferido, frecuencia_reporte, en_grupo_whatsapp, notas_internas, confidencial, acuerdo_especial, creado_por_id) VALUES
    ('aaaaaaaa-0001-0000-0000-000000000001', 'Mariana Rodríguez', 'mariana.r@gmail.com', '+5491133224455', 'mail', 'mensual', true, 'Cliente desde 2018. Tiene dos deptos.', false, NULL, v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000002', 'Roberto Saggese', 'roberto.s@hotmail.com', '+5491155667788', 'whatsapp_pdf', 'mensual', true, 'Abogado. Quiere todo en orden.', false, NULL, v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000003', 'Familia Pérez', NULL, '+5491166778899', 'llamada', 'trimestral', false, 'Padres mayores, no usan mail. Se contactan por teléfono fijo.', false, NULL, v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000004', 'Don Eduardo Vázquez', NULL, '+5491177889900', 'llamada', 'on_demand', false, 'Dueño histórico desde 2010. Le manda audios a Zulma. Trato cercano.', true, 'Comisión reducida al 2.5% por antigüedad. Atención prioritaria de Zulma personalmente.', v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000005', 'Inés Maldonado', 'ines.m@gmail.com', '+5491122334455', 'mail', 'mensual', true, NULL, false, NULL, v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000006', 'Sucesión Gómez Iturri', 'admin.gomez@estudio.com.ar', '+5491198765432', 'mail', 'mensual', false, 'Sucesión gestionada por el estudio jurídico. Contacto vía Dra. Iturri.', true, 'Cuatro hermanos, decisiones por unanimidad. Solo Zulma maneja la comunicación.', v_zulma_id);

  -- PROPIEDADES
  INSERT INTO public.propiedades (id, direccion, tipo, operacion, estado, precio_actual, moneda, dueno_id, descripcion_comercial, fecha_captacion, creado_por_id) VALUES
    ('bbbbbbbb-0001-0000-0000-000000000001', 'Av. Congreso 3400 5° B, Coghlan', 'depto', 'alquiler', 'publicada', 380000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000001', 'Hermoso 2 ambientes a estrenar, balcón a la calle, cocina integrada.', '2026-04-15', v_martin_id),
    ('bbbbbbbb-0001-0000-0000-000000000002', 'Estomba 1547 3° A, Villa Urquiza', 'depto', 'venta', 'con_visitas', 165000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000002', '3 ambientes amplios, dependencia, cochera fija, mucho sol.', '2026-03-01', v_martin_id),
    ('bbbbbbbb-0001-0000-0000-000000000003', 'Olazábal 5234 PB, Villa Urquiza', 'ph', 'venta', 'con_oferta', 280000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000003', 'PH al frente, patio, parrilla, dos plantas. Refaccionado a nuevo.', '2026-02-10', v_martin_id),
    ('bbbbbbbb-0001-0000-0000-000000000004', 'Tronador 2890 8° C, Parque Chas', 'depto', 'alquiler', 'publicada', 320000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000001', 'Monoambiente luminoso, balcón con vista despejada.', '2026-05-05', v_martin_id),
    ('bbbbbbbb-0001-0000-0000-000000000005', 'Av. Triunvirato 4520 12° A, Coghlan', 'depto', 'venta', 'publicada', 195000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000004', 'Cuatro ambientes con dependencia, vista panorámica, edificio con amenities.', '2026-01-20', v_zulma_id),
    ('bbbbbbbb-0001-0000-0000-000000000006', 'Pampa 2389 PB, Villa Urquiza', 'casa', 'venta', 'captada', 420000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000006', 'Casa chorizo en lote propio, tres dormitorios, garage, jardín.', '2026-05-12', v_zulma_id),
    ('bbbbbbbb-0001-0000-0000-000000000007', 'Plaza 4100 2° B, Coghlan', 'depto', 'alquiler', 'publicada', 295000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000005', 'Dos ambientes amplios, balcón francés, cocina equipada.', '2026-04-28', v_martin_id);

  UPDATE public.propiedades SET confidencial = true
  WHERE dueno_id IN (SELECT id FROM public.duenos WHERE confidencial = true);

  -- PORTALES
  INSERT INTO public.portales_propiedad (propiedad_id, portal, estado_en_portal, url_publicacion, fecha_publicacion) VALUES
    ('bbbbbbbb-0001-0000-0000-000000000001', 'zonaprop',     'publicada', 'https://zonaprop.com.ar/prop-1', '2026-04-16'),
    ('bbbbbbbb-0001-0000-0000-000000000001', 'argenprop',    'publicada', 'https://argenprop.com/prop-1', '2026-04-16'),
    ('bbbbbbbb-0001-0000-0000-000000000002', 'zonaprop',     'publicada', 'https://zonaprop.com.ar/prop-2', '2026-03-02'),
    ('bbbbbbbb-0001-0000-0000-000000000002', 'mercadolibre', 'publicada', 'https://inmuebles.mercadolibre.com.ar/prop-2', '2026-03-02'),
    ('bbbbbbbb-0001-0000-0000-000000000003', 'zonaprop',     'pausada',   NULL, '2026-02-11'),
    ('bbbbbbbb-0001-0000-0000-000000000004', 'zonaprop',     'publicada', 'https://zonaprop.com.ar/prop-4', '2026-05-06'),
    ('bbbbbbbb-0001-0000-0000-000000000004', 'soloduenos',   'publicada', 'https://soloduenos.com.ar/prop-4', '2026-05-06'),
    ('bbbbbbbb-0001-0000-0000-000000000007', 'zonaprop',     'publicada', 'https://zonaprop.com.ar/prop-7', '2026-04-29');

  -- LEADS
  INSERT INTO public.leads (id, nombre, telefono, email, propiedad_id, canal_origen, referido_por_dueno_id, estado, responsable_id, proxima_accion, fecha_proxima_accion, creado_por_id) VALUES
    ('cccccccc-0001-0000-0000-000000000001', 'Lucía Fernández', '+5491155112233', 'lucia.f@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000001', 'zonaprop',         NULL,                                       'con_visita',  v_martin_id, 'Coordinar visita el sábado', '2026-05-24 11:00', v_carolina_id),
    ('cccccccc-0001-0000-0000-000000000002', 'Diego Marini',    '+5491166998877', 'diego.marini@yahoo.com', 'bbbbbbbb-0001-0000-0000-000000000002', 'whatsapp_oficina', NULL,                                       'contactado',  v_martin_id, 'Mandarle ficha técnica',     '2026-05-22 10:00', v_carolina_id),
    ('cccccccc-0001-0000-0000-000000000003', 'Ariel Sobrino (sobrino de Inés)', '+5491144556677', 'ariel.s@gmail.com', NULL, 'referido_zulma', 'aaaaaaaa-0001-0000-0000-000000000005', 'nuevo',       v_zulma_id,  'Llamar para entender criterios de búsqueda', '2026-05-21 16:00', v_zulma_id),
    ('cccccccc-0001-0000-0000-000000000004', 'Pareja Castro-Núñez', '+5491133445566', 'castro.nunez@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000003', 'argenprop',         NULL,                                       'con_oferta',  v_martin_id, 'Esperando contraoferta del dueño', '2026-05-23 09:00', v_carolina_id),
    ('cccccccc-0001-0000-0000-000000000005', 'Lucía Fernández', '+5491155112233', 'lucia.f@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000004', 'zonaprop',         NULL,                                       'nuevo',       v_martin_id, 'Detectado como posible duplicado de lead 001', '2026-05-21 14:00', v_carolina_id);

  UPDATE public.leads SET criterio_busqueda = '{"zona":["Villa Urquiza","Coghlan"],"tipo":"depto","ambientes":2,"presupuesto_max":150000,"moneda":"usd","operacion":"venta"}'::jsonb
  WHERE id = 'cccccccc-0001-0000-0000-000000000003';

  -- CONSULTAS_LEAD
  INSERT INTO public.consultas_lead (lead_id, propiedad_id, fecha, canal_origen, notas, creado_por_id) VALUES
    ('cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', '2026-05-15 10:30', 'zonaprop', 'Primera consulta · pidió ficha',                          v_carolina_id),
    ('cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000004', '2026-05-20 14:00', 'zonaprop', 'Segunda consulta · ahora interesada en el monoambiente',  v_carolina_id);

  -- VISITAS
  INSERT INTO public.visitas (id, lead_id, propiedad_id, responsable_id, fecha_agendada, estado, devolucion_prospecto, devolucion_cargada_por_id) VALUES
    ('dddddddd-0001-0000-0000-000000000001', 'cccccccc-0001-0000-0000-000000000002', 'bbbbbbbb-0001-0000-0000-000000000002', v_martin_id, '2026-05-18 16:00', 'realizada', 'Le gustó mucho la luminosidad y la cocina. Le preocupa el ruido del frente. Va a hablar con la esposa y nos confirma el viernes.', v_carolina_id),
    ('dddddddd-0001-0000-0000-000000000002', 'cccccccc-0001-0000-0000-000000000004', 'bbbbbbbb-0001-0000-0000-000000000003', v_martin_id, '2026-05-17 11:00', 'realizada', 'Pareja muy entusiasmada con el patio. Ofrecieron USD 265.000 (dueño pide 280k). Quedaron en pensar contraoferta.',                v_carolina_id),
    ('dddddddd-0001-0000-0000-000000000003', 'cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', v_martin_id, '2026-05-24 11:00', 'agendada',  NULL,                                                                                                                              NULL);

  -- COMUNICACIONES (de leads)
  INSERT INTO public.comunicaciones (tipo, lead_id, contenido, fecha, registrada_por_id) VALUES
    ('whatsapp_entrante', 'cccccccc-0001-0000-0000-000000000001', 'Hola! Vi el depto de Av. Congreso, ¿lo puedo visitar este finde?',                                                                            '2026-05-15 10:30', v_carolina_id),
    ('whatsapp_saliente', 'cccccccc-0001-0000-0000-000000000001', 'Hola Lucía! Sí, te paso opciones. ¿Sábado a las 11?',                                                                                         '2026-05-15 10:45', v_carolina_id),
    ('llamada',           'cccccccc-0001-0000-0000-000000000003', 'Llamada inicial. Sobrino de Inés. Busca dos amb en Villa Urquiza, hasta USD 150k. Pidió que le mande opciones por mail.',                       '2026-05-20 16:30', v_zulma_id);

  -- COMUNICACIONES (de dueños)
  INSERT INTO public.comunicaciones (tipo, dueno_id, contenido, fecha, registrada_por_id) VALUES
    ('llamada',      'aaaaaaaa-0001-0000-0000-000000000004', 'Don Eduardo llamó para preguntar por el depto de Av. Triunvirato. Le confirmé que hubo 4 consultas esta semana, ninguna concretó visita aún. Quedó tranquilo.', '2026-05-19 11:00', v_zulma_id),
    ('mail_saliente','aaaaaaaa-0001-0000-0000-000000000001', 'Mariana, te paso el resumen del mes. Las dos propiedades tuvieron buen movimiento, sobre todo el de Congreso.',                                                  '2026-05-01 09:00', v_zulma_id);

  -- REPORTES MENSUALES
  INSERT INTO public.reportes_mensuales (propiedad_id, dueno_id, periodo, estado, nota_personalizada, canal_envio) VALUES
    ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', '2026-04-01', 'enviado',   'Mariana, gran mes. Hay interés concreto en el de Av. Congreso, te llamo esta semana para conversar.', 'mail'),
    ('bbbbbbbb-0001-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000002', '2026-04-01', 'enviado',   'Roberto, seguimos con buen flujo de consultas. La cocina chica sigue siendo el principal objection. ¿Lo conversamos?', 'whatsapp_pdf'),
    ('bbbbbbbb-0001-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000004', '2026-04-01', 'no_enviar', NULL, 'llamada');

  -- NOVEDADES (defensive: por si la migration de novedades no corrió)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='novedades') THEN
    DELETE FROM public.novedades;

    INSERT INTO public.novedades (contenido, autor_id, vista_por, creado_en) VALUES
      ('El dueño de Cabildo 2840 quiere subir el precio publicado. Llamarlo el lunes para conversar.',
       v_martin_id,
       ARRAY[v_zulma_id]::uuid[],
       now() - interval '2 hours'),
      ('Reagendé la visita de Holmberg con María González. Confirmar el jueves antes de las 18.',
       v_zulma_id,
       ARRAY[v_martin_id, v_carolina_id]::uuid[],
       now() - interval '1 day'),
      ('El contador pidió el cierre del mes para el viernes. Necesito los comprobantes de comisiones de mayo.',
       v_carolina_id,
       ARRAY[v_zulma_id, v_martin_id]::uuid[],
       now() - interval '3 days');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_demo_data() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO service_role;

-- ─── desde supabase/migrations/20260522000000_reset_seed_atomic.sql ───

CREATE OR REPLACE FUNCTION public.reset_and_seed_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.visitas;
  DELETE FROM public.comunicaciones;
  DELETE FROM public.consultas_lead;
  DELETE FROM public.reportes_mensuales;
  DELETE FROM public.portales_propiedad;
  DELETE FROM public.leads;
  DELETE FROM public.propiedades;
  DELETE FROM public.duenos;

  PERFORM public.seed_demo_data();
END;
$$;

REVOKE ALL ON FUNCTION public.reset_and_seed_demo_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_and_seed_demo_data() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_and_seed_demo_data() TO service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3 · VERIFICACIONES · ejecutar para confirmar que quedó todo OK
-- ═══════════════════════════════════════════════════════════════════════════

-- Usuarios creados (debería dar 3: Zulma, Martín, Carolina)
SELECT email, raw_user_meta_data->>'rol' AS rol
FROM auth.users
WHERE email LIKE '%@cantu.local'
ORDER BY email;

-- Identities asociadas (debería dar 3, una por usuario)
SELECT user_id, provider, identity_data->>'email' AS email
FROM auth.identities
WHERE provider = 'email'
ORDER BY identity_data->>'email';

-- Contadores de tablas públicas (deberían dar > 0)
SELECT 'usuarios' AS tabla, count(*) AS total FROM public.usuarios
UNION ALL SELECT 'propiedades', count(*) FROM public.propiedades
UNION ALL SELECT 'leads', count(*) FROM public.leads
UNION ALL SELECT 'visitas', count(*) FROM public.visitas
UNION ALL SELECT 'novedades', count(*) FROM public.novedades;

-- RLS habilitado en las tablas críticas (todas deberían dar "t")
SELECT
  c.relname AS tabla,
  c.relrowsecurity AS rls_activo
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('propiedades', 'leads', 'visitas', 'usuarios', 'novedades')
ORDER BY c.relname;

-- Funciones del cron (deberían existir las 2)
SELECT proname AS funcion, pg_get_function_result(oid) AS retorna
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('seed_demo_data', 'reset_and_seed_demo_data')
ORDER BY proname;
