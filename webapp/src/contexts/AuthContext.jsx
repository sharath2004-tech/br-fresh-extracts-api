import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api/';

// Admin credentials (frontend-only check)
const ADMIN_EMAIL = 'bijjambhargav@gmail.com';
const ADMIN_PASS  = '985600@Bh';

const isEmail = (value = '') => value.includes('@');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('so_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const loginAdmin = async (email, password) => {
    if (isEmail(email) && email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const u = { email, role: 'admin', name: 'Admin' };
      setUser(u);
      localStorage.setItem('so_user', JSON.stringify(u));
      return { success: true, role: 'admin' };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  // Called after MSG91 widget succeeds with an access-token
  const verifyMsg91Token = async (accessToken, profile = {}) => {
    if (!accessToken) {
      return { success: false, error: 'No OTP token received.' };
    }
    try {
      const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
      const res = await fetch(`${base}auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          name: profile.name?.trim() || '',
          email: profile.email?.trim() || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Verification failed. Please try again.' };
      }

      const u = {
        role: 'customer',
        phone: data.user?.phone_number || '',
        name: data.user?.name || 'Customer',
        email: data.user?.email || profile.email || '',
        tokens: data.tokens,
      };
      setUser(u);
      localStorage.setItem('so_user', JSON.stringify(u));
      return { success: true, role: 'customer' };
    } catch (err) {
      console.error('[verifyMsg91Token] error:', err);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('so_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginAdmin,
      verifyMsg91Token,
      logout,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
