import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    // -----------------------------------
    // SHOP DETAILS
    // -----------------------------------

    shopName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // -----------------------------------
    // SHOP LOGO
    // -----------------------------------

    logo: {
      type: String,
      default: "",
    },

    // -----------------------------------
    // UPI DETAILS
    // -----------------------------------

    upiId: {
      type: String,
      trim: true,
      default: "",
    },

    upiName: {
      type: String,
      trim: true,
      default: "",
    },

    upiQrImage: {
      type: String,
      default: "",
    },

    // -----------------------------------
    // INVOICE SETTINGS
    // -----------------------------------

    invoicePrefix: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INV",
    },

    invoiceFooter: {
      type: String,
      trim: true,
      default: "Thank you for your business!",
    },

    showGST: {
      type: Boolean,
      default: true,
    },

    showLogo: {
      type: Boolean,
      default: true,
    },

    // -----------------------------------
    // PRINT SETTINGS
    // -----------------------------------

    printSize: {
      type: String,
      enum: [
        "58mm",
        "80mm",
        "A4",
        "A5",
      ],
      default: "80mm",
    },

    autoPrint: {
      type: Boolean,
      default: false,
    },

    // -----------------------------------
    // INVENTORY SETTINGS
    // -----------------------------------

    lowStockNotification: {
      type: Boolean,
      default: true,
    },

    // -----------------------------------
    // GENERAL
    // -----------------------------------

    currency: {
      type: String,
      default: "INR",
    },

    currencySymbol: {
      type: String,
      default: "₹",
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model(
  "Setting",
  settingSchema
);

export default Setting;