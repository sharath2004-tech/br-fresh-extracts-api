import express from 'express';
import multer from 'multer';
import {
    changePassword,
    checkUser,
    login,
    profile,
    refreshToken,
    register,
    resetPassword,
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
    createOrder,
    listAdminOrders,
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
import { translateText } from '../controllers/translateController.js';
import { uploadImage } from '../controllers/uploadController.js';
import { requireJwt } from '../middleware/requireJwt.js';
import { requireSecret } from '../middleware/requireSecret.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public endpoints
router.get('/products/', listPublicProducts);
router.get('/categories/', listCategories);

// Orders (JWT)
router.get('/orders/', requireJwt, listUserOrders);
router.post('/orders/', requireJwt, createOrder);

// Admin analytics & orders
router.get('/admin/analytics/', requireSecret, adminAnalytics);
router.get('/admin/orders/', requireSecret, listAdminOrders);
router.put('/admin/orders/:id/', requireSecret, updateAdminOrder);

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
router.post('/auth/check-user/', checkUser);
router.post('/auth/login/', login);
router.post('/auth/register/', register);
router.get('/auth/profile/', requireJwt, profile);
router.put('/auth/profile/', requireJwt, profile);
router.post('/auth/change-password/', requireJwt, changePassword);
router.post('/auth/reset-password/', resetPassword);
router.post('/auth/token/refresh/', refreshToken);

// Translation
router.post('/translate/', translateText);

export default router;
