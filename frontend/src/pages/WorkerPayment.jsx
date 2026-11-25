
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  UserRound,
  Search,
  Banknote,
  CreditCard,
  Smartphone,
  Loader2,
  ReceiptText,
  CheckCircle2,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import "../styles/workerPayment.css";
import WorkerBottomnav from "../components/WorkerBottomnav";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function WorkerPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cart = [], totals = {} } = location.state || {};

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [upiReference, setUpiReference] = useState("");

  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [billDiscount, setBillDiscount] = useState("0");
  const [roundOff, setRoundOff] = useState("0");

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    shopName: "",
    upiId: "",
    upiName: "",
  });

  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Fetch shop settings and UPI details.
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/settings`,
          config()
        );

        const data = response.data.settings || response.data;

        setSettings({
          shopName: data.shopName || "",
          upiId: data.upiId || "",
          upiName: data.upiName || data.shopName || "",
        });
      } catch (err) {
        console.error("Settings fetch error:", err);
      }
    };

    fetchSettings();
  }, []);

  const grandTotal = Number(totals.grandTotal || 0);

  // Redirect if no cart data.
  useEffect(() => {
    if (!cart.length) {
      navigate("/worker/billing", { replace: true });
    }
  }, [cart.length, navigate]);

  // Fetch customers.
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);

        const response = await axios.get(
          `${API_URL}/api/customers`,
          config()
        );

        const data = response.data;

        setCustomers(
          Array.isArray(data)
            ? data
            : data.customers || data.data || []
        );
      } catch (err) {
        console.error("Customer fetch error:", err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers.
  const filteredCustomers = useMemo(() => {
    const value = customerSearch.toLowerCase().trim();

    if (!value) return [];

    return customers
      .filter(
        (customer) =>
          customer.isActive !== false &&
          (
            customer.name?.toLowerCase().includes(value) ||
            customer.phone?.includes(value)
          )
      )
      .slice(0, 6);
  }, [customers, customerSearch]);

  // Calculate amounts.
  const discountValue = Math.max(0, Number(billDiscount || 0));

  const finalTotal = Math.max(
    0,
    grandTotal - discountValue + Number(roundOff || 0)
  );

  const cash = Number(cashAmount || 0);
  const upi = Number(upiAmount || 0);

  const totalPaid =
    paymentMethod === "cash"
      ? finalTotal
      : paymentMethod === "upi"
      ? finalTotal
      : paymentMethod === "credit"
      ? 0
      : cash + upi;

  const outstanding = Math.max(
    0,
    Number((finalTotal - totalPaid).toFixed(2))
  );

  // QR amount: full amount for UPI, UPI portion for split payment.
  const qrAmount =
    paymentMethod === "upi"
      ? finalTotal
      : paymentMethod === "split"
      ? upi
      : 0;

  // Generate UPI payment link.
  const upiLink = useMemo(() => {
    if (!settings.upiId || qrAmount <= 0) {
      return "";
    }

    const params = new URLSearchParams({
      pa: settings.upiId,
      pn: settings.upiName || settings.shopName || "Shop",
      am: qrAmount.toFixed(2),
      cu: "INR",
      tn: "Bill Payment",
    });

    return `upi://pay?${params.toString()}`;
  }, [
    settings.upiId,
    settings.upiName,
    settings.shopName,
    qrAmount,
  ]);

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setError("");
  };

  // Generate invoice.
  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    setError("");

    if (!cart.length) {
      setError("Your billing cart is empty.");
      return;
    }

    if (finalTotal < 0) {
      setError("Invalid bill amount.");
      return;
    }

    if (
      paymentMethod === "credit" &&
      !selectedCustomer
    ) {
      setError(
        "Please select a registered customer for credit billing."
      );
      return;
    }

    if (
      paymentMethod === "split" &&
      cash + upi > finalTotal
    ) {
      setError("Paid amount cannot exceed the bill total.");
      return;
    }

    if (
      outstanding > 0 &&
      !selectedCustomer
    ) {
      setError(
        "Please select a registered customer when payment is pending."
      );
      return;
    }

    if (
      outstanding > 0 &&
      !dueDate
    ) {
      setError("Please select a due date for the pending payment.");
      return;
    }

    if (
      paymentMethod === "split" &&
      cash + upi <= 0
    ) {
      setError("Enter at least one payment amount.");
      return;
    }

    // Check UPI configuration.
    if (
      (paymentMethod === "upi" ||
        (paymentMethod === "split" && upi > 0)) &&
      !settings.upiId
    ) {
      setError(
        "UPI ID is not configured. Please ask the owner to update UPI details in Settings."
      );
      return;
    }

    if (
      (paymentMethod === "upi" ||
        (paymentMethod === "split" && upi > 0)) &&
      !upiReference.trim()
    ) {
      setError("Please enter the UPI transaction reference.");
      return;
    }

    if (
      cash < 0 ||
      upi < 0 ||
      discountValue < 0
    ) {
      setError("Payment and discount amounts cannot be negative.");
      return;
    }

    if (discountValue > grandTotal) {
      setError("Discount cannot be greater than the bill total.");
      return;
    }

    const invoiceItems = cart.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      discount: 0,
    }));

    const payload = {
      customerId: selectedCustomer?._id || null,
      items: invoiceItems,
      paymentMethod,

      cashAmount:
        paymentMethod === "cash"
          ? finalTotal
          : paymentMethod === "split"
          ? cash
          : 0,

      upiAmount:
        paymentMethod === "upi"
          ? finalTotal
          : paymentMethod === "split"
          ? upi
          : 0,

      upiReference: upiReference.trim(),
      billDiscount: discountValue,
      roundOff: Number(roundOff || 0),
      dueDate: outstanding > 0 ? dueDate : null,
      notes: notes.trim(),
    };

    try {
      setSubmitting(true);

      const response = await axios.post(
        `${API_URL}/api/invoices`,
        payload,
        config()
      );

      const invoice =
        response.data.invoice || response.data;

      if (!invoice?._id) {
        throw new Error(
          "Invoice was created but its ID was not returned."
        );
      }

      navigate(`/worker/invoice/${invoice._id}`, {
        replace: true,
        state: {
          invoice,
          printRequested: false,
        },
      });
    } catch (err) {
      console.error("Invoice generation error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate invoice."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="worker-payment-page">
        <div className="worker-payment-loading">
          <Loader2 size={28} />
          <p>Redirecting to billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-payment-page">

      {/* Header */}
      <div className="worker-payment-header">
        <button
          type="button"
          onClick={() => navigate("/worker/billing")}
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1>Payment</h1>
          <p>Complete customer billing</p>
        </div>
      </div>

      {/* Bill Summary */}
      <section className="worker-payment-summary">
        <div className="worker-payment-summary-heading">
          <ReceiptText size={21} />
          <h2>Bill Summary</h2>
        </div>

        <div className="worker-payment-summary-row">
          <span>Total Products</span>
          <strong>
            {totals.totalItems ||
              cart.reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0
              )}
          </strong>
        </div>

        <div className="worker-payment-summary-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(totals.subtotal)}</strong>
        </div>

        {totals.showGST && (
          <div className="worker-payment-summary-row">
            <span>GST</span>
            <strong>{formatCurrency(totals.gstAmount)}</strong>
          </div>
        )}

        <div className="worker-payment-summary-row worker-payment-total">
          <span>Bill Total</span>
          <strong>{formatCurrency(grandTotal)}</strong>
        </div>
      </section>

      <form
        className="worker-payment-form"
        onSubmit={handleGenerateInvoice}
      >

        {/* Customer Selection */}
        <section className="worker-payment-section">
          <div className="worker-payment-section-heading">
            <UserRound size={21} />
            <div>
              <h2>Customer Details</h2>
              <p>Optional for fully paid bills</p>
            </div>
          </div>

          <div className="worker-payment-customer-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search customer by name or phone"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomer(null);
              }}
            />
          </div>

          {loadingCustomers && (
            <p className="worker-payment-small-info">
              Loading customers...
            </p>
          )}

          {customerSearch && !selectedCustomer && (
            <div className="worker-payment-customer-results">
              {filteredCustomers.length === 0 ? (
                <p>No matching customers found.</p>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    type="button"
                    key={customer._id}
                    onClick={() => selectCustomer(customer)}
                  >
                    <div>
                      <strong>{customer.name}</strong>
                      <span>{customer.phone}</span>
                    </div>

                    <CheckCircle2 size={18} />
                  </button>
                ))
              )}
            </div>
          )}

          {selectedCustomer && (
            <div className="worker-payment-selected-customer">
              <div>
                <strong>{selectedCustomer.name}</strong>
                <p>{selectedCustomer.phone}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                }}
              >
                Change
              </button>
            </div>
          )}
        </section>

        {/* Payment Method */}
        <section className="worker-payment-section">
          <div className="worker-payment-section-heading">
            <CreditCard size={21} />
            <div>
              <h2>Payment Method</h2>
              <p>Select how the customer pays</p>
            </div>
          </div>

          <div className="worker-payment-methods">

            <button
              type="button"
              className={
                paymentMethod === "cash"
                  ? "worker-payment-method worker-payment-method-active"
                  : "worker-payment-method"
              }
              onClick={() => setPaymentMethod("cash")}
            >
              <Banknote size={23} />
              <span>Cash</span>
            </button>

            <button
              type="button"
              className={
                paymentMethod === "upi"
                  ? "worker-payment-method worker-payment-method-active"
                  : "worker-payment-method"
              }
              onClick={() => setPaymentMethod("upi")}
            >
              <Smartphone size={23} />
              <span>UPI</span>
            </button>

            <button
              type="button"
              className={
                paymentMethod === "credit"
                  ? "worker-payment-method worker-payment-method-active"
                  : "worker-payment-method"
              }
              onClick={() => setPaymentMethod("credit")}
            >
              <CreditCard size={23} />
              <span>Credit</span>
            </button>

            <button
              type="button"
              className={
                paymentMethod === "split"
                  ? "worker-payment-method worker-payment-method-active"
                  : "worker-payment-method"
              }
              onClick={() => setPaymentMethod("split")}
            >
              <ReceiptText size={23} />
              <span>Split</span>
            </button>

          </div>

          {/* UPI QR Code */}
          {(paymentMethod === "upi" ||
            (paymentMethod === "split" && upi > 0)) && (
            <div className="worker-payment-qr-section">

              <h3>Scan & Pay</h3>

              {upiLink ? (
                <>
                  <div className="worker-payment-qr-wrapper">
                    <QRCodeSVG
                      value={upiLink}
                      size={210}
                      level="M"
                      includeMargin
                    />
                  </div>

                  <div className="worker-payment-qr-details">
                    <p>
                      <strong>Shop:</strong>{" "}
                      {settings.shopName || "Shop"}
                    </p>

                    <p>
                      <strong>UPI ID:</strong>{" "}
                      {settings.upiId}
                    </p>

                    <p>
                      <strong>Amount:</strong>{" "}
                      {formatCurrency(qrAmount)}
                    </p>
                  </div>

                  <p className="worker-payment-qr-note">
                    Ask the customer to scan this QR code and
                    complete the payment. Verify the payment
                    before generating the invoice.
                  </p>
                </>
              ) : (
                <p className="worker-payment-qr-warning">
                  UPI details are not configured. Please ask
                  the owner to add the UPI ID in Settings.
                </p>
              )}

            </div>
          )}

          {/* Split Payment */}
          {paymentMethod === "split" && (
            <div className="worker-payment-split-fields">

              <div className="worker-payment-field">
                <label>Cash Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Enter cash amount"
                />
              </div>

              <div className="worker-payment-field">
                <label>UPI Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  placeholder="Enter UPI amount"
                />
              </div>

              {upi > 0 && (
                <div className="worker-payment-field">
                  <label>UPI Transaction Reference</label>
                  <input
                    type="text"
                    value={upiReference}
                    onChange={(e) =>
                      setUpiReference(e.target.value)
                    }
                    placeholder="Enter transaction reference"
                  />
                </div>
              )}
            </div>
          )}

          {/* UPI Reference */}
          {paymentMethod === "upi" && (
            <div className="worker-payment-field">
              <label>UPI Transaction Reference</label>
              <input
                type="text"
                value={upiReference}
                onChange={(e) =>
                  setUpiReference(e.target.value)
                }
                placeholder="Enter UPI transaction reference"
              />
            </div>
          )}

          {/* Credit Information */}
          {paymentMethod === "credit" && (
            <div className="worker-payment-credit-info">
              <CreditCard size={19} />
              <p>
                The full bill amount will be added to the
                registered customer's outstanding credit.
              </p>
            </div>
          )}

        </section>

        {/* Discount and Round Off */}
        <section className="worker-payment-section">
          <div className="worker-payment-section-heading">
            <ReceiptText size={21} />
            <div>
              <h2>Bill Adjustment</h2>
              <p>Optional discount and round off</p>
            </div>
          </div>

          <div className="worker-payment-adjustment-grid">

            <div className="worker-payment-field">
              <label>Bill Discount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={billDiscount}
                onChange={(e) =>
                  setBillDiscount(e.target.value)
                }
              />
            </div>

            <div className="worker-payment-field">
              <label>Round Off (₹)</label>
              <input
                type="number"
                step="0.01"
                value={roundOff}
                onChange={(e) =>
                  setRoundOff(e.target.value)
                }
              />
            </div>

          </div>
        </section>

        {/* Payment Details */}
        <section className="worker-payment-section">
          <div className="worker-payment-section-heading">
            <Banknote size={21} />
            <div>
              <h2>Payment Details</h2>
              <p>Check the final payment amount</p>
            </div>
          </div>

          <div className="worker-payment-final-details">

            <div>
              <span>Final Bill Amount</span>
              <strong>{formatCurrency(finalTotal)}</strong>
            </div>

            <div>
              <span>Paid Amount</span>
              <strong>{formatCurrency(totalPaid)}</strong>
            </div>

            <div className="worker-payment-outstanding">
              <span>Outstanding Amount</span>
              <strong>{formatCurrency(outstanding)}</strong>
            </div>

          </div>

          {outstanding > 0 && (
            <div className="worker-payment-field">
              <label>Payment Due Date</label>

              <input
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          )}

          <div className="worker-payment-field">
            <label>Notes (Optional)</label>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter payment or billing notes..."
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="worker-payment-error">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="worker-payment-submit-button"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2
                size={19}
                className="worker-payment-spin"
              />
              Generating Invoice...
            </>
          ) : (
            <>
              <CheckCircle2 size={19} />
              Generate Invoice
            </>
          )}
        </button>

      </form>

      <WorkerBottomnav />
    </div>
  );
}

export default WorkerPayment;
