import type { Prize } from "@/lib/types";

interface Props {
  prizes: Prize[];
  angle: number;
  centerLogo?: string | undefined;
  centerLogoSize: number;
  size?: number;
  showRemaining?: boolean;
}

const R = 200;
const C = 210;

const pt = (deg: number, r = R) => {
  const rad = (deg * Math.PI) / 180;
  return [
    Number((C + r * Math.cos(rad)).toFixed(3)),
    Number((C + r * Math.sin(rad)).toFixed(3)),
  ] as const;
};

export function WheelCanvas({
  prizes,
  angle,
  centerLogo,
  centerLogoSize,
  size = 460,
  showRemaining = true,
}: Props) {
  const n = prizes.length;
  const seg = n > 0 ? 360 / n : 360;
  const logoR = (Math.max(12, Math.min(60, centerLogoSize)) / 100) * R;

  return (
    <div className="relative mx-auto aspect-square w-full" style={{ maxWidth: size }}>
      {/* pointer */}
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
        <div
          className="h-7 w-6 drop-shadow"
          style={{ background: "var(--accent-gold)", clipPath: "polygon(50% 100%, 0 0, 100% 0)" }}
        />
      </div>
      <svg viewBox="0 0 420 420" className="h-full w-full">
        <defs>
          <clipPath id="logo-clip">
            <circle cx={C} cy={C} r={logoR} />
          </clipPath>
        </defs>
        <circle cx={C} cy={C} r={208} fill="var(--accent-gold)" />
        <circle cx={C} cy={C} r={202} fill="#0f1c3f" />
        <g transform={`rotate(${angle} ${C} ${C})`}>
          {n === 0 && (
            <>
              <circle cx={C} cy={C} r={R} fill="#1b2c5c" />
              <text x={C} y={C} textAnchor="middle" fill="#c9d4ee" fontSize="18">
                ยังไม่มีรางวัล
              </text>
            </>
          )}
          {prizes.map((p, i) => {
            const a0 = i * seg;
            const a1 = a0 + seg;
            const [x0, y0] = pt(a0);
            const [x1, y1] = pt(a1);
            const mid = a0 + seg / 2;
            const d =
              n === 1
                ? `M ${C - R} ${C} A ${R} ${R} 0 1 1 ${C + R} ${C} A ${R} ${R} 0 1 1 ${C - R} ${C} Z`
                : `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
            const label = p.name.length > 22 ? `${p.name.slice(0, 21)}…` : p.name;
            return (
              <g key={p.id}>
                <path d={d} fill={p.color} stroke="rgba(255,255,255,.55)" strokeWidth={1.5} />
                <g transform={`rotate(${mid} ${C} ${C})`}>
                  {p.image ? (
                    <>
                      <image
                        href={p.image}
                        x={C + R * 0.52 - 24}
                        y={C - 24}
                        width={48}
                        height={48}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath="inset(0 round 10px)"
                      />
                      <text
                        x={C + R * 0.94}
                        y={C}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fill="#fff"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {label.length > 14 ? `${label.slice(0, 13)}…` : label}
                      </text>
                    </>
                  ) : (
                    <text
                      x={C + R * 0.94}
                      y={C}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize={n > 12 ? 10 : 13}
                      fontWeight={600}
                    >
                      {label}
                    </text>
                  )}
                  {/* remaining count overlay */}
                  {showRemaining && (
                    <g transform={`translate(${C + R * 0.3} ${C})`}>
                      <rect
                        x={-24}
                        y={-10}
                        width={48}
                        height={20}
                        rx={10}
                        fill="rgba(15,28,63,0.72)"
                        stroke="var(--accent-gold)"
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#f4dd8b"
                        fontSize={11}
                        fontWeight={700}
                      >
                        เหลือ {p.remaining}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
        {/* hub */}
        <circle cx={C} cy={C} r={logoR + 6} fill="#fff" opacity={0.95} />
        <circle cx={C} cy={C} r={logoR + 3} fill="var(--accent-gold)" />
        <circle cx={C} cy={C} r={logoR} fill="#0f1c3f" />
        {centerLogo ? (
          <image
            href={centerLogo}
            x={C - logoR}
            y={C - logoR}
            width={logoR * 2}
            height={logoR * 2}
            clipPath="url(#logo-clip)"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <text
            x={C}
            y={C}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#f4dd8b"
            fontSize={logoR * 0.42}
            fontWeight={700}
          >
            LOGO
          </text>
        )}
      </svg>
    </div>
  );
}
