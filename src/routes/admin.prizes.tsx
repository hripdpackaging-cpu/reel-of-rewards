import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ImageUploader } from "@/components/ImageUploader";
import { useStore } from "@/lib/store";
import { PALETTE, type Prize } from "@/lib/types";

export const Route = createFileRoute("/admin/prizes")({
  component: PrizesPage,
});

function PrizesPage() {
  const { state, setState, addPrize, updatePrize, deletePrize } = useStore();
  const [wheelId, setWheelId] = useState(state.activeWheelId ?? state.wheels[0]?.id ?? "");
  const wheel = state.wheels.find((w) => w.id === wheelId) ?? state.wheels[0] ?? null;
  const [toDelete, setToDelete] = useState<Prize | null>(null);

  if (!wheel) {
    return <p className="text-muted-foreground">ยังไม่มีวงล้อ กรุณาสร้างวงล้อก่อน</p>;
  }

  const prizes = [...wheel.prizes].sort((a, b) => a.order - b.order);

  const move = (id: string, dir: -1 | 1) => {
    const idx = prizes.findIndex((p) => p.id === id);
    const target = idx + dir;
    if (target < 0 || target >= prizes.length) return;
    const reordered = [...prizes];
    const a = reordered[idx]!;
    const b = reordered[target]!;
    reordered[idx] = b;
    reordered[target] = a;
    setState((s) => ({
      ...s,
      wheels: s.wheels.map((w) =>
        w.id === wheel.id
          ? {
              ...w,
              prizes: reordered.map((p, i) => ({ ...p, order: i })),
              updatedAt: new Date().toISOString(),
            }
          : w,
      ),
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">จัดการรางวัล</h1>
          <p className="text-sm text-muted-foreground">เพิ่ม แก้ไข จัดลำดับ และกำหนดน้ำหนักของรางวัล</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={wheel.id} onValueChange={setWheelId}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {state.wheels.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              addPrize(wheel.id);
              toast.success("เพิ่มรางวัลใหม่แล้ว");
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> เพิ่มรางวัล
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        วิธีการสุ่มของวงล้อนี้:{" "}
        <span className="font-medium text-foreground">
          {wheel.randomMode === "equal" ? "โอกาสเท่ากันทุกรางวัล" : "ตามค่าน้ำหนัก (Weighted)"}
        </span>
      </p>

      <div className="space-y-3">
        {prizes.length === 0 && (
          <p className="text-sm text-muted-foreground">ยังไม่มีรางวัล เพิ่มรางวัลด้วยตนเองได้ทันที</p>
        )}
        {prizes.map((p, i) => (
          <Card key={p.id} className="card-soft">
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-3">
                <ImageUploader
                  label="รูปภาพรางวัล"
                  hint="ถ้าไม่มีรูป จะแสดงชื่อรางวัลบนช่องวงล้อ"
                  value={p.image}
                  onChange={(v) =>
                    updatePrize(wheel.id, p.id, v ? { image: v } : { image: undefined })
                  }
                />
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => move(p.id, -1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => move(p.id, 1)}
                    disabled={i === prizes.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">ลำดับที่ {i + 1}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>ชื่อรางวัล</Label>
                    <Input
                      className="mt-1.5"
                      value={p.name}
                      onChange={(e) => updatePrize(wheel.id, p.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>สีของช่องวงล้อ</Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="color"
                        value={p.color}
                        onChange={(e) => updatePrize(wheel.id, p.id, { color: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded border border-border bg-card"
                      />
                      <div className="flex flex-wrap gap-1">
                        {PALETTE.slice(0, 6).map((c) => (
                          <button
                            key={c}
                            type="button"
                            aria-label={c}
                            className="h-6 w-6 rounded-full border border-border"
                            style={{ backgroundColor: c }}
                            onClick={() => updatePrize(wheel.id, p.id, { color: c })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>รายละเอียดรางวัล</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={2}
                    value={p.description}
                    onChange={(e) => updatePrize(wheel.id, p.id, { description: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>จำนวนทั้งหมด</Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      value={p.total}
                      onChange={(e) =>
                        updatePrize(wheel.id, p.id, { total: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </div>
                  <div>
                    <Label>คงเหลือ</Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      value={p.remaining}
                      onChange={(e) =>
                        updatePrize(wheel.id, p.id, {
                          remaining: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>น้ำหนัก / โอกาส</Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      step="0.1"
                      value={p.weight}
                      onChange={(e) =>
                        updatePrize(wheel.id, p.id, { weight: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={p.active}
                      onCheckedChange={(v) => updatePrize(wheel.id, p.id, { active: v })}
                    />
                    <Label className="text-sm">{p.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Label>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => setToDelete(p)}>
                    <Trash2 className="mr-1 h-4 w-4" /> ลบรางวัล
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรางวัล?</AlertDialogTitle>
            <AlertDialogDescription>
              รางวัล “{toDelete?.name}” จะถูกลบออกจากวงล้อนี้อย่างถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deletePrize(wheel.id, toDelete.id);
                setToDelete(null);
                toast.success("ลบรางวัลแล้ว");
              }}
            >
              ลบรางวัล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
