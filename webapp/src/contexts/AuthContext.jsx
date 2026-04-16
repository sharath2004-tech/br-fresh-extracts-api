import { onAuthStateChanged, signInWithPhoneNumber, signOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, buildRecaptchaVerifier, isFirebaseConfigured } from '../lib/firebase';

const AuthContext = createContext(null);

// Admin credentials
const ADMIN_EMAIL = 'bijjambhargav@gmail.com';
const ADMIN_PASS  = '985600@Bh';

const normalizePhone = (value = '') => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};
const formatPhoneE164 = (value = '') => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
};
const isEmail = (value = '') => value.includes('@');

const friendlyAuthError = (err, fallback = 'Something went wrong. Please try again.') => {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Enter a valid phone number.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/invalid-verification-code':
      return 'OTP is incorrect. Please try again.';
    case 'auth/verification-code-expired':
      return 'OTP expired. Please request a new one.';
    case 'auth/missing-verification-code':
      return 'Please enter the OTP code.';
    case 'auth/recaptcha-check-failed':
    case 'auth/invalid-app-credential':
      return 'Verification failed. Make sure your domain is added in Firebase Console → Authentication → Settings → Authorized Domains.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet and try again.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA check failed. Please refresh and try again.';
    default:
      return fallback;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('so_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      try {
        const current = JSON.parse(localStorage.getItem('so_user') || 'null');
        if (current?.role === 'admin') return;
      } catch { /* ignore */ }

      if (!fbUser) {
        setUser(null);
        localStorage.removeItem('so_user');
        return;
      }

      const phone = normalizePhone(fbUser.phoneNumber || '');
      let profile = {};
      try {
        const profiles = JSON.parse(localStorage.getItem('so_customer_profiles') || '{}');
        profile = profiles[phone] || {};
      } catch { /* ignore */ }
      const u = {
        role: 'customer',
        phone,
        name: profile.name || 'Customer',
        email: profile.email || '',
      };
      setUser(u);
      localStorage.setItem('so_user', JSON.stringify(u));
    });
    return () => unsubscribe();
  }, []);

  const loginAdmin = async (email, password) => {
    if (isEmail(email) && email === ADMIN_EMAIL && password === ADMIN_PASS) {
      if (isFirebaseConfigured) {
        try { await signOut(auth); } catch { /* ignore */ }
      }
      const u = { email, role: 'admin', name: 'Admin' };
      setUser(u);
      localStorage.setItem('so_user', JSON.stringify(u));
      return { success: true, role: 'admin' };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  const sendOtp = async (phone, containerId = 'recaptcha-container') => {
    if (!isFirebaseConfigured) {
      return { success: false, error: 'Firebase is not configured.' };
    }
    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length !== 10) {
      return { success: false, error: 'Please enter a valid phone number.' };
    }
    try {
      const verifier = buildRecaptchaVerifier(containerId, 'invisible');
      if (!verifier) {
        return { success: false, error: 'Verification failed. Please refresh and try again.' };
      }
      const e164 = formatPhoneE164(normalized);
      const result = await signInWithPhoneNumber(auth, e164, verifier);
      setConfirmationResult(result);
      return { success: true };
    } catch (err) {
      console.error('[sendOtp] Firebase error code:', err?.code, '| message:', err?.message);
      return { success: false, error: friendlyAuthError(err, `Failed to send OTP. (${err?.code || 'unknown'})`) };
    }
  };

  const verifyOtp = async (code, profile = {}) => {
    if (!confirmationResult) {
      return { success: false, error: 'Please request an OTP first.' };
    }
    try {
      const result = await confirmationResult.confirm(code);
      const phone = normalizePhone(result?.user?.phoneNumber || profile.phone || '');

      const profiles = JSON.parse(localStorage.getItem('so_customer_profiles') || '{}');
      const existing = profiles[phone] || {};
      const nextProfile = {
        name: profile.name?.trim() || existing.name || 'Customer',
        email: profile.email?.trim() || existing.email || '',
      };
      profiles[phone] = nextProfile;
      localStorage.setItem('so_customer_profiles', JSON.stringify(profiles));

      const u = { role: 'customer', phone, name: nextProfile.name, email: nextProfile.email };
      setUser(u);
      localStorage.setItem('so_user', JSON.stringify(u));
      setConfirmationResult(null);
      return { success: true, role: 'customer' };
    } catch (err) {
      return { success: false, error: friendlyAuthError(err, 'OTP verification failed. Please try again.') };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('so_user');
    if (isFirebaseConfigured) {
      try { await signOut(auth); } catch { /* ignore */ }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginAdmin,
      sendOtp,
      verifyOtp,
      logout,
      isAdmin: user?.role === 'admin',
      isFirebaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
