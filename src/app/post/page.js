"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import RunForm from "@/components/RunForm";
import { useAuth } from "@/lib/AuthProvider";
import { postRun, fetchMyProfile, updateMyProfile } from "@/lib/runs";
import AuthInput from "@/components/AuthInput";
import ShareRun from "@/components/ShareRun";
import SaveAccountForm from "@/components/SaveAccountForm";
import { markEngaged, isDefaultName } from "@/lib/nudge";

function PostRun() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [posted, setPosted] = useState(false);
  const [postedRun, setPostedRun] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [name, setName] = useState("");
  const [currentName, setCurrentName] = useState("");

  // Fill the name box with the name already on the profile.
  useEffect(() => {
    fetchMyProfile(user.id)
      .then((p) => {
        const current = p?.display_name || "";
        setCurrentName(current);
        // Guests start as "Runner 123": leave the box empty for them.
        if (current && !/^Runner \d+$/.test(current)) setName(current);
      })
      .catch(() => {});
  }, [user.id]);

  async function handleSubmit(input) {
    let hostName = name.trim();
    const profile = await fetchMyProfile(user.id);
    if (hostName) {
      // A name is in the box: use it, and save it so it sticks for next time.
      if (hostName !== currentName) await updateMyProfile(user.id, { display_name: hostName });
    } else {
      // Hosts need a real name: other runners are trusting them with a meeting place.
      const existing = profile?.display_name || "";
      if (isDefaultName(existing) && !user.email) {
        throw new Error("Please enter your name so runners know who is hosting.");
      }
      hostName = existing || user.email || "Runner";
    }
    const row = await postRun(input, user.id, hostName);
    setPostedRun({
      id: row.id,
      location: row.location,
      city: row.city,
      when: row.when_text,
      distance: row.distance_km,
    });
    setPosted(true);
    markEngaged();
  }

  if (isGuest) {
    return (
      <div className="px-5 py-8 pb-28 max-w-[430px] mx-auto">
        <h1 className="font-display font-bold text-2xl mb-1.5">Post a run</h1>
        <p className="text-muted text-[13.5px] mb-6">
          Joining a run needs no sign-up, but hosting one does. People are trusting you with a meeting
          place, so create your account first. It takes under a minute.
        </p>
        <SaveAccountForm
          title="Create your account to post a run"
          intro="Add your email and a password. Your guest runs and chats come with you."
        />
      </div>
    );
  }

  if (posted) {
    return (
      <div className="px-5 py-16 pb-28 max-w-[430px] mx-auto text-center">
        <h1 className="font-display font-bold text-2xl mb-2">Run posted</h1>
        <p className="text-muted text-[13.5px] mb-6">
          Your run is live on Discover. Send the link to your friends so they can join you.
        </p>
        {postedRun && (
          <div className="mb-6">
            <ShareRun run={postedRun} />
          </div>
        )}
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
      {(
        <AuthInput
          label="Your name (required, runners will see this)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Amina"
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
