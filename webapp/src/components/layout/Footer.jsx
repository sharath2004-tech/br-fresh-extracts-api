import { Facebook, Instagram, Leaf, Mail, MessageCircle, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStore } from '../../contexts/StoreContext';

export default function Footer() {
  const { store } = useStore();
  const { t, tr } = useLanguage();
  const s = store.settings || {};
  return (
    <footer className="bg-forest-800 text-cream/80">
      {/* Leaf divider */}
      <div className="flex items-center justify-center py-6 border-b border-forest-700">
        <div className="h-px bg-forest-600 flex-1 max-w-xs" />
        <Leaf className="mx-4 text-terra-400" size={20} />
        <div className="h-px bg-forest-600 flex-1 max-w-xs" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="text-terra-400" size={20} />
            <span className="font-serif text-2xl text-cream font-semibold">BR Fresh Extracts</span>
          </div>
          <p className="text-cream/60 text-sm leading-relaxed max-w-xs">
            {t('footer.tagline')}
          </p>
          <p className="mt-4 text-xs text-cream/40 tracking-widest uppercase">{s.address}</p>
          <div className="flex items-center gap-3 mt-6">
            <a href={s.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-forest-600 hover:border-terra-400 hover:text-terra-400 transition-colors">
              <Instagram size={16} />
            </a>
            <a href={s.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-forest-600 hover:border-terra-400 hover:text-terra-400 transition-colors">
              <Facebook size={16} />
            </a>
            <a href={s.twitter} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-forest-600 hover:border-terra-400 hover:text-terra-400 transition-colors">
              <Twitter size={16} />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <p className="font-serif text-cream text-lg mb-4">{t('footer.explore')}</p>
          <ul className="space-y-2 text-sm">
            {[[ '/', t('nav.home') ], ['/shop', t('nav.shop')], ['/shop?cat=Spices', tr('Spices')], ['/shop?cat=Teas', tr('Teas')], ['/shop?cat=Ghee+%26+Oils', tr('Ghee & Oils')]].map(([href, label]) => (
              <li key={label}><Link to={href} className="hover:text-terra-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="font-serif text-cream text-lg mb-4">{t('footer.contact')}</p>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={`https://wa.me/${s.whatsappNumber}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 hover:text-terra-400 transition-colors">
                <MessageCircle size={15} /> {s.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${s.email}`}
                className="flex items-center gap-2 hover:text-terra-400 transition-colors">
                <Mail size={15} /> {s.email}
              </a>
            </li>
          </ul>
          <div className="mt-6 text-xs text-cream/40 space-y-1">
            <p>{s.hours}</p>
            <p className="uppercase tracking-widest">FSSAI No. {s.fssai}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-forest-700 text-center py-5 text-xs text-cream/30 tracking-wide">
        © {new Date().getFullYear()} BR Fresh Extracts. {t('footer.rights')} &nbsp;•&nbsp; {t('footer.made')}
      </div>
    </footer>
  );
}
