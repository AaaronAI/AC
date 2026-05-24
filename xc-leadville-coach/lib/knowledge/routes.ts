// KILM domain: route knowledge
// Each route is a fact bundle the coach uses to match workout intent to terrain.

export type WorkoutUse = "massive" | "mid-massive" | "quality" | "endurance" | "recovery" | "tempo" | "altitude" | "punchy";
export type Bailout = { name: string; mi: number };

export type Route = {
  id: string;
  name: string;
  area: string;
  workoutUses: WorkoutUse[];
  typicalMileage: [number, number];
  typicalElevationFt: [number, number];
  fatigueCost: 1 | 2 | 3 | 4 | 5;
  technicalDemand: 1 | 2 | 3 | 4 | 5;
  bailouts: Bailout[];
  idealWeeklyPlacement: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  weatherSensitivity: "low" | "medium" | "high";
  notes: string;
};

export const ROUTES: Route[] = [
  {
    id: "green-mountain",
    name: "Green Mountain",
    area: "Lakewood — home trail",
    workoutUses: ["quality", "tempo", "recovery", "punchy"],
    typicalMileage: [8, 18],
    typicalElevationFt: [1000, 2500],
    fatigueCost: 2,
    technicalDemand: 2,
    bailouts: [{ name: "Hayden trailhead", mi: 0.5 }],
    idealWeeklyPlacement: ["tue", "wed", "thu", "fri"],
    weatherSensitivity: "low",
    notes: "Best for tempo climb repeats and quick punch sets. Dries fast.",
  },
  {
    id: "buffalo-creek",
    name: "Buffalo Creek",
    area: "Pine, CO",
    workoutUses: ["massive", "endurance"],
    typicalMileage: [35, 55],
    typicalElevationFt: [3500, 6500],
    fatigueCost: 5,
    technicalDemand: 2,
    bailouts: [{ name: "Little Scraggy TH", mi: 3 }],
    idealWeeklyPlacement: ["sat", "sun"],
    weatherSensitivity: "medium",
    notes: "Sandy fast XC. Premier massive day. Watch storms in afternoon.",
  },
  {
    id: "staunton",
    name: "Staunton State Park",
    area: "Pine Junction",
    workoutUses: ["massive", "mid-massive", "endurance", "altitude"],
    typicalMileage: [18, 38],
    typicalElevationFt: [2500, 5500],
    fatigueCost: 4,
    technicalDemand: 3,
    bailouts: [{ name: "main TH", mi: 4 }],
    idealWeeklyPlacement: ["sat", "sun"],
    weatherSensitivity: "medium",
    notes: "Sustained climbs. Strong Leadville sim at altitude.",
  },
  {
    id: "centennial-cone",
    name: "Centennial Cone",
    area: "Golden",
    workoutUses: ["mid-massive", "endurance", "tempo"],
    typicalMileage: [12, 24],
    typicalElevationFt: [1500, 3000],
    fatigueCost: 3,
    technicalDemand: 3,
    bailouts: [{ name: "Mayhem Gulch TH", mi: 2 }],
    idealWeeklyPlacement: ["wed", "sat"],
    weatherSensitivity: "high",
    notes: "Hot, exposed. Closed alternating days for hikers. Pacing trail.",
  },
  {
    id: "north-table",
    name: "North Table Mountain",
    area: "Golden",
    workoutUses: ["mid-massive", "endurance", "tempo"],
    typicalMileage: [10, 22],
    typicalElevationFt: [800, 1800],
    fatigueCost: 2,
    technicalDemand: 2,
    bailouts: [{ name: "Easley Rd TH", mi: 1 }],
    idealWeeklyPlacement: ["tue", "thu", "sat"],
    weatherSensitivity: "medium",
    notes: "Good add-on for stacked loops. Hot in summer.",
  },
  {
    id: "bear-creek",
    name: "Bear Creek Lake Park",
    area: "Lakewood",
    workoutUses: ["recovery", "endurance"],
    typicalMileage: [8, 16],
    typicalElevationFt: [400, 1200],
    fatigueCost: 1,
    technicalDemand: 1,
    bailouts: [{ name: "park entrance", mi: 1 }],
    idealWeeklyPlacement: ["mon", "fri"],
    weatherSensitivity: "low",
    notes: "Flat spin-friendly. Pairs with Dakota+Matthews for the 35mi home loop.",
  },
  {
    id: "apex",
    name: "Apex",
    area: "Golden",
    workoutUses: ["quality", "punchy", "tempo"],
    typicalMileage: [10, 18],
    typicalElevationFt: [1500, 2500],
    fatigueCost: 3,
    technicalDemand: 4,
    bailouts: [{ name: "Apex TH", mi: 1.5 }],
    idealWeeklyPlacement: ["tue", "thu"],
    weatherSensitivity: "medium",
    notes: "Technical climbs. Great for power on tech.",
  },
  {
    id: "dakota-ridge",
    name: "Dakota Ridge",
    area: "Morrison",
    workoutUses: ["quality", "punchy"],
    typicalMileage: [5, 12],
    typicalElevationFt: [800, 1500],
    fatigueCost: 3,
    technicalDemand: 5,
    bailouts: [{ name: "Red Rocks", mi: 1 }],
    idealWeeklyPlacement: ["wed", "sat"],
    weatherSensitivity: "low",
    notes: "Technical hogback. Builds bike-handling under fatigue.",
  },
  {
    id: "matthews-winters",
    name: "Matthews Winters",
    area: "Morrison",
    workoutUses: ["endurance", "tempo"],
    typicalMileage: [4, 10],
    typicalElevationFt: [400, 1200],
    fatigueCost: 2,
    technicalDemand: 3,
    bailouts: [{ name: "MW TH", mi: 0.8 }],
    idealWeeklyPlacement: ["sat"],
    weatherSensitivity: "medium",
    notes: "Connector for the home 35mi Green/Dakota/Matthews/Bear Creek loop.",
  },
  {
    id: "home-35-loop",
    name: "Home 35: Green + Dakota + Matthews + Bear Creek",
    area: "West Denver",
    workoutUses: ["mid-massive", "endurance"],
    typicalMileage: [32, 38],
    typicalElevationFt: [3500, 5000],
    fatigueCost: 4,
    technicalDemand: 4,
    bailouts: [{ name: "home", mi: 0 }],
    idealWeeklyPlacement: ["wed", "sat"],
    weatherSensitivity: "medium",
    notes: "Door-to-door anchor of the mid-massive day.",
  },
  {
    id: "breck-dillon-frisco",
    name: "Breck / Dillon / Frisco",
    area: "Summit County",
    workoutUses: ["altitude", "massive", "endurance"],
    typicalMileage: [25, 50],
    typicalElevationFt: [3000, 6000],
    fatigueCost: 5,
    technicalDemand: 3,
    bailouts: [{ name: "rec path back to town", mi: 2 }],
    idealWeeklyPlacement: ["sat", "sun"],
    weatherSensitivity: "high",
    notes: "Altitude block — June 17–19 trip. Best Leadville sim short of Leadville.",
  },
  {
    id: "leadville",
    name: "Leadville",
    area: "Leadville, CO",
    workoutUses: ["altitude", "massive"],
    typicalMileage: [20, 50],
    typicalElevationFt: [2500, 7000],
    fatigueCost: 5,
    technicalDemand: 3,
    bailouts: [{ name: "town", mi: 3 }],
    idealWeeklyPlacement: ["sat"],
    weatherSensitivity: "high",
    notes: "Race terrain. Use for race-week recon ride only.",
  },
];

export function findRoute(id: string): Route | undefined {
  return ROUTES.find((r) => r.id === id);
}

export function routesForUse(use: WorkoutUse): Route[] {
  return ROUTES.filter((r) => r.workoutUses.includes(use));
}
