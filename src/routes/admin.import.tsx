import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { uid, useStore } from "@/lib/store";
import { defaultSpin, PALETTE, type Prize, type Wheel } from "@/lib/types";

export const Route = createFileRoute("/admin/import")({
  head: () => ({
    meta: [
      { title: "นำเข้ารางวัลจาก Excel | Mother's Day Lucky Wheel" },
      { name: "description", content: "อัปโหลดไฟล์ Excel เพื่อสร้างรายการรางวัลในวงล้อ พร้อมตรวจสอบข้อมูลซ้ำและดาวน์โหลดเทมเพลต" },
      { property: "og:title", content: "นำเข้ารางวัลจาก Excel | Mother's Day Lucky Wheel" },
      { property: "og:description", content: "อัปโหลดไฟล์ Excel เพื่อสร้างรายการรางวัลในวงล้อ พร้อมตรวจสอบข้อมูลซ้ำและดาวน์โหลดเทมเพลต" },
    ],
  }),
  component: ImportPage,
});

interface Row {
  wheelName: string;
  name: string;
  description: string;
  quantity: number;
  weight: number;
  color: string;
  image: string;
  status: string;
  errors: string[];
  duplicate: boolean;
}

const pick = (r: Record<string, unknown>, keys: string[]) => {
  for (const k of Object.keys(r)) {
    const norm = k.toLowerCase().replace(/[\s_]/g, "");
    if (keys.includes(norm)) return String(r[k] ?? "").trim();
  }
  return "";
};

function ImportPage() {
  const { state, setState } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"new" | "append" | "replace">("new");
  const [targetWheel, setTargetWheel] = useState(state.wheels[0]?.id ?? "");
  const [newWheelName, setNewWheelName] = useState("");

  const parse = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
    if (!sheet) {
      toast.error("ไม่พบข้อมูลในไฟล์");
      return;
    }
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const seen = new Set<string>();
    const parsed: Row[] = raw.map((r) => {
      const wheelName = pick(r, ["wheelname", "ชื่อวงล้อ"]);
      const name = pick(r, ["prizename", "ชื่อรางวัล"]);
      const description = pick(r, ["prizedescription", "description", "รายละเอียด"]);
      const qty = Number(pick(r, ["quantity", "qty", "จำนวน"]) || 0);
      const weight = Number(pick(r, ["weight", "น้ำหนัก"]) || 1);
      const color = pick(r, ["color", "สี"]);
      const image = pick(r, ["imageurl", "image", "รูปภาพ"]);
      const status = pick(r, ["status", "สถานะ"]) || "active";
      const errors: string[] = [];
      if (!name) errors.push("ไม่มีชื่อรางวัล");
      if (!Number.isFinite(qty) || qty <= 0) errors.push("จำนวนไม่ถูกต้อง");
      if (!Number.isFinite(weight) || weight < 0) errors.push("ค่าน้ำหนักไม่ถูกต้อง");
      const key = `${wheelName}::${name}`.toLowerCase();
      const duplicate = name !== "" && seen.has(key);
      if (name) seen.add(key);
      return {
        wheelName,
        name,
        description,
        quantity: Number.isFinite(qty) ? qty : 0,
        weight: Number.isFinite(weight) ? weight : 1,
        color,
        image,
        status,
        errors,
        duplicate,
      };
    });
    setRows(parsed);
    setFileName(file.name);
    const firstWheel = parsed.find((r) => r.wheelName)?.wheelName;
    if (firstWheel) setNewWheelName(firstWheel);
    toast.success(`อ่านไฟล์สำเร็จ ${parsed.length} รายการ`);
  };

  const valid = rows?.filter((r) => r.errors.length === 0 && !r.duplicate) ?? [];
  const invalid = rows?.filter((r) => r.errors.length > 0) ?? [];
  const dupes = rows?.filter((r) => r.duplicate) ?? [];

  const toPrize = (r: Row, i: number): Prize => ({
    id: uid(),
    name: r.name,
    description: r.description,
    ...(r.image ? { image: r.image } : {}),
    total: r.quantity,
    remaining: r.quantity,
    color: /^#[0-9a-fA-F]{6}$/.test(r.color) ? r.color : PALETTE[i % PALETTE.length]!,
    order: i,
    active: !["inactive", "off", "ปิด", "0", "false"].includes(r.status.toLowerCase()),
    weight: r.weight,
  });

  const runImport = () => {
    if (!valid.length) {
      toast.error("ไม่มีรายการที่ถูกต้องสำหรับนำเข้า");
      return;
    }
    const now = new Date().toISOString();
    if (mode === "new") {
      const groups = new Map<string, Row[]>();
      valid.forEach((r) => {
        const key = r.wheelName || newWheelName || "วงล้อนำเข้าใหม่";
        groups.set(key, [...(groups.get(key) ?? []), r]);
      });
      const created: Wheel[] = [...groups.entries()].map(([name, list]) => ({
        id: uid(),
        name,
        active: true,
        eventName: state.settings.eventName,
        randomMode: "weighted",
        afterSpin: "decrement",
        centerLogoSize: 34,
        spin: defaultSpin(),
        prizes: list.map(toPrize),
        createdAt: now,
        updatedAt: now,
      }));
      setState((s) => ({ ...s, wheels: [...s.wheels, ...created] }));
      toast.success(`นำเข้าสำเร็จ: สร้าง ${created.length} วงล้อ / ${valid.length} รางวัล`);
    } else {
      const wheel = state.wheels.find((w) => w.id === targetWheel);
      if (!wheel) {
        toast.error("กรุณาเลือกวงล้อปลายทาง");
        return;
      }
      setState((s) => ({
        ...s,
        wheels: s.wheels.map((w) => {
          if (w.id !== targetWheel) return w;
          const base = mode === "replace" ? [] : w.prizes;
          const added = valid.map((r, i) => toPrize(r, base.length + i));
          return { ...w, prizes: [...base, ...added], updatedAt: now };
        }),
      }));
      toast.success(
        `${mode === "replace" ? "แทนที่" : "เพิ่ม"}รางวัลสำเร็จ ${valid.length} รายการ` +
          (invalid.length ? ` · ไม่สำเร็จ ${invalid.length + dupes.length} รายการ` : ""),
      );
    }
    setRows(null);
    setFileName("");
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Wheel Name": "วงล้อกิจกรรมวันแม่ รอบที่ 1",
        "Prize Name": "ช่อดอกมะลิพรีเมียม",
        "Prize Description": "ช่อมะลิสดพร้อมการ์ดอวยพร",
        Quantity: 10,
        Weight: 5,
        Color: "#1e3a8a",
        "Image URL": "",
        Status: "active",
      },
      {
        "Wheel Name": "วงล้อกิจกรรมวันแม่ รอบที่ 1",
        "Prize Name": "บัตรกำนัล 500 บาท",
        "Prize Description": "ใช้ได้ที่ร้านค้าในเครือ",
        Quantity: 5,
        Weight: 3,
        Color: "#c9a227",
        "Image URL": "",
        Status: "active",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prizes");
    XLSX.writeFile(wb, "prize-wheel-template.xlsx");
    toast.success("ดาวน์โหลด Template แล้ว");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">นำเข้าข้อมูลจาก Excel</h1>
          <p className="text-sm text-muted-foreground">รองรับไฟล์ .xlsx และ .xls</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download className="mr-1.5 h-4 w-4" /> ดาวน์โหลด Template
          </Button>
          <Button onClick={() => input.current?.click()}>
            <Upload className="mr-1.5 h-4 w-4" /> เลือกไฟล์ Excel
          </Button>
          <input
            ref={input}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                await parse(f);
              } catch {
                toast.error("อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์");
              }
            }}
          />
        </div>
      </div>

      <Card className="card-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> คอลัมน์ที่รองรับ
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["Wheel Name", "Prize Name", "Prize Description", "Quantity", "Weight", "Color", "Image URL", "Status"].map(
            (c) => (
              <Badge key={c} variant="secondary">
                {c}
              </Badge>
            ),
          )}
        </CardContent>
      </Card>

      {rows && (
        <Card className="card-soft">
          <CardHeader>
            <CardTitle className="text-base">ตรวจสอบข้อมูลก่อนนำเข้า · {fileName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["ทั้งหมด", rows.length],
                ["ข้อมูลถูกต้อง", valid.length],
                ["ข้อมูลไม่ครบ", invalid.length],
                ["รายการซ้ำ", dupes.length],
              ].map(([label, v]) => (
                <div key={String(label)} className="rounded-lg bg-secondary p-3 text-center">
                  <p className="font-display text-xl font-bold">{v}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {invalid.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">ข้อผิดพลาดที่พบ</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {invalid.slice(0, 6).map((r, i) => (
                    <li key={i}>
                      {r.name || "(ไม่มีชื่อรางวัล)"} — {r.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วงล้อ</TableHead>
                    <TableHead>รางวัล</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>น้ำหนัก</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ผลตรวจสอบ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 12).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="max-w-40 truncate">{r.wheelName || "-"}</TableCell>
                      <TableCell className="max-w-48 truncate">{r.name || "-"}</TableCell>
                      <TableCell>{r.quantity}</TableCell>
                      <TableCell>{r.weight}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>
                        {r.errors.length ? (
                          <Badge variant="destructive">{r.errors[0]}</Badge>
                        ) : r.duplicate ? (
                          <Badge variant="secondary">ซ้ำ</Badge>
                        ) : (
                          <Badge>พร้อมนำเข้า</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3">
              <Label>รูปแบบการนำเข้า</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="gap-2">
                {[
                  ["new", "สร้างวงล้อใหม่จากไฟล์ Excel"],
                  ["append", "เพิ่มรางวัลเข้าไปในวงล้อเดิม"],
                  ["replace", "แทนที่ข้อมูลรางวัลเดิมทั้งหมด"],
                ].map(([v, label]) => (
                  <div key={v} className="flex items-center gap-2 rounded-lg border border-border p-3">
                    <RadioGroupItem value={v!} id={`m-${v}`} />
                    <Label htmlFor={`m-${v}`} className="text-sm font-normal">
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {mode === "new" ? (
                <div>
                  <Label>ชื่อวงล้อ (ใช้เมื่อไฟล์ไม่มีคอลัมน์ Wheel Name)</Label>
                  <Input
                    className="mt-1.5"
                    value={newWheelName}
                    onChange={(e) => setNewWheelName(e.target.value)}
                    placeholder="วงล้อนำเข้าใหม่"
                  />
                </div>
              ) : (
                <div>
                  <Label>วงล้อปลายทาง</Label>
                  <Select value={targetWheel} onValueChange={setTargetWheel}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="เลือกวงล้อ" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.wheels.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={runImport}>ยืนยันการนำเข้า</Button>
              <Button variant="secondary" onClick={() => setRows(null)}>
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
