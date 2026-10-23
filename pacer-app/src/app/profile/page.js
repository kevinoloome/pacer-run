"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import AuthInput from "@/components/AuthInput";
import { useAuth } from "@/lib/AuthProvider";
import { fetchMyProfile, updateMyProfile } from "@/lib/runs";
import { formatPace, parsePace } from "@/lib/pace";
import { supabase } from "@/lib/supabaseClient";

function ProfileForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [paceMin, setPaceMin] = useState("");
  const [paceMax, setPaceMax] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile(user.id)
      .then((profile) => {
        if (cancelled || !profile) return;
        setDisplayName(profile.display_name ?? "");
        setPaceMin(profile.pace_min_sec ? formatPace(profile.pace_min_sec) : "");
        setPaceMax(profile.pace_max_sec ? formatPace(profile.pace_max_sec) : "");
      })
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!displayName.trim()) {
      setError("Tell us what to call you.");
      return;
    }
    const minSec = parsePace(paceMin);
    const maxSec = parsePace(paceMax);
    if (!minSec || !maxSec || minSec > maxSec) {
      setError("Enter a valid pace range as m:ss, fastest first (e.g. 5:15 to 6:00).");
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile(user.id, {
        display_name: displayName.trim(),
        pace_min_sec: minSec,
        pace_max_sec: maxSec,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Couldn't save your profile, try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (!window.confirm("Sign out of Pacer?")) return;
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted text-[13px]">Loading...</div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-[430px] mx-auto pb-28">
      <h1 className="font-display font-bold text-2xl mb-1.5">Your profile</h1>
      <p className="text-muted text-[13.5px] mb-6">{user.email}</p>

      <form onSubmit={handleSave}>
        <AuthInput
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jane Wanjiru"
        />

        <div className="grid grid-cols-2 gap-3">
          <AuthInput
            label="Fastest pace (m:ss / km)"
            value={paceMin}
            onChange={(e) => setPaceMin(e.target.value)}
            placeholder="5:15"
          />
          <AuthInput
            label="Easiest pace (m:ss / km)"
            value={paceMax}
            onChange={(e) => setPaceMax(e.target.value)}
            placeholder="6:00"
          />
        </div>

        {error && <p className="text-accent-warm text-[12.5px] mb-3">{error}</p>}
        {saved && <p className="text-accent text-[12.5px] mb-3">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5 mt-1.5 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <button
        onClick={handleSignOut}
        className="w-full bg-bg-elevated border border-line text-accent-warm font-display font-semibold text-[14px] rounded-2xl py-3.5 mt-6"
      >
        Sign out
      </button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileForm />
    </RequireAuth>
  );
}
