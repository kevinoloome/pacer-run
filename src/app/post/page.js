"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import RunForm from "@/components/RunForm";
import { useAuth } from "@/lib/AuthProvider";
import { postRun, fetchMyProfile } from "@/lib/runs";

function PostRun() {
  const router = useRouter();
  const { user } = useAuth();
  const [posted, setPosted] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(input) {
    const profile = await fetchMyProfile(user.id);
    const hostName = profile?.display_name || user.email;
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
