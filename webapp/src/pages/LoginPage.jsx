import { Eye, EyeOff, Leaf } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = (import.meta.env.VITE_API_URL || '/api/').replace(/\/?$/, '/');

// Detect if running inside Capacitor (Android/iOS native app)
function isNative() {
  return typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.();
}

// Lazy-load @capacitor-firebase/authentication only on native.
// IMPORTANT: wrap in plain object — Capacitor plugin proxies intercept ALL property access
// including `.then`, making the plugin instance appear "thenable". If you return the plugin
// directly from an async function and then `await` the result, JS calls plugin.then() as a
// native method which throws "FirebaseAuthentication.then() is not implemented on android".
async function getFirebaseAuth() {
  const mod = await import('@capacitor-firebase/authentication');
  return { plugin: mod.FirebaseAuthentication };
}

// v8: signInWithPhoneNumber returns void; verificationId arrives via phoneCodeSent event
async function nativeSendOtp(FirebaseAuthentication, phoneNumber) {
  const handles = [];
  const cleanup = () => { handles.forEach(h => { try { h?.remove(); } catch {} }); };
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('OTP timed out (30s). Check network or Firebase Phone Auth setup.'));
    }, 30000);
    const done = (fn) => { clearTimeout(timer); cleanup(); fn(); };
    try {
      // Must await listener registration BEFORE calling signInWithPhoneNumber
      handles.push(await FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
        done(() => resolve(event.verificationId));
      }));
      handles.push(await FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
        done(() => reject(new Error(event?.message || JSON.stringify(event) || 'Phone verification failed.')));
      }));
      await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber });
    } catch (err) {
      done(() => reject(err));
    }
  });
}

export default function LoginPage() {
  const [mode, setMode] = useState('customer');
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'profile'
  const [profileForm, setProfileForm] = useState({ name: '', address: '', city: '', state: '', pincode: '', label: 'Home' });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stores the Firebase idToken while user fills in their profile (new user sign-up)
  const pendingIdTokenRef = useRef('');

  // Native: stores Firebase verificationId from Capacitor plugin
  const firebaseVerificationIdRef = useRef('');
  // Web: stores confirmationResult from Firebase web SDK signInWithPhoneNumber
  const confirmationResultRef = useRef(null);
  // Web: DOM node for invisible reCAPTCHA
  const recaptchaContainerRef = useRef(null);
  // Web: RecaptchaVerifier instance (must be cleared on resend)
  const recaptchaVerifierRef = useRef(null);

  const { loginAdmin, verifyFirebaseToken, completeSignup, user } = useAuth();
  const { t, tr } = useLanguage();
  const navigate = useNavigate();

  if (user) { navigate('/'); return null; }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Build phone identifier with country code
  const buildIdentifier = () => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 ? `+91${digits}` : `+${digits}`;
  };

  // ─── Web-only helper: create/reset invisible RecaptchaVerifier ────────────
  const getRecaptchaVerifier = async () => {
    const { RecaptchaVerifier } = await import('firebase/auth');
    const { auth } = await import('../lib/firebase');
    // Clear previous verifier if it exists
    if (recaptchaVerifierRef.current) {
      try { recaptchaVerifierRef.current.clear(); } catch {}
      recaptchaVerifierRef.current = null;
    }
    const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { size: 'invisible' });
    recaptchaVerifierRef.current = verifier;
    return { verifier, auth };
  };

  // ─── Send OTP ─────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError('');
    const identifier = buildIdentifier();
    if (identifier.replace(/\D/g, '').length < 11) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      if (isNative()) {
        // Android: native Capacitor Firebase plugin (v8 uses phoneCodeSent event)
        const { plugin: FirebaseAuthentication } = await getFirebaseAuth();
        firebaseVerificationIdRef.current = await nativeSendOtp(FirebaseAuthentication, identifier);
      } else {
        // Web browser: Firebase JS SDK with invisible reCAPTCHA
        const { signInWithPhoneNumber } = await import('firebase/auth');
        const { verifier, auth } = await getRecaptchaVerifier();
        confirmationResultRef.current = await signInWithPhoneNumber(auth, identifier, verifier);
      }
      setStep('otp');
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/too-many-requests' || e?.message?.includes('too-many-requests')) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError(e?.message || 'Failed to send OTP. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify OTP ───────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError('');
    if (!otp || otp.length < 4) { setError('Enter the OTP you received.'); return; }
    setLoading(true);
    try {
      let idToken;
      if (isNative()) {
        const { plugin: FirebaseAuthentication } = await getFirebaseAuth();
        const result = await FirebaseAuthentication.confirmVerificationCode({
          verificationId: firebaseVerificationIdRef.current,
          verificationCode: otp,
        });
        idToken = result.user?.idToken || (await FirebaseAuthentication.getIdToken()).token;
      } else {
        if (!confirmationResultRef.current) {
          setError('Session expired. Please request OTP again.');
          setStep('phone');
          return;
        }
        const userCred = await confirmationResultRef.current.confirm(otp);
        idToken = await userCred.user.getIdToken();
      }
      const authResult = await verifyFirebaseToken(idToken, { name: form.name, email: form.email });
      if (authResult.success) navigate('/');
      else if (authResult.is_new) {
        // New user — save token and show profile setup
        pendingIdTokenRef.current = idToken;
        setStep('profile');
      }
      else setError(authResult.error);
    } catch (e) {
      setError(e?.message || 'OTP incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError('');
    const identifier = buildIdentifier();
    setLoading(true);
    try {
      if (isNative()) {
        const { plugin: FirebaseAuthentication } = await getFirebaseAuth();
        firebaseVerificationIdRef.current = await nativeSendOtp(FirebaseAuthentication, identifier);
      } else {
        const { signInWithPhoneNumber } = await import('firebase/auth');
        const { verifier, auth } = await getRecaptchaVerifier();
        confirmationResultRef.current = await signInWithPhoneNumber(auth, identifier, verifier);
      }
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/too-many-requests' || e?.message?.includes('too-many-requests')) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError(e?.message || 'Failed to resend OTP. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const result = await loginAdmin(form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/admin');
    else setError(result.error);
  };

  const handleCompleteSignup = async () => {
    setError('');
    if (!profileForm.name.trim()) { setError('Please enter your full name.'); return; }
    if (!profileForm.address.trim() || !profileForm.city.trim() || !profileForm.state.trim() || !profileForm.pincode.trim()) {
      setError('Please fill in all address fields.'); return;
    }
    setLoading(true);
    const result = await completeSignup(pendingIdTokenRef.current, profileForm.name, {
      label:   profileForm.label || 'Home',
      name:    profileForm.name,
      address: profileForm.address,
      city:    profileForm.city,
      state:   profileForm.state,
      pincode: profileForm.pincode,
    });
    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.error || 'Failed to create account. Try again.');
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Invisible reCAPTCHA container (web only — Firebase requires a DOM node) */}
      <div ref={recaptchaContainerRef} />

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
                  {/* OTP info card */}
                  <div className="bg-forest-50 border border-forest-100 rounded-xl px-4 py-3 flex items-start gap-3">
                    <span className="text-2xl mt-0.5">📱</span>
                    <div>
                      <p className="text-sm font-semibold text-forest-700">{t('login.otpSentTo')}</p>
                      <p className="text-base font-bold text-forest-700 tracking-wide">+91 {phone}</p>
                      <p className="text-xs text-warm-brown/60 mt-0.5">{t('login.otpHint')}</p>
                    </div>
                  </div>

                  <div>
                    <label className="label">{t('login.otpLabel')}</label>
                    <input
                      className="input-field tracking-[0.5em] text-2xl text-center font-bold"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="• • • • • •"
                      autoFocus
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{tr(error)}</p>}

                  <button type="button" onClick={handleVerifyOtp} disabled={loading || otp.length < 4}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading
                      ? <span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                      : t('login.verifyOtp')}
                  </button>

                  <div className="flex justify-between items-center text-sm pt-1">
                    <button type="button"
                      onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                      className="text-warm-brown/60 hover:text-terra-500 transition-colors">
                      {t('login.changePhone')}
                    </button>
                    <button type="button" onClick={handleResendOtp} disabled={loading}
                      className="text-terra-500 font-medium hover:underline disabled:opacity-50">
                      {t('login.resendOtp')}
                    </button>
                  </div>
                </>
              )}

              {step === 'profile' && (
                <>
                  <div className="bg-forest-50 border border-forest-100 rounded-xl px-4 py-3 mb-1">
                    <p className="text-sm font-semibold text-forest-700">Welcome! Complete your profile to get started.</p>
                    <p className="text-xs text-warm-brown/60 mt-0.5">We need a few details to deliver your orders.</p>
                  </div>

                  <div>
                    <label className="label">Full Name *</label>
                    <input className="input-field" type="text" placeholder="Your full name" autoFocus
                      value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
                  </div>

                  <div>
                    <label className="label">Delivery Address *</label>
                    <input className="input-field" type="text" placeholder="House no., Street, Area"
                      value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">City *</label>
                      <input className="input-field" type="text" placeholder="City"
                        value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">State *</label>
                      <input className="input-field" type="text" placeholder="State"
                        value={profileForm.state} onChange={e => setProfileForm(f => ({ ...f, state: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="label">Pincode *</label>
                    <input className="input-field" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit pincode"
                      value={profileForm.pincode} onChange={e => setProfileForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} />
                  </div>

                  {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{tr(error)}</p>}

                  <button type="button" onClick={handleCompleteSignup} disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading
                      ? <span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                      : 'Create Account'}
                  </button>
                </>
              )}

              {step !== 'profile' && (
              <p className="mt-4 text-center text-sm text-warm-brown/60">
                {isLogin ? t('login.noAccount') : t('login.haveAccount')}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-terra-500 hover:underline font-medium ml-1">
                  {isLogin ? t('login.signUpLink') : t('login.signInLink')}
                </button>
              </p>
              )}
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

