# Modelo de datos

> **Por validar en discovery.** Este es el modelo de arranque. Las relaciones reales se confirman con Zulma y la administrativa.

## Entidades principales

### Propiedad
Una unidad publicada (en alquiler o venta).
- `id`, `direccion`, `tipo` (depto / casa / local / etc), `operacion` (alquiler / venta / temporada)
- `dueño_id` → Dueño
- `estado` (captada / publicada / con_visitas / con_oferta / reservada / cerrada / pausada)
- `precio`, `moneda`
- `fotos`, `descripcion_comercial`
- `portales` (array de estados por portal: ZonaProp, MercadoLibre, etc.)
- `created_at`, `updated_at`

### Dueño
Persona o entidad que posee una propiedad. Recibe el reporte mensual.
- `id`, `nombre`, `email`, `telefono`
- `recibe_reportes` (bool · default true)
- `notas_internas`

### Lead
Persona que consultó por una propiedad.
- `id`, `nombre`, `email`, `telefono`
- `propiedad_id` → Propiedad
- `canal_origen` (whatsapp / mail / formulario / zonaprop / otro)
- `estado` (nuevo / contactado / con_visita / sin_interes / cerrado)
- `responsable_id` → Usuario
- `proxima_accion`, `fecha_proxima_accion`

### Visita
Una visita agendada o realizada.
- `id`, `lead_id` → Lead, `propiedad_id` → Propiedad
- `fecha_agendada`, `confirmada` (bool)
- `realizada` (bool), `devolucion_prospecto` (text · para el reporte mensual)
- `responsable_id` → Usuario

### Comunicacion
Cada interacción registrada con un lead o dueño.
- `id`, `tipo` (whatsapp / mail / llamada / nota_interna)
- `lead_id` o `dueno_id`
- `direccion` (entrante / saliente)
- `contenido` (text), `fecha`
- `responsable_id` → Usuario

### Usuario (auth.users + perfil)
- `id` (de Supabase auth), `nombre`, `rol` (socio / administrativa)

## RLS (row-level security)

Reglas tentativas a confirmar en discovery:
- **Socios** ven todo.
- **Administrativa** ve propiedades, leads, visitas, agenda · no ve notas internas sobre dueños ni datos sensibles de comisión.

## Diagrama

> Por dibujar en discovery. Anexar PNG acá.
