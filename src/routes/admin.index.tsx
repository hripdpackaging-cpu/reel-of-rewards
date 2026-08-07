import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Disc3,
  Gift,
  PackageCheck,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { state } = useStore();
  const prizes = state.wheels.flatMap((w) => w.prizes.map((p) => ({ ...p, wheelName: w.name })));
  const totalPrizes = prizes.reduce((s, p) => s + p.total, 0);
  const remaining = prizes.reduce((s, p) => s + p.remaining, 0);
  const given = state.history.filter((h) => h.status === "confirmed").length;
  const today = new Date().toDateString();
  const todayCount = state.history.filter(
    (h) => h.status === "confirmed" && new Date(h.at).toDateString() === today,
  ).length;
  const lowStock = prizes.filter((p) => p.remaining > 0 && p.remaining <= 2);

  const stats = [
    { label: "วงล้อทั้งหมด", value: state.wheels.length, icon: Disc3 },
    { label: "รางวัลทั้งหมด", value: totalPrizes, icon: Gift },
    { label: "แจกไปแล้ว", value: given, icon: PackageCheck },
    { label: "รางวัลคงเหลือ", value: remaining, icon: PackageOpen },
    { label: "สุ่มวันนี้", value: todayCount, icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">ภาพรวมระบบ</h1>
        <p className="text-sm text-muted-foreground">
          สรุปข้อมูลกิจกรรม {state.settings.eventName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="card-soft">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <s.icon className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-gold" /> รางวัลที่ใกล้หมด
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีรางวัลที่ใกล้หมด</p>
            )}
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.wheelName}</p>
                </div>
                <Badge variant="secondary">เหลือ {p.remaining}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">ผลรางวัลล่าสุด</CardTitle>
            <Link to="/admin/history" className="text-sm text-primary hover:underline">
              ดูทั้งหมด
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.history.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการสุ่ม</p>
            )}
            {state.history.slice(0, 6).map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                {h.prizeImage && <img src={h.prizeImage} alt="" className="h-9 w-9 rounded object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.prizeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.wheelName} · {new Date(h.at).toLocaleString("th-TH")}
                  </p>
                </div>
                <Badge variant={h.status === "confirmed" ? "default" : "secondary"}>
                  {h.status === "confirmed" ? "ยืนยัน" : "ยกเลิก"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
