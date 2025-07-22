import express from 'express';
import { getSizes, updateSizes, getSizeChart } from '../controllers/sizeConfig.controller.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';

const router = express.Router();

// Get available sizes
router.get('/sizes', getSizes);

// Get detailed size chart information
router.get('/size-chart', getSizeChart);

// Update available sizes (admin only)
router.put('/sizes', auth, admin, updateSizes);

export default router;
