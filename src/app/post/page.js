"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import RunForm from "@/components/RunForm";
import { useAuth } from "@/lib/AuthProvider";
import { postRun, fetchMyProfile, updateMyProfile } from "@/lib/runs";
import AuthInput from "@/components/AuthInput";

function PostRun() {
  const router = useRouter();
  const { user } = useAuth();
  const [posted, setPosted] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);

  // Guest accounts start as "Runner 123": ask for a real name once.
  useEffect(() => {
    fetchMyProfile(user.id)
      .then((p) => {
        const current = p?.display_name || "";
        if (!current || /^Runner \d+$/.test(current)) setNeedsName(true);
        else setName(current);
      })
      .catch(() => {});
  }, [user.id]);

  async function handleSubmit(input) {
    let hostName = name.trim();
    if (needsName) {
      if (!hostName) throw new Error("Enter your name so runners know who is hosting.");
      await updateMyProfile(user.id, { display_name: hostName });
    } else {
      const profile = await fetchMyProfile(user.id);
      hostName = profile?.display_name || user.email || "Runner";
    }
    await postRun(input, user.id, hostName);
    setPosted(true);
  }

  if (posted) {
    return (
      <div className="px-5 py-16 pb-28 max-w-[430px] mx-auto text-center">
        <h1 className="font-display font-bold text-2xl mb-2">Run posted</h1>
        <p className="text-muted text-[13.5px] mb-6">
          Your run is live on Discover. Share your link with your running family so they can find it.
        </p>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={() => {
              setPosted(false);
              setFormKey((k) => k + 1);
            }}
            className="bg-bg-elevated border border-line text-text font-display font-semibold text-[14px] rounded-2xl py-3 px-5"
          >
            Post another
          </button>
          <button
            onClick={() => router.push("/runs")}
            className="bg-accent text-bg font-display font-bold text-[14px] rounded-2xl py-3 px-5"
          >
            See my runs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-[430px] mx-auto pb-28">
      <h1 className="font-display font-bold text-2xl mb-1.5">Post a run</h1>
      <p className="text-muted text-[13.5px] mb-6">Invite your running family to join you.</p>
      {needsName && (
        <AuthInput
          label="Your name (runners will see this)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane"
        />
      )}
      <RunForm
        key={formKey}
        submitLabel="Post this run"
        busyLabel="Posting..."
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function PostPage() {
  return (
    <RequireAuth>
      <PostRun />
    </RequireAuth>
  );
}
