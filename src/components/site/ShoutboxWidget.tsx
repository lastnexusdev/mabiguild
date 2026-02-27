"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { timeAgo } from "@/lib/utils";

interface ShoutMessage {
  id: string;
  message: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export default function ShoutboxWidget({
  siteId,
  userId,
}: {
  siteId: string;
  userId?: string;
}) {
  const [messages, setMessages] = useState<ShoutMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/sites/${siteId}/shout`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // ignore
    }
  }, [siteId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/sites/${siteId}/shout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });
      if (res.ok) {
        setInput("");
        fetchMessages();
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to send.");
      }
    } catch {
      setError("Failed to send.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card flex flex-col" style={{ height: "320px" }}>
      <div className="card-header flex-shrink-0">
        <h3 className="font-semibold text-sm">💬 Shoutbox</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.length === 0 && (
          <p className="text-slate-500 text-xs">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {(m.user.displayName ?? m.user.username)[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-blue-600 text-xs">
                {m.user.displayName ?? m.user.username}
              </span>
              <span className="text-slate-400 text-xs ml-1">
                {timeAgo(m.createdAt)}
              </span>
              <p className="text-slate-700 dark:text-slate-300 break-words">
                {m.message}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {userId ? (
        <div className="border-t border-slate-200 dark:border-slate-700 p-2 flex-shrink-0">
          {error && <p className="text-red-500 text-xs mb-1">{error}</p>}
          <form onSubmit={sendMessage} className="flex gap-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={280}
              placeholder="Say something..."
              className="input text-xs py-1.5 flex-1"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="btn-primary btn-sm btn px-3"
            >
              Send
            </button>
          </form>
        </div>
      ) : (
        <div className="border-t border-slate-200 dark:border-slate-700 p-2 text-center text-xs text-slate-500 flex-shrink-0">
          <a href="/login" className="text-blue-500 hover:underline">
            Login
          </a>{" "}
          to chat
        </div>
      )}
    </div>
  );
}
