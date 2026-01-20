import BlogCategoryService from '../services/blogCategory.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants.js';
import { ApiResponse } from '../utils/apiResponse.js';

class BlogCategoryController {
  createCategory = async (req, res) => {
    const category = await BlogCategoryService.createCategory(req.body);
    return res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse(HTTP_STATUS.CREATED, category, 'Blog category created successfully')
    );
  };

  getAllCategories = async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const categories = await BlogCategoryService.getAllCategories(filter);
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, categories, SUCCESS_MESSAGES.FETCHED)
    );
  };

  getCategoryById = async (req, res) => {
    const category = await BlogCategoryService.getCategoryById(req.params.id);
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, category, SUCCESS_MESSAGES.FETCHED)
    );
  };

  updateCategory = async (req, res) => {
    const category = await BlogCategoryService.updateCategory(req.params.id, req.body);
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, category, SUCCESS_MESSAGES.UPDATED)
    );
  };

  deleteCategory = async (req, res) => {
    await BlogCategoryService.deleteCategory(req.params.id);
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, null, 'Blog category deleted successfully')
    );
  };

  toggleStatus = async (req, res) => {
    const category = await BlogCategoryService.toggleStatus(req.params.id);
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, category, `Blog category status changed to ${category.status}`)
    );
  };
}

export default new BlogCategoryController();
