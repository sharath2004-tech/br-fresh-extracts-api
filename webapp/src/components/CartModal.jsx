// src/components/CartModal.jsx
import React from 'react';
import CartItem from './CartItem'; // Import the new component

// Close Icon
const CloseIcon = () => <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const CartModal = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  // Calculate the subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div 
        className={`fixed top-0 right-0 w-full max-w-lg h-full bg-white shadow-xl z-50 
                    flex flex-col transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Your Cart</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
            <CloseIcon />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            // Empty Cart Message (from your prototype)
            <div className="text-center text-gray-500 pt-10">
              <svg className="h-16 w-16 mx-auto text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-1 text-sm text-gray-500">Start adding products to see them here.</p>
            </div>
          ) : (
            // List of Cart Items
            cartItems.map(item => (
              <CartItem 
                key={item.id} 
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))
          )}
        </div>

        {/* Cart Footer (Checkout) */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Subtotal</span>
            <span className="text-xl font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <button 
            onClick={onCheckout}
            disabled={cartItems.length === 0}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl text-lg font-semibold shadow-lg 
                       hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;