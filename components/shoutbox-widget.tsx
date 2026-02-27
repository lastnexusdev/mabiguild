"use client";

import { useEffect, useState } from "react";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  user: { username: string };
};

export function ShoutboxWidget({ canDelete }: { canDelete: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/shoutbox", { cache: "no-store" });
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  async function submit() {
    setError("");
    const res = await fetch("/api/shoutbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Unable to post");
      return;
    }
    setBody("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/shoutbox?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <article className="rounded border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-2 text-lg font-semibold">Shoutbox</h3>
      <div className="mb-2 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded bg-zinc-950 p-2">
            <p>
              <span className="font-semibold">{msg.user.username}:</span> {msg.body}
            </p>
            {canDelete ? (
              <button onClick={() => remove(msg.id)} className="mt-1 text-xs text-red-300">
                Delete
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="h-16 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm"
          placeholder="Say something"
        />
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
        <button onClick={submit} className="rounded bg-sky-600 px-3 py-1 text-sm">
          Send
        </button>
      </div>
    </article>
  );
}
