const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= max) return false;
  current.count += 1;
  return true;
}
