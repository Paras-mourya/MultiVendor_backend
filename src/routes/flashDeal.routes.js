import express from 'express';
import FlashDealService from '../services/flashDeal.service.js';
import ApiResponse from '../utils/apiResponse.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants.js';

const router = express.Router();

router.get('/active', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const deals = await FlashDealService.getActiveFlashDeals(limit);
    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, deals, SUCCESS_MESSAGES.FETCHED));
});

export default router;
