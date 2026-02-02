import CouponService from '../services/coupon.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants.js';
import ApiResponse from '../utils/apiResponse.js';
import { convertToCSV, couponCSVHeaders } from '../utils/csvExport.js';

class CouponController {
    createCoupon = async (req, res) => {
        const coupon = await CouponService.createCoupon(req.body, req.vendor._id);
        return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, coupon, SUCCESS_MESSAGES.CREATED));
    };

    getVendorCoupons = async (req, res) => {
        const result = await CouponService.getVendorCoupons(req.vendor._id, req.query);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, SUCCESS_MESSAGES.FETCHED));
    };

    getCouponById = async (req, res) => {
        const coupon = await CouponService.getCouponById(req.params.id, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, coupon, SUCCESS_MESSAGES.FETCHED));
    };

    updateCoupon = async (req, res) => {
        const coupon = await CouponService.updateCoupon(req.params.id, req.body, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, coupon, SUCCESS_MESSAGES.UPDATED));
    };

    updateStatus = async (req, res) => {
        const { isActive } = req.body;
        const coupon = await CouponService.toggleStatus(req.params.id, isActive, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, coupon, 'Coupon status updated successfully'));
    };

    deleteCoupon = async (req, res) => {
        await CouponService.deleteCoupon(req.params.id, req.vendor._id);
        return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, SUCCESS_MESSAGES.DELETED));
    };

    exportVendorCoupons = async (req, res) => {
        const coupons = await CouponService.exportVendorCoupons(req.vendor._id);
        const csv = convertToCSV(coupons, couponCSVHeaders);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="coupons-${Date.now()}.csv"`);
        return res.send(csv);
    };
}

export default new CouponController();
