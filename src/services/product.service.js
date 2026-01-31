import ProductRepository from '../repositories/product.repository.js';
import ProductCategoryRepository from '../repositories/productCategory.repository.js';
import ProductSubCategoryRepository from '../repositories/productSubCategory.repository.js';
import AppError from '../utils/AppError.js';
import { HTTP_STATUS } from '../constants.js';
import Cache from '../utils/cache.js';
import crypto from 'crypto';

const PRODUCT_CACHE_KEY = 'products';

class ProductService {
    /**
     * Helper to generate unique slug
     */
    async generateUniqueSlug(name) {
        let slug = name
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');

        // Check uniqueness
        let existing = await ProductRepository.findOne({ slug });
        let counter = 1;
        let originalSlug = slug;

        while (existing) {
            slug = `${originalSlug}-${counter}`;
            existing = await ProductRepository.findOne({ slug });
            counter++;
        }

        return slug;
    }

    // --- Vendor Methods ---

    async createProduct(data, vendorId) {
        // 1. Validate Category Exists
        const category = await ProductCategoryRepository.findById(data.category);
        if (!category) {
            throw new AppError('Category not found', HTTP_STATUS.BAD_REQUEST, 'CATEGORY_NOT_FOUND');
        }
        if (category.status !== 'active') {
            throw new AppError('Category is not active', HTTP_STATUS.BAD_REQUEST, 'CATEGORY_INACTIVE');
        }

        // 2. Validate SubCategory if provided
        if (data.subCategory) {
            const subCategory = await ProductSubCategoryRepository.findById(data.subCategory);
            if (!subCategory) {
                throw new AppError('SubCategory not found', HTTP_STATUS.BAD_REQUEST, 'SUBCATEGORY_NOT_FOUND');
            }
            // Verify subcategory belongs to selected category
            if (subCategory.category.toString() !== data.category.toString()) {
                throw new AppError('SubCategory does not belong to selected category', HTTP_STATUS.BAD_REQUEST, 'SUBCATEGORY_MISMATCH');
            }
        }

        // 3. Generate Slug
        data.slug = await this.generateUniqueSlug(data.name);
        data.vendor = vendorId;

        // 4. Validate SKU Uniqueness (Global)
        const existingSku = await ProductRepository.findOne({ sku: data.sku });
        if (existingSku) {
            throw new AppError(`SKU '${data.sku}' already exists`, HTTP_STATUS.CONFLICT, 'DUPLICATE_SKU');
        }

        // 5. Validate Variation SKU Uniqueness
        if (data.variations && data.variations.length > 0) {
            // Check for duplicate SKUs within variations
            const variationSkus = data.variations.map(v => v.sku);
            const uniqueSkus = new Set(variationSkus);
            if (variationSkus.length !== uniqueSkus.size) {
                throw new AppError('Duplicate SKUs found in variations', HTTP_STATUS.BAD_REQUEST, 'DUPLICATE_VARIATION_SKU');
            }

            // Check if any variation SKU already exists in database
            for (const varSku of variationSkus) {
                const existingVarSku = await ProductRepository.findOne({ 'variations.sku': varSku });
                if (existingVarSku) {
                    throw new AppError(`Variation SKU '${varSku}' already exists`, HTTP_STATUS.CONFLICT, 'DUPLICATE_VARIATION_SKU');
                }
            }

            // Calculate Total Quantity from Variations
            data.quantity = data.variations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        }

        // 6. Validate Images
        if (!data.images || data.images.length === 0) {
            throw new AppError('At least one product image is required', HTTP_STATUS.BAD_REQUEST, 'IMAGES_REQUIRED');
        }

        // 7. Validate Thumbnail
        if (!data.thumbnail || !data.thumbnail.url) {
            throw new AppError('Product thumbnail is required', HTTP_STATUS.BAD_REQUEST, 'THUMBNAIL_REQUIRED');
        }

        // 8. Validate Pricing
        if (data.discount > 0) {
            if (data.discountType === 'percent' && data.discount > 100) {
                throw new AppError('Discount percentage cannot exceed 100%', HTTP_STATUS.BAD_REQUEST, 'INVALID_DISCOUNT');
            }
            if (data.discountType === 'flat' && data.discount >= data.price) {
                throw new AppError('Flat discount cannot be equal to or greater than price', HTTP_STATUS.BAD_REQUEST, 'INVALID_DISCOUNT');
            }
        }

        // 9. Create Product
        const product = await ProductRepository.create(data);

        // 10. Invalidate Public List Cache
        await this.invalidateCache();

        return product;
    }

    async getVendorProducts(vendorId, query) {
        const filter = { vendor: vendorId, ...query.filter };
        return await ProductRepository.findAll(filter, query.sort, query.page, query.limit);
    }

    async getVendorProductStats(vendorId) {
        // Get product counts by status for vendor dashboard
        const [total, pending, approved, rejected, suspended, active, featured] = await Promise.all([
            ProductRepository.count({ vendor: vendorId }),
            ProductRepository.count({ vendor: vendorId, status: 'pending' }),
            ProductRepository.count({ vendor: vendorId, status: 'approved' }),
            ProductRepository.count({ vendor: vendorId, status: 'rejected' }),
            ProductRepository.count({ vendor: vendorId, status: 'suspended' }),
            ProductRepository.count({ vendor: vendorId, isActive: true }),
            ProductRepository.count({ vendor: vendorId, isFeatured: true }),
        ]);

        return {
            total,
            byStatus: {
                pending,
                approved,
                rejected,
                suspended
            },
            active,
            featured
        };
    }

    async getAllProducts(query) {
        // Public caching implemented in controller or route if needed, 
        // but usually simple lists are cached.
        // For filtered lists, we might not cache everything or use complex keys.
        // Here we just fetch.
        // Default filter: Approved AND Active AND Vendor Active
        const defaultFilter = {
            status: 'approved',
            isActive: true,
        };
        const filter = query.filter ? { ...defaultFilter, ...query.filter } : defaultFilter;

        return await ProductRepository.findAll(filter, query.sort, query.page, query.limit);
    }

    async searchProducts(searchQuery, limit = 20) {
        // Lightweight search for search bar autocomplete
        // Returns only essential fields for performance
        if (!searchQuery || searchQuery.trim().length < 2) {
            return [];
        }

        const filter = {
            status: 'approved',
            isActive: true,
            quantity: { $gt: 0 },
            search: searchQuery.trim()
        };

        // Use repository but limit fields returned
        const result = await ProductRepository.findAll(filter, { createdAt: -1 }, 1, limit);

        // Return lightweight data for search suggestions
        return result.products.map(p => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            discount: p.discount,
            discountType: p.discountType,
            thumbnail: p.thumbnail,
            slug: p.slug,
            category: p.category?.name,
            vendor: p.vendor?.businessName
        }));
    }

    async getProductById(id) {
        // Try Cache for individual product? 
        // Usually detailed view is high traffic.
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }
        return product;
    }

    async getPublicProductById(id) {
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }

        // Strict Filtering: Hide variations with 0 stock
        if (product.variations && product.variations.length > 0) {
            product.variations = product.variations.filter(v => v.stock > 0);
        }

        return product;
    }

    async getSimilarProducts(productId, limit = 10) {
        // Get the current product to extract search tags
        const currentProduct = await ProductRepository.findById(productId);
        if (!currentProduct) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }

        // If no search tags, return products from same category
        if (!currentProduct.searchTags || currentProduct.searchTags.length === 0) {
            const filter = {
                status: 'approved',
                isActive: true,
                quantity: { $gt: 0 },
                category: currentProduct.category._id || currentProduct.category,
                _id: { $ne: productId } // Exclude current product
            };
            const result = await ProductRepository.findAll(filter, { createdAt: -1 }, 1, limit);
            return result.products;
        }

        // Find products with matching search tags
        const filter = {
            status: 'approved',
            isActive: true,
            quantity: { $gt: 0 },
            searchTags: { $in: currentProduct.searchTags }, // Match any of the tags
            _id: { $ne: productId } // Exclude current product
        };

        const result = await ProductRepository.findAll(filter, { createdAt: -1 }, 1, limit);
        return result.products;
    }

    async updateProduct(id, data, vendorId) {
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }

        // Authorization Check
        if (product.vendor._id.toString() !== vendorId.toString()) {
            throw new AppError('Not authorized to update this product', HTTP_STATUS.FORBIDDEN, 'FORBIDDEN_ACCESS');
        }

        // Re-Approval Logic: If product is currently approved and vendor is making changes,
        // reset to pending status for Admin review
        const isContentUpdate = data.name || data.description || data.price || data.category ||
            data.subCategory || data.images || data.variations || data.discount;

        if (product.status === 'approved' && isContentUpdate) {
            data.status = 'pending';
            data.isActive = false; // Force hide until re-approved
            // Note: We don't touch isActive if vendor is ONLY toggling it without content changes
        }

        // Restriction: Vendor can ONLY toggle isActive if status is 'approved'
        // If they define isActive: true, we must check current status (or updated status)
        const finalStatus = data.status || product.status;
        if (data.isActive === true && finalStatus !== 'approved') {
            throw new AppError('Cannot activate product until it is approved by Admin', HTTP_STATUS.FORBIDDEN, 'PRODUCT_NOT_APPROVED');
        }

        // Validate Category if being updated
        if (data.category) {
            const category = await ProductCategoryRepository.findById(data.category);
            if (!category) {
                throw new AppError('Category not found', HTTP_STATUS.BAD_REQUEST, 'CATEGORY_NOT_FOUND');
            }
            if (category.status !== 'active') {
                throw new AppError('Category is not active', HTTP_STATUS.BAD_REQUEST, 'CATEGORY_INACTIVE');
            }
        }

        // Validate SubCategory if being updated
        if (data.subCategory) {
            const subCategory = await ProductSubCategoryRepository.findById(data.subCategory);
            if (!subCategory) {
                throw new AppError('SubCategory not found', HTTP_STATUS.BAD_REQUEST, 'SUBCATEGORY_NOT_FOUND');
            }
            // Verify subcategory belongs to selected category (use existing category if not being updated)
            const categoryId = data.category || product.category._id.toString();
            if (subCategory.category.toString() !== categoryId.toString()) {
                throw new AppError('SubCategory does not belong to selected category', HTTP_STATUS.BAD_REQUEST, 'SUBCATEGORY_MISMATCH');
            }
        }

        // Validate pricing if discount is being updated
        if (data.discount !== undefined && data.discount > 0) {
            const price = data.price || product.price;
            const discountType = data.discountType || product.discountType;

            if (discountType === 'percent' && data.discount > 100) {
                throw new AppError('Discount percentage cannot exceed 100%', HTTP_STATUS.BAD_REQUEST, 'INVALID_DISCOUNT');
            }
            if (discountType === 'flat' && data.discount >= price) {
                throw new AppError('Flat discount cannot be equal to or greater than price', HTTP_STATUS.BAD_REQUEST, 'INVALID_DISCOUNT');
            }
        }

        // Validate images if being updated
        if (data.images !== undefined && (!data.images || data.images.length === 0)) {
            throw new AppError('At least one product image is required', HTTP_STATUS.BAD_REQUEST, 'IMAGES_REQUIRED');
        }

        // Calculate Total Quantity from Variations (if updating variations)
        if (data.variations && data.variations.length > 0) {
            // Check for duplicate SKUs within variations
            const variationSkus = data.variations.map(v => v.sku);
            const uniqueSkus = new Set(variationSkus);
            if (variationSkus.length !== uniqueSkus.size) {
                throw new AppError('Duplicate SKUs found in variations', HTTP_STATUS.BAD_REQUEST, 'DUPLICATE_VARIATION_SKU');
            }

            // Check if any variation SKU already exists in other products
            for (const varSku of variationSkus) {
                const existingVarSku = await ProductRepository.findOne({
                    'variations.sku': varSku,
                    _id: { $ne: id } // Exclude current product
                });
                if (existingVarSku) {
                    throw new AppError(`Variation SKU '${varSku}' already exists`, HTTP_STATUS.CONFLICT, 'DUPLICATE_VARIATION_SKU');
                }
            }

            data.quantity = data.variations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        }

        const updated = await ProductRepository.update(id, data);
        await this.invalidateCache();
        return updated;
    }

    // --- Admin Methods ---

    async adminUpdateProductStatus(id, status, reason) {
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }

        const updateData = { status };

        // If Rejected, set reason and force inactive
        if (status === 'rejected') {
            if (!reason) throw new AppError('Rejection reason is required', HTTP_STATUS.BAD_REQUEST, 'REASON_REQUIRED');
            updateData.rejectionReason = reason;
            updateData.isActive = false; // Force hide
        }

        // If Approved, we can clear rejection reason (optional, but good practice)
        if (status === 'approved') {
            updateData.rejectionReason = ''; // Clear previous reason
            // Admin can optionally set isActive via separate update, or frontend sends it.
            // Usually approval doesn't auto-activate unless requested, to let vendor decide launch timing.
        }

        const updated = await ProductRepository.update(id, updateData);
        await this.invalidateCache();
        return updated;
    }

    async adminUpdateProduct(id, data) {
        // Admin bypasses vendor checks
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }

        // Recalculate stock if variations touched
        if (data.variations && data.variations.length > 0) {
            data.quantity = data.variations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        }

        const updated = await ProductRepository.update(id, data);
        await this.invalidateCache();
        return updated;
    }

    async adminGetAllProducts(query) {
        // Admin sees ALL products, no default filters applied unless specified
        const filter = query.filter || {};
        return await ProductRepository.findAll(filter, query.sort, query.page, query.limit);
    }

    async adminGetProductById(id) {
        // Admin sees raw product data including rejection reasons etc.
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }
        return product;
    }

    async getAdminProductStats() {
        // Get comprehensive product statistics for admin dashboard
        const [total, pending, approved, rejected, suspended, active, featured, outOfStock] = await Promise.all([
            ProductRepository.count({}),
            ProductRepository.count({ status: 'pending' }),
            ProductRepository.count({ status: 'approved' }),
            ProductRepository.count({ status: 'rejected' }),
            ProductRepository.count({ status: 'suspended' }),
            ProductRepository.count({ isActive: true }),
            ProductRepository.count({ isFeatured: true }),
            ProductRepository.count({ quantity: 0 }),
        ]);

        return {
            total,
            byStatus: {
                pending, // New product requests
                approved,
                rejected,
                suspended
            },
            active,
            featured,
            outOfStock,
            inStock: total - outOfStock
        };
    }

    async adminDeleteProduct(id) {
        // Admin can delete any product without authorization checks
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }

        // TODO: cleanup images from Cloudinary

        await ProductRepository.delete(id);
        await this.invalidateCache();
        return true;
    }

    async adminToggleFeatured(id, isFeatured) {
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }

        const updated = await ProductRepository.update(id, { isFeatured });
        await this.invalidateCache();
        return updated;
    }

    async getFeaturedProducts(limit = 10) {
        // Public API: Get featured products (approved, active, vendor active)
        const filter = {
            status: 'approved',
            isActive: true,
            isFeatured: true,
            quantity: { $gt: 0 }
        };

        const result = await ProductRepository.findAll(filter, { createdAt: -1 }, 1, limit);
        return result.products;
    }

    async deleteProduct(id, vendorId) {
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, 'PRODUCT_NOT_FOUND');
        }

        // Authorization Check
        if (product.vendor._id.toString() !== vendorId.toString()) {
            throw new AppError('Not authorized to delete this product', HTTP_STATUS.FORBIDDEN, 'FORBIDDEN_ACCESS');
        }

        // TODO: cleanup images from Cloudinary

        await ProductRepository.delete(id);
        await this.invalidateCache();
        return true;
    }

    async invalidateCache() {
        await Cache.delByPattern(`${PRODUCT_CACHE_KEY}*`);
        await Cache.delByPattern('response:/api/v1/products*');
    }

    // --- Export Methods ---

    async exportVendorProducts(vendorId, filter = {}) {
        // Get all vendor products without pagination for export
        filter.vendor = vendorId;
        const result = await ProductRepository.findAll(filter, { createdAt: -1 }, 1, 10000);
        return result.products;
    }

    async exportAdminProducts(filter = {}) {
        // Get all products without pagination for export
        const result = await ProductRepository.findAll(filter, { createdAt: -1 }, 1, 10000);
        return result.products;
    }
}

export default new ProductService();
