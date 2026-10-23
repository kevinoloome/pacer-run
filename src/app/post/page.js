"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import AuthInput from "@/components/AuthInput";
import { useAuth } from "@/lib/AuthProvider";
import { postRun, fetchMyProfile } from "@/lib/runs";
import { parsePace } from "@/lib/pace";

const SURFACES = [
  { value: "trail", label: "Trail" },
  { value: "road", label: "Road" },
  { value: "track", label: "Track" },
];
const DAY_CATS = [
  { value: "weekday", label: "Weekday" },
  { value: "weekend", label: "Weekend" },
];

function PostRunForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [location, setLocation] = useState("");
  const [whenText, setWhenText] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [pace, setPace] = useState("");
  const [surface, setSurface] = useState("trail");
  const [dayCat, setDayCat] = useState("weekday");
  const [capacity, setCapacity] = useState("6");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!location.trim() || !whenText.trim()) {
      setError("Fill in a location and when the run starts.");
      return;
    }
    const distance = parseFloat(distanceKm);
    if (!distance || distance <= 0) {
      setError("Enter a valid distance in km.");
      return;
    }
    const paceSec = parsePace(pace);
    if (!paceSec) {
      setError("Enter pace as m:ss, e.g. 5:30.");
      return;
    }
    const cap = parseInt(capacity, 10);
    if (!cap || cap <= 0) {
      setError("Enter a valid capacity.");
      return;
    }

    setLoading(true);
    try {
      const profile = await fetchMyProfile(user.id);
      const hostName = profile?.display_name || user.email;
      await postRun(
        {
          location: location.trim(),
          whenText: whenText.trim(),
          distanceKm: distance,
          surface,
          dayCat,
          paceSec,
          capacity: cap,
          note: note.trim(),
        },
        user.id,
        hostName
      );
      setPosted(true);
      setLocation("");
      setWhenText("");
      setDistanceKm("");
      setPace("");
      setNote("");
      setCapacity("6");
    } catch (err) {
      setError(err.message || "Couldn't post this run, try again.");
    } finally {
      setLoading(false);
    }
  }

  if (posted) {
    return (
      <div className="px-5 py-16 max-w-[430px] mx-auto text-center">
        <h1 className="font-display font-bold text-2xl mb-2">Run posted</h1>
        <p className="text-muted text-[13.5px] mb-6">
          Your run is live on Discover. Share your link with your running family so they can find it.
        </p>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={() => setPosted(false)}
            className="bg-bg-elevated border border-line text-text font-display font-semibold text-[14px] rounded-2xl py-3 px-5"
          >
            Post another
          </button>
          <button
            onClick={() => router.push("/")}
            className="bg-accent text-bg font-display font-bold text-[14px] rounded-2xl py-3 px-5"
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-[430px] mx-auto pb-28">
      <h1 className="font-display font-bold text-2xl mb-1.5">Post a run</h1>
      <p className="text-muted text-[13.5px] mb-6">Invite your running family to join you.</p>

      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Karura Forest, Limuru Rd gate"
        />
        <AuthInput
          label="When"
          value={whenText}
          onChange={(e) => setWhenText(e.target.value)}
          placeholder="Tomorrow, 6:00 AM"
        />

        <div className="grid grid-cols-2 gap-3">
          <AuthInput
            label="Distance (km)"
            inputMode="decimal"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder="8"
          />
          <AuthInput
            label="Pace (m:ss / km)"
            value={pace}
            onChange={(e) => setPace(e.target.value)}
            placeholder="5:30"
          />
        </div>

        <div className="mb-3.5">
          <div className="text-[12px] font-medium text-muted mb-1.5">Surface</div>
          <div className="flex gap-2">
            {SURFACES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSurface(s.value)}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-medium border ${
                  surface === s.value
                    ? "bg-accent/15 border-accent text-accent"
                    : "bg-bg-elevated border-line text-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3.5">
          <div className="text-[12px] font-medium text-muted mb-1.5">Day</div>
          <div className="flex gap-2">
            {DAY_CATS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDayCat(d.value)}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-medium border ${
                  dayCat === d.value
                    ? "bg-accent/15 border-accent text-accent"
                    : "bg-bg-elevated border-line text-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <AuthInput
          label="Capacity (max runners)"
          inputMode="numeric"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="6"
        />

        <label className="block mb-3.5">
          <div className="text-[12px] font-medium text-muted mb-1.5">Note (optional)</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Easy conversational pace, one water stop..."
            rows={3}
            className="w-full bg-bg-elevated border border-line rounded-xl px-3.5 py-3 text-[14px] text-text placeholder:text-muted focus:outline-none focus:border-accent resize-none"
          />
        </label>

        {error && <p className="text-accent-warm text-[12.5px] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5 mt-1.5 disabled:opacity-60"
        >
          {loading ? "Posting..." : "Post this run"}
        </button>
      </form>
    </div>
  );
}

export default function PostPage() {
  return (
    <RequireAuth>
      <PostRunForm />
    </RequireAuth>
  );
}
