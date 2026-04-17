import { Eye, EyeOff, Leaf } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const MSG91_WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID || '';
const MSG91_TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH || '';

export default function LoginPage() {
  const [mode, setMode] = useState('customer');
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const scriptLoadedRef = useRef(false);

  const { loginAdmin, verifyMsg91Token, user } = useAuth();
  const { t, tr } = useLanguage();
  const navigate = useNavigate();

  if (user) { navigate('/'); return null; }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const launchWidget = () => {
    if (!MSG91_WIDGET_ID) return;

    const configuration = {
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_TOKEN_AUTH,
      success: async (data) => {
        const token = data?.['access-token'] || data?.token || data?.message;
        if (!token) {
          setError('OTP verification failed. No token received.');
          return;
        }
        setLoading(true);
        const result = await verifyMsg91Token(token, { name: form.name, email: form.email });
        setLoading(false);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      },
      failure: (err) => {
        console.error('[MSG91 widget failure]', err);
        setError('OTP verification failed. Please try again.');
      },
    };

    if (window.initSendOTP) {
      window.initSendOTP(configuration);
      return;
    }

    // Load scripts with fallback
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const urls = [
      'https://verify.msg91.com/otp-provider.js',
      'https://verify.phone91.com/otp-provider.js',
    ];
    let i = 0;
    function attempt() {
      const s = document.createElement('script');
      s.src = urls[i];
      s.async = true;
      s.onload = () => {
        if (typeof window.initSendOTP === 'function') {
          window.initSendOTP(configuration);
        }
      };
      s.onerror = () => {
        i++;
        if (i < urls.length) attempt();
        else setError('Failed to load OTP widget. Please refresh and try again.');
      };
      document.head.appendChild(s);
    }
    attempt();
  };

  // Auto-launch widget when switching to customer tab
  useEffect(() => {
    if (mode === 'customer' && MSG91_WIDGET_ID) {
      // Small delay to let DOM settle
      const timer = setTimeout(launchWidget, 300);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginAdmin(form.email, form.password);
    setLoading(false);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-forest-700 relative overflow-hidden items-center justify-center p-12 grain-overlay">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 text-center">
          <Leaf className="text-terra-300 mx-auto mb-6" size={40} />
          <h2 className="font-serif text-4xl text-cream font-light mb-4">BR Fresh Extracts</h2>
          <p className="text-cream/60 text-sm leading-relaxed max-w-xs">
            {t('login.panelSubtitle')}
          </p>
          <div className="mt-10 space-y-3 text-left">
            {[t('login.panelBullet1'), t('login.panelBullet2'), t('login.panelBullet3')].map(line => (
              <div key={line} className="flex items-center gap-2 text-cream/70 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-terra-400 shrink-0" /> {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-1.5 text-terra-500 text-sm mb-6 lg:hidden">
              <Leaf size={15} /> BR Fresh Extracts
            </Link>
            <h1 className="font-serif text-3xl text-forest-700 mb-2">
              {mode === 'admin'
                ? t('login.adminTitle')
                : (isLogin ? t('login.welcome') : t('login.create'))}
            </h1>
            <p className="text-warm-brown/60 text-sm">
              {mode === 'admin'
                ? t('login.adminSub')
                : (isLogin ? t('login.signInSub') : t('login.signUpSub'))}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setMode('customer'); setError(''); }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border ${
                mode === 'customer'
                  ? 'bg-terra-500 text-white border-terra-500'
                  : 'bg-white text-warm-brown border-sand-200'
              }`}
            >
              {t('login.customerTab')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('admin'); setError(''); }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border ${
                mode === 'admin'
                  ? 'bg-forest-600 text-white border-forest-600'
                  : 'bg-white text-warm-brown border-sand-200'
              }`}
            >
              {t('login.adminTab')}
            </button>
          </div>

          {/* Customer mode: optional profile fields + MSG91 widget */}
          {mode === 'customer' && (
            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="label">{t('login.fullName')}</label>
                  <input className="input-field" type="text" placeholder={t('login.namePlaceholder')}
                    value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
              )}
              {!isLogin && (
                <div>
                  <label className="label">{t('login.emailOptional')}</label>
                  <input className="input-field" type="email" placeholder={t('login.emailPlaceholder')}
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              )}

              {!MSG91_WIDGET_ID && (
                <p className="text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-lg">
                  MSG91 Widget ID not configured. Set <code>VITE_MSG91_WIDGET_ID</code> in your environment.
                </p>
              )}

              {MSG91_WIDGET_ID && (
                <button
                  type="button"
                  onClick={launchWidget}
                  disabled={loading}
                  className="btn-primary w-full text-center flex items-center justify-center gap-2"
                >
                  {loading
                    ? <span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                    : t('login.sendOtp')}
                </button>
              )}

              {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{tr(error)}</p>}
              {loading && (
                <div className="flex justify-center">
                  <span className="inline-block w-5 h-5 border-2 border-terra-300 border-t-terra-600 rounded-full animate-spin" />
                </div>
              )}

              <p className="mt-6 text-center text-sm text-warm-brown/60">
                {isLogin ? t('login.noAccount') : t('login.haveAccount')}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-terra-500 hover:underline font-medium ml-1">
                  {isLogin ? t('login.signUpLink') : t('login.signInLink')}
                </button>
              </p>
            </div>
          )}

          {/* Admin mode */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="label">{t('login.adminEmail')}</label>
                <input className="input-field" type="email" placeholder={t('login.adminEmailPlaceholder')} required
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">{t('login.adminPassword')}</label>
                <div className="relative">
                  <input className="input-field pr-10" type={showPass ? 'text' : 'password'} placeholder={t('login.passwordPlaceholder')} required
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-brown/40 hover:text-warm-brown">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{tr(error)}</p>}

              <button type="submit" disabled={loading}
                className="btn-primary w-full text-center flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                ) : t('login.adminSignIn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
