import CreditPayment from "../models/CreditPayment.model.js";
import Customer from "../models/Customer.model.js";
import Invoice from "../models/Invoice.model.js";


// RECEIVE CREDIT PAYMENT
export const receiveCreditPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      paymentDate,
      notes,
    } = req.body;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({
        message:
          "Invoice, amount and payment method are required",
      });
    }

    if (!["cash", "upi"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Payment method must be cash or upi",
      });
    }

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than 0",
      });
    }

    // -----------------------------
    // FIND INVOICE
    // -----------------------------

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (invoice.status !== "completed") {
      return res.status(400).json({
        message:
          "Payment cannot be recorded for this invoice",
      });
    }

    if (!invoice.customer) {
      return res.status(400).json({
        message:
          "This invoice is not linked to a customer",
      });
    }

    if (invoice.creditAmount <= 0) {
      return res.status(400).json({
        message: "This invoice has no pending credit",
      });
    }

    if (paymentAmount > invoice.creditAmount) {
      return res.status(400).json({
        message: "Payment exceeds pending balance",
        pendingBalance: invoice.creditAmount,
      });
    }

    // -----------------------------
    // FIND CUSTOMER
    // -----------------------------

    const customer = await Customer.findById(
      invoice.customer
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const previousBalance = invoice.creditAmount;

    const remainingBalance = Number(
      (previousBalance - paymentAmount).toFixed(2)
    );

    // -----------------------------
    // CREATE PAYMENT HISTORY
    // -----------------------------

    const creditPayment = await CreditPayment.create({
      customer: customer._id,

      invoice: invoice._id,

      amount: paymentAmount,

      paymentMethod,

      referenceNumber:
        referenceNumber || "",

      previousBalance,

      remainingBalance,

      paymentDate:
        paymentDate || new Date(),

      notes: notes || "",

      receivedBy: req.user._id,
    });

    // -----------------------------
    // UPDATE INVOICE
    // -----------------------------

    invoice.paidAmount = Number(
      (invoice.paidAmount + paymentAmount).toFixed(2)
    );

    invoice.creditAmount = remainingBalance;

    // Add payment to cash/UPI totals
    if (paymentMethod === "cash") {
      invoice.paymentDetails.cashAmount = Number(
        (
          invoice.paymentDetails.cashAmount +
          paymentAmount
        ).toFixed(2)
      );
    }

    if (paymentMethod === "upi") {
      invoice.paymentDetails.upiAmount = Number(
        (
          invoice.paymentDetails.upiAmount +
          paymentAmount
        ).toFixed(2)
      );
    }

    // Update payment status
    if (remainingBalance === 0) {
      invoice.paymentStatus = "paid";
    } else {
      invoice.paymentStatus = "partial";
    }

    await invoice.save();

    // -----------------------------
    // UPDATE CUSTOMER
    // -----------------------------

    customer.totalPaid = Number(
      (customer.totalPaid + paymentAmount).toFixed(2)
    );

    customer.creditBalance = Number(
      Math.max(
        0,
        customer.creditBalance - paymentAmount
      ).toFixed(2)
    );

    await customer.save();

    // -----------------------------
    // FINAL RESPONSE
    // -----------------------------

    const finalPayment =
      await CreditPayment.findById(
        creditPayment._id
      )
        .populate(
          "customer",
          "name phone creditBalance"
        )
        .populate(
          "invoice",
          "invoiceNumber grandTotal paidAmount creditAmount paymentStatus"
        )
        .populate(
          "receivedBy",
          "name username role"
        );

    res.status(201).json({
      message: "Credit payment received successfully",
      payment: finalPayment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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