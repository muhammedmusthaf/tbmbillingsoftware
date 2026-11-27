
import Product from "../models/Product.model.js";
import Setting from "../models/Setting.model.js";
import Notification from "../models/Notification.model.js";
import { sendOwnerPushNotification } from "../services/ownerPush.service.js";

const checkstocknotification = async (productId) => {
  try {
    const settings = await Setting.findOne();

    if (settings?.lowStockNotification === false) {
      return;
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return;
    }

    let type = null;
    let title = "";
    let message = "";
    let priority = "medium";

    if (product.stock <= 0) {
      type = "out_of_stock";
      title = "Out of Stock";
      message = `${product.name} is completely out of stock.`;
      priority = "high";
    } else if (product.stock <= product.minimumStock) {
      type = "low_stock";
      title = "Low Stock Alert";
      message = `${product.name} has only ${product.stock} ${product.unit} remaining.`;
      priority = "medium";
    }

    // Resolve previous stock alerts when stock is sufficient
    if (!type) {
      await Notification.updateMany(
        {
          relatedId: product._id,
          type: { $in: ["low_stock", "out_of_stock"] },
          isRead: false,
        },
        {
          $set: { isRead: true },
        }
      );

      return;
    }

    // Check whether the same alert already exists
    const existingNotification = await Notification.findOne({
      relatedId: product._id,
      type,
      isRead: false,
    });

    if (existingNotification) {
      return;
    }

    // Resolve previous different stock alert
    await Notification.updateMany(
      {
        relatedId: product._id,
        type: { $in: ["low_stock", "out_of_stock"] },
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    // Save notification in MongoDB
    const notification = await Notification.create({
      type,
      title,
      message,
      priority,
      relatedId: product._id,
      relatedModel: "Product",
    });

    // Send push notification to Owner only
    await sendOwnerPushNotification({
      title,
      body: message,
      data: {
        type,
        notificationId: notification._id.toString(),
        relatedId: product._id.toString(),
      },
    });

  } catch (error) {
    console.error("STOCK NOTIFICATION ERROR:", error);
  }
};

export default checkstocknotification;
