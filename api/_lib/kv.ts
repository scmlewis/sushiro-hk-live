import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function kvGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await redis.set(key, value);
}

export async function kvDel(key: string): Promise<void> {
  await redis.del(key);
}

export async function kvKeys(pattern: string): Promise<string[]> {
  return redis.keys(pattern);
}
