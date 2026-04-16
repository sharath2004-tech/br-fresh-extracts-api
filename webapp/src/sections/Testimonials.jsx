import { Quote, Star } from 'lucide-react';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={14} className={n <= rating ? 'text-terra-400 fill-terra-400' : 'text-sand-300'} />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { store } = useStore();
  const { t, tr } = useLanguage();

  return (
    <section className="py-20 md:py-28 bg-ivory">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-14">
          <p className="text-terra-500 tracking-[0.25em] text-xs uppercase font-sans mb-3">{t('testimonials.kicker')}</p>
          <h2 className="section-title">{t('testimonials.title')}</h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {store.testimonials.map((t, i) => (
            <AnimatedSection key={t.id} delay={i * 100}>
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-sand-200 h-full flex flex-col">
                <Quote className="text-terra-200 mb-4" size={28} />
                <p className="text-warm-brown/80 text-sm leading-relaxed flex-1 italic font-serif text-base">
                  "{tr(t.review)}"
                </p>
                <div className="mt-6 pt-5 border-t border-sand-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-terra-100 flex items-center justify-center text-terra-600 font-serif font-semibold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-forest-700 text-sm">{t.name}</p>
                    <p className="text-warm-brown/50 text-xs">{t.location}</p>
                  </div>
                  <StarRating rating={t.rating} />
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
