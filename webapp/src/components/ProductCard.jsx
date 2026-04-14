// src/components/ProductCard.jsx
import React from 'react';
import { getOptimizedImageUrl } from '../utils/imageUtils'; // 1. Import the helper

const ProductCard = ({ product, onAddToCart, onProductClick }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col group">
      <div className="relative w-full h-48 sm:h-56 bg-gray-100">
        
        {/* Make the image clickable */}
        <img 
          // 2. Use the helper here to fix broken/relative URLs
          src={getOptimizedImageUrl(product.image_url, 300)} 
          alt={product.name} 
          className="w-full h-full object-contain p-2 cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={() => onProductClick(product)} 
        />
        
        <div className="absolute top-3 right-3 bg-white/75 backdrop-blur-sm p-2 rounded-full">
          <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        {/* Make the title clickable */}
        <h3 
          className="text-lg font-semibold text-gray-800 truncate cursor-pointer hover:text-green-600"
          onClick={() => onProductClick(product)} 
        >
          {product.name}
        </h3>
        <p className="text-sm text-gray-500">{product.category_name || 'Category'}</p>
        
        <div className="mt-4 flex-1 flex items-end">
          <button 
            onClick={() => onAddToCart(product)}
            className="w-full bg-green-50 text-green-700 font-medium py-2.5 rounded-lg hover:bg-green-100 transition-colors duration-200"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;