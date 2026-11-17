import { ZodError } from "zod";
export class HttpError extends Error {
    status;
    fields;
    constructor(status, message, fields) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.fields = fields;
    }
}
export function buildPagination(total, page, limit) {
    return {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}
function firstValue(value) {
    return typeof value === "string" ? value : undefined;
}
/**
 * Express hands query strings back as `string | string[] | ...`. Keeping only
 * the first string matches how the browser builds these URLs and stops an
 * array from reaching Zod's coercion.
 */
export function parseListQuery(query) {
    return {
        page: firstValue(query.page),
        limit: firstValue(query.limit),
        q: firstValue(query.q),
        range: firstValue(query.range),
        specialization: firstValue(query.specialization),
        hospital: firstValue(query.hospital),
        condition: firstValue(query.condition),
        doctorId: firstValue(query.doctorId),
    };
}
export const errorHandler = (error, _request, response, _next) => {
    if (error instanceof ZodError) {
        response.status(422).json({
            error: "Please check the submitted values.",
            fields: error.flatten().fieldErrors,
        });
        return;
    }
    if (error instanceof HttpError) {
        response.status(error.status).json({
            error: error.message,
            ...(error.fields ? { fields: error.fields } : {}),
        });
        return;
    }
    // body-parser reports malformed JSON with this marker.
    if (typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "entity.parse.failed") {
        response.status(400).json({ error: "The request body is not valid JSON." });
        return;
    }
    // MongoDB's unique index is the final guard against duplicate records.
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        response.status(409).json({
            error: "A record with that email already exists.",
            fields: { email: ["A record with that email already exists."] },
        });
        return;
    }
    console.error("[api]", error);
    response.status(500).json({ error: "Something went wrong. Please try again." });
};
//# sourceMappingURL=http.js.map