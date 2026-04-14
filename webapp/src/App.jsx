// src/App.jsx
import React, { useState, createContext, useContext, useEffect } from 'react'; // Added useEffect/useContext here too just in case
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import api from './api'; // Make sure this is imported for RequireProfile
import AuthPage from './pages/AuthPage';
import StorePage from './pages/StorePage';
import MyOrdersPage from './pages/MyOrdersPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage'; // <-- ADD THIS LINE HERE!
export const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  const setToken = (token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    setAccessToken(token);
  };

  return (
    <AuthContext.Provider value={{ accessToken, setToken }}>
      {/* 2. Add the Toaster component here */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
        }}
      />
      <div id="recaptcha-container"></div>
      <Routes>
        <Route
          path="/"
          element={accessToken ? <StorePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!accessToken ? <AuthPage /> : <Navigate to="/" />}
        />
        <Route 
          path="/my-orders"
          element={accessToken ? <MyOrdersPage /> : <Navigate to="/login" />}
        />
        <Route 
          path="/complete-profile" 
          element={accessToken ? <CompleteProfilePage /> : <Navigate to="/login" />} />
        <Route
          path="/change-password"
          element={accessToken ? <ChangePasswordPage /> : <Navigate to="/login" />}
        />
      </Routes>
      
    </AuthContext.Provider>
  );
}

function RequireProfile({ children }) {
  const { accessToken } = useAuth();
  const location = useLocation();
  const [isProfileComplete, setIsProfileComplete] = useState(null); // null = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Check the user's profile status
    const checkProfile = async () => {
      try {
        const response = await api.get('/auth/profile/');
        setIsProfileComplete(response.data.is_profile_complete);
      } catch (e) {
        console.error("Could not check profile", e);
        setIsProfileComplete(false); // Failsafe
      }
      setLoading(false);
    };
    checkProfile();
  }, [accessToken]);

  if (loading) {
    return <div className="p-8">Loading user profile...</div>; // Or a spinner
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isProfileComplete) {
    // Not complete? Force them to the profile page.
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }

  return children; // They are logged in AND profile is complete
}
export default App;