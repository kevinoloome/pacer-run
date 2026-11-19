"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { deleteStory, reportStory } from "@/lib/stories";

const SECONDS = 7;

// Full-screen story viewer. Tap the right side for next, the left side for
// previous. It moves on by itself every few seconds.
export default function StoryViewer({ groups, startGroup, onClose, onChanged }) {
  const { user } = useAuth();
  const [gi, setGi] = useState(startGroup);
  const [si, setSi] = useState(0);
  const [msg, setMsg] = useState("");

  const group = groups[gi];
  const story = group?.stories[si];

  function next() {
    if (si < group.stories.length - 1) setSi(si + 1);
    else if (gi < groups.length - 1) {
      setGi(gi + 1);
      setSi(0);
    } else onClose();
  }
  function prev() {
    if (si > 0) setSi(si - 1);
    else if (gi > 0) {
      setGi(gi - 1);
      setSi(0);
    }
  }

  useEffect(() => {
    setMsg("");
    const t = setTimeout(next, SECONDS * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, si]);

  if (!story) return null;
  const mine = story.userId === user?.id;

  async function handleReport(e) {
    e.stopPropagation();
    if (!window.confirm("Report this story as inappropriate?")) return;
    try {
      await reportStory({ reporterId: user.id, story });
      setMsg("Thanks, we'll take a look.");
    } catch {
      setMsg("Couldn't send the report, try again.");
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Delete your story?")) return;
    try {
      await deleteStory(story.id);
      onChanged?.();
      onClose();
    } catch {
      setMsg("Couldn't delete, try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-center bg-black">
      <div
        className="relative w-full max-w-[430px] h-full flex flex-col"
        style={{ background: "linear-gradient(170deg, #1d2a33 0%, #12181D 70%)" }}
      >
        {/* progress bars */}
        <div className="flex gap-1 px-3 pt-3">
          {group.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/20 overflow-hidden">
              <div
                key={`${gi}-${si}`}
                className="h-full bg-accent"
                style={{
                  width: i < si ? "100%" : i === si ? "100%" : "0%",
                  animation: i === si ? `storyfill ${SECONDS}s linear` : "none",
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-accent text-bg font-display font-bold text-[13px] flex items-center justify-center">
              {(story.author || "?").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <div className="text-[13.5px] font-semibold leading-tight">{story.author}</div>
              <div className="text-[11.5px] text-muted leading-tight">
                {story.location}
                {story.when ? ` · ${story.when}` : ""}
              </div>
            </div>
          </div>
          <button aria-label="Close" onClick={onClose} className="text-[26px] leading-none text-muted px-2">
            ×
          </button>
        </div>

        {/* tap zones */}
        <div className="flex-1 relative flex items-center justify-center px-8">
          <button aria-label="Previous" onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/3" />
          <button aria-label="Next" onClick={next} className="absolute right-0 top-0 bottom-0 w-2/3" />
          <p className="font-display font-bold text-[26px] leading-snug text-center pointer-events-none">
            “{story.body}”
          </p>
        </div>

        <div className="px-5 pb-8 flex flex-col items-center gap-3">
          {msg && <div className="text-[12.5px] text-accent">{msg}</div>}
          <Link
            href={`/runs/${story.runId}`}
            className="bg-accent text-bg font-display font-bold text-[14px] rounded-2xl py-3 px-6"
          >
            See this run
          </Link>
          {mine ? (
            <button onClick={handleDelete} className="text-[12px] text-muted underline">
              Delete my story
            </button>
          ) : (
            <button onClick={handleReport} className="text-[12px] text-muted underline">
              Report this story
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes storyfill{from{width:0}to{width:100%}}`}</style>
    </div>
  );
}
