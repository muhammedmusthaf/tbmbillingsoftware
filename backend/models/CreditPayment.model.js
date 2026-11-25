
import mongoose from "mongoose";

const creditPaymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "upi"],
      required: true,
    },

    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },

    previousBalance: {
      type: Number,
      required: true,
      min: 0,
    },

    remainingBalance: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Unique key for preventing duplicate payment requests
    idempotencyKey: {
      type: String,
      trim: true,
      default: undefined,
    },

    // Identifies the payment details associated with the key
    requestFingerprint: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Existing payment records without keys remain valid.
creditPaymentSchema.index(
  { idempotencyKey: 1 },
  { unique: true, sparse: true }
);

const CreditPayment = mongoose.model(
  "CreditPayment",
  creditPaymentSchema
);

export default CreditPayment;
