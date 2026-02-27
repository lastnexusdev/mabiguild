"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ThreadModActions({
  siteId,
  threadId,
  isPinned,
  isLocked,
}: {
  siteId: string;
  threadId: string;
  isPinned: boolean;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [pinned, setPinned] = useState(isPinned);
  const [locked, setLocked] = useState(isLocked);
  const [loading, setLoading] = useState(false);

  const toggle = async (action: "pin" | "lock") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sites/${siteId}/threads/${threadId}/${action}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        if (action === "pin") setPinned(data.isPinned);
        else setLocked(data.isLocked);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => toggle("pin")}
        disabled={loading}
        className="btn-secondary btn-sm btn"
      >
        {pinned ? "Unpin" : "📌 Pin"}
      </button>
      <button
        onClick={() => toggle("lock")}
        disabled={loading}
        className="btn-secondary btn-sm btn"
      >
        {locked ? "🔓 Unlock" : "🔒 Lock"}
      </button>
    </div>
  );
}
