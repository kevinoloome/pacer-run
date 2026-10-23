import TopBar from "@/components/TopBar";
import DiscoverDeck from "@/components/DiscoverDeck";
import Onboarding from "@/components/Onboarding";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <Onboarding />
      <div className="mx-auto max-w-[430px] min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 pb-24">
          <DiscoverDeck />
        </main>
      </div>
    </div>
  );
}
