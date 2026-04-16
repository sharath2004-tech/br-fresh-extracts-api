import { Leaf, LogOut, Menu, Settings, ShoppingCart, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const { lang, setLang, t, languages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const light = isHome && !scrolled;

  const links = [
    { to: '/',     label: t('nav.home'),  end: true },
    { to: '/shop', label: t('nav.shop') },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
      !light ? 'bg-cream/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 md:h-20">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Leaf className="text-terra-500" size={22} strokeWidth={1.5} />
          <span className={`font-serif text-xl md:text-2xl font-semibold tracking-wide transition-colors ${light ? 'text-cream' : 'text-forest-700'}`}>
            BR Fresh Extracts
          </span>
        </Link>

        {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `font-sans text-sm tracking-widest uppercase transition-colors duration-200 ${
                  isActive
                    ? 'text-terra-500'
                    : light ? 'text-cream/90 hover:text-cream' : 'text-warm-brown hover:text-terra-500'
                }`
              }
            >{label}</NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link to="/cart" className="relative p-2">
            <ShoppingCart size={20} className={`transition-colors ${light ? 'text-cream' : 'text-warm-brown'}`} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-0 -right-0 bg-terra-500 text-cream text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {/* Language */}
          <div className="hidden md:block">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className={`text-xs rounded-full border px-2.5 py-1 bg-transparent transition-colors ${
                light ? 'border-cream/40 text-cream/90' : 'border-sand-300 text-warm-brown'
              }`}
            >
              {Object.entries(languages).map(([code, label]) => (
                <option key={code} value={code} className="text-forest-700">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* User */}
          {user ? (
            <div className="relative">
              <button onClick={() => setDropOpen(!dropOpen)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${light ? 'text-cream/90 hover:text-cream' : 'text-warm-brown hover:text-terra-500'}`}>
                <User size={18} strokeWidth={1.5} />
                <span className="hidden md:block">{user.name.split(' ')[0]}</span>
              </button>
              {dropOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-sand-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-sand-100">
                    <p className="text-xs text-warm-brown/60">Signed in as</p>
                    <p className="text-sm font-medium text-forest-700 truncate">{user.email}</p>
                  </div>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-warm-brown hover:bg-ivory hover:text-terra-500 transition-colors">
                      <Settings size={15} /> {t('nav.admin')}
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-warm-brown hover:bg-ivory hover:text-terra-500 transition-colors">
                    <LogOut size={15} /> {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login"
              className={`hidden md:inline text-sm font-medium tracking-wide transition-colors ${light ? 'text-cream/90 hover:text-cream' : 'text-warm-brown hover:text-terra-500'}`}>
              {t('nav.signIn')}
            </Link>
          )}

          {/* Mobile burger */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2">
            {open
              ? <X size={22} className={light ? 'text-cream' : 'text-warm-brown'} />
              : <Menu size={22} className={light ? 'text-cream' : 'text-warm-brown'} strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-cream border-t border-sand-200 px-6 py-4 flex flex-col gap-4">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `font-sans text-sm tracking-widest uppercase ${isActive ? 'text-terra-500' : 'text-warm-brown'}`
              }>{label}</NavLink>
          ))}
          <div className="pt-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-xs rounded-full border px-3 py-1 bg-white border-sand-300 text-warm-brown"
            >
              {Object.entries(languages).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
          {user ? (
            <>
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="text-sm text-forest-600 font-medium">{t('nav.admin')}</Link>}
              <button onClick={() => { handleLogout(); setOpen(false); }} className="text-sm text-left text-warm-brown">{t('nav.signOut')}</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-warm-brown">{t('nav.signIn')}</Link>
          )}
        </div>
      )}
    </header>
  );
}
