import { ArrowRight, Leaf } from 'lucide-react';
import { useState } from 'react';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useLanguage } from '../contexts/LanguageContext';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    // In production, send to your email service
    setDone(true);
    setEmail('');
  };

  return (
    <section className="py-20 md:py-24 bg-sand-100">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <AnimatedSection>
          <Leaf className="text-terra-400 mx-auto mb-5" size={28} />
          <h2 className="font-serif text-4xl md:text-5xl text-forest-700 font-light mb-4">
            {t('newsletter.title')}
          </h2>
          <p className="text-warm-brown/65 text-base mb-8 leading-relaxed">
            {t('newsletter.subtitle')}
          </p>

          {done ? (
            <div className="inline-flex items-center gap-2 bg-forest-50 border border-forest-200 text-forest-700 px-6 py-3 rounded-full font-sans text-sm">
              {t('newsletter.thanks')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                className="input-field flex-1 text-sm"
              />
              <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
                {t('newsletter.subscribe')} <ArrowRight size={14} />
              </button>
            </form>
          )}
          <p className="mt-4 text-xs text-warm-brown/40">{t('newsletter.note')}</p>
        </AnimatedSection>
      </div>
    </section>
  );
}
