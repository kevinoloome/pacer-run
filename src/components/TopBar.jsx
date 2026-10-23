export default function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-4">
      <div className="font-display font-bold text-xl">
        pacer<span className="text-accent">.</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-[12px] text-muted bg-bg-elevated border border-line rounded-full px-3 py-1.5">
          📍 Nairobi
        </div>
        <button className="relative w-[34px] h-[34px] rounded-full bg-bg-elevated border border-line flex items-center justify-center text-[15px]">
          🔔
        </button>
      </div>
    </div>
  );
}
