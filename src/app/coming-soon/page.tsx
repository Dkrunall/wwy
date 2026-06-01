"use client";

import Image from "next/image";

function ParticleField() {
  const particles = [
    { cx: 8,  cy: 14, r: 1.1, opacity: 0.10, fill: false },
    { cx: 25, cy: 38, r: 0.7, opacity: 0.07, fill: true  },
    { cx: 43, cy: 7,  r: 1.5, opacity: 0.09, fill: false },
    { cx: 60, cy: 52, r: 0.9, opacity: 0.12, fill: false },
    { cx: 76, cy: 22, r: 0.6, opacity: 0.08, fill: true  },
    { cx: 87, cy: 70, r: 1.3, opacity: 0.06, fill: false },
    { cx: 4,  cy: 62, r: 0.8, opacity: 0.10, fill: false },
    { cx: 36, cy: 82, r: 1.8, opacity: 0.05, fill: true  },
    { cx: 53, cy: 44, r: 0.6, opacity: 0.11, fill: false },
    { cx: 70, cy: 86, r: 1.0, opacity: 0.07, fill: false },
    { cx: 91, cy: 35, r: 1.6, opacity: 0.09, fill: true  },
    { cx: 16, cy: 91, r: 0.5, opacity: 0.13, fill: false },
    { cx: 48, cy: 67, r: 1.2, opacity: 0.06, fill: true  },
    { cx: 82, cy: 4,  r: 0.8, opacity: 0.08, fill: false },
    { cx: 31, cy: 55, r: 2.0, opacity: 0.04, fill: false },
    { cx: 63, cy: 28, r: 0.5, opacity: 0.11, fill: true  },
    { cx: 94, cy: 57, r: 1.4, opacity: 0.07, fill: false },
    { cx: 20, cy: 24, r: 0.9, opacity: 0.09, fill: false },
    { cx: 74, cy: 46, r: 0.7, opacity: 0.12, fill: true  },
    { cx: 41, cy: 93, r: 1.5, opacity: 0.05, fill: false },
    { cx: 57, cy: 18, r: 1.0, opacity: 0.08, fill: false },
    { cx: 12, cy: 75, r: 0.6, opacity: 0.10, fill: true  },
    { cx: 85, cy: 90, r: 1.2, opacity: 0.06, fill: false },
    { cx: 33, cy: 10, r: 0.8, opacity: 0.09, fill: false },
  ];

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {particles.map((p, i) =>
        p.fill ? (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#E89936" opacity={p.opacity} />
        ) : (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="none" stroke="#E89936" strokeWidth="0.15" opacity={p.opacity} />
        )
      )}
    </svg>
  );
}

export default function ComingSoonPage() {
  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slow-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .fade-up { animation: fade-up 0.8s ease both; }
        .d1 { animation-delay: 0.1s; }
        .d2 { animation-delay: 0.25s; }
        .d3 { animation-delay: 0.4s; }
        .d4 { animation-delay: 0.55s; }
        .d5 { animation-delay: 0.7s; }
        .slow-float { animation: slow-float 6s ease-in-out infinite; }
      `}</style>

      <main
        className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6"
        style={{ background: "#1A1410" }}
      >
        {/* Grain */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,153,54,0.10) 0%, transparent 65%)",
          }}
        />

        {/* Particles */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <ParticleField />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-0 w-full max-w-2xl">

          {/* Logo */}
          <div className="fade-up d1 slow-float mb-10">
            <Image
              src="/WWY-LOGO_White.png"
              alt="Wild Wild Yeast"
              width={150}
              height={75}
              className="object-contain"
            />
          </div>

          {/* Coming Soon badge */}
          <div className="fade-up d2 mb-8">
            <span
              className="inline-block text-[11px] tracking-[0.3em] uppercase font-sans px-4 py-1.5 rounded-full"
              style={{
                color: "rgba(232,153,54,0.8)",
                border: "1px solid rgba(232,153,54,0.25)",
              }}
            >
              ✦ Coming Soon
            </span>
          </div>

          {/* Headline */}
          <h1
            className="fade-up d3 font-serif leading-[1.05] tracking-tight mb-6"
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
            }}
          >
            Something<br />
            <span style={{ color: "#E89936" }}>is rising.</span>
          </h1>

          {/* Sub */}
          <p
            className="fade-up d4 font-sans text-base sm:text-lg leading-relaxed mb-5"
            style={{
              color: "rgba(242,235,220,0.5)",
              maxWidth: "360px",
            }}
          >
            A studio for slow-made bread<br />
            and naturally fermented drinks.
          </p>

          {/* Location */}
          <div className="fade-up d4 flex items-center gap-3 mb-8">
            <div className="w-8 h-px" style={{ background: "rgba(232,153,54,0.3)" }} />
            <span
              className="text-[11px] tracking-[0.25em] uppercase font-sans"
              style={{ color: "rgba(232,153,54,0.6)" }}
            >
              Mumbai &nbsp;&middot;&nbsp; Online &nbsp;&middot;&nbsp; Bake-to-order
            </span>
            <div className="w-8 h-px" style={{ background: "rgba(232,153,54,0.3)" }} />
          </div>

          {/* Date */}
          <div className="fade-up d5">
            <span
              className="font-sans text-[11px] tracking-[0.35em] uppercase"
              style={{ color: "rgba(242,235,220,0.2)" }}
            >
              2026 / 01
            </span>
          </div>

        </div>
      </main>
    </>
  );
}
