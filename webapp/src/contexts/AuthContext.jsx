import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api/';

const isEmail = (value = '') => value.includes('@');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('so_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const loginAdmin = async (email, password) => {
    if (!isEmail(email)) return { success: false, error: 'Invalid email.' };
    try {
      const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000); // 60s timeout for cold start
      const res = await fetch(`${base}auth/admin-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Invalid email or password.' };
      const u = { email, role: 'admin', name: 'Admin', adminToken: data.token };
      setUser(u);
      localStorage.setItem('so_user', JSON.stringify(u));
      return { success: true, role: 'admin' };
    } catch (err) {
      console.error('[loginAdmin] fetch error:', err?.message || err);
      if (err?.name === 'AbortError') return { success: false, error: 'Request timed out. Server may be starting up — please try again.' };
      return { success: false, error: `Network error: ${err?.message || 'unknown'}` };
    }
  };

  // Called after MSG91 widget succeeds with an access-token
  // On Android native, accessToken is null and preVerifiedData contains {access, refresh, user} from backend
  const verifyMsg91Token = async (accessToken, profile = {}, preVerifiedData = null) => {
    try {
      let data;
      if (preVerifiedData) {
        // Native Android: backend already verified OTP and returned JWT tokens directly
        data = { tokens: { access: preVerifiedData.access, refresh: preVerifiedData.refresh }, user: preVerifiedData.user };
      } else {
        if (!accessToken) return { success: false, error: 'No OTP token received.' };
        const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
        const res = await fetch(`${base}auth/verify-otp/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            phone: profile?.phone || '',
            name: profile?.name?.trim() || '',
            email: profile?.email?.trim() || '',
          }),
        });
        data = await res.json();
        if (!res.ok) return { success: false, error: data.error || 'Verification failed. Please try again.' };
      }

      const u = {
        role: 'customer',
        phone: data.user?.phone_number || '',
        name: data.user?.name || 'Customer',
        email: data.user?.email || profile?.email || '',
        tokens: data.tokens,
      };
      setUser(u);
      localStorage.setItem('so_user', JSON.stringify(u));
      return { success: true, role: 'customer' };
    } catch (err) {
      console.error('[verifyMsg91Token] error:', err);
      return { success: false, error: `Network error: ${err?.message || 'unknown'}` };
    }
  };

  // Called after Firebase Phone Auth succeeds on Android native
  const verifyFirebaseToken = async (idToken, profile = {}) => {
    try {
      const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
      const res = await fetch(`${base}auth/firebase-verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          name: profile?.name?.trim() || '',
          email: profile?.email?.trim() || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Verification failed.' };
      const u = {
        role: 'customer',
        phone: data.user?.phone_number || '',
        name: data.user?.name || 'Customer',
        email: data.user?.email || '',
        tokens: data.tokens,
      };
      setUser(u);
      localStorage.setItem('so_user', JSON.stringify(u));
      return { success: true, role: 'customer' };
    } catch (err) {
      return { success: false, error: `Network error: ${err?.message || 'unknown'}` };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('so_user');
  };

  // Returns a valid access token, auto-refreshing if it has expired.
  const getValidToken = async () => {
    const token = user?.tokens?.access;
    if (!token) return null;
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(atob(payload));
      const nowSec = Math.floor(Date.now() / 1000);
      if (!decoded.exp || decoded.exp > nowSec + 60) return token; // still valid
    } catch {
      return token; // can't decode — just use it as-is
    }
    // Token expired or expiring soon — refresh it
    const refreshTkn = user?.tokens?.refresh;
    if (!refreshTkn) return null;
    try {
      const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
      const res = await fetch(`${base}auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshTkn }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.access) return null;
      const updatedUser = { ...user, tokens: { ...user.tokens, access: data.access } };
      setUser(updatedUser);
      localStorage.setItem('so_user', JSON.stringify(updatedUser));
      return data.access;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginAdmin,
      verifyMsg91Token,
      verifyFirebaseToken,
      logout,
      getValidToken,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
