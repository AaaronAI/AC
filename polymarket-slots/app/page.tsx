import SlotMachine from "@/components/SlotMachine";
import { DEFAULT_RULES, FIXTURE_MODE, MAX_BET_USD } from "@/lib/config";

export default function Home() {
  return (
    <main className="shell">
      <header className="masthead">
        <h1 className="wordmark">
          Polymarket <span>Slots</span>
        </h1>
      </header>
      <p className="tagline">
        Pull the lever. The machine screens live order books and lands on a real market it
        thinks you can actually get filled on.
      </p>

      <SlotMachine fixtureMode={FIXTURE_MODE} maxBet={MAX_BET_USD} rules={DEFAULT_RULES} />
    </main>
  );
}
