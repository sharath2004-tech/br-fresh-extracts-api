import { Eye, EyeOff, Leaf } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const { t, tr } = useLanguage();
  const navigate = useNavigate();

  if (user) { navigate('/'); return null; }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // Small UX delay

    const result = isLogin
      ? login(form.email, form.password)
      : register(form.name, form.email, form.password);

    setLoading(false);
    if (result.success) {
      navigate(result.role === 'admin' ? '/admin' : '/');
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
              {isLogin ? t('login.welcome') : t('login.create')}
            </h1>
            <p className="text-warm-brown/60 text-sm">
              {isLogin ? t('login.signInSub') : t('login.signUpSub')}
            </p>
          </div>



          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">{t('login.fullName')}</label>
                <input className="input-field" type="text" placeholder="Your name" required
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">{t('login.email')}</label>
              <input className="input-field" type="email" placeholder="you@example.com" required
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">{t('login.password')}</label>
              <div className="relative">
                <input className="input-field pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••••" required
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
              ) : (isLogin ? t('login.signIn') : t('login.createAccount'))}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-warm-brown/60">
            {isLogin ? t('login.noAccount') : t('login.haveAccount')}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-terra-500 hover:underline font-medium">
              {isLogin ? t('login.signUpLink') : t('login.signInLink')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
