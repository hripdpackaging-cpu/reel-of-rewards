import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultSpin,
  PALETTE,
  type AppSettings,
  type AppState,
  type HistoryEntry,
  type Prize,
  type Wheel,
} from "./types";

const ROW_ID = "shared";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function emptyState(): AppState {
  return {
    wheels: [],
    history: [],
    activeWheelId: null,
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

type Mutator = (s: AppState) => AppState;

interface Ctx {
  state: AppState;
  /** Persists the change to the shared cloud database (all accounts stay in sync). */
  setState: (fn: Mutator) => Promise<void>;
  ready: boolean;
  syncing: boolean;
  user: User | null;
  signOut: () => Promise<void>;
  addWheel: (name: string) => Wheel;
  updateWheel: (id: string, patch: Partial<Wheel>) => Promise<void>;
  duplicateWheel: (id: string) => Promise<void>;
  deleteWheel: (id: string) => Promise<void>;
  updatePrize: (wheelId: string, prizeId: string, patch: Partial<Prize>) => Promise<void>;
  addPrize: (wheelId: string, prize?: Partial<Prize>) => Promise<void>;
  deletePrize: (wheelId: string, prizeId: string) => Promise<void>;
  addHistory: (e: Omit<HistoryEntry, "id" | "seq">) => Promise<void>;
  cancelHistory: (id: string, restore: boolean) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

const StoreContext = createContext<Ctx | null>(null);

const touch = (w: Wheel): Wheel => ({ ...w, updatedAt: new Date().toISOString() });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setInternal] = useState<AppState>(() => emptyState());
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const stateRef = useRef<AppState>(state);
  const versionRef = useRef<number>(0);
  const chainRef = useRef<Promise<unknown>>(Promise.resolve());

  const apply = useCallback((next: AppState, version?: number) => {
    stateRef.current = next;
    if (typeof version === "number") versionRef.current = version;
    setInternal(next);
  }, []);

  // Auth session (shared editing requires a signed-in account)
  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Initial load + realtime sync
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("app_state")
        .select("data, version")
        .eq("id", ROW_ID)
        .maybeSingle();
      if (!alive) return;
      if (error) {
        toast.error("โหลดข้อมูลจากคลาวด์ไม่สำเร็จ");
      } else if (data) {
        apply(data.data as unknown as AppState, Number(data.version));
      }
      setReady(true);
    };
    void load();

    const channel = supabase
      .channel("app-state-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_state", filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const row = payload.new as { data?: unknown; version?: number } | null;
          if (!row?.data || typeof row.version !== "number") return;
          if (row.version <= versionRef.current) return;
          apply(row.data as AppState, row.version);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [apply]);

  // Theme tokens
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--primary", state.settings.primaryColor);
    root.style.setProperty("--accent-gold", state.settings.accentColor);
    root.style.setProperty("--ring", state.settings.primaryColor);
  }, [state.settings.primaryColor, state.settings.accentColor]);

  const setState = useCallback(
    (fn: Mutator) => {
      // optimistic local update for instant feedback
      apply(fn(stateRef.current));

      const task = chainRef.current.then(async () => {
        setSyncing(true);
        try {
          for (let attempt = 0; attempt < 6; attempt += 1) {
            const { data: row, error } = await supabase
              .from("app_state")
              .select("data, version")
              .eq("id", ROW_ID)
              .maybeSingle();
            if (error) throw error;
            if (!row) throw new Error("ไม่พบข้อมูลกิจกรรมในคลาวด์");

            const base = row.data as unknown as AppState;
            const next = fn(base);
            const { data: updated, error: updateError } = await supabase
              .from("app_state")
              .update({
                data: next as unknown as never,
                version: Number(row.version) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", ROW_ID)
              .eq("version", row.version)
              .select("data, version")
              .maybeSingle();
            if (updateError) throw updateError;
            if (updated) {
              apply(updated.data as unknown as AppState, Number(updated.version));
              return;
            }
            // Someone else saved first — reload and replay on top of their data.
            await new Promise((r) => setTimeout(r, 120 + attempt * 150));
          }
          throw new Error("มีการแก้ไขจากเครื่องอื่นพร้อมกัน กรุณาลองบันทึกอีกครั้ง");
        } catch (err) {
          const raw = err instanceof Error ? err.message : String(err);
          const denied = /row-level security|permission|JWT|not authorized/i.test(raw);
          toast.error(denied ? "กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล" : raw);
          const { data: row } = await supabase
            .from("app_state")
            .select("data, version")
            .eq("id", ROW_ID)
            .maybeSingle();
          if (row) apply(row.data as unknown as AppState, Number(row.version));
        } finally {
          setSyncing(false);
        }
      });
      chainRef.current = task;
      return task;
    },
    [apply],
  );

  const value = useMemo<Ctx>(() => {
    const mapWheel = (id: string, fn: (w: Wheel) => Wheel) =>
      setState((s) => ({ ...s, wheels: s.wheels.map((w) => (w.id === id ? touch(fn(w)) : w)) }));

    return {
      state,
      setState,
      ready,
      syncing,
      user,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      addWheel: (name) => {
        const w: Wheel = {
          id: uid(),
          name,
          active: true,
          eventName: stateRef.current.settings.eventName,
          randomMode: "equal",
          afterSpin: "decrement",
          centerLogoSize: 34,
          spin: defaultSpin(),
          prizes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        void setState((s) => ({
          ...s,
          wheels: [...s.wheels, w],
          activeWheelId: s.activeWheelId ?? w.id,
        }));
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
      addPrize: (wheelId, prize) => {
        const id = uid();
        return mapWheel(wheelId, (w) => ({
          ...w,
          prizes: [
            ...w.prizes,
            {
              id,
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
        }));
      },
      deletePrize: (wheelId, prizeId) =>
        mapWheel(wheelId, (w) => ({ ...w, prizes: w.prizes.filter((p) => p.id !== prizeId) })),
      addHistory: (e) => {
        const id = uid();
        return setState((s) => ({
          ...s,
          history: [{ ...e, id, seq: s.history.length + 1 }, ...s.history],
        }));
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
  }, [state, setState, ready, syncing, user]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">กำลังเชื่อมต่อข้อมูลกิจกรรม...</p>
      </div>
    );
  }

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
