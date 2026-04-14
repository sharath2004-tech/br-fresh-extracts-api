import { Facebook, Instagram, Leaf, Mail, MessageCircle, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
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
            Pure, certified organic products sourced directly from Indian farms. No compromise on quality, no compromise on nature.
          </p>
          <p className="mt-4 text-xs text-cream/40 tracking-widest uppercase">New Delhi, India</p>
          <div className="flex items-center gap-3 mt-6">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 rounded-full border border-forest-600 hover:border-terra-400 hover:text-terra-400 transition-colors">
              <Instagram size={16} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 rounded-full border border-forest-600 hover:border-terra-400 hover:text-terra-400 transition-colors">
              <Facebook size={16} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-full border border-forest-600 hover:border-terra-400 hover:text-terra-400 transition-colors">
              <Twitter size={16} />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <p className="font-serif text-cream text-lg mb-4">Explore</p>
          <ul className="space-y-2 text-sm">
            {[['/', 'Home'], ['/shop', 'Shop'], ['/shop?cat=Spices', 'Spices'], ['/shop?cat=Teas', 'Teas'], ['/shop?cat=Ghee+%26+Oils', 'Ghee & Oils']].map(([href, label]) => (
              <li key={label}><Link to={href} className="hover:text-terra-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="font-serif text-cream text-lg mb-4">Contact</p>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 hover:text-terra-400 transition-colors">
                <MessageCircle size={15} /> +91 99999 99999
              </a>
            </li>
            <li>
              <a href="mailto:hello@brfreshextracts.in"
                className="flex items-center gap-2 hover:text-terra-400 transition-colors">
                <Mail size={15} /> hello@brfreshextracts.in
              </a>
            </li>
          </ul>
          <div className="mt-6 text-xs text-cream/40 space-y-1">
            <p>Mon – Sat: 10am – 7pm</p>
            <p className="uppercase tracking-widest">FSSAI No. 10019012000123</p>
          </div>
        </div>
      </div>

      <div className="border-t border-forest-700 text-center py-5 text-xs text-cream/30 tracking-wide">
        © {new Date().getFullYear()} BR Fresh Extracts. All rights reserved. &nbsp;•&nbsp; Made with 🌿 in India
      </div>
    </footer>
  );
}
