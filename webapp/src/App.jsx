import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import AppSplash from './components/ui/AppSplash';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { StoreProvider } from './contexts/StoreContext';

import MainLayout from './components/layout/MainLayout';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ShopPage from './pages/ShopPage';

import AdminCategories from './pages/admin/AdminCategories';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminHero from './pages/admin/AdminHero';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPrivacyPolicy from './pages/admin/AdminPrivacyPolicy';
import AdminProducts from './pages/admin/AdminProducts';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminWhyUs from './pages/admin/AdminWhyUs';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Bridge: syncs cart when user logs in
function CartSyncBridge() {
  const { user, getValidToken } = useAuth();
  const { syncCartFromServer } = useCart();
  useEffect(() => {
    if (user?.role === 'customer' && user?.tokens?.access) {
      getValidToken().then(token => { if (token) syncCartFromServer(token); });
    }
  }, [user?.tokens?.access]);
  return null;
}

// Bridge: registers FCM push token on Android (Capacitor) when user logs in
const _rawApi = import.meta.env.VITE_API_URL || '/api/';
const _API_URL = _rawApi.endsWith('/') ? _rawApi : _rawApi + '/';

function PushBridge() {
  const { user, getValidToken } = useAuth();
  useEffect(() => {
    if (user?.role !== 'customer') return;
    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') return;

        await PushNotifications.register();

        PushNotifications.addListener('registration', async ({ value: fcmToken }) => {
          try {
            const token = await getValidToken();
            if (!token) return;
            await fetch(`${_API_URL}auth/fcm-token/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ token: fcmToken }),
            });
          } catch { /* non-critical */ }
        });

        PushNotifications.addListener('pushNotificationReceived', notification => {
          // Show a simple in-app toast for foreground notifications
          const event = new CustomEvent('fcm:notification', { detail: notification });
          window.dispatchEvent(event);
        });
      } catch { /* not on Android / Capacitor not available */ }
    })();
  }, [user?.tokens?.access]);
  return null;
}

// Bridge: handles Android hardware back button to navigate instead of exit
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef(0);

  useEffect(() => {
    let listener = null;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        listener = await App.addListener('backButton', () => {
          // If not on root, go back in history
          if (location.pathname !== '/') {
            navigate(-1);
            return;
          }
          // On home page: double-tap to exit
          const now = Date.now();
          if (now - lastBackPress.current < 2000) {
            App.exitApp();
          } else {
            lastBackPress.current = now;
            const event = new CustomEvent('fcm:notification', {
              detail: { title: 'Exit App', body: 'Press back once more to exit.' },
            });
            window.dispatchEvent(event);
          }
        });
      } catch { /* non-critical */ }
    })();
    return () => { listener?.remove?.(); };
  }, [location.pathname]);

  return null;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashDone = () => setSplashDone(true);

  return (
    <>
      {!splashDone && <AppSplash onDone={handleSplashDone} />}
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <StoreProvider>
            <CartProvider>
              <CartSyncBridge />
              <PushBridge />
              <BackButtonHandler />
              <Routes>
                {/* Public routes with Navbar + Footer */}
                <Route element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="product/:id" element={<ProductDetailPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                </Route>

                {/* Admin routes — own layout, no main navbar */}
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders"       element={<AdminOrders />} />
                  <Route path="customers"    element={<AdminCustomers />} />
                  <Route path="expenses"     element={<AdminExpenses />} />
                  <Route path="hero"         element={<AdminHero />} />
                  <Route path="categories"   element={<AdminCategories />} />
                  <Route path="products"     element={<AdminProducts />} />
                  <Route path="testimonials" element={<AdminTestimonials />} />
                  <Route path="why-us"       element={<AdminWhyUs />} />
                  <Route path="settings"     element={<AdminSettings />} />
                  <Route path="privacy-policy" element={<AdminPrivacyPolicy />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </StoreProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
    </>
  );
}
