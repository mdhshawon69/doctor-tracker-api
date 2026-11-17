import { Router } from "express";
import { requireAuth } from "../auth.js";
import { parseListQuery } from "../lib/http.js";
import { createPatient, deletePatient, listPatients, updatePatient, } from "../services/patients.js";
import { listQuerySchema, patientInputSchema } from "../validation.js";
const router = Router();
router.use(requireAuth);
router.get("/", async (request, response) => {
    const query = listQuerySchema.parse(parseListQuery(request.query));
    const result = await listPatients(query);
    response.json({ data: result.data, pagination: result.pagination });
});
router.post("/", async (request, response) => {
    const input = patientInputSchema.parse(request.body ?? null);
    const patient = await createPatient(input);
    response.status(201).json({ data: patient });
});
router.patch("/:id", async (request, response) => {
    const input = patientInputSchema.parse(request.body ?? null);
    const patient = await updatePatient(request.params.id ?? "", input);
    response.json({ data: patient });
});
router.delete("/:id", async (request, response) => {
    const result = await deletePatient(request.params.id ?? "");
    response.json({ data: result });
});
export default router;
//# sourceMappingURL=patients.js.map