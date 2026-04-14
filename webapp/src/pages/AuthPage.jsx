// src/pages/AuthPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from '../firebase'; 
import api from '../api'; 
import { AuthContext } from '../App';
import { toast } from 'react-hot-toast';

const AuthPage = () => {
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  // Added 2 new steps for Forgot Password flow
  const [step, setStep] = useState('PHONE_ENTRY'); 
  // Steps: 'PHONE_ENTRY', 'PASSWORD_LOGIN', 'OTP_VERIFY', 'REGISTRATION_FORM', 'FORGOT_OTP_VERIFY', 'RESET_PASSWORD_FORM'

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // --- INITIALIZE RECAPTCHA ---
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);

  // --- HELPER: SEND OTP ---
  const sendOtp = async () => {
    const appVerifier = window.recaptchaVerifier;
    const formattedPhone = `+91${phone}`;
    try {
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      toast.success(`OTP sent to ${formattedPhone}`);
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Failed to send SMS. Try again later.");
      return false;
    }
  };

  // --- LOGIC HANDLERS ---

  // 1. Check if User Exists
  const handleCheckUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/check-user/', { phone_number: phone });
      if (response.data.exists) {
        setStep('PASSWORD_LOGIN');
      } else {
        const sent = await sendOtp();
        if (sent) setStep('OTP_VERIFY');
      }
    } catch (err) {
      toast.error("Connection error.");
    }
    setLoading(false);
  };

  // 2. Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login/', {
        phone_number: phone,
        password: password
      });
      const { access, refresh } = response.data.tokens;
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      navigate('/'); 
      toast.success("Welcome back!");
    } catch (err) {
      toast.error("Wrong password.");
    }
    setLoading(false);
  };

  // 3. Verify OTP (For NEW Registration)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      setStep('REGISTRATION_FORM');
      toast.success("Phone verified!");
    } catch (err) {
      toast.error("Invalid OTP.");
    }
    setLoading(false);
  };

  // 4. Register User
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const firebaseToken = await auth.currentUser.getIdToken();
      const response = await api.post('/auth/register/', {
        firebase_token: firebaseToken,
        name: name,
        password: password
      });
      const { access, refresh } = response.data.tokens;
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      navigate('/'); 
      toast.success("Account created!");
    } catch (err) {
      toast.error("Registration failed.");
    }
    setLoading(false);
  };

  // --- NEW: FORGOT PASSWORD LOGIC ---

  // A. Triggered when clicking "Forgot Password?"
  const startForgotPassword = async () => {
    setLoading(true);
    // Resend OTP to the phone number we already have
    const sent = await sendOtp(); 
    if (sent) {
        setOtp(''); // Clear any old OTP
        setStep('FORGOT_OTP_VERIFY');
    }
    setLoading(false);
  };

  // B. Verify OTP for Reset
  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      setStep('RESET_PASSWORD_FORM'); // Go to set new password
      toast.success("Verified! Set your new password.");
    } catch (err) {
      toast.error("Invalid OTP.");
    }
    setLoading(false);
  }

  // C. Submit New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const firebaseToken = await auth.currentUser.getIdToken();
        await api.post('/auth/reset-password/', {
            firebase_token: firebaseToken,
            new_password: password
        });
        toast.success("Password reset! Please login.");
        setPassword('');
        setStep('PASSWORD_LOGIN'); // Go back to login screen
    } catch (err) {
        toast.error("Failed to reset password.");
    }
    setLoading(false);
  }


  // --- UI RENDERING ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        
        <div className="flex justify-center items-center space-x-2 mb-6">
          <span className="text-3xl font-bold text-gray-800">BR Fresh Extracts</span>
        </div>

        {/* 1. PHONE ENTRY */}
        {step === 'PHONE_ENTRY' && (
          <form onSubmit={handleCheckUser} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Enter your mobile number</h2>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="9876543210" required />
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Checking...' : 'Continue'}</button>
          </form>
        )}

        {/* 2. PASSWORD LOGIN */}
        {step === 'PASSWORD_LOGIN' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Welcome back!</h2>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Password" required />
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Logging in...' : 'Login'}</button>
            
            <div className="flex justify-between mt-4 text-sm">
                <button type="button" onClick={() => setStep('PHONE_ENTRY')} className="text-gray-500">Change Number</button>
                {/* Forgot Password Button */}
                <button type="button" onClick={startForgotPassword} className="text-green-600 hover:text-green-800 font-medium">Forgot Password?</button>
            </div>
          </form>
        )}

        {/* 3. OTP VERIFY (For Registration) */}
        {step === 'OTP_VERIFY' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Verify Phone (Signup)</h2>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest" placeholder="123456" maxLength="6" required />
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Verifying...' : 'Verify OTP'}</button>
          </form>
        )}

        {/* 4. REGISTRATION FORM */}
        {step === 'REGISTRATION_FORM' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Create Account</h2>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Full Name" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Create Password" required />
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Creating Account...' : 'Complete Sign Up'}</button>
          </form>
        )}

        {/* 5. FORGOT PASSWORD OTP */}
        {step === 'FORGOT_OTP_VERIFY' && (
          <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Verify for Reset</h2>
            <p className="text-center text-sm text-gray-500">OTP sent to verify it's you.</p>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest" placeholder="123456" maxLength="6" required />
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Verifying...' : 'Verify & Reset'}</button>
            <button type="button" onClick={() => setStep('PASSWORD_LOGIN')} className="w-full text-center text-sm text-gray-500">Cancel</button>
          </form>
        )}

        {/* 6. RESET PASSWORD FORM */}
        {step === 'RESET_PASSWORD_FORM' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Set New Password</h2>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="New Password" required />
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Set Password'}</button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthPage;