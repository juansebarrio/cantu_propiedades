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
