import express from 'express';
import { z } from 'zod';
import { SYSTEM_PERMISSIONS } from '../constants.js';
import validate from '../middleware/validate.middleware.js';
import { authorizeStaff } from '../middleware/employeeAuth.middleware.js';
import AdminClearanceSaleController from '../controllers/adminClearanceSale.controller.js';
import lockRequest from '../middleware/idempotency.middleware.js';

const router = express.Router();

const setupSchema = z.object({
    body: z.object({
        startDate: z.string().datetime(),
        expireDate: z.string().datetime(),
        discountType: z.enum(['flat', 'product_wise']),
        discountAmount: z.number().min(0).optional(),
        offerActiveTime: z.enum(['always', 'specific_time']),
        startTime: z.string().optional(),
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
        productIds: z.array(z.string().min(1, "Product ID required"))
    })
});

// Admin Protection (Supports Admin & Authorized Staff)
router.use(authorizeStaff(SYSTEM_PERMISSIONS.OFFERS_AND_DEALS));

// Base Config
router.get('/', AdminClearanceSaleController.getConfig);

router.post(
    '/',
    lockRequest('setup_admin_clearance_sale'),
    validate(setupSchema),
    AdminClearanceSaleController.upsertConfig
);

// Toggle Active/Inactive
router.patch(
    '/status',
    lockRequest('toggle_admin_clearance_sale'),
    validate(toggleSchema),
    AdminClearanceSaleController.toggleStatus
);

// Manage Products
router.post(
    '/products',
    lockRequest('add_admin_clearance_products'),
    validate(addProductsSchema),
    AdminClearanceSaleController.addProducts
);

router.delete(
    '/products/:productId',
    lockRequest('remove_admin_clearance_product'),
    AdminClearanceSaleController.removeProduct
);

router.patch(
    '/products/:productId/status',
    lockRequest('toggle_admin_clearance_product_status'),
    validate(toggleSchema),
    AdminClearanceSaleController.toggleProductStatus
);

export default router;
