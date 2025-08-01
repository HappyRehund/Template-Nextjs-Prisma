import { redisClient } from "@/redis/redis";
import { sessionSchema } from "@/schemas/session";
import z from "zod";

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7
const COOKIE_SESSION_KEY = "session-id"

type UserSession = z.infer<typeof sessionSchema>;

export type Cookies = {
    set: (
        key: string,
        value: string,
        options: {
            secure?: boolean;
            httpOnly?: boolean;
            sameSite?: "strict" | "lax"
            expires?: number
        }
    ) => void
    get: (key: string) => { name: string; value: string } | undefined
    delete: (key: string) => void
}
// done
export function getUserFromSession(cookies: Pick<Cookies, "get">){
    const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
    if (sessionId == null) return null

    return getUserSessionById(sessionId)
}

export async function updateUserSessionData(
    user: UserSession,
    cookies: Pick<Cookies, "get">
) {
    const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
    if (sessionId == null) return null

    await redisClient.set(`session:${sessionId}`, sessionSchema.parse(user), {
        ex: SESSION_EXPIRATION_SECONDS
    })
}

//done 
export async function createUserSession(
    user: UserSession,
    cookies: Pick<Cookies, "set">
){
    // Gunakan Web Crypto API untuk generate session ID
    const array = new Uint8Array(64) // 512 bits
    crypto.getRandomValues(array)
    const sessionId = Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    
    await redisClient.set(`session:${sessionId}`, sessionSchema.parse(user), {
        ex: SESSION_EXPIRATION_SECONDS
    })

    setCookie(sessionId, cookies)
}

export async function updateUserSessionExpiration(
    cookies: Pick<Cookies, "get" | "set">
){
    const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
    if (sessionId == null) return null

    const user = await getUserSessionById(sessionId)
    if (user == null) return

    await redisClient.set(`session:${sessionId}`, user, {
        ex: SESSION_EXPIRATION_SECONDS
    })

    setCookie(sessionId, cookies)
}


export async function removeUserFromSession(
  cookies: Pick<Cookies, "get" | "delete">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
  if (sessionId == null) return null

  await redisClient.del(`session:${sessionId}`)
  cookies.delete(COOKIE_SESSION_KEY)
}

//done
function setCookie(sessionId: string, cookies: Pick<Cookies, "set">){
    cookies.set(COOKIE_SESSION_KEY, sessionId, {
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000 //milisekon
    })
}

//done
async function getUserSessionById(sessionId: string) {
    const rawUser = await redisClient.get(`session:${sessionId}`)

    const { success, data: user } = sessionSchema.safeParse(rawUser)

    return success ? user : null
}