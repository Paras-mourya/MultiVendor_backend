import Product from '../models/product.model.js';

class ProductRepository {
  async create(data) {
    return await Product.create(data);
  }

  async findAll(filter = {}, sort = { createdAt: -1 }, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    // Support Text Search if 'search' is in filter
    if (filter.search) {
        filter.$text = { $search: filter.search };
        delete filter.search;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('subCategory', 'name')
        .populate('vendor', 'businessName businessAddress status') // Include vendor status
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Filter out products from blocked/inactive vendors (for public queries)
    // This is done in application layer since we can't do complex joins in MongoDB
    const filteredProducts = products.filter(product => {
      // If vendor is populated and has status, check if active
      if (product.vendor && product.vendor.status) {
        return product.vendor.status === 'active';
      }
      // If vendor not populated or no status field, include it (admin/vendor views)
      return true;
    });

    return {
      products: filteredProducts,
      pagination: {
        total: filteredProducts.length, // Adjusted total after filtering
        page,
        limit,
        pages: Math.ceil(filteredProducts.length / limit)
      }
    };
  }

  async findById(id) {
    return await Product.findById(id)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('vendor', 'firstName lastName businessName businessAddress businessLogo email phoneNumber') // Full vendor details
      .populate('attributes.attribute', 'name')
      .lean();
  }

  async findOne(filter) {
      return await Product.findOne(filter).lean();
  }

  async update(id, data) {
    return await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return await Product.countDocuments(filter);
  }

  async updateStatus(id, status) {
    return await Product.findByIdAndUpdate(id, { status }, { new: true }).lean();
  }
}

export default new ProductRepository();
