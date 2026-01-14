import express from "express";
import { 
    addToWishlistController, 
    removeFromWishlistController,
    getWishlistController,
    checkWishlistItemController,
    clearWishlistController
} from "../controllers/wishlist.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all wishlist routes
router.use(auth);

// Routes for wishlist operations
router.post("/add", addToWishlistController);
router.post("/remove", removeFromWishlistController);
router.get("/get", getWishlistController);
router.get("/check/:productId", checkWishlistItemController);
router.delete("/clear", clearWishlistController);

export default router;
