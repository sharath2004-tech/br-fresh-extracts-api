import { useEffect, useState } from 'react';

export default function AppSplash({ onDone }) {
  const [phase, setPhase] = useState('hidden'); // hidden → enter → tagline → exit

  useEffect(() => {
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {});
    }).catch(() => {});

    const t0 = setTimeout(() => setPhase('enter'),    80);   // logo + title scale up
    const t1 = setTimeout(() => setPhase('tagline'),  900);  // tagline + shimmer appear
    const t2 = setTimeout(() => setPhase('exit'),    2600);  // fade out
    const t3 = setTimeout(() => onDone(),            3100);  // unmount
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f5f0e8] transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Outer glow ring */}
      <div
        className={`absolute rounded-full transition-all duration-1000 ${
          phase === 'hidden' ? 'w-0 h-0 opacity-0' : 'w-52 h-52 opacity-100'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(192,81,47,0.12) 0%, transparent 70%)',
        }}
      />

      {/* App logo */}
      <div
        className={`relative transition-all duration-700 ${
          phase === 'hidden'
            ? 'opacity-0 scale-50'
            : 'opacity-100 scale-100'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <img
          src="/logo.png"
          alt="BR Fresh Extracts"
          className="w-28 h-28 rounded-2xl shadow-xl object-contain"
          draggable={false}
        />
      </div>

      {/* Brand name */}
      <h1
        className={`mt-6 text-2xl font-bold tracking-wide text-[#2d5a27] transition-all duration-700 ${
          phase === 'hidden' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
        style={{ transitionDelay: '200ms', fontFamily: 'serif' }}
      >
        BR Fresh Extracts
      </h1>

      {/* Tagline */}
      <p
        className={`mt-2 text-sm tracking-widest uppercase text-[#c0512f] transition-all duration-700 ${
          phase === 'tagline' || phase === 'exit' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        style={{ transitionDelay: '100ms', letterSpacing: '0.18em' }}
      >
        Pure &bull; Natural &bull; Fresh
      </p>

      {/* Shimmer progress bar */}
      <div className="mt-10 w-36 h-1 rounded-full bg-[#e0d5c5] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ease-in-out ${
            phase === 'tagline' || phase === 'exit'
              ? 'w-full duration-[1600ms]'
              : 'w-0 duration-300'
          }`}
          style={{ background: 'linear-gradient(90deg, #c0512f, #2d5a27)' }}
        />
      </div>
    </div>
  );
}
