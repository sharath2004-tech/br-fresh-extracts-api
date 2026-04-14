// src/pages/MyOrdersPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // To link back to the store
import api from '../api'; // Our smart, authenticated API client

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // We just call our smart 'api' client.
        // It automatically adds the Authorization token.
        const response = await api.get('/orders/');
        setOrders(response.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError('Failed to load your order history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []); // Runs once when the page loads

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Simple Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <Link 
            to="/" 
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            &larr; Back to Store
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && <p className="text-center">Loading your orders...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <p className="text-center text-gray-500">You haven't placed any orders yet.</p>
            ) : (
              // Loop over each order
              orders.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Order ID: {order.id}</h2>
                      <p className="text-sm text-gray-600">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Total: <span className="font-bold text-gray-900 text-lg">₹{order.total_amount}</span>
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="p-4 space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-semibold text-gray-800">{item.product}</span>
                          <span className="text-gray-500"> (x {item.quantity})</span>
                        </div>
                        <span className="text-gray-700">₹{item.price_at_time} each</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrdersPage;