import DealOfTheDayService from '../services/dealOfTheDay.service.js';
import ApiResponse from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants.js';

class DealOfTheDayController {
    getActiveDeals = async (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        const result = await DealOfTheDayService.getActiveDeals(limit);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Active deals fetched successfully'));
    };

    getDeal = async (req, res) => {
        const result = await DealOfTheDayService.getPublicDealById(req.params.id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Deal fetched successfully'));
    };
}

export default new DealOfTheDayController();
