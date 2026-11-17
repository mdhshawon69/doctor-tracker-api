import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import mongoose from "mongoose"

import { config } from "./config.js"
import { errorHandler } from "./lib/http.js"
import authRoutes from "./routes/auth.js"
import dashboardRoutes from "./routes/dashboard.js"
import doctorRoutes from "./routes/doctors.js"
import filterRoutes from "./routes/filters.js"
import patientRoutes from "./routes/patients.js"

export function createApp() {
  const app = express()

  // Heroku and other reverse proxies terminate TLS before the request reaches us.
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
