"use client";

import { FormEvent, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { useUser } from "@/components/UserContext";
import { createInvite, createOrganization } from "@/lib/api";

export default function AccountPage() {
  return (
    <AuthGuard>
      <AppShell>
        <AccountInner />
      </AppShell>
    </AuthGuard>
  );
}

function AccountInner() {
  const { user, loading, refresh } = useUser();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function onCreateOrg(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setInviteLink(null);
    setBusy(true);
    try {
      await createOrganization(orgName.trim());
      setOrgName("");
      setMessage("Organization created.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setBusy(false);
    }
  }

  async function onInvite(orgId: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const { token } = await createInvite(orgId);
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      setMessage("One-time invite link created. Copy it now — it won’t be shown again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setMessage("Invite link copied to clipboard.");
    } catch {
      setMessage("Could not copy — select the link manually.");
    }
  }

  return (
    <main className="page">
      <h1 className="page-title">Account</h1>
      <p className="page-sub">Manage your profile and organizations</p>

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : (
        <>
          <section className="form-section">
            <h2>Profile</h2>
            <p className="field-hint">
              Signed in as <strong>{user?.username}</strong>
            </p>
          </section>

          <section className="form-section">
            <h2>Organizations</h2>
            <p className="field-hint">
              Names are unique (case-insensitive) and may only contain letters, digits, and hyphens.
            </p>

            {error && <div className="alert">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}
            {inviteLink && (
              <div className="invite-link-box">
                <code className="invite-link">{inviteLink}</code>
                <button type="button" className="btn btn-primary" onClick={copyInvite}>
                  Copy link
                </button>
              </div>
            )}

            {(user?.organizations.length ?? 0) === 0 ? (
              <p className="empty-hint">You are not in any organizations yet.</p>
            ) : (
              <ul className="org-list">
                {user!.organizations.map((org) => (
                  <li key={org.id} className="org-row">
                    <span className="org-name">{org.name}</span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => onInvite(org.id)}
                    >
                      Create invite link
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form className="org-create-form" onSubmit={onCreateOrg}>
              <label>
                Create organization
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. my-lab"
                  pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*"
                  title="Letters, digits, and single hyphens only"
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Working…" : "Create"}
              </button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}
