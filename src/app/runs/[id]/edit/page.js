"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import RunForm from "@/components/RunForm";
import { useAuth } from "@/lib/AuthProvider";
import { fetchRun, updateRun } from "@/lib/runs";
import { formatPace } from "@/lib/pace";
import { toInputValue } from "@/lib/when";

function EditRun() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [run, setRun] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchRun(id, user.id)
      .then((r) => !cancelled && setRun(r))
      .catch((err) => {
        console.error("Failed to load run:", err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user.id]);

  if (error) return <Notice>Couldn&apos;t load this run. Check your connection and try again.</Notice>;
  if (run === undefined) return <Notice>Loading...</Notice>;
  if (run === null) return <Notice>This run doesn&apos;t exist any more.</Notice>;
  if (run.hostId !== user.id) return <Notice>Only the host can edit this run.</Notice>;
  if (run.cancelled) return <Notice>This run was cancelled, so it can&apos;t be edited.</Notice>;

  async function handleSubmit(input) {
    await updateRun(run.id, user.id, input);
    router.push(`/runs/${run.id}`);
  }

  return (
    <div className="px-5 py-5 max-w-[430px] mx-auto pb-28">
      <Link href={`/runs/${run.id}`} className="text-[12.5px] text-muted">
        &lsaquo; Back to run
      </Link>
      <h1 className="font-display font-bold text-2xl mt-3 mb-1.5">Edit run</h1>
      <p className="text-muted text-[13.5px] mb-6">Changes show for everyone who joined.</p>
      <RunForm
        initial={{
          location: run.location,
          startsAt: run.startsAt ? toInputValue(run.startsAt) : "",
          distanceKm: String(run.distanceKm),
          pace: formatPace(run.paceMinSec),
          surface: run.surface,
          capacity: String(run.capacity),
          note: run.note ?? "",
        }}
        minCapacity={run.joinedCount}
        submitLabel="Save changes"
        busyLabel="Saving..."
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function Notice({ children }) {
  return (
    <div className="px-5 py-16 pb-28 max-w-[430px] mx-auto text-center text-muted text-[13.5px]">
      {children}
      <div className="mt-4">
        <Link href="/runs" className="text-accent font-semibold">
          Back to My runs
        </Link>
      </div>
    </div>
  );
}

export default function EditRunPage() {
  return (
    <RequireAuth>
      <EditRun />
    </RequireAuth>
  );
}
