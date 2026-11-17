import { Router } from "express";
import { requireAuth } from "../auth.js";
import { getDashboardData } from "../services/dashboard.js";
const router = Router();
router.get("/", requireAuth, async (_request, response) => {
    const data = await getDashboardData();
    response.json({ data });
});
export default router;
//# sourceMappingURL=dashboard.js.map