import { env } from "@/schemas/env-schema-server";
import { Redis } from "@upstash/redis";

export const redisClient = new Redis({
    url: env.REDIS_URL,
    token: env.REDIS_TOKEN
})