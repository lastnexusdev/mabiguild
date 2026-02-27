"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  color: string;
}

interface Membership {
  id: string;
  role: string;
  isBanned: boolean;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    lastSeen: string;
  };
  userRoles: { role: Role }[];
}

export default function AdminMembersClient({
  siteId,
  memberships: initialMemberships,
  roles,
  currentUserId,
}: {
  siteId: string;
  memberships: Membership[];
  roles: Role[];
  currentUserId: string;
}) {
  const [memberships, setMemberships] = useState(initialMemberships);
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = memberships.filter(
    (m) =>
      m.user.username.includes(search.toLowerCase()) ||
      (m.user.displayName?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  const toggleBan = async (membershipId: string, currentBan: boolean, userId: string) => {
    if (userId === currentUserId) return;
    setLoading(membershipId);
    try {
      const res = await fetch(
        `/api/sites/${siteId}/members/${membershipId}/ban`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ban: !currentBan }),
        }
      );
      if (res.ok) {
        setMemberships((prev) =>
          prev.map((m) =>
            m.id === membershipId ? { ...m, isBanned: !currentBan } : m
          )
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const assignRole = async (membershipId: string, roleId: string) => {
    setLoading(membershipId + roleId);
    try {
      await fetch(`/api/sites/${siteId}/members/${membershipId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      window.location.reload();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search members..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input max-w-sm"
      />

      <div className="card">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`px-6 py-4 ${m.isBanned ? "opacity-60 bg-red-50 dark:bg-red-900/10" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {m.user.displayName ?? m.user.username}
                    </span>
                    <span className="text-sm text-slate-500">
                      @{m.user.username}
                    </span>
                    <span
                      className={`badge text-xs ${
                        m.role === "OWNER"
                          ? "bg-yellow-100 text-yellow-800"
                          : m.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : m.role === "MODERATOR"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {m.role}
                    </span>
                    {m.isBanned && (
                      <span className="badge bg-red-100 text-red-700 text-xs">
                        BANNED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">
                      Joined {timeAgo(m.joinedAt)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Last seen {timeAgo(m.user.lastSeen)}
                    </span>
                  </div>

                  {/* Custom roles */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {m.userRoles.map(({ role }) => (
                      <span
                        key={role.id}
                        className="badge text-xs"
                        style={{
                          backgroundColor: role.color + "20",
                          color: role.color,
                        }}
                      >
                        {role.name}
                      </span>
                    ))}
                    {roles.length > 0 && (
                      <select
                        className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 bg-white dark:bg-slate-800"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) assignRole(m.id, e.target.value);
                          e.target.value = "";
                        }}
                      >
                        <option value="">+ Assign role</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {m.user.id !== currentUserId && m.role !== "OWNER" && (
                  <button
                    onClick={() => toggleBan(m.id, m.isBanned, m.user.id)}
                    disabled={loading === m.id}
                    className={
                      m.isBanned
                        ? "btn-secondary btn-sm btn"
                        : "btn-danger btn-sm btn"
                    }
                  >
                    {m.isBanned ? "Unban" : "Ban"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
