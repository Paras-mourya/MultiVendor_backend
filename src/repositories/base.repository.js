class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        return await this.model.create(data);
    }

    async findAll(filter = {}, sort = { createdAt: -1 }, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter)
        ]);

        return {
            products: items, // Using 'products' as key for consistency with existing APIs if needed, or generic 'items'
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findById(id) {
        return await this.model.findById(id).lean();
    }

    async findOne(filter) {
        return await this.model.findOne(filter).lean();
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        }).lean();
    }

    async delete(id) {
        return await this.model.findByIdAndDelete(id);
    }

    async exists(filter) {
        return await this.model.exists(filter);
    }

    async count(filter) {
        return await this.model.countDocuments(filter);
    }
}

export default BaseRepository;
