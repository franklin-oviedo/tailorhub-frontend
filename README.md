# TailorHub Frontend

Frontend SaaS para sastrerias, construido con Angular standalone + Angular Material, integrado con backend NestJS REST con JWT, roles y multi-tenant por tienda.

## Stack

- Angular 21 (standalone APIs)
- TypeScript estricto
- Angular Router + lazy loading
- HttpClient + interceptors
- Angular Material
- Reactive Forms

## Paleta oficial TailorHub

Colores base aplicados al frontend para reflejar una identidad sobria y premium:

- Primario (azul marino): `#1A2A40`
- Secundario (dorado elegante): `#C9A227`
- Neutro claro (gris plata): `#D9D9D9`
- Texto principal (gris oscuro): `#333333`
- Exito: `#4CAF50`
- Error: `#E53935`
- Fondo alternativo: `#FFFFFF`

Tipografia institucional:

- Principal: `Montserrat` (fallback: `Segoe UI`, `sans-serif`)

## Entornos

- Local: `src/environments/environment.ts`
	- `apiUrl: http://localhost:3000/api`
- Produccion: `src/environments/environment.prod.ts`
	- `apiUrl: https://YOUR_RENDER_API_URL/api`

El build de produccion usa `fileReplacements` en `angular.json`.

## Scripts

```bash
npm run start
npm run start:4201
npm run build
npm run test
npm run check
```

Si el puerto `4200` esta ocupado al levantar el frontend, ejecuta:

```bash
npm run start -- --port 4201
```

### Generar tipos desde OpenAPI

```bash
npm run types:api
```

Este script consume `http://localhost:3000/docs-json` y genera `src/app/core/models/openapi.generated.d.ts`.

## Arquitectura

Estructura por dominio:

- `src/app/core`
	- modelos tipados
	- guards (`AuthGuard`, `RoleGuard`)
	- interceptors (`auth`, `store`, `error`)
	- servicios globales de sesion y configuracion API
- `src/app/layout`
	- shell principal con navegacion por rol
- `src/app/features`
	- `auth`
	- `dashboard`
	- `users`
	- `stores`
	- `products`
	- `orders`
	- `appointments`

## Rutas principales

- `/login`
- `/register`
- `/forgot-password`
- `/dashboard`
- `/users`
- `/stores`
- `/products`
- `/orders`
- `/appointments`

## Integracion backend

- Base URL: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

Endpoints soportados por frontend en servicios:

- Auth: `/auth/register`, `/auth/login`
- Users: `/users/me`, `/users`, `/users/:id`
- Stores: `/stores`, `/stores/:id`
- Products: `/products`, `/products/:id`
- Orders: `/orders`, `/orders/:id`, `/orders/:id/status`
- Appointments: `/appointments`, `/appointments/:id`

## Seguridad y manejo de errores

- Interceptor JWT: agrega `Authorization: Bearer <token>`
- Interceptor multi-tenant: agrega `x-store-id` de la sesion
- Interceptor global de errores:
	- `400`: muestra mensaje de validacion
	- `401`: limpia sesion y redirige a `/login`
	- `403`: mensaje claro de permisos/cross-store
	- `404`: mensaje de recurso no encontrado

## Estado actual

- Login conectado a `/auth/login` y carga de perfil con `/users/me`
- CRUD base cableado por dominio (servicios tipados)
- Listados consumiendo contrato paginado `data/meta`
- Build y tests pasando

## CI y Branch Protection

El workflow de CI esta definido en `.github/workflows/ci.yml`:

- Workflow: `TailorHub CI`
- Job: `Test and Build`
- Validaciones: `npm run test:ci` (gate 100% cobertura) + `npm run build`
- Artefacto: publica carpeta `coverage/` en cada ejecucion
- Pull Request: publica/actualiza comentario con resumen de cobertura

Para bloquear merge sin CI verde en GitHub:

1. Ve a **Settings > Branches > Add branch protection rule**.
2. En **Branch name pattern**, coloca `main`.
3. Activa **Require a pull request before merging**.
4. Activa **Require status checks to pass before merging**.
5. En checks requeridos, agrega: `Test and Build`.
6. (Recomendado) Activa **Require branches to be up to date before merging**.
7. (Opcional fuerte) Activa **Do not allow bypassing the above settings**.

Con esto, ninguna PR a `main` podra mergearse si falla CI o si cobertura baja de 100%.
