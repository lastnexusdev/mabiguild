"use client";

import { useEffect, useState } from "react";

type Message = { id: string; message: string; user: { username: string } };

export function Shoutbox() {
  const [items, setItems] = useState<Message[]>([]);
  const [text, setText] = useState("");

  async function load() {
    const res = await fetch("/api/shoutbox", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function send() {
    await fetch("/api/shoutbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
    setText("");
    await load();
  }

  return (
    <div className="border border-zinc-800 rounded p-3 bg-zinc-900">
      <h3 className="font-semibold mb-2">Shoutbox</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto text-sm mb-2">
        {items.map((m) => <p key={m.id}><b>{m.user.username}:</b> {m.message}</p>)}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2" />
        <button onClick={send} className="bg-sky-600 px-2 rounded">Send</button>
      </div>
    </div>
  );
}
