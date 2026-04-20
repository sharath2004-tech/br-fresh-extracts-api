import express from 'express';
import multer from 'multer';
import {
    addAddress,
    adminLogin,
    changePassword,
    checkUser,
    deleteAddress,
    firebaseVerify,
    getAddresses,
    getCart,
    login,
    profile,
    refreshToken,
    saveCart,
    saveFcmToken,
} from '../controllers/authController.js';
import {
    createCategory,
    deleteCategory,
    listAdminCategories,
    listCategories,
    updateCategory,
} from '../controllers/categoriesController.js';
import {
    adminAnalytics,
    cancelOrder,
    createOrder,
    listAdminCustomers,
    listAdminOrders,
    listCustomerOrders,
    listUserOrders,
    updateAdminOrder,
} from '../controllers/ordersController.js';
import {
    createProduct,
    deleteProduct,
    listAdminProducts,
    listPublicProducts,
    updateProduct,
} from '../controllers/productsController.js';
import { createReview, deleteReview, listReviews } from '../controllers/reviewsController.js';
import { getStoreSettings, updateStoreSettings } from '../controllers/storeSettingsController.js';
import { translateText } from '../controllers/translateController.js';
import { uploadImage } from '../controllers/uploadController.js';
import { requireJwt } from '../middleware/requireJwt.js';
import { requireSecret } from '../middleware/requireSecret.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public endpoints
router.get('/products/', listPublicProducts);
router.get('/categories/', listCategories);
router.get('/store-settings/', getStoreSettings);

// Product reviews (public read, JWT write)
router.get('/products/:id/reviews/', listReviews);
router.post('/products/:id/reviews/', requireJwt, createReview);
router.delete('/products/:id/reviews/:reviewId/', requireSecret, deleteReview);

// Orders (JWT)
router.get('/orders/', requireJwt, listUserOrders);
router.post('/orders/', requireJwt, createOrder);
router.patch('/orders/:id/cancel/', requireJwt, cancelOrder);

// Admin analytics & orders
router.get('/admin/analytics/', requireSecret, adminAnalytics);
router.get('/admin/orders/', requireSecret, listAdminOrders);
router.put('/admin/orders/:id/', requireSecret, updateAdminOrder);

// Admin customers
router.get('/admin/customers/', requireSecret, listAdminCustomers);
router.get('/admin/customers/:phone/orders/', requireSecret, listCustomerOrders);

// Admin store settings
router.put('/admin/store-settings/', requireSecret, updateStoreSettings);

// Admin category CRUD
router.get('/admin/categories/', requireSecret, listAdminCategories);
router.post('/admin/categories/', requireSecret, createCategory);
router.put('/admin/categories/:id/', requireSecret, updateCategory);
router.delete('/admin/categories/:id/', requireSecret, deleteCategory);

// Admin product CRUD
router.get('/admin/products/', requireSecret, listAdminProducts);
router.post('/admin/products/', requireSecret, createProduct);
router.put('/admin/products/:id/', requireSecret, updateProduct);
router.delete('/admin/products/:id/', requireSecret, deleteProduct);

// Upload
router.post('/upload/', requireSecret, upload.single('file'), uploadImage);

// Auth
router.post('/auth/admin-login/', adminLogin);
router.post('/auth/check-user/', checkUser);
router.post('/auth/login/', login);
router.post('/auth/firebase-verify/', firebaseVerify);
router.get('/auth/profile/', requireJwt, profile);
router.put('/auth/profile/', requireJwt, profile);
router.post('/auth/change-password/', requireJwt, changePassword);
router.post('/auth/token/refresh/', refreshToken);
router.get('/auth/cart/', requireJwt, getCart);
router.put('/auth/cart/', requireJwt, saveCart);
router.post('/auth/fcm-token/', requireJwt, saveFcmToken);
router.get('/auth/addresses/', requireJwt, getAddresses);
router.post('/auth/addresses/', requireJwt, addAddress);
router.delete('/auth/addresses/:id/', requireJwt, deleteAddress);

// Translation
router.post('/translate/', translateText);

export default router;
