import path from "node:path"
import { fileURLToPath } from "node:url"

import { config as loadEnv } from "dotenv"

/**
 * The compiled server lives in `dist/`, the sources in `src/`, and both sit one
 * level below the directory that holds `.env` and `.env.local`.
 */
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// `.env.local` is loaded first so it wins over the committed defaults.
loadEnv({ path: path.join(serverRoot, ".env.local"), quiet: true })
loadEnv({ path: path.join(serverRoot, ".env"), quiet: true })

const isProduction = process.env.NODE_ENV === "production"

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === "") {
    return fallback
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
}

function parseSameSite(value: string | undefined) {
  const normalised = (value ?? "lax").trim().toLowerCase()

  if (normalised === "strict" || normalised === "none" || normalised === "lax") {
    return normalised
  }

  throw new Error('COOKIE_SAMESITE must be "lax", "strict" or "none".')
}

const sameSite = parseSameSite(process.env.COOKIE_SAMESITE)

const frontendOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean)

// Local production builds still run over http://localhost, so only default to a
// Secure cookie when the configured frontend is actually served over HTTPS.
const servesOverHttps =
  frontendOrigins.length > 0 && frontendOrigins.every((origin) => origin.startsWith("https://"))

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/doctor-tracker",
  frontendOrigins,
  trustProxy: parseBoolean(process.env.TRUST_PROXY, isProduction),
  cookie: {
    name: process.env.SESSION_COOKIE_NAME ?? "doctor_tracker_session",
    maxAgeSeconds: 60 * 60 * 24 * 7,
    sameSite,
    // Browsers reject SameSite=None cookies unless they are also Secure.
    secure:
      sameSite === "none"
        ? true
        : parseBoolean(process.env.COOKIE_SECURE, isProduction && servesOverHttps),
    domain: process.env.COOKIE_DOMAIN?.trim() || undefined,
  },
} as const

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET

  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it to server/.env or server/.env.local before starting the API."
    )
  }

  return secret
}
