"use client";

import { useState } from "react";
import { fetchMyProfile } from "@/lib/runs";
import { postStory } from "@/lib/stories";
import { isDefaultName } from "@/lib/nudge";

// "Share your story" for a run that has already happened. Only people who were
// on the run can post (the database enforces this too).
export default function StoryComposer({ run, user }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const body = text.trim();
    if (body.length < 2) {
      setMsg("Write a line or two about the run.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const profile = await fetchMyProfile(user.id);
      const name = profile?.display_name || "";
      if (isDefaultName(name)) {
        setMsg("Please set your name in Profile first, so people know who the story is from.");
        return;
      }
      const result = await postStory({ userId: user.id, runId: run.id, authorName: name, body });
      if (result === "duplicate") {
        setMsg("You've already shared a story for this run.");
        return;
      }
      setDone(true);
    } catch (err) {
      console.error("Failed to post story:", err);
      setMsg("Couldn't post your story, try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-5 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-[13px]">
        <div className="font-display font-bold text-accent mb-0.5">Story shared</div>
        It will show at the top of Discover for 14 days.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-5 w-full rounded-2xl border border-accent/40 bg-accent/10 text-accent font-display font-bold text-[14px] py-3"
      >
        ✨ Share your story from this run
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 rounded-2xl border border-line bg-bg-elevated p-4">
      <div className="font-display font-bold text-[15px] mb-1">How was it?</div>
      <p className="text-muted text-[12.5px] mb-3">
        A line or two for other runners, like who you met or how it felt. Everyone in the app can see it.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 280))}
        rows={3}
        placeholder="e.g. Met two runners at my pace and we're running again on Saturday!"
        className="w-full bg-bg border border-line rounded-xl px-3.5 py-3 text-[14px] text-text placeholder:text-muted focus:outline-none focus:border-accent"
      />
      <div className="text-right text-[11px] text-muted mt-1">{text.length}/280</div>
      {msg && <p className="text-accent-warm text-[12.5px] mt-1">{msg}</p>}
      <div className="flex gap-2.5 mt-3">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 bg-accent text-bg font-display font-bold text-[14px] rounded-xl py-2.5 disabled:opacity-60"
        >
          {busy ? "Posting..." : "Post story"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 text-muted text-[13px]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
