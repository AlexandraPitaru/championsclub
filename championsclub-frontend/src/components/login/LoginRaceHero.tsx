const TRACK_VIEWBOX_WIDTH = 1536;
const TRACK_VIEWBOX_HEIGHT = 1024;
const TRACK_PATH_D =
  "M 252 512 C 270 338, 526 214, 768 214 C 1042 214, 1280 340, 1287 512 C 1294 696, 1060 820, 768 820 C 471 820, 242 696, 252 512";

const STREET_LAMPS = [
  { x: 334, y: 438, rotate: -12 },
  { x: 472, y: 250, rotate: -28 },
  { x: 770, y: 164, rotate: 0 },
  { x: 1088, y: 252, rotate: 24 },
  { x: 1222, y: 474, rotate: 82 },
  { x: 1126, y: 760, rotate: 148 },
  { x: 770, y: 874, rotate: 180 },
  { x: 434, y: 760, rotate: -148 },
];

export default function LoginRaceHero() {
  return (
    <>
      <style>{`
        .login-race-hero {
          --track-width: min(100%, 700px);
          position: relative;
          width: var(--track-width);
          aspect-ratio: 3 / 2;
          margin-bottom: 1.5rem;
        }

        .login-race-track {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 20px 40px rgba(6, 182, 212, 0.16));
        }

        .login-race-title {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 10%;
          text-align: center;
        }

        .login-race-wordmark {
          font-size: clamp(2.8rem, 6vw, 5.6rem);
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 0.94;
          color: #67e8f9;
          text-shadow:
            0 0 18px rgba(103, 232, 249, 0.34),
            0 0 38px rgba(34, 211, 238, 0.26),
            0 14px 32px rgba(2, 6, 23, 0.68);
        }

        .login-race-wordmark span {
          display: inline-block;
          background: linear-gradient(180deg, #cffafe 0%, #67e8f9 48%, #0891b2 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .login-race-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .login-race-car-shadow {
          filter: drop-shadow(0 12px 12px rgba(0, 0, 0, 0.32));
        }

        .login-race-car-body {
          animation: login-car-bob 1.1s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }

        .login-race-car-drift {
          animation: login-car-drift 14s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
        }

        .login-race-drift-smoke {
          animation: login-drift-smoke 14s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
          opacity: 0;
        }

        .login-street-lamp {
          opacity: 0.95;
        }

        .login-street-lamp-head {
          animation: login-lamp-flicker 3.8s ease-in-out infinite;
        }

        .login-street-lamp:nth-of-type(2n) .login-street-lamp-head {
          animation-delay: 0.45s;
        }

        .login-race-glow {
          position: absolute;
          inset: 17% 19%;
          border-radius: 999px;
          background:
            radial-gradient(circle at center, rgba(34, 211, 238, 0.2), transparent 60%);
          filter: blur(20px);
          opacity: 0.6;
        }

        @keyframes login-lamp-flicker {
          0%, 100% {
            opacity: 0.84;
          }
          48% {
            opacity: 0.92;
          }
          50% {
            opacity: 0.7;
          }
          52% {
            opacity: 0.96;
          }
        }

        @keyframes login-car-bob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1.8px);
          }
        }

        @keyframes login-car-drift {
          0%, 14%, 30%, 46%, 64%, 79%, 100% {
            transform: rotate(0deg) translate(0, 0);
          }
          18% {
            transform: rotate(7deg) translate(-3px, 1px);
          }
          22% {
            transform: rotate(17deg) translate(-7px, 3px);
          }
          27% {
            transform: rotate(8deg) translate(-3px, 1px);
          }
          35% {
            transform: rotate(-5deg) translate(2px, -1px);
          }
          39% {
            transform: rotate(2deg) translate(0, 0);
          }
          51% {
            transform: rotate(6deg) translate(-2px, 1px);
          }
          55% {
            transform: rotate(15deg) translate(-6px, 3px);
          }
          61% {
            transform: rotate(7deg) translate(-2px, 1px);
          }
          71% {
            transform: rotate(-4deg) translate(2px, 0);
          }
          75% {
            transform: rotate(1deg) translate(0, 0);
          }
          84% {
            transform: rotate(7deg) translate(-3px, 1px);
          }
          88% {
            transform: rotate(16deg) translate(-7px, 2px);
          }
          94% {
            transform: rotate(8deg) translate(-2px, 1px);
          }
        }

        @keyframes login-drift-smoke {
          0%, 14%, 30%, 46%, 64%, 79%, 100% {
            opacity: 0;
            transform: translate(0, 0) scale(0.65);
          }
          18% {
            opacity: 0.62;
            transform: translate(-12px, 4px) scale(0.92);
          }
          22% {
            opacity: 0.96;
            transform: translate(-21px, 10px) scale(1.14);
          }
          27% {
            opacity: 0.3;
            transform: translate(-34px, 17px) scale(1.5);
          }
          35% {
            opacity: 0.48;
            transform: translate(-13px, 5px) scale(0.9);
          }
          39% {
            opacity: 0;
            transform: translate(-26px, 12px) scale(1.28);
          }
          51% {
            opacity: 0.56;
            transform: translate(-12px, 5px) scale(0.88);
          }
          55% {
            opacity: 0.92;
            transform: translate(-19px, 11px) scale(1.08);
          }
          61% {
            opacity: 0.24;
            transform: translate(-33px, 18px) scale(1.46);
          }
          71% {
            opacity: 0.4;
            transform: translate(-11px, 4px) scale(0.84);
          }
          75% {
            opacity: 0;
            transform: translate(-22px, 11px) scale(1.18);
          }
          84% {
            opacity: 0.64;
            transform: translate(-13px, 5px) scale(0.92);
          }
          88% {
            opacity: 1;
            transform: translate(-21px, 10px) scale(1.12);
          }
          94% {
            opacity: 0.28;
            transform: translate(-35px, 16px) scale(1.48);
          }
        }

        @media (max-width: 1024px) {
          .login-race-hero {
            margin-left: auto;
            margin-right: auto;
          }
        }

        @media (max-height: 920px) and (min-width: 1025px) {
          .login-race-hero {
            --track-width: min(100%, 620px);
            margin-bottom: 1rem;
          }
        }

        @media (max-width: 640px) {
          .login-race-hero {
            margin-bottom: 1.15rem;
          }

          .login-race-title {
            padding: 0 16%;
          }
        }
      `}</style>

      <div className="login-race-hero" aria-hidden="true">
        <div className="login-race-glow" />
        <div className="login-race-track">
          <svg
            className="login-race-svg"
            viewBox={`0 0 ${TRACK_VIEWBOX_WIDTH} ${TRACK_VIEWBOX_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="trackSurface" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2d1d24" />
                <stop offset="48%" stopColor="#17161d" />
                <stop offset="100%" stopColor="#2c1a23" />
              </linearGradient>
              <linearGradient id="trackEdge" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbc7bf" />
                <stop offset="50%" stopColor="#fff2f0" />
                <stop offset="100%" stopColor="#f4beb2" />
              </linearGradient>
              <radialGradient id="trackGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
                <stop offset="100%" stopColor="rgba(34,211,238,0)" />
              </radialGradient>
              <filter id="trackShadow" x="-20%" y="-20%" width="140%" height="160%">
                <feDropShadow dx="0" dy="34" stdDeviation="28" floodColor="#020617" floodOpacity="0.45" />
              </filter>
              <path id="loginTrackPath" d={TRACK_PATH_D} />
            </defs>

            <ellipse cx="768" cy="512" rx="458" ry="292" fill="url(#trackGlow)" opacity="0.45" />

            <use
              href="#loginTrackPath"
              fill="none"
              stroke="#ffd7cf"
              strokeOpacity="0.18"
              strokeWidth="228"
              strokeLinecap="round"
              filter="url(#trackShadow)"
            />
            <use
              href="#loginTrackPath"
              fill="none"
              stroke="url(#trackEdge)"
              strokeWidth="180"
              strokeLinecap="round"
            />
            <use
              href="#loginTrackPath"
              fill="none"
              stroke="url(#trackSurface)"
              strokeWidth="152"
              strokeLinecap="round"
            />
            <use
              href="#loginTrackPath"
              fill="none"
              stroke="#f8e4df"
              strokeWidth="22"
              strokeLinecap="round"
              strokeDasharray="34 42"
              opacity="0.96"
            />
            <use
              href="#loginTrackPath"
              fill="none"
              stroke="#fce7e3"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.65"
            />

            {STREET_LAMPS.map((lamp, index) => (
              <g
                key={`street-lamp-${index}`}
                className="login-street-lamp"
                transform={`translate(${lamp.x} ${lamp.y}) rotate(${lamp.rotate})`}
              >
                <ellipse cx="0" cy="10" rx="15" ry="7" fill="#020617" opacity="0.22" />
                <rect x="-3.5" y="-26" width="7" height="34" rx="3.5" fill="#475569" />
                <path d="M 0 -24 L 12 -32" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                <circle className="login-street-lamp-head" cx="16" cy="-34" r="8" fill="#fde68a" />
                <circle className="login-street-lamp-head" cx="16" cy="-34" r="16" fill="#fef3c7" opacity="0.2" />
                <path d="M 16 -28 L 16 -10" stroke="#fef3c7" strokeWidth="2" opacity="0.2" />
              </g>
            ))}

            <g className="login-race-car-shadow">
              <g className="login-race-car-body">
                <g className="login-race-car-drift">
                  <animateMotion
                    dur="14s"
                    repeatCount="indefinite"
                    rotate="auto"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  >
                    <mpath href="#loginTrackPath" />
                  </animateMotion>
                  <ellipse cx="0" cy="10" rx="30" ry="13" fill="#020617" opacity="0.22" />
                  <g className="login-race-drift-smoke" transform="translate(22 34) scale(-1 1)">
                    <circle cx="0" cy="0" r="10" fill="#e2e8f0" opacity="0.82" />
                    <circle cx="12" cy="4" r="13" fill="#f8fafc" opacity="0.72" />
                    <circle cx="-10" cy="8" r="9" fill="#cbd5e1" opacity="0.64" />
                  </g>
                  <g transform="translate(0 -6) rotate(195)">
                    <rect x="-22" y="-38" width="44" height="78" rx="12" fill="#facc15" />
                    <rect x="-17" y="-28" width="34" height="34" rx="8" fill="#1e293b" />
                    <rect x="-9" y="-34" width="18" height="72" rx="5" fill="#fef3c7" opacity="0.88" />
                    <rect x="-22" y="-18" width="44" height="8" fill="#eab308" opacity="0.8" />
                    <rect x="-22" y="8" width="44" height="8" fill="#eab308" opacity="0.8" />
                    <rect x="-20" y="-40" width="40" height="6" rx="3" fill="#fde68a" opacity="0.7" />
                    <rect x="-20" y="34" width="40" height="6" rx="3" fill="#f59e0b" opacity="0.9" />
                    <circle cx="-16" cy="-26" r="4" fill="#fde68a" />
                    <circle cx="16" cy="-26" r="4" fill="#fde68a" />
                    <circle cx="-16" cy="28" r="4" fill="#fb7185" />
                    <circle cx="16" cy="28" r="4" fill="#fb7185" />
                    <rect x="-24" y="-24" width="6" height="16" rx="3" fill="#111827" />
                    <rect x="18" y="-24" width="6" height="16" rx="3" fill="#111827" />
                    <rect x="-24" y="10" width="6" height="16" rx="3" fill="#111827" />
                    <rect x="18" y="10" width="6" height="16" rx="3" fill="#111827" />
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>
        <div className="login-race-title">
          <div>
            <h1 className="login-race-wordmark">
              <span>ChampionsClub</span>
            </h1>
          </div>
        </div>
      </div>
    </>
  );
}
