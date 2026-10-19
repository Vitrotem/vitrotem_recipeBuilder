"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { isLoggedIn, setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.replace("/");
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await login(username, password);
      setToken(token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
        <p>Sign in to the graphene liquid cell recipe builder</p>
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
