import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultSpin,
  PALETTE,
  type AppSettings,
  type AppState,
  type HistoryEntry,
  type Prize,
  type Wheel,
} from "./types";

const KEY = "prize-wheel-app-v1";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const mkPrize = (
  name: string,
  description: string,
  total: number,
  i: number,
  weight = 1,
): Prize => ({
  id: uid(),
  name,
  description,
  total,
  remaining: total,
  color: PALETTE[i % PALETTE.length]!,
  order: i,
  active: true,
  weight,
});

function seed(): AppState {
  const w1: Wheel = {
    id: uid(),
    name: "วงล้อกิจกรรมวันแม่ รอบที่ 1",
    active: true,
    eventName: "งานวันแม่แห่งชาติ 2569",
    randomMode: "weighted",
    afterSpin: "decrement",
    centerLogoSize: 34,
    centerLogo: undefined,
    spin: defaultSpin(),
    prizes: [
      mkPrize("ช่อดอกมะลิพรีเมียม", "ช่อมะลิสดพร้อมการ์ดอวยพรวันแม่", 10, 0, 5),
      mkPrize("บัตรกำนัล 500 บาท", "ใช้ได้ที่ร้านค้าในเครือ", 5, 1, 3),
      mkPrize("ชุดสปาคุณแม่", "ชุดผลิตภัณฑ์ดูแลผิวสำหรับคุณแม่", 4, 2, 2),
      mkPrize("กระเป๋าผ้าลายมะลิ", "กระเป๋าผ้าแคนวาสลายมะลิ", 12, 3, 6),
      mkPrize("ตุ๊กตาหมีวันแม่", "ตุ๊กตาหมีพร้อมริบบิ้นสีฟ้า", 6, 4, 3),
      mkPrize("ทองคำ 0.1 กรัม", "รางวัลใหญ่ประจำกิจกรรม", 1, 5, 1),
    ],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const w2: Wheel = {
    id: uid(),
    name: "วงล้อของรางวัลพิเศษ",
    active: true,
    eventName: "งานวันแม่แห่งชาติ 2569",
    randomMode: "equal",
    afterSpin: "decrement",
    centerLogoSize: 34,
    spin: { ...defaultSpin(), mode: "manual", duration: 15 },
    prizes: [
      mkPrize("หม้อทอดไร้น้ำมัน", "ขนาด 5 ลิตร", 2, 0),
      mkPrize("พัดลมไอเย็น", "พร้อมรีโมท", 2, 1),
      mkPrize("ชุดเครื่องนอน", "ผ้าปูที่นอน 6 ฟุต", 3, 2),
      mkPrize("บัตรกำนัล 1,000 บาท", "ใช้ได้ทุกสาขา", 4, 3),
      mkPrize("เค้กวันแม่", "เค้กมะลิโฮมเมด", 5, 4),
    ],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  return {
    wheels: [w1, w2],
    history: [],
    activeWheelId: w1.id,
    settings: {
      brandName: "Mother's Day Lucky Wheel",
      eventName: "งานวันแม่แห่งชาติ 2569",
      operator: "ผู้ดูแลระบบ",
      primaryColor: "#1e3a8a",
      accentColor: "#c9a227",
      sound: true,
      celebration: true,
    },
  };
}

interface Ctx {
  state: AppState;
  setState: (fn: (s: AppState) => AppState) => void;
  ready: boolean;
  addWheel: (name: string) => Wheel;
  updateWheel: (id: string, patch: Partial<Wheel>) => void;
  duplicateWheel: (id: string) => void;
  deleteWheel: (id: string) => void;
  updatePrize: (wheelId: string, prizeId: string, patch: Partial<Prize>) => void;
  addPrize: (wheelId: string, prize?: Partial<Prize>) => void;
  deletePrize: (wheelId: string, prizeId: string) => void;
  addHistory: (e: Omit<HistoryEntry, "id" | "seq">) => HistoryEntry;
  cancelHistory: (id: string, restore: boolean) => void;
  clearHistory: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setInternal] = useState<AppState>(() => seed());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setInternal(JSON.parse(raw) as AppState);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--primary", state.settings.primaryColor);
    root.style.setProperty("--accent-gold", state.settings.accentColor);
    root.style.setProperty("--ring", state.settings.primaryColor);
  }, [state.settings.primaryColor, state.settings.accentColor]);

  const setState = useCallback((fn: (s: AppState) => AppState) => setInternal(fn), []);

  const touch = (w: Wheel): Wheel => ({ ...w, updatedAt: new Date().toISOString() });

  const value = useMemo<Ctx>(() => {
    const mapWheel = (id: string, fn: (w: Wheel) => Wheel) =>
      setState((s) => ({ ...s, wheels: s.wheels.map((w) => (w.id === id ? touch(fn(w)) : w)) }));

    return {
      state,
      setState,
      ready,
      addWheel: (name) => {
        const w: Wheel = {
          id: uid(),
          name,
          active: true,
          eventName: state.settings.eventName,
          randomMode: "equal",
          afterSpin: "decrement",
          centerLogoSize: 34,
          spin: defaultSpin(),
          prizes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setState((s) => ({ ...s, wheels: [...s.wheels, w], activeWheelId: s.activeWheelId ?? w.id }));
        return w;
      },
      updateWheel: (id, patch) => mapWheel(id, (w) => ({ ...w, ...patch })),
      duplicateWheel: (id) =>
        setState((s) => {
          const src = s.wheels.find((w) => w.id === id);
          if (!src) return s;
          const copy: Wheel = {
            ...src,
            id: uid(),
            name: `${src.name} (สำเนา)`,
            prizes: src.prizes.map((p) => ({ ...p, id: uid() })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { ...s, wheels: [...s.wheels, copy] };
        }),
      deleteWheel: (id) =>
        setState((s) => {
          const wheels = s.wheels.filter((w) => w.id !== id);
          return {
            ...s,
            wheels,
            activeWheelId: s.activeWheelId === id ? (wheels[0]?.id ?? null) : s.activeWheelId,
          };
        }),
      updatePrize: (wheelId, prizeId, patch) =>
        mapWheel(wheelId, (w) => ({
          ...w,
          prizes: w.prizes.map((p) => (p.id === prizeId ? { ...p, ...patch } : p)),
        })),
      addPrize: (wheelId, prize) =>
        mapWheel(wheelId, (w) => ({
          ...w,
          prizes: [
            ...w.prizes,
            {
              id: uid(),
              name: prize?.name ?? "รางวัลใหม่",
              description: prize?.description ?? "",
              image: prize?.image,
              total: prize?.total ?? 1,
              remaining: prize?.remaining ?? prize?.total ?? 1,
              color: prize?.color ?? PALETTE[w.prizes.length % PALETTE.length]!,
              order: w.prizes.length,
              active: prize?.active ?? true,
              weight: prize?.weight ?? 1,
            },
          ],
        })),
      deletePrize: (wheelId, prizeId) =>
        mapWheel(wheelId, (w) => ({ ...w, prizes: w.prizes.filter((p) => p.id !== prizeId) })),
      addHistory: (e) => {
        const entry: HistoryEntry = { ...e, id: uid(), seq: state.history.length + 1 };
        setState((s) => ({ ...s, history: [{ ...entry, seq: s.history.length + 1 }, ...s.history] }));
        return entry;
      },
      cancelHistory: (id, restore) =>
        setState((s) => {
          const entry = s.history.find((h) => h.id === id);
          if (!entry) return s;
          const history = s.history.map((h) =>
            h.id === id ? { ...h, status: "cancelled" as const } : h,
          );
          let wheels = s.wheels;
          if (restore) {
            wheels = s.wheels.map((w) =>
              w.id === entry.wheelId
                ? touch({
                    ...w,
                    prizes: w.prizes.map((p) =>
                      p.id === entry.prizeId
                        ? {
                            ...p,
                            remaining: p.remaining + 1,
                            total: Math.max(p.total, p.remaining + 1),
                            active: true,
                          }
                        : p,
                    ),
                  })
                : w,
            );
          }
          return { ...s, history, wheels };
        }),
      clearHistory: () => setState((s) => ({ ...s, history: [] })),
      updateSettings: (patch) =>
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    };
  }, [state, setState, ready]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useWheel(id: string | null | undefined) {
  const { state } = useStore();
  return state.wheels.find((w) => w.id === id) ?? null;
}

export const spinnablePrizes = (w: Wheel) =>
  [...w.prizes].sort((a, b) => a.order - b.order).filter((p) => p.active && p.remaining > 0);

export function pickPrize(w: Wheel) {
  const pool = spinnablePrizes(w);
  if (!pool.length) return null;
  if (w.randomMode === "equal") return pool[Math.floor(Math.random() * pool.length)]!;
  const total = pool.reduce((s, p) => s + Math.max(0, p.weight), 0);
  if (total <= 0) return pool[Math.floor(Math.random() * pool.length)]!;
  let r = Math.random() * total;
  for (const p of pool) {
    r -= Math.max(0, p.weight);
    if (r <= 0) return p;
  }
  return pool[pool.length - 1]!;
}
