import DealOfTheDayService from '../services/dealOfTheDay.service.js';
import ApiResponse from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants.js';

class AdminDealOfTheDayController {
    createDeal = async (req, res) => {
        const result = await DealOfTheDayService.createDeal(req.body);
        return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, result, 'Deal created successfully'));
    };

    getDeals = async (req, res) => {
        const result = await DealOfTheDayService.getAllDeals(req.query);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Deals fetched successfully'));
    };

    getDeal = async (req, res) => {
        const result = await DealOfTheDayService.getDealById(req.params.id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Deal fetched successfully'));
    };

    updateDeal = async (req, res) => {
        const result = await DealOfTheDayService.updateDeal(req.params.id, req.body);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Deal updated successfully'));
    };

    deleteDeal = async (req, res) => {
        await DealOfTheDayService.deleteDeal(req.params.id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Deal deleted successfully'));
    };

    togglePublish = async (req, res) => {
        const result = await DealOfTheDayService.togglePublishStatus(req.params.id, req.body.isPublished);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, `Deal ${req.body.isPublished ? 'published' : 'unpublished'} successfully`));
    };

    addProducts = async (req, res) => {
        const result = await DealOfTheDayService.addProductsToDeal(req.params.id, req.body.products);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Products added to deal successfully'));
    };

    removeProduct = async (req, res) => {
        const result = await DealOfTheDayService.removeProductFromDeal(req.params.id, req.params.productId);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Product removed from deal successfully'));
    };

    toggleProductStatus = async (req, res) => {
        const { id, productId } = req.params;
        const { isActive } = req.body;
        const result = await DealOfTheDayService.toggleProductStatus(id, productId, isActive);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Product status updated in deal'));
    };
}

export default new AdminDealOfTheDayController();
