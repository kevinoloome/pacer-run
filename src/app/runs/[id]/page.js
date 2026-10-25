"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/lib/AuthProvider";
import { fetchRun, fetchParticipants, fetchMyProfile } from "@/lib/runs";
import { fetchMessages, sendMessage, subscribeToMessages } from "@/lib/chat";

const POLL_MS = 8000;

function mapsUrl(location) {
  const query = encodeURIComponent(`${location}, Nairobi`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function RunDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [run, setRun] = useState(undefined); // undefined = loading, null = not found
  const [people, setPeople] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchRun(id, user.id), fetchParticipants(id)])
      .then(([r, p]) => {
        if (cancelled) return;
        setRun(r);
        setPeople(p);
      })
      .catch((err) => {
        console.error("Failed to load run:", err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user.id]);

  if (error) {
    return (
      <Message>
        Couldn&apos;t load this run. Check your connection and try again.
        <BackLink />
      </Message>
    );
  }
  if (run === undefined) return <Message>Loading...</Message>;
  if (run === null) {
    return (
      <Message>
        This run doesn&apos;t exist any more.
        <BackLink />
      </Message>
    );
  }

  const isHost = run.hostId === user.id;
  const isMember = isHost || run.isJoinedByMe;

  return (
    <div className="px-5 py-5 max-w-[430px] mx-auto pb-28">
      <Link href="/runs" className="text-[12.5px] text-muted">
        &lsaquo; My runs
      </Link>

      <h1 className="font-display font-bold text-[22px] leading-tight mt-3">{run.location}</h1>
      <div className="text-[13.5px] text-muted mt-1">{run.when}</div>

      <a
        href={mapsUrl(run.location)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 w-full bg-accent text-bg font-display font-bold text-[14.5px] rounded-2xl py-3"
      >
        📍 Open in Google Maps
      </a>

      <div className="flex gap-2.5 mt-4">
        <Stat label="distance" value={run.distance} />
        <Stat label="pace" value={run.pace} />
        <Stat label="going" value={`${run.joinedCount}/${run.capacity}`} />
      </div>

      {run.note && (
        <div className="mt-4 text-[13px] text-[#C7CCD3] leading-snug bg-bg-elevated border border-line rounded-xl p-3.5">
          {run.note}
        </div>
      )}

      <div className="mt-5">
        <div className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2">
          Who&apos;s going
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip name={run.host} sub="Host" />
          {people
            .filter((p) => p.id !== run.hostId)
            .map((p) => (
              <Chip key={p.id} name={p.id === user.id ? "You" : p.name} />
            ))}
          {run.joinedInitials.map((n, i) => (
            <Chip key={`legacy-${i}`} name={n} />
          ))}
        </div>
      </div>

      <div className="mt-5 text-[11.5px] text-muted flex gap-1.5">
        <span className="text-accent">&#10003;</span>
        Meet at a public, well-lit place, and tell someone you trust where you&apos;re running.
      </div>

      <div className="mt-6">
        <div className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2">
          Run chat
        </div>
        {isMember ? (
          <Chat runId={run.id} user={user} />
        ) : (
          <div className="border border-dashed border-line rounded-2xl p-6 text-center text-muted text-[13px]">
            Join this run to see the chat and chat with the group.
            <div className="mt-3">
              <Link
                href="/"
                className="inline-block bg-accent text-bg font-display font-bold text-[13.5px] rounded-xl py-2.5 px-5"
              >
                Back to runs
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chat({ runId, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [senderName, setSenderName] = useState("");
  const endRef = useRef(null);

  function merge(incoming) {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) byId.set(m.id, m);
      return [...byId.values()].sort((a, b) => a.id - b.id);
    });
  }

  useEffect(() => {
    let cancelled = false;

    fetchMessages(runId)
      .then((list) => {
        if (cancelled) return;
        merge(list);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load chat:", err);
        if (!cancelled) setStatus("error");
      });

    fetchMyProfile(user.id)
      .then((p) => {
        if (!cancelled) setSenderName(p?.display_name || user.email?.split("@")[0] || "Runner");
      })
      .catch(() => {
        if (!cancelled) setSenderName(user.email?.split("@")[0] || "Runner");
      });

    // Live updates, plus a slow poll as a safety net if the live connection drops.
    const unsubscribe = subscribeToMessages(runId, (m) => merge([m]));
    const poll = setInterval(() => {
      fetchMessages(runId).then(merge).catch(() => {});
    }, POLL_MS);

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(poll);
    };
  }, [runId, user.id, user.email]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const saved = await sendMessage(
        runId,
        user.id,
        senderName || user.email?.split("@")[0] || "Runner",
        body
      );
      merge([saved]);
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
      window.alert("Couldn't send that message. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-bg-elevated overflow-hidden">
      <div className="h-[300px] overflow-y-auto p-3.5 flex flex-col gap-2.5">
        {status === "loading" && (
          <div className="m-auto text-muted text-[12.5px]">Loading chat...</div>
        )}
        {status === "error" && (
          <div className="m-auto text-center text-muted text-[12.5px] px-4">
            Couldn&apos;t load the chat. If this is new, the chat table may not be set up yet.
          </div>
        )}
        {status === "ready" && messages.length === 0 && (
          <div className="m-auto text-center text-muted text-[12.5px] px-4">
            No messages yet. Say hi and agree where to meet.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.user_id === user.id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine && <div className="text-[10.5px] text-muted mb-0.5 ml-1">{m.sender_name}</div>}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug break-words ${
                  mine ? "bg-accent text-bg rounded-br-md" : "bg-bg-elevated-2 text-text rounded-bl-md"
                }`}
              >
                {m.body}
              </div>
              <div className="text-[10px] text-muted mt-0.5 mx-1">{formatTime(m.created_at)}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-line p-2.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="Message the group..."
          className="flex-1 bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-text placeholder:text-muted focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-accent text-bg font-display font-bold text-[14px] rounded-xl px-4 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex-1 bg-black/20 border border-line rounded-lg px-2.5 py-1.5">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="font-mono text-[14px] font-semibold">{value}</div>
    </div>
  );
}

function Chip({ name, sub }) {
  return (
    <div className="flex items-center gap-2 bg-bg-elevated border border-line rounded-full pl-1.5 pr-3 py-1">
      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10.5px] font-bold text-bg">
        {(name || "?").trim().charAt(0).toUpperCase()}
      </div>
      <div className="text-[12.5px]">
        {name}
        {sub && <span className="text-muted"> &middot; {sub}</span>}
      </div>
    </div>
  );
}

function Message({ children }) {
  return (
    <div className="px-5 py-16 max-w-[430px] mx-auto text-center text-muted text-[13.5px] pb-28">
      {children}
    </div>
  );
}

function BackLink() {
  return (
    <div className="mt-4">
      <Link href="/runs" className="text-accent font-semibold">
        Back to My runs
      </Link>
    </div>
  );
}

export default function RunDetailPage() {
  return (
    <RequireAuth>
      <RunDetail />
    </RequireAuth>
  );
}
