import Notification from "../models/Notification.model.js";

const createNotification = async ({
  type,
  title,
  message,
  priority = "medium",
  relatedId = null,
  relatedModel = null,
}) => {
  try {
    const notification = await Notification.create({
      type,
      title,
      message,
      priority,
      relatedId,
      relatedModel,
    });

    return notification;
  } catch (error) {
    console.error("Notification creation failed:", error);
    return null;
  }
};

export default createNotification;