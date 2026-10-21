"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { login, register } from "@/lib/api";
import { isLoggedIn, setToken } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page"><div className="login-card">Loading…</div></div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.replace(next);
  }, [router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token =
        mode === "login"
          ? await login(username, password)
          : await register(username, password);
      setToken(token);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <span className="brand-mark login-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4L12 2.5zm0 2.3L6 8.1v7.8l6 3.5 6-3.5V8.1L12 4.8z" />
            </svg>
          </span>
          <h1>vitroTEM</h1>
        </div>
        <p>
          {mode === "login"
            ? "Sign in to the graphene liquid cell recipe builder"
            : "Create an account to save recipes and join organizations"}
        </p>
        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`login-tab${mode === "login" ? " active" : ""}`}
            aria-selected={mode === "login"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            className={`login-tab${mode === "register" ? " active" : ""}`}
            aria-selected={mode === "register"}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
          >
            Create account
          </button>
        </div>
        {error && <div className="alert">{error}</div>}
        <label>
          Username
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 6 : undefined}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading
            ? mode === "login"
              ? "Signing in…"
              : "Creating…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}
