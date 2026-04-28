/**
 * shared/http-utils.ts
 */

export async function post<T>(
  url: string,
  headers: Record<string, string>,
  body: T,
  { timeoutMs = 5000 }: { timeoutMs?: number } = {},
): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${text}`);
  }

  return res.json();
}

export async function get(
  url: string,
  headers: Record<string, string>,
  { timeoutMs = 5000 }: { timeoutMs?: number } = {},
): Promise<any> {
  const res = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${text}`);
  }

  return res.json();
}
