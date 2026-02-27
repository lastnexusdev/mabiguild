"use client";

import { useState } from "react";

interface Forum {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  _count: { threads: number };
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  forums: Forum[];
}

export default function AdminForumsClient({
  siteId,
  categories: initialCategories,
}: {
  siteId: string;
  categories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [newForumData, setNewForumData] = useState<
    Record<string, { name: string; description: string }>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createCategory = async () => {
    if (!newCatName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sites/${siteId}/forums/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories((prev) => [...prev, { ...cat, forums: [] }]);
        setNewCatName("");
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (catId: string) => {
    if (!confirm("Delete this category and all its forums?")) return;
    setLoading(true);
    try {
      await fetch(`/api/sites/${siteId}/forums/categories/${catId}`, {
        method: "DELETE",
      });
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    } finally {
      setLoading(false);
    }
  };

  const createForum = async (catId: string) => {
    const data = newForumData[catId];
    if (!data?.name?.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/forums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: catId,
          name: data.name,
          description: data.description,
        }),
      });
      if (res.ok) {
        const forum = await res.json();
        setCategories((prev) =>
          prev.map((c) =>
            c.id === catId
              ? { ...c, forums: [...c.forums, { ...forum, _count: { threads: 0 } }] }
              : c
          )
        );
        setNewForumData((prev) => ({ ...prev, [catId]: { name: "", description: "" } }));
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteForum = async (forumId: string, catId: string) => {
    if (!confirm("Delete this forum and all its threads?")) return;
    setLoading(true);
    try {
      await fetch(`/api/sites/${siteId}/forums/${forumId}`, {
        method: "DELETE",
      });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId
            ? { ...c, forums: c.forums.filter((f) => f.id !== forumId) }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {/* Existing categories */}
      {categories.map((cat) => (
        <div key={cat.id} className="card">
          <div className="card-header flex items-center justify-between bg-slate-700 rounded-t-lg">
            <h2 className="font-bold text-white">{cat.name}</h2>
            <button
              onClick={() => deleteCategory(cat.id)}
              disabled={loading}
              className="btn-danger btn-sm btn"
            >
              Delete Category
            </button>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {cat.forums.map((forum) => (
              <div key={forum.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium">{forum.name}</span>
                  {forum.description && (
                    <p className="text-sm text-slate-500">{forum.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    {forum._count.threads} threads
                  </span>
                  <button
                    onClick={() => deleteForum(forum.id, cat.id)}
                    disabled={loading}
                    className="btn-danger btn-sm btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Add forum form */}
            <div className="px-6 py-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Forum name"
                  value={newForumData[cat.id]?.name ?? ""}
                  onChange={(e) =>
                    setNewForumData((prev) => ({
                      ...prev,
                      [cat.id]: { ...prev[cat.id], name: e.target.value },
                    }))
                  }
                  className="input text-sm py-1.5 flex-1"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newForumData[cat.id]?.description ?? ""}
                  onChange={(e) =>
                    setNewForumData((prev) => ({
                      ...prev,
                      [cat.id]: { ...prev[cat.id], description: e.target.value },
                    }))
                  }
                  className="input text-sm py-1.5 flex-1"
                />
                <button
                  onClick={() => createForum(cat.id)}
                  disabled={loading || !newForumData[cat.id]?.name?.trim()}
                  className="btn-primary btn-sm btn whitespace-nowrap"
                >
                  + Add Forum
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* New category */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">New Category</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Category name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="input"
          />
          <button
            onClick={createCategory}
            disabled={loading || !newCatName.trim()}
            className="btn-primary btn whitespace-nowrap"
          >
            Create Category
          </button>
        </div>
      </div>
    </div>
  );
}
