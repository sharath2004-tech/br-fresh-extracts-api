import { Link } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { useParallax3D } from '../hooks/useScrollAnimation';

export default function CategoriesSection() {
  const { store } = useStore();
  const { t, tr } = useLanguage();
  const [sectionRef, sectionStyle] = useParallax3D({ intensity: 0.08, rotate: 2, perspective: 1000 });

  return (
    <section className="py-20 md:py-28 bg-ivory">
      <div ref={sectionRef} style={sectionStyle} className="max-w-7xl mx-auto px-6 will-change-transform">
        <AnimatedSection className="text-center mb-14">
          <p className="text-terra-500 tracking-[0.25em] text-xs uppercase font-sans mb-3">{t('categories.kicker')}</p>
          <h2 className="section-title">{t('categories.title')}</h2>
          <p className="section-subtitle mt-3 max-w-lg mx-auto">
            {t('categories.subtitle')}
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {store.categories.map((cat, i) => (
            <AnimatedSection key={cat.id} delay={i * 80}>
              <Link to={`/shop?cat=${encodeURIComponent(cat.name)}`}
                className="group block rounded-2xl overflow-hidden bg-white shadow-sm card-hover border border-sand-200">
                {/* Image */}
                <div className="relative overflow-hidden h-52">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-900/60 to-transparent" />
                  <span className="absolute top-3 right-3 text-2xl">{cat.icon}</span>
                </div>
                {/* Text */}
                <div className="p-5">
                  <h3 className="font-serif text-xl text-forest-700 mb-1 group-hover:text-terra-500 transition-colors">{tr(cat.name)}</h3>
                  <p className="text-sm text-warm-brown/65 leading-snug">{tr(cat.description)}</p>
                  <p className="mt-3 text-terra-500 text-xs font-medium tracking-widest uppercase group-hover:underline underline-offset-2">
                    {t('categories.shop', { cat: tr(cat.name) })}
                  </p>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
