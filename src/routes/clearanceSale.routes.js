import express from 'express';
import { z } from 'zod';
import validate from '../middleware/validate.middleware.js';
import { protectVendor } from '../middleware/vendorAuth.middleware.js';
import ClearanceSaleController from '../controllers/clearanceSale.controller.js';
import lockRequest from '../middleware/idempotency.middleware.js';

const router = express.Router();

const setupSchema = z.object({
    body: z.object({
        startDate: z.string().datetime(),
        expireDate: z.string().datetime(),
        discountType: z.enum(['flat', 'product_wise']),
        discountAmount: z.number().min(0).optional(),
        offerActiveTime: z.enum(['always', 'specific_time']),
        startTime: z.string().optional(), // HH:mm validation could be stricter
        endTime: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaImage: z.string().optional()
    })
});

const toggleSchema = z.object({
    body: z.object({
        isActive: z.boolean()
    })
});

const addProductsSchema = z.object({
    body: z.object({
        productIds: z.array(z.string().min(1, "Available ID required"))
    })
});

// Public Routes
router.get('/public/all', ClearanceSaleController.getPublicSales);

// Vendor Routes
router.use(protectVendor);

// Base Config
router.get('/', ClearanceSaleController.getConfig);

router.post(
    '/',
    lockRequest('setup_clearance_sale'),
    validate(setupSchema),
    ClearanceSaleController.upsertConfig
);

// Toggle Active/Inactive
router.patch(
    '/status',
    lockRequest('toggle_clearance_sale'),
    validate(toggleSchema),
    ClearanceSaleController.toggleStatus
);

// Manage Products
router.post(
    '/products',
    lockRequest('add_clearance_products'),
    validate(addProductsSchema),
    ClearanceSaleController.addProducts
);

router.delete(
    '/products/:productId',
    lockRequest('remove_clearance_product'),
    ClearanceSaleController.removeProduct
);

router.patch(
    '/products/:productId/status',
    lockRequest('toggle_clearance_product_status'),
    validate(toggleSchema),
    ClearanceSaleController.toggleProductStatus
);

export default router;
