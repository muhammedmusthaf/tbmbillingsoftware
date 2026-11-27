
import Invoice from "../models/Invoice.model.js";
import Notification from "../models/Notification.model.js";
import { sendOwnerPushNotification } from "../services/ownerPush.service.js";

const checkCreditDueNotifications = async () => {
  try {
    const now = new Date();

    // Find invoices with overdue outstanding credit
    const overdueInvoices = await Invoice.find({
      status: "completed",
      creditAmount: { $gt: 0 },
      dueDate: {
        $ne: null,
        $lte: now,
      },
    });

    const overdueIds = overdueInvoices.map(
      (invoice) => invoice._id
    );

    // Resolve notifications for invoices no longer overdue
    await Notification.updateMany(
      {
        type: "credit_due",
        relatedModel: "Invoice",
        relatedId: { $nin: overdueIds },
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    // Create notifications without duplicates
    for (const invoice of overdueInvoices) {
      const existingNotification =
        await Notification.findOne({
          type: "credit_due",
          relatedModel: "Invoice",
          relatedId: invoice._id,
        });

      if (existingNotification) {
        continue;
      }

      const title = "Customer Credit Overdue";

      const message =
        `${invoice.customerName} has an overdue payment of ` +
        `₹${invoice.creditAmount.toFixed(2)} for invoice ` +
        `${invoice.invoiceNumber}.`;

      // Save notification in MongoDB
      const notification = await Notification.create({
        type: "credit_due",
        title,
        message,
        priority: "high",
        isRead: false,
        relatedId: invoice._id,
        relatedModel: "Invoice",
      });

      // Send push notification to Owner only
      await sendOwnerPushNotification({
        title,
        body: message,
        data: {
          type: "credit_due",
          notificationId: notification._id.toString(),
          relatedId: invoice._id.toString(),
        },
      });
    }

  } catch (error) {
    console.error(
      "CREDIT DUE NOTIFICATION ERROR:",
      error
    );
  }
};

export default checkCreditDueNotifications;
