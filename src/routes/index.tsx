import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  History as HistoryIcon,
  Maximize,
  Minimize,
  Play,
  Settings2,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WheelCanvas } from "@/components/WheelCanvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { pickPrize, spinnablePrizes, useStore } from "@/lib/store";
import { useSpinner } from "@/lib/useSpinner";
import { celebrate, fanfare } from "@/lib/media";
import type { Prize } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "สุ่มวงล้อรางวัลวันแม่ | Mother's Day Lucky Wheel" },
      {
        name: "description",
        content:
          "เว็บแอปสุ่มวงล้อรางวัลสำหรับกิจกรรมวันแม่ รองรับหลายวงล้อ กำหนดรางวัล น้ำหนักการสุ่ม เอฟเฟกต์ฉลอง และแสดงบนจอใหญ่",
      },
      { property: "og:title", content: "สุ่มวงล้อรางวัลวันแม่" },
      {
        property: "og:description",
        content: "หมุนวงล้อลุ้นรางวัลในงานวันแม่ พร้อมระบบจัดการรางวัลและประวัติการสุ่ม",
      },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const { state, setState, updateWheel, updatePrize, deletePrize, addHistory } = useStore();
  const wheels = state.wheels.filter((w) => w.active);
  const wheel = state.wheels.find((w) => w.id === state.activeWheelId) ?? wheels[0] ?? state.wheels[0] ?? null;
  const [result, setResult] = useState<{ prize: Prize; at: string; round: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [full, setFull] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const soundOn = state.settings.sound && (wheel?.spin.sound ?? true);
  const celebrationOn = state.settings.celebration && (wheel?.spin.celebration ?? true);
  const spinner = useSpinner(
    wheel?.spin ?? {
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
    },
    soundOn,
  );

  const pool = useMemo(() => (wheel ? spinnablePrizes(wheel) : []), [wheel]);
  const remainingTotal = pool.reduce((s, p) => s + p.remaining, 0);
  const wheelHistory = state.history.filter((h) => h.wheelId === wheel?.id);
  const spinCount = wheelHistory.filter((h) => h.status === "confirmed").length;

  if (!wheel) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold">ยังไม่มีวงล้อในระบบ</h1>
          <p className="mt-2 text-muted-foreground">สร้างวงล้อแรกของคุณเพื่อเริ่มกิจกรรม</p>
          <Button asChild className="mt-6">
            <Link to="/admin/wheels">ไปหน้าจัดการวงล้อ</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const doSpin = () => {
    if (spinner.busy) return;
    if (!pool.length) {
      toast.error("ไม่มีรางวัลเหลืออยู่ในวงล้อนี้แล้ว");
      return;
    }
    const prize = pickPrize(wheel);
    if (!prize) return;
    const index = pool.findIndex((p) => p.id === prize.id);
    spinner.spin(index, pool.length, () => {
      setResult({ prize, at: new Date().toISOString(), round: spinCount + 1 });
      if (celebrationOn) void celebrate();
      if (soundOn) fanfare();
    });
  };

  const confirmResult = () => {
    if (!result) return;
    const p = wheel.prizes.find((x) => x.id === result.prize.id);
    addHistory({
      wheelId: wheel.id,
      wheelName: wheel.name,
      prizeId: result.prize.id,
      prizeName: result.prize.name,
      ...(result.prize.image ? { prizeImage: result.prize.image } : {}),
      at: result.at,
      operator: state.settings.operator,
      status: "confirmed",
      note: "",
    });
    if (p) {
      if (wheel.afterSpin === "remove") {
        deletePrize(wheel.id, p.id);
      } else if (wheel.afterSpin === "decrement") {
        const remaining = Math.max(0, p.remaining - 1);
        updatePrize(wheel.id, p.id, { remaining, active: remaining > 0 ? p.active : false });
      }
    }
    toast.success(`ยืนยันรางวัล: ${result.prize.name}`);
    setResult(null);
  };

  const removePrizeFromWheel = () => {
    if (!result) return;
    deletePrize(wheel.id, result.prize.id);
    addHistory({
      wheelId: wheel.id,
      wheelName: wheel.name,
      prizeId: result.prize.id,
      prizeName: result.prize.name,
      ...(result.prize.image ? { prizeImage: result.prize.image } : {}),
      at: result.at,
      operator: state.settings.operator,
      status: "confirmed",
      note: "ลบรางวัลออกจากวงล้อหลังสุ่ม",
    });
    setConfirmDelete(false);
    setResult(null);
    toast.success("ลบรางวัลออกจากวงล้อแล้ว");
  };

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFull(false);
    } else {
      await el.requestFullscreen().catch(() => undefined);
      setFull(true);
    }
  };

  const remainingPrize = (id: string) => wheel.prizes.find((p) => p.id === id)?.remaining ?? 0;

  return (
    <AppShell>
      <div
        ref={stageRef}
        className="panel-hero relative overflow-hidden"
        style={
          wheel.background
            ? { backgroundImage: `url(${wheel.background})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="text-center">
            {wheel.banner ? (
              <img
                src={wheel.banner}
                alt={wheel.eventName}
                className="mx-auto mb-4 max-h-32 rounded-xl object-contain"
              />
            ) : null}
            <p className="text-sm font-medium tracking-wide text-white/70">
              {wheel.eventName || state.settings.eventName}
            </p>
            <h1 className="gold-text font-display text-3xl font-bold sm:text-5xl">{wheel.name}</h1>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative">
              <WheelCanvas
                prizes={pool}
                angle={spinner.angle}
                centerLogo={wheel.centerLogo}
                centerLogoSize={wheel.centerLogoSize}
                size={520}
              />
              {spinner.countdown !== null && (
                <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center rounded-full">
                  <span className="rounded-2xl bg-black/55 px-6 py-3 text-center">
                    <span className="block text-sm text-white/80">กำลังสุ่มรางวัล...</span>
                    <span className="gold-text font-display text-6xl font-bold">
                      {spinner.countdown}
                    </span>
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button
                  size="lg"
                  onClick={doSpin}
                  disabled={spinner.busy}
                  className="h-14 min-w-40 bg-gold text-base font-semibold text-[#1a1405] hover:bg-gold/90"
                >
                  <Play className="mr-1.5 h-5 w-5" />
                  {spinner.busy ? "กำลังหมุน..." : "เริ่มหมุน"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14"
                  onClick={spinner.requestStop}
                  disabled={wheel.spin.mode !== "manual" || spinner.phase !== "spinning"}
                >
                  <Square className="mr-1.5 h-5 w-5" /> หยุด
                </Button>
                <Button size="lg" variant="secondary" className="h-14" onClick={toggleFullscreen}>
                  {full ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14"
                  onClick={() => {
                    const next = !state.settings.sound;
                    setState((s) => ({ ...s, settings: { ...s.settings, sound: next } }));
                    toast.info(next ? "เปิดเสียงแล้ว" : "ปิดเสียงแล้ว");
                  }}
                >
                  {state.settings.sound ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-white/70">เลือกวงล้อ</p>
                <Select
                  value={wheel.id}
                  onValueChange={(v) => setState((s) => ({ ...s, activeWheelId: v }))}
                  disabled={spinner.busy}
                >
                  <SelectTrigger className="mt-1.5 border-white/25 bg-white/95 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.wheels.map((w) => (
                      <SelectItem key={w.id} value={w.id} disabled={!w.active}>
                        {w.name}
                        {!w.active ? " (ปิดใช้งาน)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-black/25 p-3">
                    <p className="text-xs text-white/70">รางวัลคงเหลือ</p>
                    <p className="gold-text font-display text-2xl font-bold">{remainingTotal}</p>
                  </div>
                  <div className="rounded-lg bg-black/25 p-3">
                    <p className="text-xs text-white/70">สุ่มไปแล้ว</p>
                    <p className="gold-text font-display text-2xl font-bold">{spinCount}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="secondary" size="sm">
                        <HistoryIcon className="mr-1.5 h-4 w-4" /> ประวัติผลรางวัล
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>ประวัติการสุ่ม · {wheel.name}</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-2 px-4 pb-6">
                        {wheelHistory.length === 0 && (
                          <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการสุ่ม</p>
                        )}
                        {wheelHistory.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                          >
                            {h.prizeImage && (
                              <img src={h.prizeImage} alt="" className="h-10 w-10 rounded object-cover" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{h.prizeName}</p>
                              <p className="text-xs text-muted-foreground">
                                #{h.seq} · {new Date(h.at).toLocaleString("th-TH")}
                              </p>
                            </div>
                            <Badge variant={h.status === "confirmed" ? "default" : "secondary"}>
                              {h.status === "confirmed" ? "ยืนยัน" : "ยกเลิก"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/admin/wheels">
                      <Settings2 className="mr-1.5 h-4 w-4" /> ตั้งค่าวงล้อ
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="mb-2 text-xs text-white/70">รางวัลในวงล้อ ({pool.length})</p>
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {pool.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-2.5 py-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-white">{p.name}</span>
                      <span className="text-xs font-semibold text-gold">เหลือ {p.remaining}</span>
                    </div>
                  ))}
                  {pool.length === 0 && (
                    <p className="text-sm text-white/80">รางวัลหมดแล้ว กรุณาเพิ่มรางวัลใหม่</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-xl">
              🎉 ยินดีด้วย! ได้รับรางวัล
            </DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gold/40 bg-accent/60 p-4 text-center">
                {result.prize.image && (
                  <img
                    src={result.prize.image}
                    alt={result.prize.name}
                    className="mx-auto mb-3 h-28 w-28 rounded-xl object-cover"
                  />
                )}
                <p className="font-display text-2xl font-bold text-foreground">{result.prize.name}</p>
                {result.prize.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{result.prize.description}</p>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">{remainingPrize(result.prize.id)}</p>
                    คงเหลือ
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">#{result.round}</p>
                    รอบที่
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date(result.at).toLocaleTimeString("th-TH")}
                    </p>
                    {new Date(result.at).toLocaleDateString("th-TH")}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={confirmResult}>ยืนยันผลรางวัล</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setResult(null);
                    setTimeout(doSpin, 250);
                  }}
                >
                  สุ่มใหม่
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    toast.info("ยกเลิกผลการสุ่มแล้ว");
                  }}
                >
                  ยกเลิกผล
                </Button>
                <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="mr-1.5 h-4 w-4" /> ลบรางวัลนี้
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                โหมดจัดการหลังสุ่ม:{" "}
                {wheel.afterSpin === "remove"
                  ? "ลบรางวัลออกทันที"
                  : wheel.afterSpin === "decrement"
                    ? "ลดจำนวนคงเหลือ และลบเมื่อหมด"
                    : "ไม่ลบรางวัล (สุ่มซ้ำได้)"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรางวัลออกจากวงล้อ?</AlertDialogTitle>
            <AlertDialogDescription>
              รางวัล “{result?.prize.name}” จะถูกลบออกจากวงล้อนี้และไม่สามารถสุ่มได้อีก
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={removePrizeFromWheel}>ลบรางวัล</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>

  );
}
