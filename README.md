# Doctor Tracker API

Express 5 + MongoDB (Mongoose) API for the Doctor Tracker frontend. It is
deployed as a single Vercel serverless function and can also run as a normal
long-lived Node process.

## Authentication

Accounts are **stored in MongoDB**, not in environment variables.

- Passwords are hashed with bcrypt; the hash never leaves the server.
- A successful sign-in returns a signed JWT in an `httpOnly` cookie, so browser
  JavaScript never sees the token.
- `.env` now only holds infrastructure settings (`MONGODB_URI`, `AUTH_SECRET`,
  `FRONTEND_ORIGIN`, cookie flags). No `ADMIN_*` values exist anymore.

### First-run bootstrap

The first account is created through the API itself:

```bash
# 1. Ask whether the workspace is empty
curl http://localhost:4000/api/auth/setup
# { "data": { "needsSetup": true } }

# 2. Create the first administrator (only allowed while no users exist)
curl -i -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dara Whitfield","email":"admin@careguide.app","password":"Admin@12345"}'
```

`POST /api/auth/register` returns `403` once at least one account exists, so it
cannot be used for open sign-up afterwards.

### Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | – | Liveness + Mongo connection state |
| `GET` | `/api/auth/setup` | – | `{ needsSetup }` for the first-run screen |
| `POST` | `/api/auth/register` | – (only while empty) | Create the first administrator |
| `POST` | `/api/auth/login` | – | Sign in, sets the session cookie |
| `POST` | `/api/auth/logout` | – | Clear the session cookie |
| `GET` | `/api/auth/me` | cookie | Current session user |
| `POST` | `/api/auth/password` | cookie | Change your own password (`currentPassword`, `newPassword`) |
| `GET` | `/api/auth/users` | cookie | List accounts (admin only) |
| `POST` | `/api/auth/users` | cookie | Create an account (admin only) |
| `PATCH` | `/api/auth/users/:id/password` | cookie | Reset another account's password (admin only) |

Changing or resetting a password does not revoke already-issued session
cookies; they expire after 7 days. Rotate `AUTH_SECRET` to invalidate every
session at once.

All other routes (`/api/doctors`, `/api/patients`, `/api/filters`,
`/api/dashboard`) require the session cookie.

## Local development

```bash
npm install
cp .env.example .env      # fill in MONGODB_URI and AUTH_SECRET
npm run dev               # tsx watch src/index.ts
```

Optional demo data (doctors + patients only, never accounts):

```bash
npm run seed
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

## Deploying to Vercel

Vercel's zero-configuration Express support detects this project (the `express`
dependency plus `src/app.ts` importing it) and deploys `src/app.ts` as a single
Function. `src/app.ts` default-exports the Express app, and `vercel.json` only
sets the install/build commands. The app never calls `app.listen` on Vercel, and
the database connection is opened lazily on the first request of a cold
instance.

1. Push the repository to GitHub and import it in Vercel.
2. Framework preset: **Express** (detected automatically; select it manually if
   the dashboard asks). Build command `npm run build`.
3. Add the environment variables:

   | Variable | Example | Notes |
   | --- | --- | --- |
   | `MONGODB_URI` | `mongodb+srv://…/doctor-tracker` | Atlas cluster |
   | `AUTH_SECRET` | `openssl rand -base64 32` | Same value for every deployment |
   | `FRONTEND_ORIGIN` | `https://app.example.com` | Comma-separated for previews |
   | `NODE_ENV` | `production` | Vercel sets this automatically |

   Optional: `COOKIE_SAMESITE`, `COOKIE_SECURE`, `COOKIE_DOMAIN`,
   `SESSION_COOKIE_NAME`, `TRUST_PROXY`.

4. In MongoDB Atlas, add `0.0.0.0/0` (or Vercel's egress range) to the cluster's
   IP access list, otherwise the function cannot connect.
5. Deploy, then run the first-run `POST /api/auth/register` against
   `https://<project>.vercel.app` to create the administrator.

### Cross-site cookies

This API is meant to be deployed on its own Vercel domain, with the frontend on
a different origin. In that setup `FRONTEND_ORIGIN` must be the exact frontend
origin (no trailing slash) and the cookie must be
`SameSite=None; Secure`. That is applied automatically in production when
`FRONTEND_ORIGIN` uses `https://`; override with `COOKIE_SAMESITE=lax` if you
later put the frontend behind the same site.

The frontend must send requests with `credentials: "include"` (for example
`fetch(url, { credentials: "include" })`) for the cookie to travel at all.

## Notes for existing deployments

If you seeded the admin account from the old `ADMIN_*` variables, that account
already lives in MongoDB and keeps working. Delete those variables from Vercel
and from your local `.env`; change the password from the app if it was a
default one.
