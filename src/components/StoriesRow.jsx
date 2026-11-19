"use client";

import { useEffect, useState } from "react";
import { fetchStories, groupByAuthor } from "@/lib/stories";
import StoryViewer from "./StoryViewer";

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// A row of circles at the top of Discover, one per runner with a recent story.
// Shows nothing at all when there are no stories yet.
export default function StoriesRow({ blockedIds }) {
  const [stories, setStories] = useState([]);
  const [open, setOpen] = useState(null); // index of the group being viewed

  useEffect(() => {
    let cancelled = false;
    fetchStories().then((list) => {
      if (!cancelled) setStories(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = groupByAuthor(stories.filter((s) => !blockedIds?.has(s.userId)));
  if (groups.length === 0) return null;

  return (
    <>
      <div className="mb-4">
        <div className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2">
          Run stories
        </div>
        <div className="flex gap-3.5 overflow-x-auto pb-1 -mx-5 px-5">
          {groups.map((g, i) => (
            <button
              key={g.userId}
              onClick={() => setOpen(i)}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[64px]"
            >
              <span className="w-[58px] h-[58px] rounded-full p-[2.5px] bg-accent flex items-center justify-center">
                <span className="w-full h-full rounded-full bg-bg-elevated border-2 border-bg flex items-center justify-center font-display font-bold text-[16px]">
                  {initials(g.author)}
                </span>
              </span>
              <span className="text-[11px] text-muted truncate w-full text-center">
                {g.author.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>
      {open !== null && (
        <StoryViewer
          groups={groups}
          startGroup={open}
          onClose={() => setOpen(null)}
          onChanged={() => fetchStories().then(setStories)}
        />
      )}
    </>
  );
}
