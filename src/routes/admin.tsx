import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

const tabs = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/wheels", label: "จัดการวงล้อ" },
  { to: "/admin/prizes", label: "จัดการรางวัล" },
  { to: "/admin/import", label: "Import Excel" },
  { to: "/admin/history", label: "ประวัติการสุ่ม" },
  { to: "/admin/settings", label: "ตั้งค่าระบบ" },
];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "ระบบจัดการวงล้อรางวัล | Mother's Day Lucky Wheel" },
      {
        name: "description",
        content: "จัดการวงล้อ รางวัล การนำเข้าข้อมูล Excel ประวัติการสุ่ม และตั้งค่าเสียง/เอฟเฟกต์",
      },
      { property: "og:title", content: "ระบบจัดการวงล้อรางวัล" },
      { property: "og:description", content: "Admin Dashboard สำหรับกิจกรรมสุ่มรางวัลวันแม่" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Outlet />
      </div>
    </AppShell>
  );
}
