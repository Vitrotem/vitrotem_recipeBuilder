"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { acceptInvite } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    if (!isLoggedIn()) {
      router.replace(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }

    let cancelled = false;
    (async () => {
      setStatus("working");
      try {
        const org = await acceptInvite(token);
        if (cancelled) return;
        setOrgName(org.name);
        setStatus("done");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to accept invite");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1>Organization invite</h1>
        </div>
        {status === "working" || status === "idle" ? (
          <p>Accepting invite…</p>
        ) : status === "done" ? (
          <>
            <p>
              You joined <strong>{orgName}</strong>.
            </p>
            <Link href="/account" className="btn btn-primary">
              Go to account
            </Link>
          </>
        ) : (
          <>
            <div className="alert">{error}</div>
            <Link href="/" className="btn btn-ghost">
              Back home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
