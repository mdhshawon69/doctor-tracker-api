import { z } from "zod";
import { CONDITIONS, DATE_RANGES, DEFAULT_PAGE_SIZE, GENDERS, MAX_PAGE_SIZE, SPECIALIZATIONS, } from "./constants.js";
const phoneRegex = /^[+()\d][\d\s\-().]{6,19}$/;
const objectIdRegex = /^[a-f\d]{24}$/i;
export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required").max(128),
});
export const doctorInputSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    specialization: z.enum(SPECIALIZATIONS, { message: "Choose a specialization" }),
    hospital: z.string().trim().min(2, "Hospital is required").max(160),
    phone: z
        .string()
        .trim()
        .regex(phoneRegex, "Enter a valid phone number")
        .max(24),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(160),
});
export const patientInputSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    age: z.coerce
        .number()
        .int("Age must be a whole number")
        .min(0, "Age cannot be negative")
        .max(120, "Age must be 120 or below"),
    gender: z.enum(GENDERS, { message: "Choose a gender" }),
    condition: z.enum(CONDITIONS, { message: "Choose a condition" }),
    phone: z
        .string()
        .trim()
        .regex(phoneRegex, "Enter a valid phone number")
        .max(24),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(160),
    doctorId: z.string().regex(objectIdRegex, "Choose a doctor"),
});
export const objectIdSchema = z.string().regex(objectIdRegex, "Invalid id");
const rangeValues = DATE_RANGES.map((option) => option.value);
/**
 * Query strings always arrive as text. The `.catch()` calls keep a malformed
 * page/limit from producing a 500 while still bounding what a client can ask for.
 */
export const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
    q: z.string().trim().max(80).catch(""),
    range: z.enum(rangeValues).catch("all"),
    specialization: z.string().trim().max(80).catch(""),
    hospital: z.string().trim().max(160).catch(""),
    condition: z.string().trim().max(80).catch(""),
    doctorId: z.string().trim().catch(""),
});
//# sourceMappingURL=validation.js.map