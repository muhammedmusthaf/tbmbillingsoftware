
import express from "express";
import DeviceToken from "../models/DeviceToken.model.js";
import { protect } from "../middleware/auth.middleware.js";
import { sendPushNotification } from "../services/pushNotification.service.js";

const device = express.Router();

// Register or update Android device token
device.post("/register", protect, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        message: "Valid FCM token is required",
      });
    }

    const deviceToken = await DeviceToken.findOneAndUpdate(
      { token: token.trim() },
      {
        $set: {
          user: req.user._id,
          token: token.trim(),
          platform: "android",
          lastSeenAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Device registered successfully",
    });
  } catch (error) {
    console.error("Device registration error:", error);
    return res.status(500).json({
      message: "Failed to register device",
    });
  }
});

// Remove this device token during logout
device.delete("/unregister", protect, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "FCM token is required",
      });
    }

    await DeviceToken.deleteOne({
      token: token.trim(),
      user: req.user._id,
    });

    return res.status(200).json({
      message: "Device unregistered successfully",
    });
  } catch (error) {
    console.error("Device unregistration error:", error);
    return res.status(500).json({
      message: "Failed to unregister device",
    });
  }
});
// TEST PUSH NOTIFICATION
device.post("/test", protect, async (req, res) => {
  try {
    const result = await sendPushNotification(req.user._id, {
      title: "TBM Build Mart",
      body: "Your Android push notification system is working successfully! 🎉",
      data: {
        type: "test",
      },
    });

    if (result.successCount === 0) {
      return res.status(400).json({
        message: "No push notification was delivered. Check Render logs and registered device tokens.",
        ...result,
      });
    }

    return res.status(200).json({
      message: "Test push notification sent successfully!",
      ...result,
    });
  } catch (error) {
    console.error("Test push notification error:", error);

    return res.status(500).json({
      message: "Failed to send test notification",
    });
  }
});

export default device;
