import { useEffect, useRef, useState } from 'react';

export function useScrollAnimation(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(entry.target); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

export function useParallax3D({ intensity = 0.12, rotate = 6, perspective = 900 } = {}) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handle = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      const progress = Math.max(-1, Math.min(1, (center - viewH / 2) / viewH));
      const translate = -progress * intensity * 120;
      const rotateX = progress * rotate;
      setStyle({
        transform: `perspective(${perspective}px) translate3d(0, ${translate}px, 0) rotateX(${rotateX}deg)`
      });
    };

    handle();
    window.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, [intensity, rotate, perspective]);

  return [ref, style];
}
