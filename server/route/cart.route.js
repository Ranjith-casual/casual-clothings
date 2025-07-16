import {Router} from "express";
import auth from "../middleware/auth.js";
import { 
    addToCartItemController,
    deleteCartItemQtyController, 
    getCartItemController, 
    updateCartItemQtyController, 
    addBundleToCartController,
    validateCartItemsController
} from "../controllers/cart.controller.js";
import { get } from "mongoose";

const cartRouter = Router();

cartRouter.post("/create",auth,addToCartItemController);
cartRouter.post("/add-bundle",auth,addBundleToCartController);
cartRouter.get("/get",auth,getCartItemController);
cartRouter.put('/update-qty',auth,updateCartItemQtyController);
cartRouter.delete('/delete-cart-item',auth,deleteCartItemQtyController);
cartRouter.post('/validate',auth,validateCartItemsController);

export default cartRouter;