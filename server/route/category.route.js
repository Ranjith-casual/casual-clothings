import {Router} from 'express';

import {AddCategoryController,getCategoryController,updateCategoryController,deleteCategoryController} from '../controllers/category.controller.js';
import auth from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js'
const categoryRouter = Router();    
categoryRouter.post('/add-category',auth,AddCategoryController);
categoryRouter.get('/get',getCategoryController);

categoryRouter.put('/update',auth,updateCategoryController)
categoryRouter.delete('/delete',auth,deleteCategoryController)
export default categoryRouter;