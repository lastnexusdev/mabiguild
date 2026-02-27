"use client";

import { useState } from "react";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
}

interface Menu {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
}

export default function AdminMenusClient({
  siteId,
  menus: initialMenus,
}: {
  siteId: string;
  menus: Menu[];
}) {
  const [menus, setMenus] = useState(initialMenus);
  const [newItems, setNewItems] = useState<
    Record<string, { label: string; url: string }>
  >({});
  const [loading, setLoading] = useState(false);

  const addItem = async (menuId: string) => {
    const data = newItems[menuId];
    if (!data?.label?.trim() || !data?.url?.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/menus/${menuId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: data.label, url: data.url }),
      });
      if (res.ok) {
        const item = await res.json();
        setMenus((prev) =>
          prev.map((m) =>
            m.id === menuId ? { ...m, items: [...m.items, item] } : m
          )
        );
        setNewItems((prev) => ({ ...prev, [menuId]: { label: "", url: "" } }));
      }
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (menuId: string, itemId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/sites/${siteId}/menus/${menuId}/items/${itemId}`, {
        method: "DELETE",
      });
      setMenus((prev) =>
        prev.map((m) =>
          m.id === menuId
            ? { ...m, items: m.items.filter((i) => i.id !== itemId) }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {menus.map((menu) => (
        <div key={menu.id} className="card">
          <div className="card-header">
            <h2 className="font-semibold">
              {menu.name}{" "}
              <span className="text-sm text-slate-500 font-normal">
                ({menu.location})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {menu.items.map((item) => (
              <div key={item.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{item.label}</span>
                  <span className="text-xs text-slate-500 ml-2">{item.url}</span>
                </div>
                <button
                  onClick={() => removeItem(menu.id, item.id)}
                  disabled={loading}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="px-6 py-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Label"
                  value={newItems[menu.id]?.label ?? ""}
                  onChange={(e) =>
                    setNewItems((prev) => ({
                      ...prev,
                      [menu.id]: { ...prev[menu.id], label: e.target.value },
                    }))
                  }
                  className="input text-sm py-1.5 flex-1"
                />
                <input
                  type="text"
                  placeholder="URL (e.g. /forums)"
                  value={newItems[menu.id]?.url ?? ""}
                  onChange={(e) =>
                    setNewItems((prev) => ({
                      ...prev,
                      [menu.id]: { ...prev[menu.id], url: e.target.value },
                    }))
                  }
                  className="input text-sm py-1.5 flex-1"
                />
                <button
                  onClick={() => addItem(menu.id)}
                  disabled={
                    loading ||
                    !newItems[menu.id]?.label?.trim() ||
                    !newItems[menu.id]?.url?.trim()
                  }
                  className="btn-primary btn-sm btn whitespace-nowrap"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
