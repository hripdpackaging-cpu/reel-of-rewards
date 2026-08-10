import { Link, useRouterState } from "@tanstack/react-router";
import { Cloud, CloudOff, Crown, LogIn, LogOut, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { ReactNode } from "react";

const links = [
  { to: "/", label: "หน้าสุ่มวงล้อ" },
  { to: "/admin", label: "จัดการระบบ" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { state, user, signOut, syncing } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            {state.settings.siteLogo ? (
              <img
                src={state.settings.siteLogo}
                alt={state.settings.brandName}
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Crown className="h-5 w-5 text-gold" />
              </span>
            )}
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-sm font-semibold text-foreground">
                {state.settings.brandName}
              </span>
              <span className="block text-xs text-muted-foreground">
                {state.settings.eventName}
              </span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {links.map((l) => {
              const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <span
              className="ml-1 hidden items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs text-muted-foreground md:flex"
              title={user ? "ข้อมูลซิงก์กับคลาวด์" : "โหมดดูข้อมูล (ยังไม่เข้าสู่ระบบ)"}
            >
              {syncing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : user ? (
                <Cloud className="h-3.5 w-3.5" />
              ) : (
                <CloudOff className="h-3.5 w-3.5" />
              )}
              {syncing ? "กำลังบันทึก..." : user ? "ซิงก์เรียลไทม์" : "โหมดดูข้อมูล"}
            </span>
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  toast.info("ออกจากระบบแล้ว");
                }}
              >
                <LogOut className="mr-1.5 h-4 w-4" /> ออกจากระบบ
              </Button>
            ) : (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/auth">
                  <LogIn className="mr-1.5 h-4 w-4" /> เข้าสู่ระบบ
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
        <Sparkles className="mr-1 inline h-3.5 w-3.5 text-gold" />
        {state.settings.brandName} · ข้อมูลถูกบันทึกบนคลาวด์และซิงก์ให้ทุกบัญชีแบบเรียลไทม์
        {user ? ` · ${user.email ?? "ผู้ดูแล"}` : ""}
      </footer>
    </div>
  );
}
