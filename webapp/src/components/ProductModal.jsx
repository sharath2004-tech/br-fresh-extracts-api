// src/components/ProductModal.jsx
import React from 'react';
import { getOptimizedImageUrl } from '../utils/imageUtils';
// Close Icon
const CloseIcon = () => <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  if (!product) return null; // Don't render if no product is selected

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
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Product Details</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
            <CloseIcon />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <img 
            src={getOptimizedImageUrl(product.image_url, 800)} 
            alt={product.name} 
            className="w-full h-64 rounded-lg object-contain mb-4 bg-gray-50"
          />
          <h3 className="text-3xl font-bold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1 mb-3">{product.category_name}</p>
          <p className="text-2xl font-semibold text-green-600 mb-4">₹{product.price}</p>
          <p className="text-base text-gray-700 mb-6">{product.description}</p>
          <button 
            onClick={() => {
              onAddToCart(product);
              onClose(); // Close modal after adding
            }}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl text-lg font-semibold shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;