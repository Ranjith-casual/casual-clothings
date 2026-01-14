import { Router } from "express";
import auth from "../middleware/auth.js";
import { admin } from "../middleware/Admin.js";
import {
    createBundleController,
    getBundlesController,
    getBundleByIdController,
    updateBundleController,
    deleteBundleController,
    toggleBundleStatusController,
    getFeaturedBundlesController,
    getBundleStatsController,
    decrementBundleStockController
} from "../controllers/bundle.controller.js";

const bundleRouter = Router();

// Public routes
bundleRouter.get("/", getBundlesController);
bundleRouter.get("/featured", getFeaturedBundlesController);
bundleRouter.get("/:bundleId", getBundleByIdController);

// Protected routes
bundleRouter.post("/decrement-stock", auth, decrementBundleStockController);

// Admin routes
bundleRouter.post("/create", auth, admin, createBundleController);
bundleRouter.put("/update/:bundleId", auth, admin, updateBundleController);
bundleRouter.delete("/delete/:bundleId", auth, admin, deleteBundleController);
bundleRouter.patch("/toggle-status/:bundleId", auth, admin, toggleBundleStatusController);
bundleRouter.get("/admin/stats", auth, admin, getBundleStatsController);

export default bundleRouter;
