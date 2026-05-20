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
