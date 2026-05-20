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
