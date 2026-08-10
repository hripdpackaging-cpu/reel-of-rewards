import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบผู้ดูแล | Mother's Day Lucky Wheel" },
      {
        name: "description",
        content: "เข้าสู่ระบบเพื่อจัดการวงล้อ รางวัล และซิงก์ข้อมูลรางวัลคงเหลือแบบเรียลไทม์ร่วมกับทีมงาน",
      },
      { property: "og:title", content: "เข้าสู่ระบบผู้ดูแล | Mother's Day Lucky Wheel" },
      {
        property: "og:description",
        content: "เข้าสู่ระบบเพื่อจัดการวงล้อและรางวัลของกิจกรรมวันแม่ร่วมกันหลายบัญชี",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/admin" });
  }, [user, navigate]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("เข้าสู่ระบบสำเร็จ");
    void navigate({ to: "/admin" });
  };

  const signUp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("สมัครบัญชีสำเร็จ หากระบบขอยืนยันอีเมล กรุณาตรวจสอบกล่องจดหมาย");
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) {
      toast.error("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/admin" });
  };

  return (
    <div className="panel-hero flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-white/15 bg-card/95 backdrop-blur">
        <CardHeader className="items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Crown className="h-6 w-6 text-gold" />
          </span>
          <CardTitle className="font-display text-xl">เข้าสู่ระบบผู้ดูแลกิจกรรม</CardTitle>
          <p className="text-sm text-muted-foreground">
            ผู้ดูแลที่เข้าสู่ระบบจะแก้ไขวงล้อและรางวัลร่วมกันได้ ข้อมูลซิงก์ทันทีทุกเครื่อง
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
            <LogIn className="mr-2 h-4 w-4" /> เข้าสู่ระบบด้วย Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> หรือใช้อีเมล <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">
                เข้าสู่ระบบ
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                สมัครบัญชีใหม่
              </TabsTrigger>
            </TabsList>
            <div className="space-y-3 pt-4">
              <div>
                <Label>อีเมล</Label>
                <Input
                  className="mt-1.5"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>รหัสผ่าน</Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <TabsContent value="signin" className="pt-3">
              <Button className="w-full" onClick={signIn} disabled={busy || !email || !password}>
                เข้าสู่ระบบ
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="pt-3">
              <Button className="w-full" onClick={signUp} disabled={busy || !email || !password}>
                สมัครบัญชีใหม่
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="underline">
              กลับไปหน้าสุ่มวงล้อ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
