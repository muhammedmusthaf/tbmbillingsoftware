import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: [
                "bill_generated",
                "stock_in",
                "low_stock",
                "out_of_stock",
                "credit_payment",
                "credit_due",
                "return_processed",
            ],
        },

        title: {
            type: String,
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        relatedModel: {
            type: String,
            enum: ["Product", "Invoice", "Customer", "Return"],
            default: null,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;