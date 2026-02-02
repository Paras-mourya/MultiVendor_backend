import express from 'express';
import { z } from 'zod';
import validate from '../middleware/validate.middleware.js';
import { protectVendor } from '../middleware/vendorAuth.middleware.js';
import CouponController from '../controllers/coupon.controller.js';
import lockRequest from '../middleware/idempotency.middleware.js';

const router = express.Router();

// Validation Schemas
const createCouponSchema = z.object({
    body: z.object({
        title: z.string().min(3, 'Title is required'),
        code: z.string().min(3, 'Code is required').regex(/^[a-zA-Z0-9]+$/, 'Code must be alphanumeric'),
        type: z.enum(['discount_on_purchase', 'free_delivery', 'first_order']),
        discountType: z.enum(['amount', 'percent']).optional(),
        discountAmount: z.number().min(0).optional(),
        minPurchase: z.number().min(0).optional(),
        limitForSameUser: z.number().min(1).optional(),
        startDate: z.string().datetime({ message: 'Start date must be a valid ISO date' }),
        expireDate: z.string().datetime({ message: 'Expire date must be a valid ISO date' })
    }) // Add refinments if needed (e.g., if type=discount_on_purchase, amount required)
});

const updateCouponSchema = z.object({
    body: z.object({
        title: z.string().min(3).optional(),
        code: z.string().min(3).regex(/^[a-zA-Z0-9]+$/).optional(),
        type: z.enum(['discount_on_purchase', 'free_delivery', 'first_order']).optional(),
        discountType: z.enum(['amount', 'percent']).optional(),
        discountAmount: z.number().min(0).optional(),
        minPurchase: z.number().min(0).optional(),
        limitForSameUser: z.number().min(1).optional(),
        startDate: z.string().datetime().optional(),
        expireDate: z.string().datetime().optional()
    })
});

const updateStatusSchema = z.object({
    body: z.object({
        isActive: z.boolean()
    })
});

// Vendor Routes
router.use(protectVendor);

router.post(
    '/',
    lockRequest('create_coupon'),
    validate(createCouponSchema),
    CouponController.createCoupon
);

router.get('/', CouponController.getVendorCoupons);

router.get('/export/csv', CouponController.exportVendorCoupons);

router.get('/:id', CouponController.getCouponById);

router.put(
    '/:id',
    lockRequest('update_coupon'),
    validate(updateCouponSchema),
    CouponController.updateCoupon
);

router.patch(
    '/:id/status',
    lockRequest('update_coupon_status'),
    validate(updateStatusSchema),
    CouponController.updateStatus
);

router.delete(
    '/:id',
    lockRequest('delete_coupon'),
    CouponController.deleteCoupon
);

export default router;
