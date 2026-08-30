import SlotMachine from "@/components/SlotMachine";
import { DEFAULT_RULES, FIXTURE_MODE, MAX_BET_USD } from "@/lib/config";

export default function Home() {
  // The cabinet renders its own <main>, marquee and all — there's no page
  // chrome around it on purpose.
  return <SlotMachine fixtureMode={FIXTURE_MODE} maxBet={MAX_BET_USD} rules={DEFAULT_RULES} />;
}
