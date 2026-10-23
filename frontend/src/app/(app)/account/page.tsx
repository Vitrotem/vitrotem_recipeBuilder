"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import OrgIcon from "@/components/OrgIcon";
import PageLoading, { useLoadingMessage } from "@/components/PageLoading";
import { useUser } from "@/components/UserContext";
import {
  createInvite,
  createOrganization,
  deleteOrganizationIcon,
  listOrganizationMembers,
  uploadOrganizationIcon,
} from "@/lib/api";
import { resizeImageToSquare } from "@/lib/resizeImage";

type Member = { id: string; username: string };

function MembersLoadingHint() {
  const text = useLoadingMessage("Loading members…");
  return <p className="empty-hint">{text}</p>;
}

export default function AccountPage() {
  return <AccountInner />;
}

function AccountInner() {
  const { user, loading, refresh } = useUser();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [membersByOrg, setMembersByOrg] = useState<Record<string, Member[]>>({});
  const [membersLoading, setMembersLoading] = useState(false);
  const iconInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadMembers = useCallback(async () => {
    const orgs = user?.organizations ?? [];
    if (orgs.length === 0) {
      setMembersByOrg({});
      return;
    }
    setMembersLoading(true);
    try {
      const entries = await Promise.all(
        orgs.map(async (org) => {
          try {
            const members = await listOrganizationMembers(org.id);
            return [org.id, members] as const;
          } catch {
            return [org.id, [] as Member[]] as const;
          }
        }),
      );
      setMembersByOrg(Object.fromEntries(entries));
    } finally {
      setMembersLoading(false);
    }
  }, [user?.organizations]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

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

  async function onUploadIcon(orgId: string, file: File | null) {
    if (!file) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const resized = await resizeImageToSquare(file, 100);
      await uploadOrganizationIcon(orgId, resized);
      setMessage("Organization icon updated.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload icon");
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveIcon(orgId: string) {
    if (!confirm("Remove this organization icon?")) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await deleteOrganizationIcon(orgId);
      setMessage("Organization icon removed.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove icon");
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
        <PageLoading />
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
              Icons are resized to 100×100 before upload.
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
                {user!.organizations.map((org) => {
                  const members = membersByOrg[org.id] ?? [];
                  return (
                    <li key={org.id} className="org-card">
                      <div className="org-row">
                        <span className="org-name">
                          <OrgIcon
                            orgId={org.id}
                            iconId={org.icon_id}
                            name={org.name}
                            size={40}
                            className="org-icon-lg"
                          />
                          {org.name}
                        </span>
                        <div className="org-icon-actions">
                          <input
                            ref={(el) => {
                              iconInputRefs.current[org.id] = el;
                            }}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              e.target.value = "";
                              void onUploadIcon(org.id, file);
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={busy}
                            onClick={() => iconInputRefs.current[org.id]?.click()}
                          >
                            {org.icon_id ? "Change icon" : "Upload icon"}
                          </button>
                          {org.icon_id ? (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={busy}
                              onClick={() => void onRemoveIcon(org.id)}
                            >
                              Remove icon
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={busy}
                            onClick={() => onInvite(org.id)}
                          >
                            Create invite link
                          </button>
                        </div>
                      </div>
                      <div className="org-members">
                        <p className="org-members-label">Members</p>
                        {membersLoading && !membersByOrg[org.id] ? (
                          <MembersLoadingHint />
                        ) : members.length === 0 ? (
                          <p className="empty-hint">No members found.</p>
                        ) : (
                          <ul className="member-list">
                            {members.map((member) => (
                              <li key={member.id} className="member-chip">
                                {member.username}
                                {member.id === user?.id ? (
                                  <span className="member-you">you</span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
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
