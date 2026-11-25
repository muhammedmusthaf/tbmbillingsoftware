import CreditPayment from "../models/CreditPayment.model.js";
import Customer from "../models/Customer.model.js";
import Invoice from "../models/Invoice.model.js";
import WhatsAppReminder from "../models/WhatsAppReminder.model.js";
import createNotification from "../utils/createnotification.js";
import mongoose from "mongoose";


// RECEIVE CREDIT PAYMENT

// RECEIVE CREDIT PAYMENT — TRANSACTION SAFE

export const receiveCreditPayment = async (req, res) => {
  const session = await mongoose.startSession();

  const {
    invoiceId,
    amount,
    paymentMethod,
    referenceNumber = "",
    paymentDate,
    notes = "",
    idempotencyKey,
  } = req.body;

  let paymentId;
  let notificationData;

  const normalizedReference =
    paymentMethod === "upi" && typeof referenceNumber === "string"
      ? referenceNumber.trim()
      : "";

  const normalizedNotes =
    typeof notes === "string" ? notes.trim() : "";

  const paymentAmount = Number(amount);

  // Fingerprint ensures the same key cannot be reused
  // for a different payment.
  const requestFingerprint = JSON.stringify({
    invoiceId: String(invoiceId || ""),
    amount: Number.isFinite(paymentAmount)
      ? paymentAmount.toFixed(2)
      : "",
    paymentMethod,
    referenceNumber: normalizedReference,
    paymentDate: paymentDate || "",
    notes: normalizedNotes,
  });

  const getPopulatedPayment = async (id) => {
    return CreditPayment.findById(id)
      .populate("customer", "name phone creditBalance")
      .populate(
        "invoice",
        "invoiceNumber grandTotal paidAmount creditAmount paymentStatus"
      )
      .populate("receivedBy", "name username role");
  };

  try {
    // VALIDATION
    if (
      !invoiceId ||
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !paymentMethod ||
      !idempotencyKey
    ) {
      return res.status(400).json({
        message:
          "Invoice, amount, payment method and idempotency key are required.",
      });
    }

    if (
      typeof idempotencyKey !== "string" ||
      idempotencyKey.trim().length < 10 ||
      idempotencyKey.trim().length > 150
    ) {
      return res.status(400).json({
        message: "Invalid payment request key.",
      });
    }

    const safeKey = idempotencyKey.trim();

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        message: "Invalid invoice ID.",
      });
    }

    if (!["cash", "upi"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Payment method must be cash or upi.",
      });
    }

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      Math.abs(paymentAmount * 100 - Math.round(paymentAmount * 100)) > 0.000001
    ) {
      return res.status(400).json({
        message: "Enter a valid amount with up to 2 decimal places.",
      });
    }

    if (paymentMethod === "upi" && !normalizedReference) {
      return res.status(400).json({
        message: "UPI transaction reference is required.",
      });
    }

    if (
      paymentDate &&
      Number.isNaN(new Date(paymentDate).getTime())
    ) {
      return res.status(400).json({
        message: "Invalid payment date.",
      });
    }

    // CHECK WHETHER THIS REQUEST WAS ALREADY PROCESSED
    const existingPayment = await CreditPayment.findOne({
      idempotencyKey: safeKey,
    });

    if (existingPayment) {
      if (
        existingPayment.requestFingerprint !== requestFingerprint
      ) {
        return res.status(409).json({
          message:
            "This payment request key has already been used for different payment details.",
        });
      }

      const existingPopulatedPayment =
        await getPopulatedPayment(existingPayment._id);

      return res.status(200).json({
        message: "This payment was already recorded.",
        duplicate: true,
        payment: existingPopulatedPayment,
      });
    }

    // DATABASE TRANSACTION
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(invoiceId).session(session);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.status !== "completed") {
        throw new Error(
          "Payment cannot be recorded for this invoice"
        );
      }

      if (!invoice.customer) {
        throw new Error(
          "This invoice is not linked to a customer"
        );
      }

      if (invoice.creditAmount <= 0) {
        throw new Error(
          "This invoice has no pending credit"
        );
      }

      if (paymentAmount > invoice.creditAmount) {
        throw new Error(
          `Payment exceeds pending balance of ₹${invoice.creditAmount}`
        );
      }

      const customer = await Customer.findById(
        invoice.customer
      ).session(session);

      if (!customer) {
        throw new Error("Customer not found");
      }

      const previousBalance = Number(invoice.creditAmount);

      const remainingBalance = Math.max(
        0,
        Number((previousBalance - paymentAmount).toFixed(2))
      );

      // CREATE PAYMENT RECORD
      const paymentDocs = await CreditPayment.create(
        [
          {
            customer: customer._id,
            invoice: invoice._id,
            amount: paymentAmount,
            paymentMethod,
            referenceNumber: normalizedReference,
            previousBalance,
            remainingBalance,
            paymentDate: paymentDate || new Date(),
            notes: normalizedNotes,
            receivedBy: req.user._id,
            idempotencyKey: safeKey,
            requestFingerprint,
          },
        ],
        { session }
      );

      paymentId = paymentDocs[0]._id;

      // UPDATE INVOICE
      invoice.paidAmount = Number(
        (invoice.paidAmount + paymentAmount).toFixed(2)
      );

      invoice.creditAmount = remainingBalance;

      invoice.paymentDetails =
        invoice.paymentDetails || {
          cashAmount: 0,
          upiAmount: 0,
          upiReference: "",
        };

      if (paymentMethod === "cash") {
        invoice.paymentDetails.cashAmount = Number(
          (
            (invoice.paymentDetails.cashAmount || 0) +
            paymentAmount
          ).toFixed(2)
        );
      }

      if (paymentMethod === "upi") {
        invoice.paymentDetails.upiAmount = Number(
          (
            (invoice.paymentDetails.upiAmount || 0) +
            paymentAmount
          ).toFixed(2)
        );
      }

      invoice.paymentStatus =
        remainingBalance === 0 ? "paid" : "partial";

      await invoice.save({ session });

      // UPDATE CUSTOMER
      customer.totalPaid = Number(
        ((customer.totalPaid || 0) + paymentAmount).toFixed(2)
      );

      customer.creditBalance = Number(
        Math.max(
          0,
          (customer.creditBalance || 0) - paymentAmount
        ).toFixed(2)
      );

      await customer.save({ session });
      // CANCEL REMINDERS WHEN INVOICE IS FULLY PAID
if (remainingBalance === 0) {
  await WhatsAppReminder.updateMany(
    {
      invoice: invoice._id,
      status: {
        $in: ["pending", "failed", "processing"],
      },
    },
    {
      $set: {
        status: "cancelled",
        leaseUntil: null,
        nextAttemptAt: null,
        errorMessage: "Invoice fully paid.",
      },
    },
    { session }
  );

  console.log(
    `WhatsApp reminders cancelled for paid invoice ${invoice.invoiceNumber}`
  );
}

      notificationData = {
        customerName: customer.name,
        paymentAmount,
        invoiceNumber: invoice.invoiceNumber,
        remainingBalance,
        paymentId,
      };
    });

    // TRANSACTION COMMITTED
    try {
      await createNotification({
        type: "credit_payment",
        title: "Credit Payment Received",
        message:
          `${notificationData.customerName} paid ₹${notificationData.paymentAmount.toFixed(2)} ` +
          `towards invoice ${notificationData.invoiceNumber}. ` +
          `Remaining credit: ₹${notificationData.remainingBalance.toFixed(2)}.`,
        priority: "medium",
        relatedId: notificationData.paymentId,
        relatedModel: null,
      });
    } catch (notificationError) {
      console.error(
        "Credit payment notification failed:",
        notificationError.message
      );
    }

    const finalPayment = await getPopulatedPayment(paymentId);

    return res.status(201).json({
      message: "Credit payment received successfully",
      duplicate: false,
      payment: finalPayment,
    });

  } catch (error) {
    console.error("Credit payment error:", error);

    // A concurrent request may have inserted the same unique key.
    // Return that existing payment instead of creating another.
    if (error.code === 11000 && idempotencyKey) {
      const existingPayment = await CreditPayment.findOne({
        idempotencyKey: idempotencyKey.trim(),
      });

      if (existingPayment) {
        if (
          existingPayment.requestFingerprint !== requestFingerprint
        ) {
          return res.status(409).json({
            message:
              "This payment request key has already been used for different payment details.",
          });
        }

        const existingPopulatedPayment =
          await getPopulatedPayment(existingPayment._id);

        return res.status(200).json({
          message: "This payment was already recorded.",
          duplicate: true,
          payment: existingPopulatedPayment,
        });
      }
    }

    const statusCode =
      error.message === "Invoice not found" ||
      error.message === "Customer not found"
        ? 404
        : error.message?.includes("pending balance") ||
          error.message?.includes("no pending credit") ||
          error.message?.includes("cannot be recorded")
        ? 400
        : 500;

    return res.status(statusCode).json({
      message: error.message || "Credit payment failed",
    });

  } finally {
    await session.endSession();
  }
};




// GET ALL CREDIT PAYMENTS
export const getCreditPayments = async (req, res) => {
  try {
    const payments = await CreditPayment.find()
      .populate(
        "customer",
        "name phone creditBalance"
      )
      .populate(
        "invoice",
        "invoiceNumber grandTotal creditAmount paymentStatus"
      )
      .populate(
        "receivedBy",
        "name username role"
      )
      .sort({ paymentDate: -1 });

    res.status(200).json({
      count: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET CUSTOMER CREDIT PAYMENT HISTORY
export const getCustomerCreditPayments = async (
  req,
  res
) => {
  try {
    const payments = await CreditPayment.find({
      customer: req.params.customerId,
    })
      .populate(
        "invoice",
        "invoiceNumber grandTotal paidAmount creditAmount paymentStatus"
      )
      .populate(
        "receivedBy",
        "name username"
      )
      .sort({ paymentDate: -1 });

    res.status(200).json({
      count: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};