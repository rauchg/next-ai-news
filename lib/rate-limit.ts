import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error(
    "Please link a Vercel KV instance or populate `KV_REST_API_URL` and `KV_REST_API_TOKEN`"
  );
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

export const signUpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "15 m"),
  analytics: true,
  prefix: "ratelimit:signup",
});

export const newStoryRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "15 m"),
  analytics: true,
  prefix: "ratelimit:newstory",
});

export const newCommentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:newcomment",
});
