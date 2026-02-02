import ClearanceSale from '../models/clearanceSale.model.js';
import BaseRepository from './base.repository.js';

class ClearanceSaleRepository extends BaseRepository {
    constructor() {
        super(ClearanceSale);
    }

    async findByVendor(vendorId) {
        return await this.model.findOne({ vendor: vendorId }).populate('products.product');
    }

    async addProducts(vendorId, productIds) {
        const productObjects = productIds.map(id => ({ product: id, isActive: true }));

        // Use a loop or complex query because $addToSet with objects only works if the whole object is unique.
        // We want to ensure the product ID is unique.
        const sale = await this.model.findOne({ vendor: vendorId });
        if (!sale) return null;

        productIds.forEach(id => {
            const exists = sale.products.find(p => p.product.toString() === id.toString());
            if (!exists) {
                sale.products.push({ product: id, isActive: true });
            }
        });

        return await sale.save();
    }

    async removeProduct(vendorId, productId) {
        return await this.model.findOneAndUpdate(
            { vendor: vendorId },
            { $pull: { products: { product: productId } } },
            { new: true }
        );
    }

    async toggleProductStatus(vendorId, productId, isActive) {
        return await this.model.findOneAndUpdate(
            { vendor: vendorId, 'products.product': productId },
            { $set: { 'products.$.isActive': isActive } },
            { new: true }
        );
    }
}

export default new ClearanceSaleRepository();
