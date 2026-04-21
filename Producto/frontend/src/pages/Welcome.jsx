import React from 'react'
import { useNavigate } from 'react-router-dom'
import bgDungeon from '../assets/bg_dungeon.png'

/* ─── Fire keyframes injected once into the document head ─── */
const FIRE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');

  @keyframes fireFlicker {
    0%   {
      text-shadow:
        0 0 6px #fff8e1,
        0 0 14px #ffe680,
        0 0 30px #ffa500,
        0 0 55px #ff6600,
        0 0 90px #cc1100,
        0 0 130px #880000,
        0 0 180px #440000;
      filter: brightness(1.15);
    }
    15% {
      text-shadow:
        0 0 4px #fff8e1,
        0 0 10px #ffcc00,
        0 0 22px #ff8800,
        0 0 45px #ff4400,
        0 0 75px #bb0000,
        0 0 110px #770000,
        0 0 160px #330000;
      filter: brightness(0.95);
    }
    30% {
      text-shadow:
        0 0 8px #ffffff,
        0 0 18px #ffee55,
        0 0 38px #ffaa00,
        0 0 65px #ff5500,
        0 0 100px #dd1100,
        0 0 145px #990000,
        0 0 190px #550000;
      filter: brightness(1.2);
    }
    50% {
      text-shadow:
        0 0 3px #fff5cc,
        0 0 9px #ffbb00,
        0 0 20px #ff7700,
        0 0 40px #ff3300,
        0 0 70px #aa0000,
        0 0 105px #660000,
        0 0 150px #220000;
      filter: brightness(0.88);
    }
    65% {
      text-shadow:
        0 0 7px #fff9e0,
        0 0 16px #ffd700,
        0 0 34px #ff9900,
        0 0 60px #ff5500,
        0 0 95px #cc2200,
        0 0 140px #880000,
        0 0 185px #440000;
      filter: brightness(1.1);
    }
    80% {
      text-shadow:
        0 0 5px #fff5cc,
        0 0 12px #ffcc33,
        0 0 26px #ff8800,
        0 0 50px #ff4400,
        0 0 82px #bb0000,
        0 0 120px #770000,
        0 0 165px #330000;
      filter: brightness(1.0);
    }
    100% {
      text-shadow:
        0 0 6px #fff8e1,
        0 0 14px #ffe680,
        0 0 30px #ffa500,
        0 0 55px #ff6600,
        0 0 90px #cc1100,
        0 0 130px #880000,
        0 0 180px #440000;
      filter: brightness(1.15);
    }
  }

  @keyframes fireFlickerSub {
    0%   { text-shadow: 0 0 6px #ff9900, 0 0 20px #cc4400, 0 0 50px #880000; filter: brightness(1.05); }
    25%  { text-shadow: 0 0 3px #ff7700, 0 0 14px #aa3300, 0 0 38px #660000; filter: brightness(0.9); }
    55%  { text-shadow: 0 0 8px #ffaa00, 0 0 24px #dd5500, 0 0 58px #990000; filter: brightness(1.1); }
    80%  { text-shadow: 0 0 4px #ff8800, 0 0 17px #bb4400, 0 0 44px #770000; filter: brightness(0.95); }
    100% { text-shadow: 0 0 6px #ff9900, 0 0 20px #cc4400, 0 0 50px #880000; filter: brightness(1.05); }
  }

  @keyframes loginGlow {
    0%, 100% { box-shadow: 0 0 18px rgba(180,30,30,0.5), inset 0 0 18px rgba(0,0,0,0.35); }
    50%       { box-shadow: 0 0 32px rgba(220,60,10,0.75), inset 0 0 18px rgba(0,0,0,0.2); }
  }

  .fire-title {
    font-family: 'Cinzel', 'Georgia', serif;
    font-weight: 900;
    letter-spacing: 0.28em;
    text-transform: uppercase;

    /* Gradient text: yellow-core → orange → deep red */
    background: linear-gradient(
      to bottom,
      #fff8e1 0%,
      #ffe566 15%,
      #ffa500 40%,
      #ff4400 70%,
      #cc0000 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    animation: fireFlicker 9s ease-in-out infinite;
  }

  .fire-subtitle {
    font-family: 'Cinzel', 'Georgia', serif;
    font-weight: 700;
    letter-spacing: 0.55em;
    text-transform: uppercase;

    background: linear-gradient(
      to bottom,
      #ffd580 0%,
      #ff7700 55%,
      #aa2200 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    animation: fireFlickerSub 1.9s ease-in-out infinite;
    animation-delay: 0.3s;
  }

  .login-btn {
    animation: loginGlow 2.2s ease-in-out infinite;
    transition: transform 0.25s ease, background 0.25s ease;
  }
  .login-btn:hover {
    background: rgba(180, 30, 10, 0.92) !important;
    transform: scale(1.05);
    animation: none;
    box-shadow: 0 0 45px rgba(220, 60, 10, 0.9), inset 0 0 18px rgba(0,0,0,0.2) !important;
  }
`

function injectStyles(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const tag = document.createElement('style')
    tag.id = id
    tag.textContent = css
    document.head.appendChild(tag)
  }
}

export default function Welcome() {
  const navigate = useNavigate()

  // Inject keyframes once
  injectStyles('welcome-fire-styles', FIRE_STYLES)

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background image — object-contain para evitar zoom/recorte */}
      <img
        src={bgDungeon}
        alt="Dungeon Background"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center center' }}
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.35) 45%, transparent 72%)',
        }}
      />

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-14 px-8 gap-7">

        {/* Fire title */}
        <div className="text-center select-none">
          <h1 className="fire-title" style={{ fontSize: 'clamp(2.2rem, 7vw, 3.8rem)' }}>
            Dungeon
          </h1>
          <h2 className="fire-subtitle" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.5rem)', marginTop: '0.15em' }}>
            Assistant
          </h2>
        </div>

        {/* LOGIN button */}
        <button
          id="welcome-login-btn"
          onClick={() => navigate('/login')}
          className="login-btn px-16 py-4 font-bold tracking-widest uppercase"
          style={{
            fontFamily: "'Cinzel', 'Georgia', serif",
            fontSize: '0.95rem',
            letterSpacing: '0.35em',
            color: '#fff',
            background: 'rgba(140, 20, 10, 0.78)',
            border: '1px solid rgba(220, 80, 40, 0.55)',
            backdropFilter: 'blur(6px)',
            borderRadius: '2px',
            minWidth: '210px',
          }}
        >
          LOGIN
        </button>
      </div>
    </div>
  )
}
