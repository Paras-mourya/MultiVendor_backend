import ProductCategoryService from '../services/productCategory.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants.js';
import { ApiResponse } from '../utils/apiResponse.js';
import AppError from '../utils/AppError.js';
import Cache from '../utils/cache.js';

// Wipe all cached responses for the public category listing endpoint
const invalidateCategoryCache = () => Cache.delByPattern('response:*product-categories*');

class ProductCategoryController {
  createCategory = async (req, res) => {
    const category = await ProductCategoryService.createCategory(req.body, req.file);
    await invalidateCategoryCache();
    return res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse(HTTP_STATUS.CREATED, category, 'Category created successfully')
    );
  };

  getAllCategories = async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const categories = await ProductCategoryService.getAllCategories(filter);
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, categories, SUCCESS_MESSAGES.FETCHED)
    );
  };

  updateCategory = async (req, res) => {
    const category = await ProductCategoryService.updateCategory(req.params.id, req.body, req.file);
    await invalidateCategoryCache();
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, category, SUCCESS_MESSAGES.UPDATED)
    );
  };

  deleteCategory = async (req, res) => {
    await ProductCategoryService.deleteCategory(req.params.id);
    await invalidateCategoryCache();
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, null, 'Category and related subcategories deleted successfully')
    );
  };

  toggleStatus = async (req, res) => {
    const category = await ProductCategoryService.updateCategory(req.params.id, {
      status: req.body.status
    });
    await invalidateCategoryCache();
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, category, `Category status changed to ${category.status}`)
    );
  };
}

export default new ProductCategoryController();
