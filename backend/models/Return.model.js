import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    productCode: {
      type: String,
      required: true,
      trim: true,
    },

    unit: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    gst: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    restock: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const returnSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    customerName: {
      type: String,
      trim: true,
      default: "Walk-in Customer",
    },

    items: {
      type: [returnItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "At least one return item is required",
      },
    },

    totalRefundAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    refundMethod: {
      type: String,
      enum: ["cash", "upi", "credit_adjustment"],
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    returnDate: {
      type: Date,
      default: Date.now,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Return = mongoose.model("Return", returnSchema);

export default Return;