import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
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
  head: () => ({
    meta: [
      { title: "จัดการรางวัลในวงล้อ | Mother's Day Lucky Wheel" },
      { name: "description", content: "เพิ่ม แก้ไข จัดลำดับ และกำหนดน้ำหนักความน่าจะเป็นของรางวัลในแต่ละวงล้อ" },
      { property: "og:title", content: "จัดการรางวัลในวงล้อ | Mother's Day Lucky Wheel" },
      { property: "og:description", content: "เพิ่ม แก้ไข จัดลำดับ และกำหนดน้ำหนักความน่าจะเป็นของรางวัลในแต่ละวงล้อ" },
    ],
  }),
  component: PrizesPage,
});

function PrizesPage() {
  const { state, setState, addPrize, deletePrize } = useStore();
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
    const orderById = new Map(reordered.map((p, i) => [p.id, i]));
    void setState((s) => ({
      ...s,
      wheels: s.wheels.map((w) =>
        w.id === wheel.id
          ? {
              ...w,
              prizes: w.prizes.map((p) => ({ ...p, order: orderById.get(p.id) ?? p.order })),
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
          <p className="text-sm text-muted-foreground">
            แก้ไขข้อมูลรางวัลแล้วกด “บันทึกรางวัลนี้” เพื่อยืนยันการบันทึกลงคลาวด์
          </p>
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
            onClick={async () => {
              await addPrize(wheel.id);
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
          <PrizeRow
            key={p.id}
            wheelId={wheel.id}
            prize={p}
            index={i}
            count={prizes.length}
            onMove={move}
            onDelete={setToDelete}
          />
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
              onClick={async () => {
                if (toDelete) await deletePrize(wheel.id, toDelete.id);
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

function PrizeRow({
  wheelId,
  prize,
  index,
  count,
  onMove,
  onDelete,
}: {
  wheelId: string;
  prize: Prize;
  index: number;
  count: number;
  onMove: (id: string, dir: -1 | 1) => void;
  onDelete: (p: Prize) => void;
}) {
  const { updatePrize, syncing } = useStore();
  const [draft, setDraft] = useState<Prize>(prize);

  useEffect(() => {
    setDraft(prize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prize.id, prize.order]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(prize);
  const set = (patch: Partial<Prize>) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    const { id, order, ...patch } = draft;
    void id;
    void order;
    await updatePrize(wheelId, prize.id, patch);
    toast.success(`บันทึกรางวัล “${draft.name}” แล้ว`);
  };

  return (
    <Card className={`card-soft ${dirty ? "ring-2 ring-destructive/40" : ""}`}>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-3">
          <ImageUploader
            label="รูปภาพรางวัล"
            hint="ถ้าไม่มีรูป จะแสดงชื่อรางวัลบนช่องวงล้อ"
            value={draft.image}
            onChange={(v) => set(v ? { image: v } : { image: undefined })}
          />
          <div className="flex items-center gap-2">
            <Button size="icon" variant="secondary" onClick={() => onMove(prize.id, -1)} disabled={index === 0}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onMove(prize.id, 1)}
              disabled={index === count - 1}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">ลำดับที่ {index + 1}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>ชื่อรางวัล</Label>
              <Input className="mt-1.5" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div>
              <Label>สีของช่องวงล้อ</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => set({ color: e.target.value })}
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
                      onClick={() => set({ color: c })}
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
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>จำนวนทั้งหมด</Label>
              <Input
                className="mt-1.5"
                type="number"
                min={0}
                value={draft.total}
                onChange={(e) => set({ total: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div>
              <Label>คงเหลือ</Label>
              <Input
                className="mt-1.5"
                type="number"
                min={0}
                value={draft.remaining}
                onChange={(e) => set({ remaining: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div>
              <Label>น้ำหนัก / โอกาส</Label>
              <Input
                className="mt-1.5"
                type="number"
                min={0}
                step="0.1"
                value={draft.weight}
                onChange={(e) => set({ weight: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={draft.active} onCheckedChange={(v) => set({ active: v })} />
              <Label className="text-sm">{draft.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {dirty && <span className="text-xs font-medium text-destructive">ยังไม่ได้บันทึก</span>}
              <Button size="sm" variant="secondary" onClick={() => setDraft(prize)} disabled={!dirty || syncing}>
                ยกเลิก
              </Button>
              <Button size="sm" onClick={save} disabled={!dirty || syncing}>
                <Save className="mr-1 h-4 w-4" /> บันทึกรางวัลนี้
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(prize)}>
                <Trash2 className="mr-1 h-4 w-4" /> ลบรางวัล
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
