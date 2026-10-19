import { getToken, clearToken } from "./auth";
import type { Recipe, RecipeInput } from "./types";

/** Same-origin proxy — backend URL stays in server-only `API_URL` (next.config rewrites). */
const API_BASE = "/api";

function authHeaders(json = true): Headers {
  const headers = new Headers();
  if (json) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

function handleUnauthorized(): never {
  clearToken();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
  throw new Error("Unauthorized");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) handleUnauthorized();
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(username: string, password: string): Promise<string> {
  const data = await request<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return data.access_token;
}

export async function listRecipes(params?: {
  q?: string;
  modality?: string;
  tag?: string;
}): Promise<Recipe[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.modality) sp.set("modality", params.modality);
  if (params?.tag) sp.set("tag", params.tag);
  const qs = sp.toString();
  return request(`/recipes${qs ? `?${qs}` : ""}`);
}

export async function getRecipe(id: string): Promise<Recipe> {
  return request(`/recipes/${id}`);
}

export async function createRecipe(body: RecipeInput): Promise<Recipe> {
  return request("/recipes", { method: "POST", body: JSON.stringify(body) });
}

export async function updateRecipe(id: string, body: RecipeInput): Promise<Recipe> {
  return request(`/recipes/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteRecipe(id: string): Promise<void> {
  return request(`/recipes/${id}`, { method: "DELETE" });
}

export async function uploadRecipeImage(
  recipeId: string,
  file: File,
  opts?: { caption?: string; kind?: string },
): Promise<Recipe> {
  const body = new FormData();
  body.append("file", file);
  if (opts?.caption) body.append("caption", opts.caption);
  if (opts?.kind) body.append("kind", opts.kind);
  return request(`/recipes/${recipeId}/images`, {
    method: "POST",
    body,
    headers: authHeaders(false),
  });
}

export async function deleteRecipeImage(recipeId: string, imageId: string): Promise<Recipe> {
  return request(`/recipes/${recipeId}/images/${imageId}`, { method: "DELETE" });
}

export async function fetchRecipeImageBlob(recipeId: string, imageId: string): Promise<Blob> {
  const headers = authHeaders(false);
  const res = await fetch(`${API_BASE}/recipes/${recipeId}/images/${imageId}`, { headers });
  if (res.status === 401) handleUnauthorized();
  if (!res.ok) throw new Error("Failed to load image");
  return res.blob();
}
