
import DeviceToken from "../models/DeviceToken.model.js";
import { firebaseMessaging } from "../config/firebase.js";

const INVALID_TOKEN_ERRORS = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export const sendPushNotification = async (
  userId,
  { title, body, data = {} }
) => {
  try {
    if (!firebaseMessaging) {
      console.warn("Firebase is not configured. Push notification skipped.");
      return { successCount: 0, failureCount: 0 };
    }

    const devices = await DeviceToken.find({ user: userId })
      .select("_id token");

    if (!devices.length) {
      console.log("No registered devices for user:", userId);
      return { successCount: 0, failureCount: 0 };
    }

    let successCount = 0;
    let failureCount = 0;
    const invalidDeviceIds = [];

    // FCM supports up to 500 tokens per multicast request.
    for (let i = 0; i < devices.length; i += 500) {
      const batch = devices.slice(i, i + 500);

      const response = await firebaseMessaging.sendEachForMulticast({
        tokens: batch.map((device) => device.token),

        notification: {
          title,
          body,
        },

        data: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            String(value),
          ])
        ),

        android: {
          priority: "high",
          notification: {
            channelId: "default",
          },
        },
      });

      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((result, index) => {
        if (
          !result.success &&
          INVALID_TOKEN_ERRORS.has(result.error?.code)
        ) {
          invalidDeviceIds.push(batch[index]._id);
        } else if (!result.success) {
          console.error("FCM send failed:", result.error?.code);
        }
      });
    }

    if (invalidDeviceIds.length) {
      await DeviceToken.deleteMany({
        _id: { $in: invalidDeviceIds },
      });
    }

    console.log(
      `Push notification: ${successCount} sent, ${failureCount} failed`
    );

    return { successCount, failureCount };
  } catch (error) {
    console.error("Push notification service error:", error);
    return { successCount: 0, failureCount: 0 };
  }
};
