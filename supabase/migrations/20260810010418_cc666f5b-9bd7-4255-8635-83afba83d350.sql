CREATE TABLE public.app_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.app_state TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_state TO authenticated;
GRANT ALL ON public.app_state TO service_role;

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared wheel data"
  ON public.app_state FOR SELECT
  USING (true);

CREATE POLICY "Signed-in users can create shared wheel data"
  ON public.app_state FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Signed-in users can update shared wheel data"
  ON public.app_state FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE public.app_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;

INSERT INTO public.app_state (id, data, version) VALUES ('shared', '{"wheels": [{"id": "wheel-mday-01", "name": "วงล้อกิจกรรมวันแม่ รอบที่ 1", "active": true, "eventName": "งานวันแม่แห่งชาติ 2569", "randomMode": "weighted", "afterSpin": "decrement", "centerLogoSize": 34, "spin": {"mode": "auto", "duration": 10, "minRotations": 5, "countdown": true, "sound": true, "celebration": true, "initialSpeed": 60, "maxSpeed": 720, "acceleration": 480, "deceleration": 360}, "prizes": [{"id": "prz-101", "name": "ช่อดอกมะลิพรีเมียม", "description": "ช่อมะลิสดพร้อมการ์ดอวยพรวันแม่", "total": 10, "remaining": 10, "color": "#1e3a8a", "order": 0, "active": true, "weight": 5}, {"id": "prz-102", "name": "บัตรกำนัล 500 บาท", "description": "ใช้ได้ที่ร้านค้าในเครือ", "total": 5, "remaining": 5, "color": "#c9a227", "order": 1, "active": true, "weight": 3}, {"id": "prz-103", "name": "ชุดสปาคุณแม่", "description": "ชุดผลิตภัณฑ์ดูแลผิวสำหรับคุณแม่", "total": 4, "remaining": 4, "color": "#b91c1c", "order": 2, "active": true, "weight": 2}, {"id": "prz-104", "name": "กระเป๋าผ้าลายมะลิ", "description": "กระเป๋าผ้าแคนวาสลายมะลิ", "total": 12, "remaining": 12, "color": "#0f766e", "order": 3, "active": true, "weight": 6}, {"id": "prz-105", "name": "ตุ๊กตาหมีวันแม่", "description": "ตุ๊กตาหมีพร้อมริบบิ้นสีฟ้า", "total": 6, "remaining": 6, "color": "#7c2d12", "order": 4, "active": true, "weight": 3}, {"id": "prz-106", "name": "ทองคำ 0.1 กรัม", "description": "รางวัลใหญ่ประจำกิจกรรม", "total": 1, "remaining": 1, "color": "#4338ca", "order": 5, "active": true, "weight": 1}], "createdAt": "2026-08-10T01:00:00.000Z", "updatedAt": "2026-08-10T01:00:00.000Z"}, {"id": "wheel-mday-02", "name": "วงล้อของรางวัลพิเศษ", "active": true, "eventName": "งานวันแม่แห่งชาติ 2569", "randomMode": "equal", "afterSpin": "decrement", "centerLogoSize": 34, "spin": {"mode": "manual", "duration": 15, "minRotations": 5, "countdown": true, "sound": true, "celebration": true, "initialSpeed": 60, "maxSpeed": 720, "acceleration": 480, "deceleration": 360}, "prizes": [{"id": "prz-201", "name": "หม้อทอดไร้น้ำมัน", "description": "ขนาด 5 ลิตร", "total": 2, "remaining": 2, "color": "#1e3a8a", "order": 0, "active": true, "weight": 1}, {"id": "prz-202", "name": "พัดลมไอเย็น", "description": "พร้อมรีโมท", "total": 2, "remaining": 2, "color": "#c9a227", "order": 1, "active": true, "weight": 1}, {"id": "prz-203", "name": "ชุดเครื่องนอน", "description": "ผ้าปูที่นอน 6 ฟุต", "total": 3, "remaining": 3, "color": "#b91c1c", "order": 2, "active": true, "weight": 1}, {"id": "prz-204", "name": "บัตรกำนัล 1,000 บาท", "description": "ใช้ได้ทุกสาขา", "total": 4, "remaining": 4, "color": "#0f766e", "order": 3, "active": true, "weight": 1}, {"id": "prz-205", "name": "เค้กวันแม่", "description": "เค้กมะลิโฮมเมด", "total": 5, "remaining": 5, "color": "#7c2d12", "order": 4, "active": true, "weight": 1}], "createdAt": "2026-08-10T01:00:00.000Z", "updatedAt": "2026-08-10T01:00:00.000Z"}], "history": [], "activeWheelId": "wheel-mday-01", "settings": {"brandName": "Mother''s Day Lucky Wheel", "eventName": "งานวันแม่แห่งชาติ 2569", "operator": "ผู้ดูแลระบบ", "primaryColor": "#1e3a8a", "accentColor": "#c9a227", "sound": true, "celebration": true}}'::jsonb, 1);