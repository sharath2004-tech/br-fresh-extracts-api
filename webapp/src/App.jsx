import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { StoreProvider } from './contexts/StoreContext';

import MainLayout from './components/layout/MainLayout';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ShopPage from './pages/ShopPage';

import AdminCategories from './pages/admin/AdminCategories';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminHero from './pages/admin/AdminHero';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminWhyUs from './pages/admin/AdminWhyUs';

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <StoreProvider>
            <CartProvider>
              <Routes>
                {/* Public routes with Navbar + Footer */}
                <Route element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="login" element={<LoginPage />} />
                </Route>

                {/* Admin routes — own layout, no main navbar */}
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders"       element={<AdminOrders />} />
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
