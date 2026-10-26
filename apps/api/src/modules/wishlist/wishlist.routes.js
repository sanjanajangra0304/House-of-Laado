import { Router } from "express";
import * as wishlistController from "./wishlist.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// All wishlist routes require customer authentication
router.get("/", authenticate, wishlistController.getWishlist);
router.post("/toggle", authenticate, wishlistController.toggleProduct);
router.post("/sync", authenticate, wishlistController.syncWishlist);

export default router;
