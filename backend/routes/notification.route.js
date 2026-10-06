import express from "express";
import { getInventoryNotifications } from "../controllers/notification.controller.js";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";



const notification = express.Router();

// Get low-stock & out-of-stock notifications
notification.get(
  "/",
  protect,
  ownerOnly,
  getInventoryNotifications
);

export default notification;