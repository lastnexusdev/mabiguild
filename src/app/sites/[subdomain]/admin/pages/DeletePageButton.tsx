"use client";

import { useState } from "react";

export default function DeletePageButton({
  pageId,
  siteId,
}: {
  pageId: string;
  siteId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    setLoading(true);
    try {
      await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
        method: "DELETE",
      });
      window.location.reload();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn-danger btn-sm btn"
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
