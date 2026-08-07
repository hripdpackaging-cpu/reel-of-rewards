import { Link, useRouterState } from "@tanstack/react-router";
import { Crown, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import type { ReactNode } from "react";

const links = [
  { to: "/", label: "หน้าสุ่มวงล้อ" },
  { to: "/admin", label: "จัดการระบบ" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useStore();
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
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
        <Sparkles className="mr-1 inline h-3.5 w-3.5 text-gold" />
        {state.settings.brandName} · ข้อมูลถูกบันทึกไว้ในเครื่องนี้อัตโนมัติ
      </footer>
    </div>
  );
}
