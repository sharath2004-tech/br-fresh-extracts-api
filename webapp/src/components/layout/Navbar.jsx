import { Leaf, LogOut, Menu, Settings, ShoppingCart, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const links = [
  { to: '/',     label: 'Home',  end: true },
  { to: '/shop', label: 'Shop' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

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
      scrolled ? 'bg-cream/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 md:h-20">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Leaf className="text-terra-500" size={22} strokeWidth={1.5} />
          <span className={`font-serif text-xl md:text-2xl font-semibold tracking-wide transition-colors ${scrolled ? 'text-forest-700' : 'text-cream'}`}>
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
                    : scrolled ? 'text-warm-brown hover:text-terra-500' : 'text-cream/90 hover:text-cream'
                }`
              }
            >{label}</NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link to="/cart" className="relative p-2">
            <ShoppingCart size={20} className={`transition-colors ${scrolled ? 'text-warm-brown' : 'text-cream'}`} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-0 -right-0 bg-terra-500 text-cream text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {/* User */}
          {user ? (
            <div className="relative">
              <button onClick={() => setDropOpen(!dropOpen)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${scrolled ? 'text-warm-brown hover:text-terra-500' : 'text-cream/90 hover:text-cream'}`}>
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
                      <Settings size={15} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-warm-brown hover:bg-ivory hover:text-terra-500 transition-colors">
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login"
              className={`hidden md:inline text-sm font-medium tracking-wide transition-colors ${scrolled ? 'text-warm-brown hover:text-terra-500' : 'text-cream/90 hover:text-cream'}`}>
              Sign In
            </Link>
          )}

          {/* Mobile burger */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2">
            {open
              ? <X size={22} className={scrolled ? 'text-warm-brown' : 'text-cream'} />
              : <Menu size={22} className={scrolled ? 'text-warm-brown' : 'text-cream'} strokeWidth={1.5} />
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
          {user ? (
            <>
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="text-sm text-forest-600 font-medium">Admin Panel</Link>}
              <button onClick={() => { handleLogout(); setOpen(false); }} className="text-sm text-left text-warm-brown">Sign out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-warm-brown">Sign In</Link>
          )}
        </div>
      )}
    </header>
  );
}
