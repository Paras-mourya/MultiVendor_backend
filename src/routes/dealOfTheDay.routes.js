import express from 'express';
import DealOfTheDayController from '../controllers/dealOfTheDay.controller.js';

const router = express.Router();

router.get('/active', DealOfTheDayController.getActiveDeals);
router.get('/:id', DealOfTheDayController.getDeal);

export default router;
