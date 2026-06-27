import { userRoles } from "@/drizzle/schema";
import z from "zod";
import crypto from 'crypto';
import { redisClient } from "@/redis/redis";

const SESSION_EXPIRATION_SECONDS = 60 * 24 * 7;
const COOKIE_SESSION_KEY = "custom-auth-session-id";

const sessionSchema = z.object({
    id: z.string(),
    role: z.enum(userRoles)
});

type UserSession = z.infer<typeof sessionSchema>; 
export type Cookies = {
    set: (
        key: string,
        value: string,
        options: {
            secure?: boolean
            httpOnly?: boolean
            sameSite?: "strict" | "lax"
            expires?: Date
        }
    ) => void
    get: (key: string) => { name: string, value: string } | undefined
    delete: (key: string) => void
};

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
    console.log("Setting cookie:", sessionId);
    cookies.set(COOKIE_SESSION_KEY, sessionId, {
        secure: true,
        httpOnly: true,
        sameSite: "strict",
        expires: new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000),
    })
}

export async function createUserSession(user: UserSession, cookies: Pick<Cookies, "set">) {
    const sessionId = crypto.randomBytes(512).toString("hex").normalize();
    await redisClient.set(`session:${sessionId}`, JSON.stringify(sessionSchema.parse(user)), {
        ex: SESSION_EXPIRATION_SECONDS
    });

    setCookie(sessionId, cookies);
}

export async function getUserSessionById(sessionId: string) {
    const rawUser = await redisClient.get(`session:${sessionId}`);
    const { success, data: user } = sessionSchema.safeParse(rawUser);

    return success ? user : null;
}

export async function getUserFromSession(cookies: Pick<Cookies, 'get'>) {
    const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
    if (sessionId == null) return null;

    return await getUserSessionById(sessionId);
}

export async function removeUserFrmSession(cookies: Pick<Cookies, 'get' | 'delete'>) {
    const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
    if (sessionId == null) return null;

    await redisClient.del(`session:${sessionId}`);
    cookies.delete(COOKIE_SESSION_KEY);
}

export async function updateUserSessionData(user: UserSession, cookies: Pick<Cookies, 'get'>) {
    const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
    if (sessionId == null) return null;
    
    await redisClient.set(`session:${sessionId}`, JSON.stringify(sessionSchema.parse(user)), {
        ex: SESSION_EXPIRATION_SECONDS
    });
}

export async function updateUserSessionExpiration(cookies: Pick<Cookies, 'set' | 'get'>) {
    const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
    if (sessionId == null) return null;

    const user = await getUserSessionById(sessionId);
    if (user == null) return;

    await redisClient.set(`session:${sessionId}`, JSON.stringify(sessionSchema.parse(user)), {
        ex: SESSION_EXPIRATION_SECONDS
    });

    setCookie(sessionId, cookies);
}