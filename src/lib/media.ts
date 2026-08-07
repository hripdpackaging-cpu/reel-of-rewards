export async function fileToDataUrl(file: File): Promise<string> {
  const ok = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!ok.includes(file.type)) throw new Error("รองรับเฉพาะไฟล์ JPG, JPEG, PNG, WebP");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

let audioCtx: AudioContext | null = null;
function ctx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  audioCtx ??= new AC();
  return audioCtx;
}

export function tick() {
  const c = ctx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = 1100;
  g.gain.setValueAtTime(0.05, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.06);
}

export function fanfare() {
  const c = ctx();
  if (!c) return;
  [523, 659, 784, 1046].forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    const t = c.currentTime + i * 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.5);
  });
}

export async function celebrate() {
  const confetti = (await import("canvas-confetti")).default;
  const shoot = (ratio: number, opts: Record<string, unknown>) =>
    confetti({
      particleCount: Math.floor(220 * ratio),
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#c9a227", "#1e3a8a", "#ffffff", "#93c5fd", "#fde68a"],
      ...opts,
    });
  shoot(0.3, { startVelocity: 60 });
  shoot(0.25, { spread: 130, decay: 0.91, scalar: 0.9 });
  shoot(0.2, { spread: 160, startVelocity: 30, decay: 0.92, scalar: 1.2 });
}
