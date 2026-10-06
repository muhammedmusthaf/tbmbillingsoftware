import mongoose from "mongoose";

const stockItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      min: 0,
    },

    gst: {
      type: Number,
      default: 0,
      min: 0,
    },

    previousStock: {
      type: Number,
      required: true,
    },

    newStock: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const stockTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["stock_in", "adjustment", "return"],
      default: "stock_in",
    },

    supplier: {
      type: String,
      trim: true,
      default: "",
    },

    purchaseInvoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },

    transactionDate: {
      type: Date,
      default: Date.now,
    },

    items: {
      type: [stockItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "At least one product is required",
      },
    },

    totalPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const StockTransaction = mongoose.model(
  "StockTransaction",
  stockTransactionSchema
);

export default StockTransaction;