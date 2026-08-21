/**
 * Small fetch wrapper that attaches the JWT from localStorage (set at
 * login/register) as a Bearer token, and centralizes the API base URL.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token missing/expired — send the user back to log in.
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return response;
}
