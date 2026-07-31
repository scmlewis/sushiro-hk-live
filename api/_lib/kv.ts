import { kv } from '@vercel/kv';

export async function kvGet<T>(key: string): Promise<T | null> {
  return kv.get<T>(key);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await kv.set(key, value);
}

export async function kvDel(key: string): Promise<void> {
  await kv.del(key);
}

export async function kvKeys(pattern: string): Promise<string[]> {
  return kv.keys(pattern);
}
