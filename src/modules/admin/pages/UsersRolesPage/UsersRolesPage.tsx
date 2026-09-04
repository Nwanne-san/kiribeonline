"use client";

import CheckRounded from "@mui/icons-material/CheckRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PersonAddAlt1Rounded from "@mui/icons-material/PersonAddAlt1Rounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedUrlParam } from "@/utils/hooks/useDebouncedUrlParam";
import { ApiMethods } from "../../../../../types/service";
import { AdminRoutes } from "@/routes/admin.routes";
import {
  AdminButton,
  AdminPanel,
  AdminSearchableSelect,
  InitialAvatar,
  Pill,
  type PillTone,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { relativeTime } from "@/modules/admin/lib/activity";
import { adminQueryKeys, adminUsersService } from "@/services/admin.service";
import {
  CAPABILITIES,
  ROLE_CAPABILITIES,
  ROLE_LABELS,
  USER_ROLES,
  USER_STATUSES,
  type Capability,
  type UserRole,
  type UserStatus,
} from "@/server/access/roles";
import type { AdminUserListItem } from "@/server/modules/users/users.types";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";

/* ──────────────────────────────────────────────────── Types & constants */

type UsersListResponse = { docs: AdminUserListItem[]; totalDocs: number };

type InviteResponse = {
  user: AdminUserListItem;
  inviteToken?: string;
  inviteExpiresAt: string;
  emailSent: boolean;
};

type StatusFilter = "all" | UserStatus;
type RoleFilter = "all" | UserRole;
type MainTab = "members" | "roles";

/** The capability that gates all team-management actions on this screen. */
const MANAGE_CAPABILITY: Capability = "users:manage";

/** Solid role badge fills (white text) — matches the Figma role chips. */
const ROLE_BADGE_COLOR: Record<UserRole, string> = {
  admin: "#6b1d2a",
  editor: "#2563eb",
  writer: "#0d766e",
  contributor: "#1e2939",
};

const STATUS_TONE: Record<UserStatus, PillTone> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
};

const STATUS_FILTERS: StatusFilter[] = ["all", ...USER_STATUSES];
const ROLE_FILTERS: RoleFilter[] = ["all", ...USER_ROLES];

/* ──────────────────────────────────────────────────────────── Helpers */

function joinedLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function capGroup(cap: Capability): string {
  return cap.split(":")[0];
}

function capAction(cap: Capability): string {
  const action = cap.split(":")[1] ?? cap;
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Ordered capability groups, preserving the order they appear in CAPABILITIES. */
function capabilityGroups(): { group: string; caps: Capability[] }[] {
  const order: string[] = [];
  const byGroup = new Map<string, Capability[]>();
  for (const cap of CAPABILITIES) {
    const g = capGroup(cap);
    if (!byGroup.has(g)) {
      byGroup.set(g, []);
      order.push(g);
    }
    byGroup.get(g)!.push(cap);
  }
  return order.map((group) => ({ group, caps: byGroup.get(group)! }));
}

/* ─────────────────────────────────────────────────────────────── Page */

export function UsersRolesPage() {
  const { can } = usePermissions();
  const canManage = can(MANAGE_CAPABILITY);

  // Filter state is URL-synced so bookmarking a filtered view (or landing on
  // it from an audit-log link) preserves the operator's context. Search runs
  // through the standard debounced-URL hook to match the rest of the admin.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: MainTab = (searchParams.get("tab") as MainTab | null) === "roles" ? "roles" : "members";
  const status = (searchParams.get("status") as StatusFilter | null) ?? "all";
  const role = (searchParams.get("role") as RoleFilter | null) ?? "all";
  const { value: search, setValue: setSearch, debouncedValue } = useDebouncedUrlParam();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all") params.delete(key);
        else params.set(key, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setTab = (next: MainTab) => updateParams({ tab: next === "members" ? null : next });
  const setStatus = (next: StatusFilter) => updateParams({ status: next });
  const setRole = (next: RoleFilter) => updateParams({ role: next });

  const listPath = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (role !== "all") params.set("role", role);
    if (debouncedValue) params.set("q", debouncedValue);
    const qs = params.toString();
    return qs ? `${adminUsersService.list.path}?${qs}` : adminUsersService.list.path;
  }, [status, role, debouncedValue]);

  const { data, isLoading } = useQueryService<Record<string, never>, UsersListResponse>({
    service: { path: listPath, method: ApiMethods.GET },
    options: {
      keys: [adminQueryKeys.users, status, role],
      keepPreviousData: true,
      filterFingerprint: `${status}:${role}`,
      searchQuery: debouncedValue,
    },
  });

  const members = data?.docs ?? [];
  const memberCount = data?.totalDocs ?? members.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
            Users &amp; Roles
          </h1>
          <p className="mt-2 text-sm text-muted">
            {memberCount} team member{memberCount === 1 ? "" : "s"}
          </p>
        </div>
        {canManage && (
          <AdminButton
            variant="primary"
            leftIcon={<PersonAddAlt1Rounded sx={{ fontSize: 16 }} />}
            onClick={() => setInviteOpen(true)}
          >
            Invite User
          </AdminButton>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-6 border-b border-border">
        <TabButton active={tab === "members"} onClick={() => setTab("members")}>
          Team Members
        </TabButton>
        <TabButton active={tab === "roles"} onClick={() => setTab("roles")}>
          Roles &amp; Permissions
        </TabButton>
      </div>

      {tab === "members" ? (
        <>
          {/* Filter bar */}
          <div className="flex flex-col gap-3 rounded-none border border-border bg-surface p-3 shadow-card lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((value) => (
                <FilterChip
                  key={`status-${value}`}
                  label={value === "all" ? "All" : value}
                  active={status === value}
                  activeClassName="bg-[#6b1d2a] text-white"
                  onClick={() => setStatus(value)}
                />
              ))}
            </div>
            <span className="hidden h-6 w-px bg-border lg:block" aria-hidden />
            <div className="flex flex-wrap gap-1.5">
              {ROLE_FILTERS.map((value) => (
                <FilterChip
                  key={`role-${value}`}
                  label={value === "all" ? "All" : ROLE_LABELS[value]}
                  active={role === value}
                  activeClassName="bg-[#1e2939] text-white"
                  onClick={() => setRole(value)}
                />
              ))}
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-none border border-border bg-surface-alt px-3 py-2 lg:ml-auto lg:w-64">
              <SearchRounded sx={{ fontSize: 18 }} className="shrink-0 text-muted-soft" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
              />
            </div>
          </div>

          {/* Members table */}
          <AdminPanel>
            {isLoading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border-soft text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted-soft">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-2 py-3 font-semibold">Role</th>
                    <th className="px-2 py-3 font-semibold">Email</th>
                    <th className="px-2 py-3 font-semibold">Articles</th>
                    <th className="px-2 py-3 font-semibold">Last Active</th>
                    <th className="px-2 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {members.map((user) => (
                    <tr
                      key={user.id}
                      onClick={canManage ? () => setEditUser(user) : undefined}
                      className={`border-b border-border-soft transition-colors last:border-0 ${
                        canManage ? "cursor-pointer hover:bg-surface-alt" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <InitialAvatar
                            name={user.name ?? user.email}
                            className="h-9 w-9"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-ink">
                              {user.name ?? user.email}
                            </div>
                            <div className="text-xs text-muted-soft">
                              Joined {joinedLabel(user.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-2 py-3 text-ink-secondary">{user.email}</td>
                      <td className="px-2 py-3 tabular-nums text-ink-secondary">
                        {user.articleCount}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-muted">
                        {relativeTime(user.updatedAt)}
                      </td>
                      <td className="px-2 py-3">
                        <Pill tone={STATUS_TONE[user.status]}>{user.status}</Pill>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {canManage && (
                          <ChevronRightRounded
                            sx={{ fontSize: 18 }}
                            className="text-muted-soft"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                  {!isLoading && members.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-sm text-muted-soft"
                      >
                        No team members match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </AdminPanel>
        </>
      ) : (
        <RolesMatrix />
      )}

      {inviteOpen && <InviteUserModal onClose={() => setInviteOpen(false)} />}
      {editUser && canManage && (
        <UserEditDrawer user={editUser} onClose={() => setEditUser(null)} />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────── Sub-components */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative -mb-px pb-3 text-xs font-semibold uppercase tracking-[0.06em] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-[''] ${
        active
          ? "text-burgundy after:bg-burgundy"
          : "text-muted after:bg-transparent hover:text-ink-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({
  label,
  active,
  activeClassName,
  onClick,
}: {
  label: string;
  active: boolean;
  activeClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-none px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors ${
        active
          ? activeClassName
          : "border border-border text-ink-secondary hover:bg-surface-muted"
      }`}
    >
      {label}
    </button>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className="inline-flex items-center rounded-none px-2 py-0.5 text-[0.6875rem] font-semibold uppercase leading-tight tracking-wide text-white"
      style={{ backgroundColor: ROLE_BADGE_COLOR[role] }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

/* ─────────────────────────────────────────── Roles & permissions matrix */

function RolesMatrix() {
  const groups = useMemo(capabilityGroups, []);

  return (
    <AdminPanel
      title="Role Capabilities"
      action={
        <span className="text-[0.6875rem] font-medium text-muted-soft">
          Read-only reference
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border-soft text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted-soft">
              <th className="px-5 py-3 font-semibold">Capability</th>
              {USER_ROLES.map((r) => (
                <th key={r} className="px-2 py-3 text-center font-semibold">
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(({ group, caps }) => (
              <GroupRows key={group} group={group} caps={caps} />
            ))}
          </tbody>
        </table>
      </div>
    </AdminPanel>
  );
}

function GroupRows({ group, caps }: { group: string; caps: Capability[] }) {
  return (
    <>
      <tr className="bg-surface-muted">
        <td
          colSpan={1 + USER_ROLES.length}
          className="px-5 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-burgundy"
        >
          {titleCase(group)}
        </td>
      </tr>
      {caps.map((cap) => (
        <tr key={cap} className="border-b border-border-soft last:border-0">
          <td className="px-5 py-2.5 text-ink-secondary">{capAction(cap)}</td>
          {USER_ROLES.map((r) => {
            const granted = ROLE_CAPABILITIES[r].includes(cap);
            return (
              <td key={r} className="px-2 py-2.5 text-center">
                {granted ? (
                  <CheckRounded
                    sx={{ fontSize: 18 }}
                    className="text-[#0d766e]"
                    aria-label="Granted"
                  />
                ) : (
                  <span className="text-muted-soft" aria-label="Not granted">
                    —
                  </span>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────────────── Invite modal */

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("writer");
  // When email delivery is off, the API returns the raw invite token once. We
  // hold it here so the admin can copy the accept-invite link before closing —
  // without it, an invitee can never activate their account.
  const [fallback, setFallback] = useState<InviteResponse | null>(null);

  useEscapeToClose(onClose);

  const inviteMutation = useMutationService<
    { email: string; name?: string; role: UserRole },
    InviteResponse
  >({
    service: adminUsersService.invite,
    options: {
      invalidateKeys: [adminQueryKeys.users],
      // Toast title still splits on outcome so the admin can see at a glance
      // whether Resend accepted the send. Message copy makes clear that even
      // an accepted send is not the same as delivery.
      successTitle: (r) =>
        r.emailSent ? "Invite created, email queued" : "Invite created, email did not go out",
      successMessage: (r) =>
        r.emailSent
          ? "An invitation email is on the way. If it does not land in a minute, share the link on the next screen instead."
          : "Resend did not accept the email. Share the invite link below with the new member directly.",
      errorTitle: "Could not send invite",
      // Always land on the invite-link panel. Even a successful email send
      // can silently fail downstream (bounce, spam filter, unverified
      // domain), so the admin needs a shareable link as a backup on every
      // invite. The panel copy reflects delivery state.
      onSuccess: (r) => {
        if (r.inviteToken) setFallback(r);
        else onClose();
      },
    },
  });

  const emailValid = /.+@.+\..+/.test(email.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || inviteMutation.isPending) return;
    inviteMutation.mutate({
      email: email.trim(),
      name: name.trim() || undefined,
      role,
    });
  }

  if (fallback?.inviteToken) {
    return (
      <ModalShell titleId="invite-link-title" onClose={onClose}>
        <InviteLinkPanel invite={fallback} email={email.trim()} onClose={onClose} />
      </ModalShell>
    );
  }

  return (
    <ModalShell titleId="invite-user-title" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="invite-user-title"
              className="font-headline text-lg font-bold text-burgundy"
            >
              Invite User
            </h2>
            <p className="mt-1 text-xs text-muted">
              They&apos;ll receive a link to set a password and join the team.
            </p>
          </div>
          <CloseButton onClose={onClose} />
        </div>

        <Field label="Email address" htmlFor="invite-email">
          <input
            id="invite-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@kiribe.com"
            className={inputClass}
          />
        </Field>

        <Field label="Full name (optional)" htmlFor="invite-name">
          <input
            id="invite-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Obi"
            className={inputClass}
          />
        </Field>

        <Field label="Role" htmlFor="invite-role">
          <AdminSearchableSelect
            id="invite-role"
            value={role}
            onChange={(val) => setRole(val as UserRole)}
            options={USER_ROLES.map((r) => ({
              value: r,
              label: ROLE_LABELS[r],
            }))}
            searchable={false}
          />
        </Field>

        <div className="mt-1 flex justify-end gap-2">
          <AdminButton variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            type="submit"
            disabled={!emailValid || inviteMutation.isPending}
            leftIcon={<PersonAddAlt1Rounded sx={{ fontSize: 16 }} />}
          >
            {inviteMutation.isPending ? "Sending…" : "Send Invite"}
          </AdminButton>
        </div>
      </form>
    </ModalShell>
  );
}

/** Absolute accept-invite link for a token, built from the current origin. */
function buildInviteUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${AdminRoutes.acceptInvite}?token=${encodeURIComponent(token)}`;
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Shown after an invite is created. Surfaces the one-time accept-invite link
 * so the admin can always hand it to the invitee as a backup, regardless of
 * whether Resend accepted the send. Copy adapts to email delivery state.
 */
function InviteLinkPanel({
  invite,
  email,
  onClose,
}: {
  invite: InviteResponse;
  email: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = buildInviteUrl(invite.inviteToken ?? "");
  const expiry = formatExpiry(invite.inviteExpiresAt);
  const emailQueued = invite.emailSent;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="invite-link-title"
            className="font-headline text-lg font-bold text-burgundy"
          >
            Invite link
          </h2>
          <p className="mt-1 text-xs text-muted">
            {emailQueued
              ? `An invitation email is on the way to${email ? ` ${email}` : " the new member"}. Keep this link handy in case it does not land.`
              : `Email delivery did not go out. Share this link with${email ? ` ${email}` : " the new member"} directly.`}
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div className="flex items-start gap-2 rounded-none border border-[#fed7aa] bg-[#fffbeb] p-3">
        <WarningAmberRounded sx={{ fontSize: 18 }} className="mt-0.5 shrink-0 text-[#b54708]" />
        <p className="text-xs text-[#b54708]">
          This link is shown <strong>once</strong> and cannot be retrieved
          later. Copy it now{expiry ? `. It expires ${expiry}.` : "."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
          Accept-invite URL
        </span>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className={`${inputClass} font-mono text-xs`}
            aria-label="Accept-invite URL"
          />
          <AdminButton
            variant="secondary"
            onClick={copy}
            leftIcon={<ContentCopyRounded sx={{ fontSize: 15 }} />}
          >
            {copied ? "Copied" : "Copy"}
          </AdminButton>
        </div>
      </div>

      <div className="mt-1 flex justify-end">
        <AdminButton variant="primary" onClick={onClose}>
          Done
        </AdminButton>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── Edit drawer */

function UserEditDrawer({
  user,
  onClose,
}: {
  user: AdminUserListItem;
  onClose: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEscapeToClose(onClose);

  const updateMutation = useMutationService<
    { id: string; role: UserRole; status: UserStatus },
    AdminUserListItem
  >({
    // The extra `id` in the request body is stripped by userUpdateSchema
    // (non-strict) server-side; only { role, status } reaches the update.
    service: (v) => adminUsersService.update(v.id),
    options: {
      invalidateKeys: [adminQueryKeys.users],
      successTitle: "Member updated",
      errorTitle: "Update failed",
      onSuccess: () => onClose(),
    },
  });

  const removeMutation = useMutationService<{ id: string }, { deleted: boolean }>({
    service: (v) => adminUsersService.remove(v.id),
    options: {
      invalidateKeys: [adminQueryKeys.users],
      successTitle: "Member removed",
      errorTitle: "Could not remove member",
      onSuccess: () => onClose(),
    },
  });

  const dirty = role !== user.role || status !== user.status;
  const busy = updateMutation.isPending || removeMutation.isPending;

  return (
    <DrawerShell titleId="edit-user-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-3 border-b border-border-soft px-5 py-4">
        <div className="flex items-center gap-3">
          <InitialAvatar name={user.name ?? user.email} className="h-10 w-10" />
          <div className="min-w-0">
            <h2
              id="edit-user-title"
              className="font-headline text-base font-bold text-ink"
            >
              {user.name ?? user.email}
            </h2>
            <p className="text-xs text-muted-soft">{user.email}</p>
          </div>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <Field label="Role" htmlFor="edit-role">
          <AdminSearchableSelect
            id="edit-role"
            value={role}
            onChange={(val) => setRole(val as UserRole)}
            options={USER_ROLES.map((r) => ({
              value: r,
              label: ROLE_LABELS[r],
            }))}
            searchable={false}
          />
        </Field>

        <Field label="Status" htmlFor="edit-status">
          <AdminSearchableSelect
            id="edit-status"
            value={status}
            onChange={(val) => setStatus(val as UserStatus)}
            options={USER_STATUSES.map((s) => ({
              value: s,
              label: titleCase(s),
            }))}
            searchable={false}
          />
        </Field>

        <AdminButton
          variant="primary"
          disabled={!dirty || busy}
          onClick={() => updateMutation.mutate({ id: user.id, role, status })}
        >
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </AdminButton>

        <div className="mt-auto border-t border-border-soft pt-4">
          {confirmRemove ? (
            <div className="rounded-none border border-[#fecaca] bg-[#fef2f2] p-3">
              <p className="text-xs text-[#b42318]">
                Remove <strong>{user.name ?? user.email}</strong> from the team?
                This cannot be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <AdminButton
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={() => removeMutation.mutate({ id: user.id })}
                  leftIcon={<DeleteOutlineRounded sx={{ fontSize: 15 }} />}
                >
                  {removeMutation.isPending ? "Removing…" : "Confirm Remove"}
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmRemove(false)}
                >
                  Cancel
                </AdminButton>
              </div>
            </div>
          ) : (
            <AdminButton
              variant="danger"
              size="sm"
              onClick={() => setConfirmRemove(true)}
              leftIcon={<DeleteOutlineRounded sx={{ fontSize: 15 }} />}
            >
              Remove Member
            </AdminButton>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}

/* ─────────────────────────────────────────────────── Shared overlay UI */

const inputClass =
  "w-full rounded-none border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-burgundy placeholder:text-muted-soft";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="shrink-0 rounded-none p-1 text-muted-soft transition-colors hover:bg-surface-muted hover:text-ink"
    >
      <CloseRounded sx={{ fontSize: 20 }} />
    </button>
  );
}

function ModalShell({
  titleId,
  onClose,
  children,
}: {
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-none border border-border bg-surface p-5 shadow-card"
      >
        {children}
      </div>
    </div>
  );
}

function DrawerShell({
  titleId,
  onClose,
  children,
}: {
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-card"
      >
        {children}
      </div>
    </div>
  );
}

/** Close the overlay on Escape. */
function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}
