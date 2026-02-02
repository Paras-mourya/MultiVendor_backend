import express from 'express';
import CartController from '../controllers/cart.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Cart Routes
 * All routes support both guest (with x-guest-id header) and authenticated users
 */

// Get cart
router.get('/', optionalAuth, CartController.getCart.bind(CartController));

// Add item to cart
router.post('/', optionalAuth, CartController.addToCart.bind(CartController));

// Update item quantity
router.patch('/:itemId', optionalAuth, CartController.updateItemQuantity.bind(CartController));

// Remove item from cart
router.delete('/:itemId', optionalAuth, CartController.removeItem.bind(CartController));

// Clear entire cart
router.delete('/', optionalAuth, CartController.clearCart.bind(CartController));

export default router;
