// Small pill shown on group / community runs.
export default function CommunityBadge({ run, className = "" }) {
  if (!run?.isGroup) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-accent text-bg ${className}`}
    >
      👥 Community run{run.communityName ? ` · ${run.communityName}` : ""}
    </span>
  );
}
