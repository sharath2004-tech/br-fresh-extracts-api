// src/pages/StorePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import CartModal from '../components/CartModal';
import ProductModal from '../components/ProductModal';
import LocationModal from '../components/LocationModal';
import { toast } from 'react-hot-toast';

const StorePage = () => {
  const { setToken } = useContext(AuthContext);
  
  // Data State
  const [products, setProducts] = useState([]);
  const [userAddress, setUserAddress] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Modals State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const [cart, setCart] = useState([]);

  // 1. Fetch Products & User Profile on Load
  useEffect(() => {
    const initData = async () => {
      try {
        const [prodRes, profRes] = await Promise.all([
          api.get('products/'),
          api.get('auth/profile/')
        ]);

        setProducts(prodRes.data.map(p => ({
          id: p.id, name: p.name, description: p.description,
          price: p.price, image_url: p.image, category_name: p.category,
        })));

        const addr = profRes.data.address;
        setUserAddress(addr);
        
        if (!addr) {
          setIsLocationOpen(true);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // --- LOCATION LOGIC ---
  const handleDetectLocation = (manualPosition = null) => {
    setLocationLoading(true);

    const processCoords = async (latitude, longitude) => {
        latitude = parseFloat(latitude.toFixed(6));
        longitude = parseFloat(longitude.toFixed(6));
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const newAddress = data.display_name || "Pinned Location";

            await api.patch('auth/profile/', {
                address: newAddress,
                latitude,
                longitude
            });
            setUserAddress(newAddress);
            setIsLocationOpen(false);
            toast.success("Location updated!");
        } catch (e) {
            toast.error("Error saving location.");
        } finally {
            setLocationLoading(false);
        }
    };

    if (manualPosition && manualPosition.coords) {
        processCoords(manualPosition.coords.latitude, manualPosition.coords.longitude);
    } else {
        if (!navigator.geolocation) return toast.error("No GPS");
        navigator.geolocation.getCurrentPosition(
            (pos) => processCoords(pos.coords.latitude, pos.coords.longitude),
            () => { setLocationLoading(false); toast.error("GPS failed"); }
        );
    }
  };

  // --- THIS WAS MISSING ---
  const handleManualLocation = async (addressText) => {
    setLocationLoading(true);
    try {
      await api.patch('auth/profile/', { address: addressText });
      setUserAddress(addressText);
      setIsLocationOpen(false);
      toast.success("Location updated!");
    } catch (e) {
      toast.error("Failed to save address.");
    } finally {
      setLocationLoading(false);
    }
  };
  // ------------------------

  // --- CART/PRODUCT LOGIC ---
  const handleAddToCart = (product) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      return exist 
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };
  
  const handleUpdateQty = (id, chg) => setCart(p => p.map(i => i.id === id ? {...i, quantity: Math.max(0, i.quantity+chg)} : i).filter(i=>i.quantity>0));
  const handleRemove = (id) => setCart(p => p.filter(i => i.id !== id));
  
  const handleCheckout = async () => {
    try {
      await api.post('orders/', { items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })) });
      toast.success("Order placed!");
      setCart([]); setIsCartOpen(false);
    } catch (e) { toast.error("Order failed."); }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)} 
        onLogout={() => setToken(null)}
        currentAddress={userAddress}
        onLocationClick={() => setIsLocationOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="text-center py-12 bg-white rounded-2xl shadow-lg overflow-hidden">
           <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">What are you looking for?</h1>
           <div className="mt-8 max-w-lg mx-auto px-4">
            <div className="relative flex items-center w-full h-14 rounded-full shadow-lg bg-white border border-gray-200">
              <input className="w-full h-full pl-6 pr-16 rounded-full text-base text-gray-700 outline-none border-none focus:ring-2 focus:ring-green-500" type="text" placeholder="Search for products..."/>
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-green-700">
                Search
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Products</h2>
          {loading ? <p>Loading...</p> : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onProductClick={(p) => {setSelectedProduct(p); setIsProductModalOpen(true)}} />
              ))}
            </div>
          )}
        </section>
      </main>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cart} onUpdateQuantity={handleUpdateQty} onRemoveItem={handleRemove} onCheckout={handleCheckout} />
      <ProductModal product={selectedProduct} isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onAddToCart={handleAddToCart} />
      
      <LocationModal 
        isOpen={isLocationOpen} 
        onClose={() => setIsLocationOpen(false)}
        onDetectLocation={handleDetectLocation}
        onManualSubmit={handleManualLocation}
        loading={locationLoading}
      />
    </div>
  );
};

export default StorePage;