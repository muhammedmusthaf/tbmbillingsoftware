
import User from "../models/User.model.js";
import { sendPushNotification } from "./pushNotification.service.js";

export const sendOwnerPushNotification = async ({
  title,
  body,
  data = {},
}) => {
  try {
    // Find active owner accounts only
    const owners = await User.find({
      role: "owner",
      isActive: true,
    }).select("_id");

    if (!owners.length) {
      console.log("No active owner accounts found.");
      return;
    }

    // Send to every registered Android device belonging to an owner
    const results = await Promise.all(
      owners.map((owner) =>
        sendPushNotification(owner._id, {
          title,
          body,
          data,
        })
      )
    );

    return results;
  } catch (error) {
    console.error("OWNER PUSH NOTIFICATION ERROR:", error);
  }
};
