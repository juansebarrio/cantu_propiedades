-- ═══════════════════════════════════════════════════════════════════════════
-- Función reset_and_seed_demo_data()
-- ═══════════════════════════════════════════════════════════════════════════
-- Borra los datos operativos y llama a seed_demo_data() en una sola
-- transacción. Si seed_demo_data() no existe o falla, todo el DELETE se
-- revierte y la base queda con los datos previos.
--
-- Esto reemplaza la lógica que tenía el endpoint /api/cron/reset-seed
-- de borrar tabla por tabla desde JS y después llamar al RPC: ese flujo
-- no era atómico y, si el seed fallaba, la base quedaba vacía.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.reset_and_seed_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Orden inverso de dependencia (igual que el array TABLAS_A_LIMPIAR
  -- que tenía el route handler).
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
