// src/components/CartItem.jsx
import React from 'react';

// Icons for the buttons
const PlusIcon = () => <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>;
const MinusIcon = () => <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>;

const CartItem = ({ item, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="flex items-start space-x-4">
      <img 
        src={item.image_url || 'https://via.placeholder.com/100'} 
        alt={item.name} 
        className="w-20 h-20 rounded-lg object-cover border border-gray-200"
      />
      <div className="flex-1">
        <h4 className="text-base font-medium text-gray-800">{item.name}</h4>
        <p className="text-sm text-gray-500">₹{item.price}</p>
        <div className="mt-2 flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button 
              onClick={() => onUpdateQuantity(item.id, -1)}
              className="p-1.5 text-gray-500 hover:text-gray-800"
            >
              <MinusIcon />
            </button>
            <span className="px-3 text-sm font-medium text-gray-700">{item.quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(item.id, 1)}
              className="p-1.5 text-gray-500 hover:text-gray-800"
            >
              <PlusIcon />
            </button>
          </div>
          {/* Remove Button */}
          <button 
            onClick={() => onRemoveItem(item.id)}
            className="text-sm font-medium text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;