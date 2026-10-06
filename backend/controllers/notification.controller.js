import Product from "../models/Product.model.js";
import Setting from "../models/Setting.model.js";

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