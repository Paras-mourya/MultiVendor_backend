import ClearanceSaleService from '../services/clearanceSale.service.js';
import ApiResponse from '../utils/apiResponse.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants.js';

class AdminClearanceSaleController {
    getConfig = async (req, res) => {
        const config = await ClearanceSaleService.getAdminSaleConfig();
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, SUCCESS_MESSAGES.FETCHED));
    };

    upsertConfig = async (req, res) => {
        const config = await ClearanceSaleService.upsertAdminSaleConfig(req.body);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, SUCCESS_MESSAGES.UPDATED));
    };

    toggleStatus = async (req, res) => {
        const { isActive } = req.body;
        const config = await ClearanceSaleService.toggleAdminStatus(isActive);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, 'Clearance sale status updated'));
    };

    addProducts = async (req, res) => {
        const { productIds } = req.body;
        const config = await ClearanceSaleService.addAdminProducts(productIds);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, 'Products added to clearance sale'));
    };

    removeProduct = async (req, res) => {
        const { productId } = req.params;
        const result = await ClearanceSaleService.removeAdminProduct(productId);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Product removed from clearance sale'));
    };

    toggleProductStatus = async (req, res) => {
        const { productId } = req.params;
        const { isActive } = req.body;
        const config = await ClearanceSaleService.toggleAdminProductStatus(productId, isActive);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, 'Product sale status updated'));
    };
}

export default new AdminClearanceSaleController();
