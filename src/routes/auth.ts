import { Router, type NextFunction, type Request, type Response } from "express"

import { authenticate, requireAuth, sessionCookieOptions, signSessionToken } from "../auth.js"
import { config } from "../config.js"
import { HttpError } from "../lib/http.js"
import {
  changePassword,
  countUsers,
  createUser,
  listUsers,
  setUserPassword,
} from "../services/users.js"
import type { SessionUser } from "../types.js"
import {
  loginSchema,
  passwordChangeSchema,
  passwordResetSchema,
  registerSchema,
} from "../validation.js"

const router = Router()

function currentUser(response: Response) {
  return response.locals.user as SessionUser
}

function requireAdmin(_request: Request, response: Response, next: NextFunction) {
  if (currentUser(response)?.role !== "admin") {
    response.status(403).json({ error: "Only administrators can manage accounts." })
    return
  }

  next()
}

/**
 * The frontend calls this before showing the sign-in form. When the users
 * collection is empty the very first account can be created from the app, so
 * no admin credentials ever have to be written into `.env`.
 */
router.get("/setup", async (_request, response) => {
  const total = await countUsers()

  response.json({ data: { needsSetup: total === 0 } })
})

router.post("/register", async (request, response) => {
  const input = registerSchema.parse(request.body ?? null)

  // Open sign-up only until the workspace has its first administrator.
  if ((await countUsers()) > 0) {
    throw new HttpError(
      403,
      "This workspace already has an account. Ask an administrator to create one for you."
    )
  }

  const user = await createUser(input)
  const token = await signSessionToken(user)

  response.cookie(config.cookie.name, token, sessionCookieOptions())
  response.status(201).json({ data: user })
})

router.post("/login", async (request, response) => {
  const input = loginSchema.parse(request.body ?? null)
  const user = await authenticate(input.email, input.password)

  if (!user) {
    response.status(401).json({ error: "Invalid email or password." })
    return
  }

  const token = await signSessionToken(user)
  response.cookie(config.cookie.name, token, sessionCookieOptions())
  response.json({ data: user })
})

router.post("/logout", (_request, response) => {
  response.clearCookie(config.cookie.name, {
    httpOnly: true,
    sameSite: config.cookie.sameSite,
    secure: config.cookie.secure,
    domain: config.cookie.domain,
    path: "/",
  })

  response.json({ data: { ok: true } })
})

router.get("/me", requireAuth, (_request, response) => {
  response.json({ data: currentUser(response) })
})

router.post("/password", requireAuth, async (request, response) => {
  const input = passwordChangeSchema.parse(request.body ?? null)

  await changePassword(currentUser(response).id, input.currentPassword, input.newPassword)

  response.json({ data: { ok: true } })
})

router.get("/users", requireAuth, requireAdmin, async (_request, response) => {
  const users = await listUsers()

  response.json({ data: users })
})

router.post("/users", requireAuth, requireAdmin, async (request, response) => {
  const input = registerSchema.parse(request.body ?? null)
  const user = await createUser(input)

  response.status(201).json({ data: user })
})

router.patch("/users/:id/password", requireAuth, requireAdmin, async (request, response) => {
  const input = passwordResetSchema.parse(request.body ?? null)
  const userId = request.params.id

  await setUserPassword(typeof userId === "string" ? userId : "", input.password)

  response.json({ data: { ok: true } })
})

export default router
