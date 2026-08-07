export type SpinMode = "auto" | "manual";
export type AfterSpin = "remove" | "decrement" | "keep";
export type RandomMode = "equal" | "weighted";

export interface Prize {
  id: string;
  name: string;
  description: string;
  image?: string | undefined;
  total: number;
  remaining: number;
  color: string;
  order: number;
  active: boolean;
  weight: number;
}

export interface SpinSettings {
  mode: SpinMode;
  duration: number;
  minRotations: number;
  countdown: boolean;
  sound: boolean;
  celebration: boolean;
  initialSpeed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
}

export interface Wheel {
  id: string;
  name: string;
  active: boolean;
  eventName: string;
  randomMode: RandomMode;
  afterSpin: AfterSpin;
  centerLogo?: string | undefined;
  centerLogoSize: number;
  background?: string | undefined;
  banner?: string | undefined;
  spin: SpinSettings;
  prizes: Prize[];
  updatedAt: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  seq: number;
  wheelId: string;
  wheelName: string;
  prizeId: string;
  prizeName: string;
  prizeImage?: string | undefined;
  at: string;
  operator: string;
  status: "confirmed" | "cancelled";
  note: string;
}

export interface AppSettings {
  siteLogo?: string | undefined;
  brandName: string;
  eventName: string;
  operator: string;
  primaryColor: string;
  accentColor: string;
  sound: boolean;
  celebration: boolean;
}

export interface AppState {
  wheels: Wheel[];
  history: HistoryEntry[];
  settings: AppSettings;
  activeWheelId: string | null;
}

export const defaultSpin = (): SpinSettings => ({
  mode: "auto",
  duration: 10,
  minRotations: 5,
  countdown: true,
  sound: true,
  celebration: true,
  initialSpeed: 60,
  maxSpeed: 720,
  acceleration: 480,
  deceleration: 360,
});

export const PALETTE = [
  "#1e3a8a",
  "#c9a227",
  "#b91c1c",
  "#0f766e",
  "#7c2d12",
  "#4338ca",
  "#be185d",
  "#065f46",
  "#a16207",
  "#334155",
];
