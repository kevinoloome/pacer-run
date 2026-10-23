import TopBar from "@/components/TopBar";
import DiscoverDeck from "@/components/DiscoverDeck";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[430px] min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 pb-24">
          <DiscoverDeck />
        </main>
      </div>
    </div>
  );
}
