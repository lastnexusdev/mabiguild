"use client";

import { useState } from "react";

const WIDGET_TYPES = [
  { value: "shoutbox", label: "Shoutbox" },
  { value: "recent_threads", label: "Recent Threads" },
  { value: "members_online", label: "Members Online" },
  { value: "text", label: "Text Block" },
];

interface Widget {
  id: string;
  widgetType: string;
  column: number;
  sortOrder: number;
  config: string;
}

export default function AdminWidgetsClient({
  siteId,
  widgets: initialWidgets,
}: {
  siteId: string;
  widgets: Widget[];
}) {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [newType, setNewType] = useState("shoutbox");
  const [newColumn, setNewColumn] = useState(1);
  const [loading, setLoading] = useState(false);

  const byColumn = (col: number) =>
    widgets.filter((w) => w.column === col).sort((a, b) => a.sortOrder - b.sortOrder);

  const addWidget = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/widgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetType: newType, column: newColumn }),
      });
      if (res.ok) {
        const w = await res.json();
        setWidgets((prev) => [...prev, w]);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeWidget = async (id: string) => {
    setLoading(true);
    try {
      await fetch(`/api/sites/${siteId}/widgets/${id}`, { method: "DELETE" });
      setWidgets((prev) => prev.filter((w) => w.id !== id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((col) => (
          <div key={col} className="card">
            <div className="card-header">
              <h3 className="font-semibold">Column {col}</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {byColumn(col).map((w) => (
                <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm">
                    {WIDGET_TYPES.find((t) => t.value === w.widgetType)?.label ?? w.widgetType}
                  </span>
                  <button
                    onClick={() => removeWidget(w.id)}
                    disabled={loading}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {byColumn(col).length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-500">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Add Widget</h3>
        <div className="flex gap-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="input flex-1"
          >
            {WIDGET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={newColumn}
            onChange={(e) => setNewColumn(Number(e.target.value))}
            className="input w-32"
          >
            <option value={1}>Column 1</option>
            <option value={2}>Column 2</option>
            <option value={3}>Column 3</option>
          </select>
          <button
            onClick={addWidget}
            disabled={loading}
            className="btn-primary btn whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
