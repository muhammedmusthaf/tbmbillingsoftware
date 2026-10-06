import Product from "../models/Product.model.js";
import StockTransaction from "../models/StockTransaction.model.js";



// STOCK IN
export const stockIn = async (req, res) => {
  try {
    const {
      supplier,
      purchaseInvoiceNumber,
      transactionDate,
      items,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one product is required",
      });
    }

    const transactionItems = [];
    let totalPurchaseAmount = 0;

    for (const item of items) {
      const {
        productId,
        quantity,
        purchasePrice,
        sellingPrice,
        gst,
      } = item;

      if (!productId || !quantity || purchasePrice === undefined) {
        return res.status(400).json({
          message: "Product, quantity and purchase price are required",
        });
      }

      if (Number(quantity) <= 0) {
        return res.status(400).json({
          message: "Quantity must be greater than 0",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${productId}`,
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          message: `${product.name} is inactive`,
        });
      }

      const previousStock = product.stock;

      const newStock =
        Number(previousStock) + Number(quantity);

      // Update current product stock
      product.stock = newStock;

      // Update latest purchase price
      product.purchasePrice = Number(purchasePrice);

      // Update selling price if provided
      if (sellingPrice !== undefined) {
        product.sellingPrice = Number(sellingPrice);
      }

      // Update GST if provided
      if (gst !== undefined) {
        product.gst = Number(gst);
      }

      await product.save();

      const itemTotal =
        Number(quantity) * Number(purchasePrice);

      totalPurchaseAmount += itemTotal;

      transactionItems.push({
        product: product._id,
        quantity: Number(quantity),
        purchasePrice: Number(purchasePrice),
        sellingPrice:
          sellingPrice !== undefined
            ? Number(sellingPrice)
            : product.sellingPrice,
        gst:
          gst !== undefined
            ? Number(gst)
            : product.gst,
        previousStock,
        newStock,
      });
    }

    const transaction = await StockTransaction.create({
      type: "stock_in",
      supplier: supplier || "",
      purchaseInvoiceNumber: purchaseInvoiceNumber || "",
      transactionDate: transactionDate || new Date(),
      items: transactionItems,
      totalPurchaseAmount,
      notes: notes || "",
      createdBy: req.user._id,
    });

    const populatedTransaction =
      await StockTransaction.findById(transaction._id)
        .populate(
          "items.product",
          "name productCode category brand unit"
        )
        .populate(
          "createdBy",
          "name username role"
        );

    res.status(201).json({
      message: "Stock added successfully",
      transaction: populatedTransaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET STOCK TRANSACTION HISTORY
export const getStockHistory = async (req, res) => {
  try {
    const transactions = await StockTransaction.find()
      .populate(
        "items.product",
        "name productCode category brand unit"
      )
      .populate(
        "createdBy",
        "name username role"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};