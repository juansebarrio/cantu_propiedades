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
