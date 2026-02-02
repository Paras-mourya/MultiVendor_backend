import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    type: {
        type: String,
        enum: ['discount_on_purchase', 'free_delivery', 'first_order'],
        required: true
    },
    discountType: {
        type: String,
        enum: ['amount', 'percent'],
        default: 'amount',
        required: function () { return this.type !== 'free_delivery'; }
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    minPurchase: {
        type: Number,
        default: 0,
        min: 0
    },
    limitForSameUser: {
        type: Number,
        default: 1,
        min: 1
    },
    startDate: {
        type: Date,
        required: true
    },
    expireDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    customerScope: {
        type: String,
        enum: ['all'], // Can be expanded to 'specific' later
        default: 'all'
    },
    // Tracking total global usage if needed, though limitForSameUser is per-user
    totalUsed: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

// Compound index for quick validation lookups
couponSchema.index({ code: 1, isActive: 1, startDate: 1, expireDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
