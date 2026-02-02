import ClearanceSaleRepository from '../repositories/clearanceSale.repository.js';
import ProductRepository from '../repositories/product.repository.js';
import AppError from '../utils/AppError.js';
import { HTTP_STATUS } from '../constants.js';
import Cache from '../utils/cache.js';

class ClearanceSaleService {

    async getSaleConfig(vendorId) {
        return await ClearanceSaleRepository.findByVendor(vendorId);
    }

    async upsertSaleConfig(data, vendorId) {
        // Validate dates
        if (data.startDate && data.expireDate) {
            if (new Date(data.expireDate) <= new Date(data.startDate)) {
                throw new AppError('Expire date must be after start date', HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE');
            }
        }

        let existing = await ClearanceSaleRepository.findByVendor(vendorId);

        // Prepare meta image handling if provided (assumed handled by controller/upload middleware -> url string)

        let result;
        if (existing) {
            result = await ClearanceSaleRepository.update(existing._id, data);
        } else {
            data.vendor = vendorId;
            // Default false if not provided, though schema has default
            result = await ClearanceSaleRepository.create(data);
        }

        await this.invalidateCache(vendorId);
        return result;
    }

    async toggleStatus(isActive, vendorId) {
        const existing = await ClearanceSaleRepository.findByVendor(vendorId);
        if (!existing) {
            throw new AppError('Clearance sale configuration not found', HTTP_STATUS.NOT_FOUND, 'SALE_NOT_FOUND');
        }

        const result = await ClearanceSaleRepository.update(existing._id, { isActive });
        await this.invalidateCache(vendorId);
        return result;
    }

    async addProducts(productIds, vendorId) {
        const sale = await ClearanceSaleRepository.findByVendor(vendorId);
        if (!sale) {
            throw new AppError('Please setup clearance sale configuration first', HTTP_STATUS.BAD_REQUEST, 'SETUP_REQUIRED');
        }

        // Verify products belong to vendor
        const count = await ProductRepository.count({
            _id: { $in: productIds },
            vendor: vendorId
        });

        if (count !== productIds.length) {
            throw new AppError('One or more products do not belong to you or do not exist', HTTP_STATUS.FORBIDDEN, 'INVALID_PRODUCTS');
        }

        const result = await ClearanceSaleRepository.addProducts(vendorId, productIds);
        await this.invalidateCache(vendorId);
        // Also invalidate product caches as their price/display might change?
        // Ideally yes, but depends on if we store "isSale" on product. We don't.
        // But the "Home" page might fetch "Clearance Products".
        return result;
    }

    async removeProduct(productId, vendorId) {
        const result = await ClearanceSaleRepository.removeProduct(vendorId, productId);
        await this.invalidateCache(vendorId);
        return result;
    }

    async toggleProductStatus(productId, isActive, vendorId) {
        const result = await ClearanceSaleRepository.toggleProductStatus(vendorId, productId, isActive);
        if (!result) {
            throw new AppError('Product not found in clearance sale', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }
        await this.invalidateCache(vendorId);
        return result;
    }

    async invalidateCache(vendorId) {
        await Cache.delByPattern('clearance*');
        // If we cache specific vendor sales
    }

    async getPublicSales(limit = 10) {
        // Fetch all ACTIVE clearance sales where current date is within range
        const now = new Date();
        const result = await ClearanceSaleRepository.findAll({
            isActive: true,
            startDate: { $lte: now },
            expireDate: { $gte: now }
        }, { createdAt: -1 }, 1, limit);

        // We return everything. The frontend will check 'isActive' on each product 
        // within the sale to decide whether to show the "Clearance Price" or "Normal Price".
        // This satisfies: "active h toh product pe sale dikhegi agr inactive h toh product dikhega lkn sale nhi rhegi"

        return result;
    }

    async enrichProductsWithSales(products) {
        if (!products || (Array.isArray(products) && products.length === 0)) return products;

        const isArray = Array.isArray(products);
        const productList = isArray ? products : [products];

        // Get unique vendor IDs from the products
        const vendorIds = [...new Set(productList.map(p => p.vendor?._id || p.vendor).filter(id => id))];
        if (vendorIds.length === 0) return products;

        // Fetch active sales for these vendors
        const now = new Date();
        const activeSales = await ClearanceSaleRepository.model.find({
            vendor: { $in: vendorIds },
            isActive: true,
            startDate: { $lte: now },
            expireDate: { $gte: now }
        }).lean();

        if (activeSales.length === 0) return products;

        // Map sales by vendor for quick lookup
        const salesByVendor = {};
        activeSales.forEach(sale => {
            salesByVendor[sale.vendor.toString()] = sale;
        });

        productList.forEach(p => {
            const vendorId = (p.vendor?._id || p.vendor)?.toString();
            const sale = salesByVendor[vendorId];

            if (sale) {
                // Check if product is in this sale and active
                const saleProduct = sale.products?.find(sp => sp.product.toString() === p._id.toString());
                if (saleProduct && saleProduct.isActive) {
                    p.clearanceSale = {
                        discountType: sale.discountType,
                        discountAmount: sale.discountAmount,
                        offerActiveTime: sale.offerActiveTime,
                        startTime: sale.startTime,
                        endTime: sale.endTime,
                        metaTitle: sale.metaTitle
                    };

                    // Frontend logic helper: calculate sale price
                    if (sale.discountType === 'flat') {
                        p.salePrice = sale.discountAmount > 0
                            ? Math.max(0, p.price - (p.price * (sale.discountAmount / 100)))
                            : p.price;
                    }
                    // If product_wise, the frontend/vendor might set it differently, 
                    // but usually vendor sets a flat % for all clearance items in 'flat' mode.
                }
            }
        });

        return isArray ? productList : productList[0];
    }
}

export default new ClearanceSaleService();
