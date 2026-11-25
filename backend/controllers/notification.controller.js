import Notification from "../models/Notification.model.js";
import Product from "../models/Product.model.js";
import Setting from "../models/Setting.model.js";
import checkCreditDueNotifications from "../utils/checkCreditDueNotifications.js";

// ==========================================
// GET INVENTORY NOTIFICATIONS
// ==========================================
export const getInventoryNotifications = async (
  req,
  res
) => {
  try {
    // -----------------------------------
    // CHECK NOTIFICATION SETTING
    // -----------------------------------

    const settings = await Setting.findOne();

    if (
      settings &&
      settings.lowStockNotification === false
    ) {
      return res.status(200).json({
        enabled: false,
        count: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        notifications: [],
      });
    }

    // -----------------------------------
    // GET ACTIVE PRODUCTS
    // -----------------------------------

    const products = await Product.find({
      isActive: true,
    }).select(
      "name productCode category brand stock minimumStock unit"
    );

    const notifications = [];

    let lowStockCount = 0;
    let outOfStockCount = 0;

    // -----------------------------------
    // GENERATE NOTIFICATIONS
    // -----------------------------------

    for (const product of products) {
      // OUT OF STOCK
      if (product.stock <= 0) {
        outOfStockCount++;

        notifications.push({
          type: "out_of_stock",

          priority: "high",

          title: "Out of Stock",

          message: `${product.name} is out of stock`,

          product: {
            _id: product._id,
            name: product.name,
            productCode:
              product.productCode,
            category:
              product.category,
            brand:
              product.brand,
            stock:
              product.stock,
            minimumStock:
              product.minimumStock,
            unit:
              product.unit,
          },
        });

        continue;
      }

      // LOW STOCK
      if (
        product.stock <=
        product.minimumStock
      ) {
        lowStockCount++;

        notifications.push({
          type: "low_stock",

          priority: "medium",

          title: "Low Stock",

          message:
            `${product.name} has only ` +
            `${product.stock} ${product.unit} remaining`,

          product: {
            _id: product._id,
            name: product.name,
            productCode:
              product.productCode,
            category:
              product.category,
            brand:
              product.brand,
            stock:
              product.stock,
            minimumStock:
              product.minimumStock,
            unit:
              product.unit,
          },
        });
      }
    }

    // -----------------------------------
    // SORT
    // Out of stock first,
    // then lowest stock
    // -----------------------------------

    notifications.sort((a, b) => {
      if (
        a.type === "out_of_stock" &&
        b.type !== "out_of_stock"
      ) {
        return -1;
      }

      if (
        b.type === "out_of_stock" &&
        a.type !== "out_of_stock"
      ) {
        return 1;
      }

      return (
        a.product.stock -
        b.product.stock
      );
    });

    // -----------------------------------
    // RESPONSE
    // -----------------------------------

    res.status(200).json({
      enabled: true,

      count:
        notifications.length,

      lowStockCount,

      outOfStockCount,

      notifications,
    });
  } catch (error) {
    console.error(
      "NOTIFICATION ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// GET SAVED NOTIFICATIONS
// ==========================================
export const getSavedNotifications = async (req, res) => {
  try {
    await checkCreditDueNotifications();
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// MARK SINGLE NOTIFICATION AS READ
// ==========================================
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("MARK NOTIFICATION ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
