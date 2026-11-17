import { Router } from "express";
import { requireAuth } from "../auth.js";
import { parseListQuery } from "../lib/http.js";
import { createDoctor, getDoctor, listDoctors } from "../services/doctors.js";
import { doctorInputSchema, listQuerySchema } from "../validation.js";
const router = Router();
router.use(requireAuth);
router.get("/", async (request, response) => {
    const query = listQuerySchema.parse(parseListQuery(request.query));
    const result = await listDoctors(query);
    response.json({ data: result.data, pagination: result.pagination });
});
router.post("/", async (request, response) => {
    const input = doctorInputSchema.parse(request.body ?? null);
    const doctor = await createDoctor(input);
    response.status(201).json({ data: doctor });
});
router.get("/:id", async (request, response) => {
    const doctor = await getDoctor(request.params.id ?? "");
    if (!doctor) {
        response.status(404).json({ error: "Doctor not found." });
        return;
    }
    response.json({ data: doctor });
});
export default router;
//# sourceMappingURL=doctors.js.map