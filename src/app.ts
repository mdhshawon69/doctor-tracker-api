import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import mongoose from "mongoose"

import { config } from "./config.js"
import { connectToDatabase } from "./db.js"
import { errorHandler } from "./lib/http.js"
import authRoutes from "./routes/auth.js"
import dashboardRoutes from "./routes/dashboard.js"
import doctorRoutes from "./routes/doctors.js"
import filterRoutes from "./routes/filters.js"
import patientRoutes from "./routes/patients.js"

export function createApp() {
  const app = express()

  // Vercel and other reverse proxies terminate TLS before the request reaches us.
  if (config.trustProxy) {
    app.set("trust proxy", 1)
  }

  app.disable("x-powered-by")

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin requests and non-browser clients arrive without an Origin.
        if (!origin || config.frontendOrigins.includes(origin)) {
          callback(null, true)
          return
        }

        callback(null, false)
      },
      credentials: true,
    })
  )

  app.use(express.json({ limit: "100kb" }))
  app.use(cookieParser())

  /**
   * Serverless platforms do not have a startup phase, so the first request of a
   * cold instance opens the database connection. When it is already open this
   * is only a `readyState` check.
   */
  app.use(async (_request, _response, next) => {
    try {
      await connectToDatabase()
    } catch (error) {
      // The data routes retry the connection and report a JSON 500 instead of
      // letting the whole function crash with an HTML error page.
      console.error("[api] database connection failed", error)
    }

    next()
  })

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    })
  })

  app.use("/api/auth", authRoutes)
  app.use("/api/doctors", doctorRoutes)
  app.use("/api/patients", patientRoutes)
  app.use("/api/filters", filterRoutes)
  app.use("/api/dashboard", dashboardRoutes)

  app.use((_request, response) => {
    response.status(404).json({ error: "Not found." })
  })

  app.use(errorHandler)

  return app
}

/**
 * Vercel's zero-configuration Express support looks for a default export (or an
 * `app.listen` call) in `app`, `index` or `server` at the project root or under
 * `src/`. This default export is what the platform deploys as a single Function.
 */
const app = createApp()

export default app
