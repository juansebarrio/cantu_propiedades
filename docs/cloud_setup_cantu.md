# Fase 2 · Schema + Seed para Supabase Cloud

Generar un único archivo SQL consolidado (schema + seed + verificaciones) que se pueda copiar y pegar en el SQL Editor del dashboard de Supabase para terminar de configurar el proyecto cloud.

## Contexto

El proyecto Supabase Cloud ya está creado (`cantu-propiedades` en plan Free, región São Paulo). Las migrations y seed funcionan perfecto en local con Docker. Ahora queremos replicar todo eso en cloud para poder deployar la app en Vercel.

La estrategia: **un solo archivo SQL** que el usuario pega en el SQL Editor → ejecuta una vez → la base queda lista. Sin CLI, sin `supabase link`, sin configuración compleja. Sirve como artefacto reproducible para futuras instancias.

## 1 · Inspección previa

Antes de generar el archivo consolidado, mostrame qué hay:

```bash
ls -la supabase/migrations/
ls -la supabase/ | grep -E "seed|init"
wc -l supabase/migrations/*.sql supabase/seed.sql 2>/dev/null
```

Reportame:

- Cuántos archivos hay en `supabase/migrations/`
- Cuántas líneas tiene cada uno
- Si existe `supabase/seed.sql` y su tamaño
- Si existe algún otro archivo SQL relevante (ej. `supabase/functions.sql`, `supabase/policies.sql`)

Si hay algún archivo que no tenga sentido incluir en el consolidado (ej. un dump de prueba), avisame antes de seguir.

## 2 · Generar `cantu_cloud_setup.sql`

Crear este archivo en la raíz del repo (no dentro de `supabase/`, así no se confunde con migrations locales). Estructura:

```sql
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
-- Generado: <fecha>
-- Repo: github.com/juansebarrio/cantu_propiedades
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · SCHEMA · tablas, indices, funciones, triggers, RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- [contenido de migration 1 con su header de comentario indicando archivo origen]

-- [contenido de migration 2 con su header de comentario indicando archivo origen]

-- [... etc ...]


-- ═══════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2 · SEED · usuarios (auth.users + identities) + datos demo
-- ═══════════════════════════════════════════════════════════════════════════

-- [contenido de seed.sql tal cual]


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
UNION ALL SELECT 'visitas', count(*) FROM public.visitas;

-- RLS habilitado en las tablas críticas (todas deberían dar "t")
SELECT
  c.relname AS tabla,
  c.relrowsecurity AS rls_activo
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('propiedades', 'leads', 'visitas', 'usuarios')
ORDER BY c.relname;
```

### Reglas de concatenación

1. **Orden de migrations:** orden alfabético del nombre del archivo. Las migrations de Supabase típicamente tienen prefijo timestamp (`20260301_create_propiedades.sql`), así que el orden alfabético equivale al orden cronológico.

2. **Headers de comentario antes de cada migration:** insertar una línea de comentario indicando de qué archivo viene:
   ```sql
   -- ─── desde supabase/migrations/20260301_create_propiedades.sql ───
   ```
   Así si algo rompe en cloud, sabemos exactamente qué migration fue.

3. **NO modificar el contenido de las migrations o el seed.** Solo concatenar. Si el SQL funciona en local, funciona en cloud.

4. **NO incluir** statements de `RESET`, `TRUNCATE`, o `DROP DATABASE` si los hay. La base de cloud está limpia.

5. **Si alguna migration tiene `IF NOT EXISTS`** en sus CREATE, mejor — el archivo se vuelve casi idempotente. No agregues esos cláusulas vos si no estaban; respeta el original.

6. **Manejo especial de `auth.users` y `auth.identities`:** el seed local inserta usuarios directamente ahí con todos los campos necesarios (`instance_id`, `aud`, `role`, `confirmation_token`, etc.) más la fila correspondiente en `auth.identities`. Eso debe quedar EXACTAMENTE como está. Esos inserts ya están probados.

## 3 · Verificar el archivo generado

Después de generarlo, mostrame:

```bash
ls -la cantu_cloud_setup.sql
wc -l cantu_cloud_setup.sql
head -30 cantu_cloud_setup.sql
echo "---"
tail -50 cantu_cloud_setup.sql
```

Quiero ver:
- Que el archivo exista y tenga tamaño razonable (entre 500 y 5000 líneas, dependiendo de las migrations)
- Que el header esté bien armado
- Que las verificaciones del final estén intactas

## 4 · Documentar en `docs/deployment.md`

Crear (o agregar al existente) este archivo con la guía completa de deploy:

```markdown
# Deployment · Cantú Propiedades

## Estado actual

- **Base local:** Supabase corriendo en Docker (`pnpm db:start`)
- **Base cloud:** Supabase Cloud, proyecto `cantu-propiedades`, región São Paulo
- **App:** Vercel, repo conectado a `juansebarrio/cantu_propiedades`, deploy automático en push a `main`
- **URL pública:** `https://cantu-propiedades.vercel.app`

## Configurar el cloud desde cero (one-time setup)

Si hay que reconstruir el cloud (o configurar un cloud de staging):

1. Crear proyecto en supabase.com → `cantu-propiedades` → región São Paulo → plan Free
2. Esperar a que termine de provisionar (~5 min)
3. Anotar credenciales: Project URL, anon key (legacy), service_role key (legacy)
4. SQL Editor → New query → pegar el contenido de `cantu_cloud_setup.sql` → Run
5. Verificar que las queries del final del archivo devuelvan counts esperados (3 usuarios, > 0 propiedades, RLS activo)

## Configurar Vercel

En vercel.com → proyecto `cantu-propiedades` → Settings → Environment Variables.

Sumar estas variables, todas marcadas para Production (y Preview si querés branch deploys también):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-id>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | el JWT que arranca con `eyJ...` (anon legacy) |
| `SUPABASE_SERVICE_ROLE_KEY` | el otro JWT que arranca con `eyJ...` (service_role legacy) |

Después: Deployments → último deploy → menú "..." → Redeploy (sin caché).

## Verificaciones post-deploy

1. Abrir `cantu-propiedades.vercel.app` → debe mostrar la landing
2. Click "Iniciar sesión" → loguearse con `zulma@cantu.local` / `zulma123`
3. Debería redirigir a `/propiedades` y mostrar la lista con 7 propiedades
4. Cerrar sesión, loguearse como `martin@cantu.local` / `martin123` → la ficha de Don Eduardo NO debe mostrar el bloque violeta de acuerdo especial
5. Cerrar sesión, loguearse como `carolina@cantu.local` / `carolina123` → NO debe ver notas internas en ninguna propiedad

Si algo falla, revisar:
- Variables de entorno en Vercel (todas las 3, todas marcadas Production)
- Logs del deployment en Vercel → Functions → Function Logs
- SQL Editor en Supabase Cloud → correr las verificaciones del final de `cantu_cloud_setup.sql`
```

## 5 · Commit y push

```bash
git add cantu_cloud_setup.sql docs/deployment.md
git commit -m "chore(deploy): consolidar schema+seed para Supabase Cloud + docs"
git push
```

**Importante:** asegurarse que `.env.local` está en `.gitignore` y que no se está commiteando ninguna credencial real. Verificar con:

```bash
git status
grep -r "supabase.co" --include="*.env*" . 2>/dev/null
```

Si aparece alguna URL real de cloud o algún JWT en archivos rastreables, **parar y avisarme** antes de commitear.

## 6 · Confirmación final

Mostrame:

- Hash del commit
- Listado final de archivos modificados (`git diff --stat HEAD~1`)
- Tamaño y línea inicial / final de `cantu_cloud_setup.sql`
- Confirmación de que no se commitearon credenciales

Si algo en la inspección inicial (paso 1) te llamó la atención (ej. migrations con DROP TABLE, schemas que no son `public`, funciones que dependen de extensiones específicas), incluilo en el reporte para que lo veamos antes de pegar el SQL en cloud.
