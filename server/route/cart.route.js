import {Router} from "express";
import auth from "../middleware/auth.js";
import { 
    addToCartItemController,
    deleteCartItemQtyController, 
    getCartItemController, 
    updateCartItemQtyController, 
    addBundleToCartController,
    validateCartItemsController,
    batchRemoveCartItemsController,
    cleanCartController
} from "../controllers/cart.controller.js";

const cartRouter = Router();

cartRouter.post("/create",auth,addToCartItemController);
cartRouter.post("/add-bundle",auth,addBundleToCartController);
cartRouter.get("/get",auth,getCartItemController);
cartRouter.put('/update-qty',auth,updateCartItemQtyController);
cartRouter.delete('/delete-cart-item',auth,deleteCartItemQtyController);
cartRouter.post('/validate',auth,validateCartItemsController);
cartRouter.post('/batch-remove',auth,batchRemoveCartItemsController);
cartRouter.post('/clean',auth,cleanCartController);

export default cartRouter;