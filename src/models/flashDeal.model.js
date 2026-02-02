import mongoose from 'mongoose';

const flashDealSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    image: {
        url: { type: String, required: true },
        publicId: { type: String, required: true }
    },
    isPublished: {
        type: Boolean,
        default: false,
        index: true
    },
    // Meta Data
    metaTitle: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    },
    metaImage: {
        url: { type: String },
        publicId: { type: String }
    },
    // Products included in the flash deal
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        discountType: {
            type: String,
            enum: ['flat', 'percent'],
            default: 'percent'
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for status (Active/Expired)
flashDealSchema.virtual('status').get(function () {
    const now = new Date();
    if (now < this.startDate) return 'upcoming';
    if (now > this.endDate) return 'expired';
    return 'active';
});

const FlashDeal = mongoose.model('FlashDeal', flashDealSchema);

export default FlashDeal;
