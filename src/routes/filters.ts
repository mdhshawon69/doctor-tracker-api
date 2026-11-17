import { Router } from "express"

import { requireAuth } from "../auth.js"
import { getFilterOptions } from "../services/filters.js"

const router = Router()

router.get("/", requireAuth, async (_request, response) => {
  const options = await getFilterOptions()

  response.json({ data: options })
})

export default router
