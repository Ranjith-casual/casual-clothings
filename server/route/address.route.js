import e from 'express';
import Router from 'express';
import auth from '../middleware/auth.js';
import { addAddressController, deleteAddressController, editAddressController, getAddressController } from '../controllers/address.controller.js';

const addressRouter = Router();

addressRouter.post('/create',auth,addAddressController)
addressRouter.get("/get",auth,getAddressController)
addressRouter.put("/edit",auth,editAddressController) // Assuming you have an edit controller
addressRouter.delete("/delete",auth,deleteAddressController) // Assuming you have a delete controller


export default addressRouter;