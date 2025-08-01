import { Router } from 'express';
import { 
    getIndianStates, 
    getDistrictsByState, 
    getAllStatesWithDistricts,
    searchDistricts 
} from '../controllers/indianLocation.controller.js';

const indianLocationRouter = Router();

// Get all Indian states
indianLocationRouter.get('/states', getIndianStates);

// Get districts for a specific state
indianLocationRouter.get('/states/:stateName/districts', getDistrictsByState);

// Get all states with their districts
indianLocationRouter.get('/all', getAllStatesWithDistricts);

// Search districts across all states
indianLocationRouter.get('/search', searchDistricts);

export default indianLocationRouter;
