# AIRMAX ISP ecosystem

Production-oriented ISP system composed of a React Native CLI mobile client, NestJS REST API, Next.js operations dashboard, PostgreSQL, Redis, and a server-only MikroTik integration boundary.

## Run locally

Requirements: Node 22+, npm, Android Studio or Xcode, and Docker.

```bash
npm ci
docker compose up -d
cp server/.env.example server/.env
npm --prefix server ci
npm --prefix server run prisma:generate
npm --prefix server run prisma:migrate
npm --prefix admin ci
npm start
```

Run `npm run android` or `npm run ios` for the native mobile app, `npm --prefix server run dev` for the API, and `npm --prefix admin run dev` for the web dashboard. The Android development command builds only the connected device architecture to keep native builds fast and disk-efficient; use `npm run android:all-architectures` only when an all-ABI debug artifact is specifically required.

See [docs/architecture.md](docs/architecture.md) for service boundaries and [server/README.md](server/README.md) for the REST route map.

Demo login values are prefilled while the mobile app is running in development mode. Select **Customer** or **Admin**, then sign in. Any six digits work in the demo OTP flow.

## Architecture

- `App.tsx` and `src/navigation/` — React Navigation root, guarded native stacks, and role-specific tabs
- `app/` — customer, admin, authentication, and shared screen components
- `src/components/` — reusable card, input, button, badge and state components
- `src/features/` — feature validation and domain logic
- `src/services/` — typed REST transport, development fixtures, notifications, and network adapter boundary
- `src/store/` — persisted auth and local workflow state with Zustand
- `server/` — NestJS API, Prisma domain model, Redis integration, Socket.io, and server-only MikroTik adapter
- `admin/` — Next.js operations dashboard
- `assets/images/splash.png` — original AIRMAX telecom splash artwork

TanStack Query owns server state; Zustand owns session and local UI workflow state. React Hook Form + Zod validate authentication. Secrets and direct router/OLT credentials must stay on a secure backend—never in the mobile bundle.

The UI uses bundled Manrope typography with Space Grotesk display headings, responsive 320px-to-tablet content metrics, safe-area-aware scrolling, keyboard avoidance, and tab bars that include the Android gesture/three-button navigation inset.

## Backend setup

1. Start PostgreSQL and Redis with `docker compose up -d`.
2. Copy `server/.env.example` to `server/.env`, then replace development secrets.
3. Run `npm --prefix server run prisma:migrate` and `npm --prefix server run dev`.
4. Select the existing native environment flavor for mobile builds; production
   endpoints remain owned by the native Android/iOS build configuration.
5. Configure provider webhooks, push credentials, object storage, and MikroTik credentials on the server only.

Passwords are hashed by the API, refresh-token hashes live in PostgreSQL, and transient OTP challenges live in Redis. The mobile and web clients never receive infrastructure credentials.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm --prefix server run build
npm --prefix admin run build
```

For production builds, configure native signing, APNs/FCM credentials, payment providers, error reporting, deep links, privacy copy, HTTPS API origins, and secret management.

## Production foundation commands

Production configuration is injected by the deployment environment. The API
does not load `server/.env` when `NODE_ENV=production`, and it refuses local or
unencrypted database, Redis, CORS, and optional MikroTik dependency endpoints.
See `server/.env.example` for the complete production requirements.

```bash
npm --prefix server ci
npm --prefix server run prisma:generate
npm --prefix server run build
npm --prefix server run db:deploy:preflight
npm --prefix server run db:deploy:safe
npm --prefix server run db:deploy:verify
npm --prefix server run start:prod

AIRMAX_API_URL=https://api.example.com/api/v1 npm --prefix admin run build
npm --prefix admin run start

npm run android:production:assemble
npm run android:production:bundle
```

Native release commands require the existing platform signing configuration.
They do not provision keys, certificates, providers, or deployment services.
Database release approvals, backup evidence, target pinning, verification, and
manual recovery are defined in
[`docs/database-deployment-runbook.md`](docs/database-deployment-runbook.md).
Provider-neutral backup requirements, evidence validation, and isolated restore
rehearsals are defined in
[`docs/database-backup-policy.md`](docs/database-backup-policy.md).
