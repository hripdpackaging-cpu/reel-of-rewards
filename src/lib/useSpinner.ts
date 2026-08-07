import { useCallback, useEffect, useRef, useState } from "react";
import { tick as tickSound } from "./media";
import type { SpinSettings } from "./types";

export type SpinPhase = "idle" | "countdown" | "spinning" | "stopping";

const mod360 = (a: number) => ((a % 360) + 360) % 360;

function autoEase(t: number) {
  const p1 = 0.2;
  const p2 = 0.7;
  const area = p1 / 2 + (p2 - p1) + (1 - p2) / 2;
  let acc: number;
  if (t < p1) acc = (t * t) / (2 * p1);
  else if (t < p2) acc = p1 / 2 + (t - p1);
  else {
    const u = t - p2;
    const span = 1 - p2;
    acc = p1 / 2 + (p2 - p1) + u - (u * u) / (2 * span);
  }
  return acc / area;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Target rotation so that the segment at `index` lands under the top pointer. */
export function targetRotation(index: number, count: number, current: number, extraTurns: number) {
  const seg = 360 / count;
  const center = (index + 0.5) * seg;
  const want = mod360(270 - center);
  const base = current + extraTurns * 360;
  return base + mod360(want - mod360(base));
}

export function useSpinner(settings: SpinSettings, soundOn: boolean) {
  const [angle, setAngle] = useState(0);
  const [phase, setPhase] = useState<SpinPhase>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const raf = useRef<number | null>(null);
  const angleRef = useRef(0);
  const lastSeg = useRef(0);
  const stopReq = useRef(false);
  const segCount = useRef(1);

  const cancel = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const push = useCallback(
    (a: number) => {
      angleRef.current = a;
      setAngle(a);
      if (soundOn && segCount.current > 0) {
        const s = Math.floor(mod360(a) / (360 / segCount.current));
        if (s !== lastSeg.current) {
          lastSeg.current = s;
          tickSound();
        }
      }
    },
    [soundOn],
  );

  const run = useCallback(
    (from: number, to: number, duration: number, ease: (t: number) => number, done: () => void) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / (duration * 1000));
        push(from + (to - from) * ease(t));
        if (t < 1) raf.current = requestAnimationFrame(step);
        else {
          raf.current = null;
          done();
        }
      };
      raf.current = requestAnimationFrame(step);
    },
    [push],
  );

  const spin = useCallback(
    (index: number, count: number, onDone: () => void) => {
      segCount.current = count;
      stopReq.current = false;
      const begin = () => {
        if (settings.mode === "auto") {
          setPhase("spinning");
          const to = targetRotation(index, count, angleRef.current, Math.max(1, settings.minRotations));
          run(angleRef.current, to, Math.max(1, settings.duration), autoEase, () => {
            setPhase("idle");
            onDone();
          });
        } else {
          setPhase("spinning");
          const speed = Math.max(120, settings.maxSpeed);
          let last = performance.now();
          const loop = (now: number) => {
            const dt = (now - last) / 1000;
            last = now;
            push(angleRef.current + speed * dt);
            if (stopReq.current) {
              setPhase("stopping");
              const decelTime = Math.max(1.5, settings.maxSpeed / Math.max(60, settings.deceleration));
              const to = targetRotation(index, count, angleRef.current, 2);
              run(angleRef.current, to, decelTime, easeOut, () => {
                setPhase("idle");
                onDone();
              });
              return;
            }
            raf.current = requestAnimationFrame(loop);
          };
          raf.current = requestAnimationFrame(loop);
        }
      };

      if (settings.countdown) {
        setPhase("countdown");
        let n = 3;
        setCountdown(n);
        const iv = setInterval(() => {
          n -= 1;
          if (n <= 0) {
            clearInterval(iv);
            setCountdown(null);
            begin();
          } else setCountdown(n);
        }, 800);
      } else {
        begin();
      }
    },
    [settings, run, push],
  );

  const requestStop = useCallback(() => {
    stopReq.current = true;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setPhase("idle");
    setCountdown(null);
  }, [cancel]);

  const busy = phase !== "idle";
  return { angle, phase, countdown, spin, requestStop, reset, busy };
}
