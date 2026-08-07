import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/ImageUploader";
import { celebrate, fanfare } from "@/lib/media";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const THEMES = [
  { name: "น้ำเงินเข้ม–ทอง (เริ่มต้น)", primary: "#1e3a8a", accent: "#c9a227" },
  { name: "ฟ้าวันแม่–ทอง", primary: "#1d4ed8", accent: "#e0b64a" },
  { name: "ม่วงอมชมพู–ทอง", primary: "#6d28d9", accent: "#d4af37" },
  { name: "เขียวมรกต–ทอง", primary: "#065f46", accent: "#c9a227" },
  { name: "แดงมงคล–ทอง", primary: "#9f1239", accent: "#e6c667" },
];

function SettingsPage() {
  const { state, updateSettings } = useStore();
  const s = state.settings;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">ตั้งค่าระบบ</h1>
        <p className="text-sm text-muted-foreground">
          ตั้งค่าหน้าจอ โลโก้ รูปภาพ เสียง และเอฟเฟกต์การฉลอง
        </p>
      </div>

      <Tabs defaultValue="screen">
        <TabsList>
          <TabsTrigger value="screen">ตั้งค่าหน้าจอ</TabsTrigger>
          <TabsTrigger value="brand">โลโก้ &amp; รูปภาพ</TabsTrigger>
          <TabsTrigger value="fx">เสียง &amp; เอฟเฟกต์</TabsTrigger>
        </TabsList>

        <TabsContent value="screen" className="pt-4">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลกิจกรรมและโทนสี</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>ชื่อระบบ / แบรนด์</Label>
                  <Input
                    className="mt-1.5"
                    value={s.brandName}
                    onChange={(e) => updateSettings({ brandName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ชื่อกิจกรรม</Label>
                  <Input
                    className="mt-1.5"
                    value={s.eventName}
                    onChange={(e) => updateSettings({ eventName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ผู้ดำเนินการสุ่ม</Label>
                  <Input
                    className="mt-1.5"
                    value={s.operator}
                    onChange={(e) => updateSettings({ operator: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>ชุดสีสำเร็จรูป</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => updateSettings({ primaryColor: t.primary, accentColor: t.accent })}
                      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
                    >
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.primary }} />
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.accent }} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>สีหลักของระบบ</Label>
                  <Input
                    type="color"
                    className="mt-1.5 h-11 w-24 p-1"
                    value={s.primaryColor}
                    onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>สีทอง / สีเน้น</Label>
                  <Input
                    type="color"
                    className="mt-1.5 h-11 w-24 p-1"
                    value={s.accentColor}
                    onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="pt-4">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base">โลโก้ส่วนหัวเว็บไซต์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader
                label="โลโก้ / ตราบริษัท (ส่วนหัว)"
                hint="รองรับ JPG, JPEG, PNG, WebP"
                value={s.siteLogo}
                onChange={(v) => updateSettings(v ? { siteLogo: v } : { siteLogo: undefined })}
              />
              <p className="text-sm text-muted-foreground">
                โลโก้กลางวงล้อ รูปพื้นหลัง และแบนเนอร์ ตั้งค่าแยกได้ในแต่ละวงล้อที่หน้า “จัดการวงล้อ”
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fx" className="pt-4">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base">เสียงและเอฟเฟกต์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">เสียงประกอบ</p>
                  <p className="text-xs text-muted-foreground">เสียงหมุนวงล้อและเสียงแสดงความยินดี</p>
                </div>
                <Switch checked={s.sound} onCheckedChange={(v) => updateSettings({ sound: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">เอฟเฟกต์ฉลอง</p>
                  <p className="text-xs text-muted-foreground">กระดาษโปรยเมื่อได้รางวัล</p>
                </div>
                <Switch
                  checked={s.celebration}
                  onCheckedChange={(v) => updateSettings({ celebration: v })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    fanfare();
                    toast.success("ทดสอบเสียงแล้ว");
                  }}
                >
                  ทดสอบเสียง
                </Button>
                <Button variant="secondary" onClick={() => void celebrate()}>
                  ทดสอบเอฟเฟกต์ฉลอง
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                หมายเหตุ: สามารถเปิด/ปิดเสียงและเอฟเฟกต์แยกในแต่ละวงล้อได้ที่หน้า Spin Settings
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
