import { z } from 'zod';

/**
 * Add to Cart Validation
 */
export const addToCartSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum quantity is 100').default(1),
    variation: z.string().optional().nullable()
});


/**
 * Update Cart Item Quantity Validation
 */
export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum quantity is 100')
});

/**
 * Guest ID Validation (UUID v4)
 */
export const guestIdSchema = z.string().uuid('Invalid guest ID format');
