import Invoice from "../models/Invoice.model.js";
import WhatsAppReminder from "../models/WhatsAppReminder.model.js";
import Customer from "../models/Customer.model.js";
import { sendCreditPaymentReminder } from "../utils/whatsapp.js";

const DAY = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY = 15 * 60 * 1000;
const LEASE_DURATION = 5 * 60 * 1000;

// ==========================================
// GET CURRENT DATE IN INDIAN TIMEZONE
// ==========================================

const getIndiaDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    key: `${values.year}-${values.month}-${values.day}`,
  };
};

// ==========================================
// CALCULATE DAYS OVERDUE
// ==========================================

const getDayDifference = (dueDate, today) => {
  const due = getIndiaDate(dueDate);

  const dueUTC = Date.UTC(
    due.year,
    due.month - 1,
    due.day
  );

  const todayUTC = Date.UTC(
    today.year,
    today.month - 1,
    today.day
  );

  return Math.round((todayUTC - dueUTC) / DAY);
};

// ==========================================
// DETERMINE REMINDER STAGE
// ==========================================

const getReminderDetails = (daysOverdue, dueDate) => {
  const dueKey = getIndiaDate(dueDate).key;

  // 2 days before due date
  if (daysOverdue === -2) {
    return {
      type: "upcoming",
      cycleKey: `upcoming-${dueKey}`,
    };
  }

  // On due date
  if (daysOverdue === 0) {
    return {
      type: "due_today",
      cycleKey: `due-${dueKey}`,
    };
  }

  // 2 days after due date
  if (daysOverdue === 2) {
    return {
      type: "overdue",
      cycleKey: `overdue-${dueKey}`,
    };
  }

  // Every 3 days after the initial overdue reminder
  if (daysOverdue > 2 && (daysOverdue - 2) % 3 === 0) {
    return {
      type: "follow_up",
      cycleKey: `followup-${daysOverdue}-${dueKey}`,
    };
  }

  return null;
};

// ==========================================
// CANCEL A REMINDER SAFELY
// ==========================================

const cancelReminder = async (reminderId, reason) => {
  return WhatsAppReminder.findOneAndUpdate(
    {
      _id: reminderId,
      status: { $in: ["pending", "failed", "processing"] },
    },
    {
      $set: {
        status: "cancelled",
        leaseUntil: null,
        nextAttemptAt: null,
        errorMessage: reason,
      },
    },
    { returnDocument: "after" }
  );
};

// ==========================================
// PROCESS ONE REMINDER
// Handles initial sends and retries
// ==========================================

const processOneReminder = async (reminderId) => {
  const now = new Date();
  const reminder = await WhatsAppReminder.findById(reminderId);

  if (!reminder) return;

  // Never process completed or cancelled reminders.
  if (["sent", "cancelled"].includes(reminder.status)) return;

  if (reminder.attempts >= MAX_ATTEMPTS) {
    if (reminder.status === "failed" && reminder.nextAttemptAt) {
      await WhatsAppReminder.updateOne(
        { _id: reminder._id, status: "failed" },
        { $set: { nextAttemptAt: null } }
      );
    }
    return;
  }

  // Do not process an active lease.
  if (
    reminder.status === "processing" &&
    reminder.leaseUntil &&
    reminder.leaseUntil > now
  ) {
    return;
  }

  // Wait until retry time.
  if (
    reminder.status === "failed" &&
    reminder.nextAttemptAt &&
    reminder.nextAttemptAt > now
  ) {
    return;
  }

  // Check the latest invoice before claiming the reminder.
  const latestInvoice = await Invoice.findById(reminder.invoice);

  if (
    !latestInvoice ||
    latestInvoice.status !== "completed" ||
    Number(latestInvoice.creditAmount) <= 0
  ) {
    await cancelReminder(
      reminder._id,
      "Invoice is missing, inactive, or fully paid."
    );
    console.log(`Reminder cancelled: invoice ${reminder.invoice} is no longer payable.`);
    return;
  }

  // Check current customer status and consent.
  const customer = await Customer.findById(latestInvoice.customer);

  if (
    !customer ||
    !customer.isActive ||
    !customer.phone ||
    !customer.whatsappConsent
  ) {
    await cancelReminder(
      reminder._id,
      "Customer is inactive, has no phone number, or has withdrawn WhatsApp consent."
    );
    console.log(`Reminder cancelled: customer validation failed for invoice ${latestInvoice.invoiceNumber}.`);
    return;
  }

  // ========================================
  // ATOMIC REMINDER CLAIM
  // ========================================

  const claimed = await WhatsAppReminder.findOneAndUpdate(
    {
      _id: reminder._id,
      attempts: { $lt: MAX_ATTEMPTS },
      $or: [
        { status: "pending" },
        {
          status: "failed",
          $or: [
            { nextAttemptAt: { $lte: now } },
            { nextAttemptAt: null },
          ],
        },
        {
          status: "processing",
          $or: [
            { leaseUntil: { $lte: now } },
            { leaseUntil: null },
          ],
        },
      ],
    },
    {
      $set: {
        status: "processing",
        leaseUntil: new Date(now.getTime() + LEASE_DURATION),
        amount: latestInvoice.creditAmount,
        phone: customer.phone,
        nextAttemptAt: null,
      },
      $inc: { attempts: 1 },
    },
    { returnDocument: "after" }
  );

  if (!claimed) {
    return;
  }

  // Recheck invoice/customer after claiming, immediately before sending.
  // This narrows the window in which a paid invoice could receive a reminder.
  const invoiceBeforeSend = await Invoice.findById(claimed.invoice);
  const customerBeforeSend = invoiceBeforeSend
    ? await Customer.findById(invoiceBeforeSend.customer)
    : null;

  if (
    !invoiceBeforeSend ||
    invoiceBeforeSend.status !== "completed" ||
    Number(invoiceBeforeSend.creditAmount) <= 0
  ) {
    await cancelReminder(
      claimed._id,
      "Invoice was paid or became unavailable before sending."
    );
    return;
  }

  if (
    !customerBeforeSend ||
    !customerBeforeSend.isActive ||
    !customerBeforeSend.phone ||
    !customerBeforeSend.whatsappConsent
  ) {
    await cancelReminder(
      claimed._id,
      "Customer is inactive, has no phone number, or has withdrawn WhatsApp consent."
    );
    return;
  }

  // Confirm this reminder is still processing before calling the external API.
  const stillProcessing = await WhatsAppReminder.exists({
    _id: claimed._id,
    status: "processing",
  });

  if (!stillProcessing) {
    return;
  }

  // ========================================
  // SEND WHATSAPP MESSAGE
  // ========================================

  try {
    const result = await sendCreditPaymentReminder({
      to: customerBeforeSend.phone,
      customerName: customerBeforeSend.name,
      amount: invoiceBeforeSend.creditAmount,
      invoiceNumber: invoiceBeforeSend.invoiceNumber,
      reminderType: claimed.reminderType,
    });

    // Update only if the reminder is still processing.
    // A concurrent payment may have cancelled it while the API call was running.
    const updated = await WhatsAppReminder.findOneAndUpdate(
      {
        _id: claimed._id,
        status: "processing",
      },
      {
        $set: {
          status: "sent",
          messageId: result.messages?.[0]?.id || "",
          sentAt: new Date(),
          leaseUntil: null,
          nextAttemptAt: null,
          errorMessage: "",
          amount: invoiceBeforeSend.creditAmount,
          phone: customerBeforeSend.phone,
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      console.warn(
        `WhatsApp API returned success, but reminder ${claimed._id} was cancelled or changed while sending. Check Meta message logs.`
      );
      return;
    }

    console.log(
      `${claimed.reminderType} reminder sent successfully for invoice ${invoiceBeforeSend.invoiceNumber}`
    );
  } catch (sendError) {
    const nextAttemptAt =
      claimed.attempts < MAX_ATTEMPTS
        ? new Date(Date.now() + RETRY_DELAY)
        : null;

    // Do not overwrite a cancellation made by a concurrent payment.
    const failedReminder = await WhatsAppReminder.findOneAndUpdate(
      {
        _id: claimed._id,
        status: "processing",
      },
      {
        $set: {
          status: "failed",
          leaseUntil: null,
          nextAttemptAt,
          errorMessage: String(sendError.message || "WhatsApp send failed").slice(0, 1000),
        },
      },
      { returnDocument: "after" }
    );

    if (!failedReminder) {
      console.warn(
        `Reminder ${claimed._id} was cancelled or changed while the WhatsApp request failed.`
      );
      return;
    }

    if (nextAttemptAt) {
      console.log(
        `Retry ${claimed.attempts + 1} scheduled for invoice ${invoiceBeforeSend.invoiceNumber} at ${nextAttemptAt.toISOString()}`
      );
    } else {
      console.log(
        `Maximum attempts reached for invoice ${invoiceBeforeSend.invoiceNumber}`
      );
    }

    console.error(
      `WhatsApp send failed for invoice ${invoiceBeforeSend.invoiceNumber}:`,
      sendError.message
    );
  }
};

// ==========================================
// PROCESS NEW REMINDERS
// This function is called by the 8 PM job only.
// ==========================================

const processScheduledReminders = async ({ testInvoiceId = null } = {}) => {
  const now = new Date();
  const today = getIndiaDate(now);

  const invoiceQuery = {
    status: "completed",
    creditAmount: { $gt: 0 },
    dueDate: { $ne: null },
  };

  if (testInvoiceId) {
    invoiceQuery._id = testInvoiceId;
  }

  const invoices = await Invoice.find(invoiceQuery);

  console.log(
    `Checking ${invoices.length} invoices for scheduled reminders`
  );

  for (const invoice of invoices) {
    const customer = await Customer.findById(invoice.customer);

    if (
      !customer ||
      !customer.isActive ||
      !customer.phone ||
      !customer.whatsappConsent
    ) {
      continue;
    }

    const daysOverdue = getDayDifference(invoice.dueDate, today);
    const reminderDetails = getReminderDetails(daysOverdue, invoice.dueDate);

    if (!reminderDetails) continue;

    const { type, cycleKey } = reminderDetails;

    try {
      const reminder = await WhatsAppReminder.findOneAndUpdate(
        {
          invoice: invoice._id,
          cycleKey,
        },
        {
          $setOnInsert: {
            customer: customer._id,
            invoice: invoice._id,
            phone: customer.phone,
            amount: invoice.creditAmount,
            reminderType: type,
            cycleKey,
            status: "pending",
            scheduledFor: now,
            attempts: 0,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
      );

      await processOneReminder(reminder._id);
    } catch (error) {
      if (error.code === 11000) {
        console.log(
          `Duplicate reminder prevented for invoice ${invoice.invoiceNumber}`
        );
        continue;
      }

      throw error;
    }
  }
};

// ==========================================
// RETRY FAILED REMINDERS
// Independent of today's reminder stage.
// ==========================================

const processFailedReminders = async ({ testInvoiceId = null } = {}) => {
  const now = new Date();

  const query = {
    status: { $in: ["failed", "processing"] },
    attempts: { $lt: MAX_ATTEMPTS },
    $or: [
      // Failed reminders whose retry time has arrived.
      {
        status: "failed",
        $or: [
          { nextAttemptAt: { $lte: now } },
          { nextAttemptAt: null },
        ],
      },
      // Recover a job that crashed while processing after its lease expires.
      {
        status: "processing",
        $or: [
          { leaseUntil: { $lte: now } },
          { leaseUntil: null },
        ],
      },
    ],
  };

  if (testInvoiceId) {
    query.invoice = testInvoiceId;
  }

  const failedReminders = await WhatsAppReminder.find(query)
    .select("_id")
    .lean();

  console.log(
    `Found ${failedReminders.length} failed reminders ready for retry`
  );

  for (const reminder of failedReminders) {
    await processOneReminder(reminder._id);
  }
};

// ==========================================
// MAIN REMINDER SERVICE
//
// Default: process scheduled reminders + due retries.
// retryOnly: process due retries only (15-minute cron).
// ==========================================

const processWhatsAppReminders = async ({
  testInvoiceId = null,
  retryOnly = false,
} = {}) => {
  try {
    if (
      testInvoiceId &&
      process.env.WHATSAPP_TEST_MODE !== "true"
    ) {
      throw new Error(
        "Test execution blocked. WhatsApp test mode is not enabled."
      );
    }

    console.log("========== WHATSAPP REMINDER SERVICE ==========");

    if (!retryOnly) {
      await processScheduledReminders({ testInvoiceId });
    }

    // Retry old failures independently from today's reminder stage.
    await processFailedReminders({ testInvoiceId });

    console.log("WhatsApp reminder processing completed.");
  } catch (error) {
    console.error("WhatsApp reminder service error:", error);
    throw error;
  }
};

export default processWhatsAppReminders;
