# BetTrack MX

Aplicación para registrar y analizar apuestas deportivas, pensada para usuarios en México
(Playdoit, Draftea, Caliente, Codere, bet365). MVP funcional: registro manual de apuestas,
dashboard con ROI/bankroll/win rate, historial filtrable, control de bankroll y juego responsable.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth.js (Credentials + JWT)
- Recharts

## Opción sin terminal: publicar en internet con Vercel + Neon

Si no quieres usar la terminal, esta es la forma más fácil de ver la app funcionando: la subes a
GitHub arrastrando los archivos (sin comandos), la conectas a Vercel, y Vercel construye e
instala todo automáticamente — incluyendo crear las tablas de la base de datos, porque el script
`build` ya incluye `prisma db push` y el sembrado inicial. Ver la guía completa en la conversación
donde se entregó este proyecto, o seguir estos pasos generales:

1. Crea cuenta gratis en https://github.com y sube esta carpeta a un repositorio nuevo (botón
   "uploading an existing file", arrastras la carpeta descomprimida).
2. Crea cuenta gratis en https://neon.tech, crea un proyecto Postgres y copia su
   "connection string" (empieza con `postgresql://...`).
3. Crea cuenta gratis en https://vercel.com con tu cuenta de GitHub, importa el repositorio.
4. En "Environment Variables" agrega:
   - `DATABASE_URL` = el connection string de Neon
   - `NEXTAUTH_SECRET` = cualquier texto largo y aleatorio
   - `NEXTAUTH_URL` = la URL que Vercel te asigne (puedes ponerla después del primer deploy y
     volver a desplegar)
5. Dale a "Deploy". Cuando termine, abres el link que te da Vercel — esa es tu app funcionando.

## Requisitos previos (para correrla en tu computadora en vez de publicarla)

- Node.js 18 o superior
- PostgreSQL corriendo localmente (o remoto). Si no tienes uno, la forma más simple es Docker:

  ```bash
  docker run --name bettrack-postgres -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=bettrack_mx -p 5432:5432 -d postgres:16
  ```

## Instalación

```bash
npm install
cp .env.example .env
# Edita .env: pon tu DATABASE_URL real y genera NEXTAUTH_SECRET con:
#   openssl rand -base64 32

npx prisma migrate dev --name init   # crea las tablas
npm run db:seed                      # siembra casas de apuestas, deportes y ligas

npm run dev
```

Abre http://localhost:3000, crea una cuenta y empieza a registrar apuestas.

## Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Corre el build de producción |
| `npm run db:migrate` | Aplica migraciones de Prisma |
| `npm run db:seed` | Siembra el catálogo inicial (casas, deportes, ligas) |
| `npm run db:studio` | Abre Prisma Studio (explorador visual de la base de datos) |

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/           # login, registro, recuperación de contraseña
│   ├── (app)/             # dashboard, bets, bankroll, responsible-gambling, settings (protegidas)
│   └── api/                # todas las rutas de API (REST sobre App Router)
├── components/
│   ├── bets/               # formulario y tabla de historial
│   ├── bankroll/
│   ├── dashboard/
│   ├── responsible/
│   ├── settings/
│   ├── layout/             # navegación
│   └── ui/                  # componentes visuales reutilizables
├── lib/
│   ├── calculations.ts      # TODA la lógica financiera (profit, ROI, win rate, bankroll)
│   ├── auth.ts               # configuración NextAuth
│   ├── session.ts             # helper de sesión para API routes / server components
│   ├── validations.ts          # schemas Zod compartidos
│   └── prisma.ts
└── types/
prisma/
├── schema.prisma
└── seed.ts
```

## Decisiones de arquitectura importantes

- **El bankroll nunca se guarda como campo mutable.** Se calcula siempre a partir de las
  transacciones de bankroll (depósitos, retiros, bonos, ajustes) + la ganancia/pérdida neta de
  apuestas resueltas. Esto evita que el número se desincronice si se edita una apuesta pasada.
- **Los cálculos financieros trabajan en centavos** (enteros) internamente para evitar errores de
  redondeo de punto flotante, y solo se convierten a pesos al mostrarse.
- **Apuestas anuladas (VOID) no cuentan** para ROI ni win rate, pero tampoco generan pérdida — el
  stake se considera "no jugado".
- **Autorización a nivel de fila:** cada query de apuestas/bankroll filtra explícitamente por
  `userId` de la sesión activa; nunca se confía en IDs que vengan del cliente sin verificar
  propiedad primero (ver `getOwnedBet` en `api/bets/[id]/route.ts`).

## Sobre integraciones con casas de apuestas

Playdoit, Draftea, Caliente, Codere y bet365 **no tienen una API pública documentada** para
obtener el historial de apuestas de un usuario. Por eso el MVP usa registro 100% manual.

La arquitectura ya está preparada para integraciones oficiales futuras si alguna vez existen:

- El modelo `Sportsbook` en `prisma/schema.prisma` tiene un campo `apiIntegrationConfig Json?`
  reservado para guardar configuración de una integración oficial (sin usarlo todavía).
- Como las apuestas se relacionan con `Sportsbook` por `sportsbookId`, agregar una fuente
  automática de apuestas en el futuro no requeriría cambiar el modelo de datos, solo un nuevo
  "importador" que cree registros `Bet` de la misma forma que lo hace el formulario manual.

**No se implementó scraping ni almacenamiento de credenciales de usuario de ningún sportsbook,
como se pidió explícitamente.**

## Panel administrativo (no incluido en este MVP)

El schema ya modela `Sportsbook`, `Sport` y `League` como catálogos independientes con
`isActive: Boolean`, listos para que un futuro panel admin los edite sin tocar el resto del
código. No se construyó UI de administración en este MVP, según lo indicado.

## Próximos pasos sugeridos

1. Agregar tests para `lib/calculations.ts` (es la lógica más crítica del producto).
2. Servicio de email real (Resend, SendGrid, etc.) para recuperación de contraseña — hoy el link
   se muestra en consola/UI solo en modo desarrollo.
3. Desplegar en Vercel (frontend/API) + una base de datos administrada como Neon, Supabase o
   Railway (todas tienen tier gratuito con PostgreSQL).
4. Panel de administración básico usando los catálogos ya modelados.
