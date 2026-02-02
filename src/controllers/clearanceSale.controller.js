import ClearanceSaleService from '../services/clearanceSale.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants.js';
import ApiResponse from '../utils/apiResponse.js';

class ClearanceSaleController {

    upsertConfig = async (req, res) => {
        // Handle file upload for metaImage if present
        if (req.file) {
            // Assume middleware handled upload to cloud/disk and gave path.
            // But usually we use a separate upload util. 
            // If using standard upload middleware (like in product), req.file.path or location is available.
            // Let's assume common flow: body contains string URL or we process req.file here?
            // "meta steup bhio daalega meta title meta description meta image"
            // Let's assume for now the image is uploaded separately or handled by generic upload middleware.
            // If req.file is present from upload middleware:
            // req.body.metaImage = req.file.path; 
        }

        const config = await ClearanceSaleService.upsertSaleConfig(req.body, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, 'Clearance sale configuration saved'));
    };

    getConfig = async (req, res) => {
        const config = await ClearanceSaleService.getSaleConfig(req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, SUCCESS_MESSAGES.FETCHED));
    };

    toggleStatus = async (req, res) => {
        const { isActive } = req.body;
        const config = await ClearanceSaleService.toggleStatus(isActive, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, 'Clearance sale status updated'));
    };

    addProducts = async (req, res) => {
        const { productIds } = req.body; // Expect array
        const result = await ClearanceSaleService.addProducts(productIds, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Products added to clearance sale'));
    };

    removeProduct = async (req, res) => {
        const { productId } = req.params;
        const result = await ClearanceSaleService.removeProduct(productId, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Product removed from clearance sale'));
    };

    toggleProductStatus = async (req, res) => {
        const { productId } = req.params;
        const { isActive } = req.body;
        const config = await ClearanceSaleService.toggleProductStatus(productId, isActive, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, config, 'Product sale status updated'));
    };

    getPublicSales = async (req, res) => {
        const limit = parseInt(req.query.limit) || 12;
        const sales = await ClearanceSaleService.getPublicSales(limit);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, sales, SUCCESS_MESSAGES.FETCHED));
    };
}

export default new ClearanceSaleController();
