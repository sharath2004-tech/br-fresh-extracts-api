import { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
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
import AdminProducts from './pages/admin/AdminProducts';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminWhyUs from './pages/admin/AdminWhyUs';

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

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <StoreProvider>
            <CartProvider>
              <CartSyncBridge />
              <PushBridge />
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
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </StoreProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}
