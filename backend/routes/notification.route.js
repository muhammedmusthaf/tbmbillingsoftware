
import express from "express";



import {
  ownerOnly,
  protect,
} from "../middleware/auth.middleware.js";
import { getInventoryNotifications, getSavedNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notification.controller.js";

const notification = express.Router();

notification.use(protect, ownerOnly);

// Existing live inventory notifications
notification.get("/", getInventoryNotifications);

// Saved notification history
notification.get("/history", getSavedNotifications);

// Mark one notification as read
notification.patch("/:id/read", markNotificationRead);

// Mark all notifications as read
notification.patch("/read-all", markAllNotificationsRead);

export default notification;
