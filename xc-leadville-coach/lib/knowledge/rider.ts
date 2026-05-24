// KILM domain: rider profile
// Static facts about Aaron. The coach must retrieve these before recommending.

export type RiderProfile = {
  name: string;
  location: string;
  homeTrail: string;
  goalRace: string;
  raceDate: string; // ISO
  style: "XC / marathon MTB";
  motivation: "low" | "medium" | "high";
  timeAvailable: "low" | "medium" | "high";
  riskNotes: string[];
  objective: string;
};

export const RIDER: RiderProfile = {
  name: "Aaron",
  location: "Lakewood / Denver, CO",
  homeTrail: "Green Mountain",
  goalRace: "Silver Rush 50",
  raceDate: "2026-07-12",
  style: "XC / marathon MTB",
  motivation: "high",
  timeAvailable: "high",
  riskNotes: [
    "Wants to do massive days; may over-stack load",
    "Will chase mileage when fatigued — coach must push back",
  ],
  objective: "Build an XC diesel engine with punch",
};
