import mongoose from "mongoose";

const whatsappReminderSchema = new mongoose.Schema(
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

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    reminderType: {
      type: String,
      enum: ["upcoming", "due_today", "overdue", "follow_up"],
      required: true,
    },

    // Unique identifier for each reminder cycle
    cycleKey: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed", "cancelled"],
      default: "pending",
    },

    messageId: {
      type: String,
      default: "",
    },

    sentAt: {
      type: Date,
      default: null,
    },

    scheduledFor: {
      type: Date,
      required: true,
    },

    // Prevent two workers from sending the same reminder concurrently.
    leaseUntil: {
      type: Date,
      default: null,
    },

    // Time when a failed send becomes eligible for retry.
    nextAttemptAt: {
      type: Date,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    errorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent duplicate reminders for the same invoice and reminder cycle.
whatsappReminderSchema.index(
  { invoice: 1, cycleKey: 1 },
  { unique: true }
);

// Efficiently find reminders due for retry.
whatsappReminderSchema.index({
  status: 1,
  nextAttemptAt: 1,
  attempts: 1,
});

// Preserve scheduled reminder lookup support.
whatsappReminderSchema.index({
  status: 1,
  scheduledFor: 1,
});

const WhatsAppReminder = mongoose.model(
  "WhatsAppReminder",
  whatsappReminderSchema
);

export default WhatsAppReminder;
