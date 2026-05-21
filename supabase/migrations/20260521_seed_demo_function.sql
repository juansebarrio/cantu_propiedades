-- ═══════════════════════════════════════════════════════════════════════════
-- Función seed_demo_data()
-- ═══════════════════════════════════════════════════════════════════════════
-- Llamada desde /api/cron/reset-seed (Fase 1B).
-- Re-inserta los datos demo críticos usando los UUIDs de los 3 usuarios
-- que ya existen (auth.users, auth.identities, public.usuarios persisten).
-- Lookup por rol → no hardcodea IDs · resiliente a reseeds.
-- ═══════════════════════════════════════════════════════════════════════════

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

  -- ──────────────────────────────────────────────────────────────────
  -- DUEÑOS
  -- ──────────────────────────────────────────────────────────────────
  INSERT INTO public.duenos (id, nombre, email, telefono, canal_preferido, frecuencia_reporte, en_grupo_whatsapp, notas_internas, confidencial, acuerdo_especial, creado_por_id) VALUES
    ('aaaaaaaa-0001-0000-0000-000000000001', 'Mariana Rodríguez', 'mariana.r@gmail.com', '+5491133224455', 'mail', 'mensual', true, 'Cliente desde 2018. Tiene dos deptos.', false, NULL, v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000002', 'Roberto Saggese', 'roberto.s@hotmail.com', '+5491155667788', 'whatsapp_pdf', 'mensual', true, 'Abogado. Quiere todo en orden.', false, NULL, v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000003', 'Familia Pérez', NULL, '+5491166778899', 'llamada', 'trimestral', false, 'Padres mayores, no usan mail. Se contactan por teléfono fijo.', false, NULL, v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000004', 'Don Eduardo Vázquez', NULL, '+5491177889900', 'llamada', 'on_demand', false, 'Dueño histórico desde 2010. Le manda audios a Zulma. Trato cercano.', true, 'Comisión reducida al 2.5% por antigüedad. Atención prioritaria de Zulma personalmente.', v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000005', 'Inés Maldonado', 'ines.m@gmail.com', '+5491122334455', 'mail', 'mensual', true, NULL, false, NULL, v_zulma_id),
    ('aaaaaaaa-0001-0000-0000-000000000006', 'Sucesión Gómez Iturri', 'admin.gomez@estudio.com.ar', '+5491198765432', 'mail', 'mensual', false, 'Sucesión gestionada por el estudio jurídico. Contacto vía Dra. Iturri.', true, 'Cuatro hermanos, decisiones por unanimidad. Solo Zulma maneja la comunicación.', v_zulma_id);

  -- ──────────────────────────────────────────────────────────────────
  -- PROPIEDADES
  -- ──────────────────────────────────────────────────────────────────
  INSERT INTO public.propiedades (id, direccion, tipo, operacion, estado, precio_actual, moneda, dueno_id, descripcion_comercial, fecha_captacion, creado_por_id) VALUES
    ('bbbbbbbb-0001-0000-0000-000000000001', 'Av. Congreso 3400 5° B, Coghlan', 'depto', 'alquiler', 'publicada', 380000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000001', 'Hermoso 2 ambientes a estrenar, balcón a la calle, cocina integrada.', '2026-04-15', v_martin_id),
    ('bbbbbbbb-0001-0000-0000-000000000002', 'Estomba 1547 3° A, Villa Urquiza', 'depto', 'venta', 'con_visitas', 165000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000002', '3 ambientes amplios, dependencia, cochera fija, mucho sol.', '2026-03-01', v_martin_id),
    ('bbbbbbbb-0001-0000-0000-000000000003', 'Olazábal 5234 PB, Villa Urquiza', 'ph', 'venta', 'con_oferta', 280000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000003', 'PH al frente, patio, parrilla, dos plantas. Refaccionado a nuevo.', '2026-02-10', v_martin_id),
    ('bbbbbbbb-0001-0000-0000-000000000004', 'Tronador 2890 8° C, Parque Chas', 'depto', 'alquiler', 'publicada', 320000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000001', 'Monoambiente luminoso, balcón con vista despejada.', '2026-05-05', v_martin_id),
    ('bbbbbbbb-0001-0000-0000-000000000005', 'Av. Triunvirato 4520 12° A, Coghlan', 'depto', 'venta', 'publicada', 195000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000004', 'Cuatro ambientes con dependencia, vista panorámica, edificio con amenities.', '2026-01-20', v_zulma_id),
    ('bbbbbbbb-0001-0000-0000-000000000006', 'Pampa 2389 PB, Villa Urquiza', 'casa', 'venta', 'captada', 420000, 'usd', 'aaaaaaaa-0001-0000-0000-000000000006', 'Casa chorizo en lote propio, tres dormitorios, garage, jardín.', '2026-05-12', v_zulma_id),
    ('bbbbbbbb-0001-0000-0000-000000000007', 'Plaza 4100 2° B, Coghlan', 'depto', 'alquiler', 'publicada', 295000, 'ars', 'aaaaaaaa-0001-0000-0000-000000000005', 'Dos ambientes amplios, balcón francés, cocina equipada.', '2026-04-28', v_martin_id);

  -- Marcar como confidencial las propiedades de dueños confidenciales
  UPDATE public.propiedades SET confidencial = true
  WHERE dueno_id IN (SELECT id FROM public.duenos WHERE confidencial = true);

  -- ──────────────────────────────────────────────────────────────────
  -- PORTALES
  -- ──────────────────────────────────────────────────────────────────
  INSERT INTO public.portales_propiedad (propiedad_id, portal, estado_en_portal, url_publicacion, fecha_publicacion) VALUES
    ('bbbbbbbb-0001-0000-0000-000000000001', 'zonaprop',     'publicada', 'https://zonaprop.com.ar/prop-1', '2026-04-16'),
    ('bbbbbbbb-0001-0000-0000-000000000001', 'argenprop',    'publicada', 'https://argenprop.com/prop-1', '2026-04-16'),
    ('bbbbbbbb-0001-0000-0000-000000000002', 'zonaprop',     'publicada', 'https://zonaprop.com.ar/prop-2', '2026-03-02'),
    ('bbbbbbbb-0001-0000-0000-000000000002', 'mercadolibre', 'publicada', 'https://inmuebles.mercadolibre.com.ar/prop-2', '2026-03-02'),
    ('bbbbbbbb-0001-0000-0000-000000000003', 'zonaprop',     'pausada',   NULL, '2026-02-11'),
    ('bbbbbbbb-0001-0000-0000-000000000004', 'zonaprop',     'publicada', 'https://zonaprop.com.ar/prop-4', '2026-05-06'),
    ('bbbbbbbb-0001-0000-0000-000000000004', 'soloduenos',   'publicada', 'https://soloduenos.com.ar/prop-4', '2026-05-06'),
    ('bbbbbbbb-0001-0000-0000-000000000007', 'zonaprop',     'publicada', 'https://zonaprop.com.ar/prop-7', '2026-04-29');

  -- ──────────────────────────────────────────────────────────────────
  -- LEADS (incluye referido_zulma y duplicado de Lucía)
  -- ──────────────────────────────────────────────────────────────────
  INSERT INTO public.leads (id, nombre, telefono, email, propiedad_id, canal_origen, referido_por_dueno_id, estado, responsable_id, proxima_accion, fecha_proxima_accion, creado_por_id) VALUES
    ('cccccccc-0001-0000-0000-000000000001', 'Lucía Fernández', '+5491155112233', 'lucia.f@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000001', 'zonaprop',         NULL,                                       'con_visita',  v_martin_id, 'Coordinar visita el sábado', '2026-05-24 11:00', v_carolina_id),
    ('cccccccc-0001-0000-0000-000000000002', 'Diego Marini',    '+5491166998877', 'diego.marini@yahoo.com', 'bbbbbbbb-0001-0000-0000-000000000002', 'whatsapp_oficina', NULL,                                       'contactado',  v_martin_id, 'Mandarle ficha técnica',     '2026-05-22 10:00', v_carolina_id),
    ('cccccccc-0001-0000-0000-000000000003', 'Ariel Sobrino (sobrino de Inés)', '+5491144556677', 'ariel.s@gmail.com', NULL, 'referido_zulma', 'aaaaaaaa-0001-0000-0000-000000000005', 'nuevo',       v_zulma_id,  'Llamar para entender criterios de búsqueda', '2026-05-21 16:00', v_zulma_id),
    ('cccccccc-0001-0000-0000-000000000004', 'Pareja Castro-Núñez', '+5491133445566', 'castro.nunez@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000003', 'argenprop',         NULL,                                       'con_oferta',  v_martin_id, 'Esperando contraoferta del dueño', '2026-05-23 09:00', v_carolina_id),
    ('cccccccc-0001-0000-0000-000000000005', 'Lucía Fernández', '+5491155112233', 'lucia.f@gmail.com', 'bbbbbbbb-0001-0000-0000-000000000004', 'zonaprop',         NULL,                                       'nuevo',       v_martin_id, 'Detectado como posible duplicado de lead 001', '2026-05-21 14:00', v_carolina_id);

  UPDATE public.leads SET criterio_busqueda = '{"zona":["Villa Urquiza","Coghlan"],"tipo":"depto","ambientes":2,"presupuesto_max":150000,"moneda":"usd","operacion":"venta"}'::jsonb
  WHERE id = 'cccccccc-0001-0000-0000-000000000003';

  -- ──────────────────────────────────────────────────────────────────
  -- CONSULTAS_LEAD
  -- ──────────────────────────────────────────────────────────────────
  INSERT INTO public.consultas_lead (lead_id, propiedad_id, fecha, canal_origen, notas, creado_por_id) VALUES
    ('cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', '2026-05-15 10:30', 'zonaprop', 'Primera consulta · pidió ficha',                          v_carolina_id),
    ('cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000004', '2026-05-20 14:00', 'zonaprop', 'Segunda consulta · ahora interesada en el monoambiente',  v_carolina_id);

  -- ──────────────────────────────────────────────────────────────────
  -- VISITAS
  -- ──────────────────────────────────────────────────────────────────
  INSERT INTO public.visitas (id, lead_id, propiedad_id, responsable_id, fecha_agendada, estado, devolucion_prospecto, devolucion_cargada_por_id) VALUES
    ('dddddddd-0001-0000-0000-000000000001', 'cccccccc-0001-0000-0000-000000000002', 'bbbbbbbb-0001-0000-0000-000000000002', v_martin_id, '2026-05-18 16:00', 'realizada', 'Le gustó mucho la luminosidad y la cocina. Le preocupa el ruido del frente. Va a hablar con la esposa y nos confirma el viernes.', v_carolina_id),
    ('dddddddd-0001-0000-0000-000000000002', 'cccccccc-0001-0000-0000-000000000004', 'bbbbbbbb-0001-0000-0000-000000000003', v_martin_id, '2026-05-17 11:00', 'realizada', 'Pareja muy entusiasmada con el patio. Ofrecieron USD 265.000 (dueño pide 280k). Quedaron en pensar contraoferta.',                v_carolina_id),
    ('dddddddd-0001-0000-0000-000000000003', 'cccccccc-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', v_martin_id, '2026-05-24 11:00', 'agendada',  NULL,                                                                                                                              NULL);

  -- ──────────────────────────────────────────────────────────────────
  -- COMUNICACIONES (de leads)
  -- ──────────────────────────────────────────────────────────────────
  INSERT INTO public.comunicaciones (tipo, lead_id, contenido, fecha, registrada_por_id) VALUES
    ('whatsapp_entrante', 'cccccccc-0001-0000-0000-000000000001', 'Hola! Vi el depto de Av. Congreso, ¿lo puedo visitar este finde?',                                                                            '2026-05-15 10:30', v_carolina_id),
    ('whatsapp_saliente', 'cccccccc-0001-0000-0000-000000000001', 'Hola Lucía! Sí, te paso opciones. ¿Sábado a las 11?',                                                                                         '2026-05-15 10:45', v_carolina_id),
    ('llamada',           'cccccccc-0001-0000-0000-000000000003', 'Llamada inicial. Sobrino de Inés. Busca dos amb en Villa Urquiza, hasta USD 150k. Pidió que le mande opciones por mail.',                       '2026-05-20 16:30', v_zulma_id);

  -- COMUNICACIONES (de dueños)
  INSERT INTO public.comunicaciones (tipo, dueno_id, contenido, fecha, registrada_por_id) VALUES
    ('llamada',      'aaaaaaaa-0001-0000-0000-000000000004', 'Don Eduardo llamó para preguntar por el depto de Av. Triunvirato. Le confirmé que hubo 4 consultas esta semana, ninguna concretó visita aún. Quedó tranquilo.', '2026-05-19 11:00', v_zulma_id),
    ('mail_saliente','aaaaaaaa-0001-0000-0000-000000000001', 'Mariana, te paso el resumen del mes. Las dos propiedades tuvieron buen movimiento, sobre todo el de Congreso.',                                                  '2026-05-01 09:00', v_zulma_id);

  -- ──────────────────────────────────────────────────────────────────
  -- REPORTES MENSUALES
  -- ──────────────────────────────────────────────────────────────────
  INSERT INTO public.reportes_mensuales (propiedad_id, dueno_id, periodo, estado, nota_personalizada, canal_envio) VALUES
    ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', '2026-04-01', 'enviado',   'Mariana, gran mes. Hay interés concreto en el de Av. Congreso, te llamo esta semana para conversar.', 'mail'),
    ('bbbbbbbb-0001-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000002', '2026-04-01', 'enviado',   'Roberto, seguimos con buen flujo de consultas. La cocina chica sigue siendo el principal objection. ¿Lo conversamos?', 'whatsapp_pdf'),
    ('bbbbbbbb-0001-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000004', '2026-04-01', 'no_enviar', NULL, 'llamada');

  -- ──────────────────────────────────────────────────────────────────
  -- NOVEDADES (tablón de mensajes asincrónicos entre socios)
  -- ──────────────────────────────────────────────────────────────────
  -- Solo se insertan si la tabla existe (puede que un cloud antiguo no
  -- haya corrido la migration 20260521150000_novedades.sql todavía).
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='novedades') THEN
    -- Limpia novedades previas para no duplicar en cada reset
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

-- Permisos: solo service_role puede ejecutarla. anon/authenticated NO.
REVOKE ALL ON FUNCTION public.seed_demo_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_demo_data() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO service_role;
