"use client";

import { useState } from "react";

interface RolePermission {
  id: string;
  permission: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  permissions: RolePermission[];
}

export default function AdminRolesClient({
  siteId,
  roles: initialRoles,
  allPermissions,
}: {
  siteId: string;
  roles: Role[];
  allPermissions: string[];
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#888888");
  const [loading, setLoading] = useState(false);

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName, color: newRoleColor }),
      });
      if (res.ok) {
        const role = await res.json();
        setRoles((prev) => [...prev, { ...role, permissions: [] }]);
        setNewRoleName("");
        setNewRoleColor("#888888");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (roleId: string, perm: string, has: boolean) => {
    setLoading(true);
    try {
      await fetch(`/api/sites/${siteId}/roles/${roleId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission: perm, grant: !has }),
      });
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r;
          if (has) {
            return { ...r, permissions: r.permissions.filter((p) => p.permission !== perm) };
          } else {
            return { ...r, permissions: [...r.permissions, { id: Date.now().toString(), permission: perm }] };
          }
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!confirm("Delete this role?")) return;
    setLoading(true);
    try {
      await fetch(`/api/sites/${siteId}/roles/${roleId}`, { method: "DELETE" });
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {roles.map((role) => (
        <div key={role.id} className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: role.color }}
              />
              <span className="font-semibold">{role.name}</span>
              {role.isDefault && (
                <span className="badge bg-slate-100 text-slate-600 text-xs">
                  Default
                </span>
              )}
            </div>
            {!role.isDefault && (
              <button
                onClick={() => deleteRole(role.id)}
                disabled={loading}
                className="btn-danger btn-sm btn"
              >
                Delete
              </button>
            )}
          </div>
          <div className="card-body">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Permissions
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {allPermissions.map((perm) => {
                const has = role.permissions.some((p) => p.permission === perm);
                return (
                  <label
                    key={perm}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={has}
                      onChange={() => togglePermission(role.id, perm, has)}
                      disabled={loading}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm">
                      {perm.replace(/_/g, " ")}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Create role */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Create New Role</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Role name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="input flex-1"
          />
          <input
            type="color"
            value={newRoleColor}
            onChange={(e) => setNewRoleColor(e.target.value)}
            className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
            title="Role color"
          />
          <button
            onClick={createRole}
            disabled={loading || !newRoleName.trim()}
            className="btn-primary btn whitespace-nowrap"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
