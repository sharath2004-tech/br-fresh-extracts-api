import { ClipboardList, Globe, Home, LogOut, Menu, Settings, ShoppingBag, ShoppingCart, User, X } from 'lucide-react';
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
    { to: '/',     label: t('nav.home'),  end: true,  icon: Home },
    { to: '/shop', label: t('nav.shop'),              icon: ShoppingBag },
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
          <img src="https://res.cloudinary.com/djmrm8sgh/image/upload/v1776526884/Untitled_design-removebg-preview_obbk20.png" alt="BR Fresh Extracts" className="h-8 w-8 object-contain" />
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
                    <p className="text-sm font-medium text-forest-700 truncate">{user.phone || user.email}</p>
                  </div>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-warm-brown hover:bg-ivory hover:text-terra-500 transition-colors">
                      <Settings size={15} /> {t('nav.admin')}
                    </Link>
                  )}
                  {user.role === 'customer' && (
                    <Link to="/orders" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-warm-brown hover:bg-ivory hover:text-terra-500 transition-colors">
                      <ClipboardList size={15} /> My Orders
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

      {/* Mobile menu — slide down panel */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-sand-100 mx-3 mb-3 rounded-2xl shadow-lg overflow-hidden">

          {/* Nav links */}
          <div className="px-2 pt-3 pb-2">
            {links.map(({ to, label, end, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-terra-50 text-terra-500'
                      : 'text-warm-brown hover:bg-sand-50 hover:text-terra-500'
                  }`
                }>
                {({ isActive }) => (
                  <>
                    <span className={`p-1.5 rounded-lg ${isActive ? 'bg-terra-100' : 'bg-sand-100'}`}>
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <span className="tracking-wide">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-sand-100" />

          {/* Language selector */}
          <div className="px-4 py-3 flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-sand-100 text-warm-brown">
              <Globe size={16} strokeWidth={1.8} />
            </span>
            <span className="text-sm text-warm-brown font-medium flex-1">Language</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-xs rounded-lg border border-sand-200 px-3 py-1.5 bg-sand-50 text-forest-700 font-medium"
            >
              {Object.entries(languages).map(([code, lbl]) => (
                <option key={code} value={code}>{lbl}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-sand-100" />

          {/* User section */}
          <div className="px-2 pt-2 pb-3">
            {user ? (
              <>
                {/* User info row */}
                <div className="flex items-center gap-3 px-4 py-2.5 mb-1">
                  <span className="p-1.5 rounded-lg bg-forest-50">
                    <User size={16} strokeWidth={1.8} className="text-forest-600" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-warm-brown/50">Signed in as</p>
                    <p className="text-sm font-semibold text-forest-700 truncate">{user.name}</p>
                  </div>
                </div>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-warm-brown hover:bg-sand-50 hover:text-terra-500 transition-colors">
                    <span className="p-1.5 rounded-lg bg-sand-100"><Settings size={16} strokeWidth={1.8} /></span>
                    {t('nav.admin')}
                  </Link>
                )}
                {user.role === 'customer' && (
                  <Link to="/orders" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-warm-brown hover:bg-sand-50 hover:text-terra-500 transition-colors">
                    <span className="p-1.5 rounded-lg bg-sand-100"><ClipboardList size={16} strokeWidth={1.8} /></span>
                    My Orders
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <span className="p-1.5 rounded-lg bg-red-50"><LogOut size={16} strokeWidth={1.8} /></span>
                  {t('nav.signOut')}
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-warm-brown hover:bg-sand-50 hover:text-terra-500 transition-colors">
                <span className="p-1.5 rounded-lg bg-sand-100"><User size={16} strokeWidth={1.8} /></span>
                {t('nav.signIn')}
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
