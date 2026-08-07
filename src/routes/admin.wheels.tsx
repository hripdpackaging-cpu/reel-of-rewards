import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/ImageUploader";
import { WheelCanvas } from "@/components/WheelCanvas";
import { spinnablePrizes, useStore } from "@/lib/store";
import { useSpinner } from "@/lib/useSpinner";
import type { AfterSpin, RandomMode, SpinMode, Wheel } from "@/lib/types";

export const Route = createFileRoute("/admin/wheels")({
  component: WheelsPage,
});

const DURATIONS = [3, 5, 10, 15, 20, 30];

function WheelsPage() {
  const { state, addWheel, updateWheel, duplicateWheel, deleteWheel } = useStore();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Wheel | null>(null);
  const wheel = state.wheels.find((w) => w.id === editing) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">จัดการวงล้อ</h1>
          <p className="text-sm text-muted-foreground">สร้าง แก้ไข คัดลอก หรือลบวงล้อของกิจกรรม</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="ชื่อวงล้อใหม่"
            className="w-56"
          />
          <Button
            onClick={() => {
              const name = newName.trim();
              if (!name) return toast.error("กรุณาตั้งชื่อวงล้อ");
              const w = addWheel(name);
              setNewName("");
              setEditing(w.id);
              toast.success("สร้างวงล้อใหม่แล้ว");
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> สร้างวงล้อ
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.wheels.map((w) => {
          const pool = spinnablePrizes(w);
          const remaining = pool.reduce((s, p) => s + p.remaining, 0);
          const spins = state.history.filter((h) => h.wheelId === w.id && h.status === "confirmed").length;
          return (
            <Card key={w.id} className="card-soft">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{w.name}</CardTitle>
                  <Badge variant={w.active ? "default" : "secondary"}>
                    {w.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{w.eventName}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="font-display text-lg font-bold">{w.prizes.length}</p>
                    รายการรางวัล
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="font-display text-lg font-bold">{remaining}</p>
                    คงเหลือ
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="font-display text-lg font-bold">{spins}</p>
                    สุ่มแล้ว
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  หมุน {w.spin.duration} วิ · {w.spin.mode === "auto" ? "Auto Stop" : "Manual Stop"} ·{" "}
                  {w.randomMode === "equal" ? "โอกาสเท่ากัน" : "ตามน้ำหนัก"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setEditing(w.id)}>
                    <Pencil className="mr-1 h-4 w-4" /> แก้ไข
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(w.id)}>
                    ตั้งค่าการหมุน
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      duplicateWheel(w.id);
                      toast.success("คัดลอกวงล้อแล้ว");
                    }}
                  >
                    <Copy className="mr-1 h-4 w-4" /> คัดลอก
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/admin/history">ประวัติ</Link>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setToDelete(w)}>
                    <Trash2 className="mr-1 h-4 w-4" /> ลบ
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    id={`active-${w.id}`}
                    checked={w.active}
                    onCheckedChange={(v) => updateWheel(w.id, { active: v })}
                  />
                  <Label htmlFor={`active-${w.id}`} className="text-xs">
                    เปิดใช้งานวงล้อนี้
                  </Label>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!wheel} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>ตั้งค่าวงล้อ</DialogTitle>
          </DialogHeader>
          {wheel && <WheelEditor wheel={wheel} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบวงล้อ?</AlertDialogTitle>
            <AlertDialogDescription>
              วงล้อ “{toDelete?.name}” และรางวัลทั้งหมดในวงล้อจะถูกลบอย่างถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteWheel(toDelete.id);
                setToDelete(null);
                toast.success("ลบวงล้อแล้ว");
              }}
            >
              ลบวงล้อ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WheelEditor({ wheel }: { wheel: Wheel }) {
  const { updateWheel, state } = useStore();
  const set = (patch: Partial<Wheel>) => updateWheel(wheel.id, patch);
  const setSpin = (patch: Partial<Wheel["spin"]>) => set({ spin: { ...wheel.spin, ...patch } });
  const pool = spinnablePrizes(wheel);
  const spinner = useSpinner(wheel.spin, state.settings.sound && wheel.spin.sound);

  return (
    <Tabs defaultValue="general">
      <TabsList className="w-full">
        <TabsTrigger value="general">ทั่วไป</TabsTrigger>
        <TabsTrigger value="images">รูปภาพ &amp; โลโก้</TabsTrigger>
        <TabsTrigger value="spin">Spin Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4 pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>ชื่อวงล้อ</Label>
            <Input value={wheel.name} onChange={(e) => set({ name: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label>ชื่อกิจกรรม / แบนเนอร์ข้อความ</Label>
            <Input
              value={wheel.eventName}
              onChange={(e) => set({ eventName: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>วิธีการสุ่ม</Label>
            <Select value={wheel.randomMode} onValueChange={(v) => set({ randomMode: v as RandomMode })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">โอกาสเท่ากันทุกรางวัล</SelectItem>
                <SelectItem value="weighted">กำหนดค่าน้ำหนัก (Weighted)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>การจัดการรางวัลหลังสุ่ม</Label>
            <Select value={wheel.afterSpin} onValueChange={(v) => set({ afterSpin: v as AfterSpin })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remove">ลบรางวัลออกทันทีหลังสุ่มได้</SelectItem>
                <SelectItem value="decrement">ลดจำนวนคงเหลือ และปิดเมื่อหมด</SelectItem>
                <SelectItem value="keep">ไม่ลบรางวัล (สุ่มซ้ำได้)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={wheel.active} onCheckedChange={(v) => set({ active: v })} />
          <Label>เปิดใช้งานวงล้อนี้</Label>
        </div>
      </TabsContent>

      <TabsContent value="images" className="space-y-5 pt-4">
        <ImageUploader
          label="โลโก้ / ตราบริษัทตรงกลางวงล้อ"
          value={wheel.centerLogo}
          onChange={(v) => set(v ? { centerLogo: v } : { centerLogo: undefined })}
          hint="JPG, JPEG, PNG, WebP"
        />
        <div>
          <Label>ขนาดโลโก้กลางวงล้อ ({wheel.centerLogoSize}%)</Label>
          <Slider
            className="mt-3"
            value={[wheel.centerLogoSize]}
            min={12}
            max={60}
            step={1}
            onValueChange={([v]) => set({ centerLogoSize: v ?? 34 })}
          />
        </div>
        <ImageUploader
          label="รูปพื้นหลังหน้าวงล้อ"
          value={wheel.background}
          onChange={(v) => set(v ? { background: v } : { background: undefined })}
        />
        <ImageUploader
          label="แบนเนอร์กิจกรรม"
          value={wheel.banner}
          onChange={(v) => set(v ? { banner: v } : { banner: undefined })}
        />
      </TabsContent>

      <TabsContent value="spin" className="space-y-4 pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Spin Mode</Label>
            <Select value={wheel.spin.mode} onValueChange={(v) => setSpin({ mode: v as SpinMode })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Stop (หยุดอัตโนมัติ)</SelectItem>
                <SelectItem value="manual">Manual Stop (กดหยุดเอง)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Spin Duration (วินาที)</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={wheel.spin.duration === d ? "default" : "secondary"}
                  onClick={() => setSpin({ duration: d })}
                >
                  {d}s
                </Button>
              ))}
              <Input
                type="number"
                min={1}
                max={120}
                value={wheel.spin.duration}
                onChange={(e) => setSpin({ duration: Math.max(1, Number(e.target.value) || 1) })}
                className="w-24"
              />
            </div>
          </div>
          <div>
            <Label>Minimum Rotations (รอบ)</Label>
            <Input
              type="number"
              min={1}
              value={wheel.spin.minRotations}
              onChange={(e) => setSpin({ minRotations: Math.max(1, Number(e.target.value) || 1) })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Initial Speed (องศา/วินาที)</Label>
            <Input
              type="number"
              value={wheel.spin.initialSpeed}
              onChange={(e) => setSpin({ initialSpeed: Number(e.target.value) || 0 })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Maximum Speed (องศา/วินาที)</Label>
            <Input
              type="number"
              value={wheel.spin.maxSpeed}
              onChange={(e) => setSpin({ maxSpeed: Number(e.target.value) || 0 })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Acceleration</Label>
            <Input
              type="number"
              value={wheel.spin.acceleration}
              onChange={(e) => setSpin({ acceleration: Number(e.target.value) || 0 })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Deceleration</Label>
            <Input
              type="number"
              value={wheel.spin.deceleration}
              onChange={(e) => setSpin({ deceleration: Number(e.target.value) || 0 })}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["countdown", "Countdown"],
              ["sound", "Sound Effect"],
              ["celebration", "Celebration Effect"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 rounded-lg border border-border p-3">
              <Switch checked={wheel.spin[key]} onCheckedChange={(v) => setSpin({ [key]: v })} />
              <Label className="text-sm">{label}</Label>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">ทดลองหมุน (Test Spin)</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={spinner.busy || pool.length === 0}
                onClick={() =>
                  spinner.spin(Math.floor(Math.random() * pool.length), pool.length, () => undefined)
                }
              >
                Test Spin
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={wheel.spin.mode !== "manual" || spinner.phase !== "spinning"}
                onClick={spinner.requestStop}
              >
                หยุด
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <WheelCanvas
              prizes={pool}
              angle={spinner.angle}
              centerLogo={wheel.centerLogo}
              centerLogoSize={wheel.centerLogoSize}
              size={260}
            />
            {spinner.countdown !== null && (
              <p className="mt-2 text-center font-display text-lg font-semibold">
                กำลังสุ่มรางวัล... {spinner.countdown}
              </p>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
