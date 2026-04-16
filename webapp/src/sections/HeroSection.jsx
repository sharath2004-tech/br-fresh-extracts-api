import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { useParallax3D } from '../hooks/useScrollAnimation';

export default function HeroSection() {
  const { store } = useStore();
  const { t, tr, lang } = useLanguage();
  const { title, subtitle, ctaText, backgroundImage } = store.hero;
  const [bgRef, bgStyle] = useParallax3D({ intensity: 0.18, rotate: 4, perspective: 900 });
  const [contentRef, contentStyle] = useParallax3D({ intensity: 0.1, rotate: -3, perspective: 900 });

  const scrollDown = () => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  const heroTitle = lang === 'en' ? title : tr(title || t('hero.title'));
  const heroSubtitle = lang === 'en' ? subtitle : tr(subtitle || t('hero.subtitle'));
  const heroCta = lang === 'en' ? ctaText : tr(ctaText || t('hero.cta'));

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grain-overlay">
      {/* Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 will-change-transform"
        style={{ backgroundImage: `url(${backgroundImage})`, ...bgStyle }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-900/70 via-forest-900/50 to-forest-900/80" />

      {/* Botanical SVG decorations */}
      <svg className="absolute top-10 left-8 text-terra-400/20 w-32 h-32 md:w-48 md:h-48 pointer-events-none" viewBox="0 0 200 200" fill="currentColor">
        <path d="M100 20 C60 20 20 60 20 100 C20 140 60 180 100 180 C140 180 180 140 180 100 L100 100 Z" opacity="0.5"/>
        <path d="M100 20 L100 180 M60 50 Q100 100 60 150 M140 50 Q100 100 140 150" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
      </svg>
      <svg className="absolute bottom-16 right-8 text-cream/10 w-40 h-40 md:w-56 md:h-56 pointer-events-none rotate-180" viewBox="0 0 200 200" fill="currentColor">
        <path d="M100 20 C60 20 20 60 20 100 C20 140 60 180 100 180 C140 180 180 140 180 100 L100 100 Z" opacity="0.4"/>
        <path d="M100 20 L100 180" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
      </svg>

      {/* Content */}
      <div ref={contentRef} style={contentStyle} className="relative z-10 text-center px-6 max-w-4xl mx-auto will-change-transform">
        <p className="font-sans text-terra-300 tracking-[0.3em] text-xs md:text-sm uppercase mb-6 animate-[fadeIn_1s_ease_both]">
          {t('hero.tagline')}
        </p>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-cream font-light leading-[1.1] mb-6 whitespace-pre-line text-balance">
          {heroTitle}
        </h1>
        <div className="w-16 h-px bg-terra-400 mx-auto mb-6" />
        <p className="font-sans text-cream/75 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
          {heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/shop" className="btn-primary flex items-center gap-2 group">
            {heroCta} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/shop" className="text-cream/70 hover:text-cream font-sans text-sm tracking-widest uppercase transition-colors">
            {t('hero.viewAll')}
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-14 flex-wrap">
          {['FSSAI Certified', 'Farm Fresh', 'Pan India Delivery'].map(b => (
            <span key={b} className="text-cream/50 text-xs tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-terra-400 inline-block" />
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button onClick={scrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/40 hover:text-cream/80 transition-colors animate-bounce">
        <ChevronDown size={28} strokeWidth={1} />
      </button>
    </section>
  );
}
