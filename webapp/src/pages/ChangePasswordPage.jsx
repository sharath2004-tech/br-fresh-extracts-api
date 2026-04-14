// src/pages/ChangePasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';

const ChangePasswordPage = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      
      toast.success('Password changed successfully!');
      navigate('/'); 
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar 
        cartCount={0} 
        onCartClick={() => navigate('/')} 
        onLogout={() => navigate('/login')} 
      />

      <div className="max-w-md mx-auto mt-10 px-4 sm:px-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Change Password</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;