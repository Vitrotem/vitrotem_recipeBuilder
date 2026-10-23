"use client";

import {
  FormEvent,
  useEffect,
  useState,
  Suspense,
  type InputHTMLAttributes,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLoading, { useLoadingMessage } from "@/components/PageLoading";
import { login, register, wakeBackend } from "@/lib/api";
import { isLoggedIn, setToken } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <div className="login-card">
            <PageLoading />
          </div>
        </div>
      }
    >
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const busyLabel = mode === "login" ? "Signing in…" : "Creating…";
  const submitLabel = useLoadingMessage(busyLabel, loading);

  useEffect(() => {
    wakeBackend();
  }, []);

  useEffect(() => {
    if (isLoggedIn()) router.replace(next);
  }, [router, next]);

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

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
      <form
        className="login-card"
        onSubmit={onSubmit}
        // Remount when switching modes so browsers re-offer password generation
        key={mode}
        autoComplete={mode === "register" ? "on" : "on"}
      >
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
            ? "Sign in to the graphene liquid cell protocol builder"
            : "Create an account to save protocols and join organizations"}
        </p>
        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`login-tab${mode === "login" ? " active" : ""}`}
            aria-selected={mode === "login"}
            onClick={() => switchMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            className={`login-tab${mode === "register" ? " active" : ""}`}
            aria-selected={mode === "register"}
            onClick={() => switchMode("register")}
          >
            Create account
          </button>
        </div>
        {error && <div className="alert">{error}</div>}
        <label htmlFor="login-username">
          Username
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label htmlFor="login-password">
          Password
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : undefined}
            // Safari / Apple Keychain strong password generation
            {...(mode === "register"
              ? ({
                  passwordrules:
                    "minlength: 8; required: lower; required: upper; required: digit; required: [-!@#$%^&*()];",
                } as InputHTMLAttributes<HTMLInputElement>)
              : {})}
          />
        </label>
        {mode === "register" && (
          <label htmlFor="login-password-confirm">
            Confirm password
            <input
              id="login-password-confirm"
              name="password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
        )}
        {mode === "register" && (
          <p className="login-password-hint">
            Use your browser’s password manager to generate a strong password.
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? submitLabel : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
