import { compare } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { config, getAuthSecret } from "./config.js";
import { connectToDatabase } from "./db.js";
import { User } from "./models/user.js";
function getSecret() {
    return new TextEncoder().encode(getAuthSecret());
}
export async function signSessionToken(user) {
    return new SignJWT({
        name: user.name,
        email: user.email,
        role: user.role,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(`${config.cookie.maxAgeSeconds}s`)
        .sign(getSecret());
}
export async function verifySessionToken(token) {
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
        if (!payload.sub || typeof payload.email !== "string") {
            return null;
        }
        return {
            id: payload.sub,
            name: typeof payload.name === "string" ? payload.name : "Administrator",
            email: payload.email,
            role: "admin",
        };
    }
    catch {
        return null;
    }
}
export function sessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: config.cookie.sameSite,
        secure: config.cookie.secure,
        domain: config.cookie.domain,
        path: "/",
        maxAge: config.cookie.maxAgeSeconds * 1000,
    };
}
/**
 * Guards every data route. The JWT lives in an httpOnly cookie, so browser
 * JavaScript never has to hold or forward the token itself.
 */
export async function requireAuth(request, response, next) {
    const token = request.cookies?.[config.cookie.name];
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
        response.status(401).json({ error: "Your session has expired. Please sign in again." });
        return;
    }
    response.locals.user = session;
    next();
}
export async function authenticate(email, password) {
    await connectToDatabase();
    const user = await User.findOne({ email }).select("+passwordHash").lean();
    if (!user) {
        return null;
    }
    const passwordMatches = await compare(password, user.passwordHash);
    if (!passwordMatches) {
        return null;
    }
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
    };
}
//# sourceMappingURL=auth.js.map