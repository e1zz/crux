const API_BASE = "http://localhost:3001";

type ApiResult<T> = { success: true; data: T } | { success: false; error: string; status: number };

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  baseUrl = API_BASE,
): Promise<ApiResult<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return res.json();
}

export async function apiGet<T = unknown>(
  path: string,
  baseUrl = API_BASE,
): Promise<ApiResult<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(10_000),
  });
  return res.json();
}
