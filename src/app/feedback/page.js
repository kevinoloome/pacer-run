"use client";

import { useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import AuthInput from "@/components/AuthInput";
import { useAuth } from "@/lib/AuthProvider";
import { sendFeedback } from "@/lib/safety";

function Feedback() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!message.trim()) {
      setError("Write a few words first.");
      return;
    }
    setBusy(true);
    try {
      await sendFeedback({
        userId: user.id,
        message: message.trim(),
        contact: contact.trim(),
        page: document.referrer ? new URL(document.referrer).pathname : "",
      });
      setSent(true);
    } catch (err) {
      console.error("Couldn't send feedback:", err);
      setError("Couldn't send that. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="px-5 py-16 pb-28 max-w-[430px] mx-auto text-center">
        <h1 className="font-display font-bold text-2xl mb-2">Thank you</h1>
        <p className="text-muted text-[13.5px] mb-6">
          Your message reached us. Every note helps shape what we build next.
        </p>
        <Link
          href="/"
          className="inline-block bg-accent text-bg font-display font-bold text-[14px] rounded-2xl py-3 px-6"
        >
          Back to runs
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-[430px] mx-auto pb-28">
      <h1 className="font-display font-bold text-2xl mb-1.5">Send feedback</h1>
      <p className="text-muted text-[13.5px] mb-6">
        What was confusing, broken, or missing? Short is fine.
      </p>
      <form onSubmit={submit}>
        <label className="block mb-3.5">
          <div className="text-[12px] font-medium text-muted mb-1.5">Your message</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={6}
            placeholder="I tried to join a run and..."
            className="w-full bg-bg-elevated border border-line rounded-xl px-3.5 py-3 text-[14px] text-text placeholder:text-muted focus:outline-none focus:border-accent resize-none"
          />
        </label>
        <AuthInput
          label="How can we reach you? (optional)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email or WhatsApp number"
        />
        {error && <p className="text-accent-warm text-[12.5px] mb-3">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5 disabled:opacity-60"
        >
          {busy ? "Sending..." : "Send feedback"}
        </button>
      </form>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <RequireAuth>
      <Feedback />
    </RequireAuth>
  );
}
