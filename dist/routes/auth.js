import { Router } from "express";
import { authenticate, requireAuth, sessionCookieOptions, signSessionToken } from "../auth.js";
import { config } from "../config.js";
import { loginSchema } from "../validation.js";
const router = Router();
router.post("/login", async (request, response) => {
    const input = loginSchema.parse(request.body ?? null);
    const user = await authenticate(input.email, input.password);
    if (!user) {
        response.status(401).json({ error: "Invalid email or password." });
        return;
    }
    const token = await signSessionToken(user);
    response.cookie(config.cookie.name, token, sessionCookieOptions());
    response.json({ data: user });
});
router.post("/logout", (_request, response) => {
    response.clearCookie(config.cookie.name, {
        httpOnly: true,
        sameSite: config.cookie.sameSite,
        secure: config.cookie.secure,
        domain: config.cookie.domain,
        path: "/",
    });
    response.json({ data: { ok: true } });
});
router.get("/me", requireAuth, (_request, response) => {
    response.json({ data: response.locals.user });
});
export default router;
//# sourceMappingURL=auth.js.map