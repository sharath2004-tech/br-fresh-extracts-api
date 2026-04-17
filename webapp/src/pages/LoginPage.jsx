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
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const scriptLoadedRef = useRef(false);
  const widgetReadyRef = useRef(false);

  const { loginAdmin, verifyMsg91Token, user } = useAuth();
  const { t, tr } = useLanguage();
  const navigate = useNavigate();

  if (user) { navigate('/'); return null; }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const initWidget = () => {
    if (!MSG91_WIDGET_ID || widgetReadyRef.current) return;
    const configuration = {
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_TOKEN_AUTH,
      exposeMethods: true,
      success: async (data) => {
        const token = data?.['access-token'] || data?.token || data?.message;
        if (!token) { setError('Verification failed. No token received.'); return; }
        setLoading(true);
        const result = await verifyMsg91Token(token, { name: form.name, email: form.email });
        setLoading(false);
        if (result.success) { navigate('/'); }
        else { setError(result.error); }
      },
      failure: (err) => {
        console.error('[MSG91]', err);
        setError('OTP verification failed. Please try again.');
        setLoading(false);
      },
    };
    if (window.initSendOTP) {
      window.initSendOTP(configuration);
      widgetReadyRef.current = true;
    }
  };

  const loadScript = (onReady) => {
    if (scriptLoadedRef.current) { onReady(); return; }
    scriptLoadedRef.current = true;
    const urls = ['https://verify.msg91.com/otp-provider.js', 'https://verify.phone91.com/otp-provider.js'];
    let i = 0;
    function attempt() {
      const s = document.createElement('script');
      s.src = urls[i]; s.async = true;
      s.onload = () => { onReady(); };
      s.onerror = () => { i++; if (i < urls.length) attempt(); else setError('Failed to load OTP service.'); };
      document.head.appendChild(s);
    }
    attempt();
  };

  useEffect(() => {
    if (mode === 'customer' && MSG91_WIDGET_ID) {
      loadScript(initWidget);
    }
  }, [mode]);

  const handleSendOtp = () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    const identifier = digits.length === 10 ? `91${digits}` : digits;
    const send = () => {
      if (!window.sendOtp) { setError('OTP service not loaded. Please refresh.'); return; }
      setLoading(true);
      window.sendOtp(
        identifier,
        () => { setLoading(false); setStep('otp'); setError(''); },
        (err) => { setLoading(false); setError(err?.message || 'Failed to send OTP. Try again.'); }
      );
    };
    if (widgetReadyRef.current) { send(); return; }
    loadScript(() => { initWidget(); setTimeout(send, 300); });
  };

  const handleVerifyOtp = () => {
    setError('');
    if (!otp || otp.length < 4) { setError('Enter the OTP you received.'); return; }
    if (!window.verifyOtp) { setError('OTP service not loaded. Please refresh.'); return; }
    setLoading(true);
    window.verifyOtp(
      otp,
      async (data) => {
        const token = data?.['access-token'] || data?.token || data?.message;
        if (!token) { setLoading(false); setError('Verification failed. No token received.'); return; }
        const result = await verifyMsg91Token(token, { name: form.name, email: form.email });
        setLoading(false);
        if (result.success) { navigate('/'); }
        else { setError(result.error); }
      },
      (err) => { setLoading(false); setError(err?.message || 'OTP incorrect. Please try again.'); }
    );
  };

  const handleResendOtp = () => {
    setError('');
    if (!window.retryOtp) return;
    window.retryOtp(null, () => {}, (err) => setError(err?.message || 'Resend failed.'));
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const result = await loginAdmin(form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/admin');
    else setError(result.error);
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      <div className="hidden lg:flex lg:w-1/2 bg-forest-700 relative overflow-hidden items-center justify-center p-12 grain-overlay">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 text-center">
          <Leaf className="text-terra-300 mx-auto mb-6" size={40} />
          <h2 className="font-serif text-4xl text-cream font-light mb-4">BR Fresh Extracts</h2>
          <p className="text-cream/60 text-sm leading-relaxed max-w-xs">{t('login.panelSubtitle')}</p>
          <div className="mt-10 space-y-3 text-left">
            {[t('login.panelBullet1'), t('login.panelBullet2'), t('login.panelBullet3')].map(line => (
              <div key={line} className="flex items-center gap-2 text-cream/70 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-terra-400 shrink-0" /> {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-1.5 text-terra-500 text-sm mb-6 lg:hidden">
              <Leaf size={15} /> BR Fresh Extracts
            </Link>
            <h1 className="font-serif text-3xl text-forest-700 mb-2">
              {mode === 'admin' ? t('login.adminTitle') : (isLogin ? t('login.welcome') : t('login.create'))}
            </h1>
            <p className="text-warm-brown/60 text-sm">
              {mode === 'admin' ? t('login.adminSub') : (isLogin ? t('login.signInSub') : t('login.signUpSub'))}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setMode('customer'); setError(''); setStep('phone'); }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border ${mode === 'customer' ? 'bg-terra-500 text-white border-terra-500' : 'bg-white text-warm-brown border-sand-200'}`}>
              {t('login.customerTab')}
            </button>
            <button type="button" onClick={() => { setMode('admin'); setError(''); }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border ${mode === 'admin' ? 'bg-forest-600 text-white border-forest-600' : 'bg-white text-warm-brown border-sand-200'}`}>
              {t('login.adminTab')}
            </button>
          </div>

          {mode === 'customer' && (
            <div className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="label">{t('login.fullName')}</label>
                    <input className="input-field" type="text" placeholder={t('login.namePlaceholder')}
                      value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{t('login.emailOptional')}</label>
                    <input className="input-field" type="email" placeholder={t('login.emailPlaceholder')}
                      value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                </>
              )}

              {step === 'phone' && (
                <>
                  <div>
                    <label className="label">{t('login.phone')}</label>
                    <div className="flex gap-2">
                      <span className="input-field w-16 text-center text-warm-brown/60 shrink-0">+91</span>
                      <input className="input-field flex-1" type="tel" inputMode="numeric" maxLength={10}
                        placeholder={t('login.phonePlaceholder')}
                        value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{tr(error)}</p>}
                  <button type="button" onClick={handleSendOtp} disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading ? <span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : t('login.sendOtp')}
                  </button>
                </>
              )}

              {step === 'otp' && (
                <>
                  <p className="text-sm text-warm-brown/70">OTP sent to <span className="font-semibold">+91 {phone}</span></p>
                  <div>
                    <label className="label">{t('login.otpLabel')}</label>
                    <input className="input-field tracking-widest text-xl text-center" type="text"
                      inputMode="numeric" maxLength={6} placeholder="------"
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{tr(error)}</p>}
                  <button type="button" onClick={handleVerifyOtp} disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading ? <span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : t('login.verifyOtp')}
                  </button>
                  <div className="flex justify-between text-xs text-warm-brown/60 pt-1">
                    <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                      className="hover:underline">{t('login.changePhone') || 'Change number'}</button>
                    <button type="button" onClick={handleResendOtp} className="text-terra-500 hover:underline">{t('login.resendOtp')}</button>
                  </div>
                </>
              )}

              {!MSG91_WIDGET_ID && (
                <p className="text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-lg">
                  MSG91 Widget ID not configured. Set <code>VITE_MSG91_WIDGET_ID</code>.
                </p>
              )}

              <p className="mt-4 text-center text-sm text-warm-brown/60">
                {isLogin ? t('login.noAccount') : t('login.haveAccount')}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-terra-500 hover:underline font-medium ml-1">
                  {isLogin ? t('login.signUpLink') : t('login.signInLink')}
                </button>
              </p>
            </div>
          )}

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
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? <span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : t('login.adminSignIn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
