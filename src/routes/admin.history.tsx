import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Search, Trash2, Undo2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useStore } from "@/lib/store";
import type { HistoryEntry } from "@/lib/types";

export const Route = createFileRoute("/admin/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { state, cancelHistory, clearHistory } = useStore();
  const [q, setQ] = useState("");
  const [wheelFilter, setWheelFilter] = useState("all");
  const [prizeFilter, setPrizeFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [restore, setRestore] = useState(true);
  const [toCancel, setToCancel] = useState<HistoryEntry | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const prizeNames = [...new Set(state.history.map((h) => h.prizeName))];

  const rows = state.history.filter((h) => {
    if (q && !`${h.prizeName} ${h.wheelName} ${h.operator}`.toLowerCase().includes(q.toLowerCase()))
      return false;
    if (wheelFilter !== "all" && h.wheelId !== wheelFilter) return false;
    if (prizeFilter !== "all" && h.prizeName !== prizeFilter) return false;
    const d = new Date(h.at).getTime();
    if (from && d < new Date(from).getTime()) return false;
    if (to && d > new Date(to).getTime() + 86_400_000) return false;
    return true;
  });

  const exportExcel = () => {
    if (!rows.length) {
      toast.error("ไม่มีข้อมูลสำหรับ Export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      rows.map((h) => ({
        ลำดับ: h.seq,
        วงล้อ: h.wheelName,
        รางวัล: h.prizeName,
        วันเวลา: new Date(h.at).toLocaleString("th-TH"),
        ผู้ดำเนินการ: h.operator,
        สถานะ: h.status === "confirmed" ? "ยืนยัน" : "ยกเลิก",
        หมายเหตุ: h.note,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, "spin-history.xlsx");
    toast.success("Export ประวัติสำเร็จ");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">ประวัติการสุ่ม</h1>
          <p className="text-sm text-muted-foreground">ค้นหา กรอง ยกเลิกผล และ Export เป็น Excel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportExcel}>
            <Download className="mr-1.5 h-4 w-4" /> Export Excel
          </Button>
          <Button variant="destructive" onClick={() => setConfirmClear(true)}>
            <Trash2 className="mr-1.5 h-4 w-4" /> ล้างประวัติ
          </Button>
        </div>
      </div>

      <Card className="card-soft">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหารางวัล / วงล้อ"
              className="pl-8"
            />
          </div>
          <Select value={wheelFilter} onValueChange={setWheelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="ทุกวงล้อ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกวงล้อ</SelectItem>
              {state.wheels.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prizeFilter} onValueChange={setPrizeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="ทุกรางวัล" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกรางวัล</SelectItem>
              {prizeNames.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Switch id="restore" checked={restore} onCheckedChange={setRestore} />
        <Label htmlFor="restore" className="text-sm">
          เมื่อยกเลิกผล ให้คืนจำนวนรางวัลกลับเข้าวงล้อ
        </Label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ลำดับ</TableHead>
              <TableHead>รางวัล</TableHead>
              <TableHead>วงล้อ</TableHead>
              <TableHead>วันเวลา</TableHead>
              <TableHead>ผู้ดำเนินการ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>หมายเหตุ</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  ยังไม่มีประวัติการสุ่ม
                </TableCell>
              </TableRow>
            )}
            {rows.map((h) => (
              <TableRow key={h.id}>
                <TableCell>#{h.seq}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {h.prizeImage && <img src={h.prizeImage} alt="" className="h-8 w-8 rounded object-cover" />}
                    <span className="max-w-48 truncate">{h.prizeName}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-40 truncate">{h.wheelName}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(h.at).toLocaleString("th-TH")}
                </TableCell>
                <TableCell>{h.operator}</TableCell>
                <TableCell>
                  <Badge variant={h.status === "confirmed" ? "default" : "secondary"}>
                    {h.status === "confirmed" ? "ยืนยัน" : "ยกเลิก"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-40 truncate text-sm text-muted-foreground">{h.note}</TableCell>
                <TableCell>
                  {h.status === "confirmed" && (
                    <Button size="sm" variant="outline" onClick={() => setToCancel(h)}>
                      <Undo2 className="mr-1 h-4 w-4" /> ยกเลิกผล
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการยกเลิกผลการสุ่ม?</AlertDialogTitle>
            <AlertDialogDescription>
              รายการ “{toCancel?.prizeName}” จะถูกทำเครื่องหมายว่ายกเลิก
              {restore ? " และคืนจำนวนรางวัล 1 ชิ้นกลับเข้าวงล้อ" : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ปิด</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toCancel) cancelHistory(toCancel.id, restore);
                setToCancel(null);
                toast.success("ยกเลิกผลการสุ่มแล้ว");
              }}
            >
              ยกเลิกผล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ล้างประวัติทั้งหมด?</AlertDialogTitle>
            <AlertDialogDescription>
              ประวัติการสุ่มทั้งหมดจะถูกลบอย่างถาวร (จำนวนรางวัลคงเหลือจะไม่เปลี่ยนแปลง)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearHistory();
                setConfirmClear(false);
                toast.success("ล้างประวัติแล้ว");
              }}
            >
              ล้างประวัติ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
