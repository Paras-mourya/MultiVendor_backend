import mongoose from 'mongoose';

const clearanceSaleSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
        unique: true, // One clearance sale config per vendor
        index: true
    },
    // Configuration
    isActive: {
        type: Boolean,
        default: false
    },
    startDate: {
        type: Date,
        required: true
    },
    expireDate: {
        type: Date,
        required: true
    },
    discountType: {
        type: String,
        enum: ['flat', 'product_wise'],
        default: 'flat',
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0,
        // Only relevant if discountType is 'flat'
    },
    offerActiveTime: {
        type: String,
        enum: ['always', 'specific_time'],
        default: 'always'
    },
    // Only if specific_time
    startTime: {
        type: String, // Format "HH:mm" e.g. "14:00"
        default: null
    },
    endTime: {
        type: String, // Format "HH:mm"
        default: null
    },

    // SEO / Meta Data
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaImage: { type: String }, // Path/URL

    // Products included in the sale
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true,
    versionKey: false
});

const ClearanceSale = mongoose.model('ClearanceSale', clearanceSaleSchema);

export default ClearanceSale;
