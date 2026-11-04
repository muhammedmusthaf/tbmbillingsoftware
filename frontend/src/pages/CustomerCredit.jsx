
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Wallet,
  Receipt,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Banknote,
  History,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/credit.css";


import OwnerBottomNav from "../components/OwnerBottomnav";

const API_URL = import.meta.env.VITE_API_URL;

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const CustomerCredit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // ==========================================
  // LOAD CUSTOMER / INVOICES / PAYMENTS
  // ==========================================

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const [customerRes, invoiceRes, paymentRes] =
        await Promise.all([
          axios.get(
            `${API_URL}/api/customers/${id}`,
            getConfig()
          ),
          axios.get(
            `${API_URL}/api/invoices`,
            getConfig()
          ),
          axios.get(
            `${API_URL}/api/credit/customer/${id}`,
            getConfig()
          ),
        ]);

      const customerData =
        customerRes.data.customer || customerRes.data;

      const invoiceData = Array.isArray(invoiceRes.data)
        ? invoiceRes.data
        : invoiceRes.data.invoices || [];

      const paymentData = Array.isArray(paymentRes.data)
        ? paymentRes.data
        : paymentRes.data.payments || [];

      const customerInvoices = invoiceData.filter((invoice) => {
        const customerId =
          typeof invoice.customer === "object"
            ? invoice.customer?._id
            : invoice.customer;

        return String(customerId || "") === String(id);
      });

      setCustomer(customerData);
      setInvoices(customerInvoices);
      setPayments(paymentData);
    } catch (err) {
      console.error("CUSTOMER CREDIT ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load customer credit details."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // ==========================================
  // UNPAID INVOICES
  // ==========================================

  const unpaidInvoices = useMemo(() => {
    return invoices
      .filter(
        (invoice) =>
          invoice.status === "completed" &&
          Number(invoice.creditAmount || 0) > 0
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate || a.invoiceDate) -
          new Date(b.dueDate || b.invoiceDate)
      );
  }, [invoices]);

  const selectedInvoice = unpaidInvoices.find(
    (invoice) => invoice._id === selectedInvoiceId
  );

  const selectedBalance = Number(
    selectedInvoice?.creditAmount || 0
  );

  const totalOutstanding = Number(
    customer?.creditBalance || 0
  );

  // ==========================================
  // PAYMENT HISTORY
  // ==========================================

  const sortedPayments = useMemo(() => {
    return [...payments].sort(
      (a, b) =>
        new Date(b.paymentDate || b.createdAt) -
        new Date(a.paymentDate || a.createdAt)
    );
  }, [payments]);

  // ==========================================
  // RECEIVE PAYMENT
  // ==========================================

  const handleReceivePayment = async (e) => {
    e.preventDefault();

    if (!selectedInvoice) {
      setError("Please select an unpaid invoice.");
      return;
    }

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      !Number.isInteger(paymentAmount * 100)
    ) {
      setError("Enter a valid amount with up to 2 decimal places.");
      return;
    }

    if (paymentAmount > selectedBalance + 0.001) {
      setError(
        `Payment cannot exceed ${formatCurrency(selectedBalance)}.`
      );
      return;
    }

    if (paymentMethod === "upi" && !referenceNumber.trim()) {
      setError("Enter the UPI transaction reference.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await axios.post(
        `${API_URL}/api/credit/payment`,
        {
          invoiceId: selectedInvoice._id,
          amount: paymentAmount,
          paymentMethod,
          referenceNumber:
            paymentMethod === "upi"
              ? referenceNumber.trim()
              : "",
          notes: notes.trim(),
        },
        getConfig()
      );

      setSelectedInvoiceId("");
      setAmount("");
      setReferenceNumber("");
      setNotes("");
      setPaymentMethod("cash");

      await loadData(false);

      setSuccess("Credit payment recorded successfully.");
    } catch (err) {
      console.error("RECEIVE PAYMENT ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to record credit payment."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="credit-loading-page">
        Loading credit details...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="credit-error-page">
        <p>{error || "Customer not found."}</p>
        <button onClick={() => navigate("/customers")}>
          Back to customers
        </button>
      </div>
    );
  }

  return (
    <div className="credit-page">

      {/* HEADER */}
      <header className="credit-header">
        <button
          type="button"
          className="credit-back-button"
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft size={23} />
        </button>

        <div className="credit-header-info">
          <h1>Customer credit</h1>
          <p>{customer.name}</p>
        </div>
      </header>

      {/* CUSTOMER SUMMARY */}
      <section className="credit-summary-card">
        <div className="credit-summary-heading">
          <Wallet size={25} />
          <span>OUTSTANDING BALANCE</span>
        </div>

        <strong className="credit-outstanding-amount">
          {formatCurrency(totalOutstanding)}
        </strong>

        <div className="credit-summary-details">
          <div>
            <span>Lifetime purchases</span>
            <strong>
              {formatCurrency(customer.totalPurchases)}
            </strong>
          </div>

          <div>
            <span>Total paid</span>
            <strong>
              {formatCurrency(customer.totalPaid)}
            </strong>
          </div>
        </div>
      </section>

      {/* CUSTOMER INFORMATION */}
      <section className="credit-customer-card">
        <div className="credit-customer-avatar">
          {customer.name?.charAt(0).toUpperCase()}
        </div>

        <div className="credit-customer-info">
          <h2>{customer.name}</h2>

          {customer.phone && <p>{customer.phone}</p>}

          {customer.address && <p>{customer.address}</p>}
        </div>
      </section>

      {/* UNPAID INVOICES */}
      <section className="credit-invoices-section">
        <div className="credit-section-heading">
          <Receipt size={22} />
          <h2>Unpaid invoices</h2>
          <span>{unpaidInvoices.length}</span>
        </div>

        {unpaidInvoices.length === 0 ? (
          <div className="credit-empty-invoices">
            <CheckCircle2 size={32} />
            <p>No unpaid invoices.</p>
          </div>
        ) : (
          <div className="credit-invoice-list">
            {unpaidInvoices.map((invoice) => {
              const dueDate = invoice.dueDate
                ? new Date(invoice.dueDate)
                : null;

              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (dueDate) {
                dueDate.setHours(0, 0, 0, 0);
              }

              const overdue = dueDate && dueDate < today;

              return (
                <button
                  type="button"
                  key={invoice._id}
                  className={`credit-invoice-card ${
                    selectedInvoiceId === invoice._id
                      ? "credit-invoice-selected"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedInvoiceId(invoice._id);
                    setAmount(
                      Number(invoice.creditAmount).toFixed(2)
                    );
                    setError("");
                    setSuccess("");
                  }}
                >
                  <div className="credit-invoice-info">
                    <strong>{invoice.invoiceNumber}</strong>

                    <span>
                      {formatDate(
                        invoice.invoiceDate || invoice.createdAt
                      )}
                    </span>

                    {invoice.dueDate && (
                      <span className="credit-invoice-due">
                        <CalendarDays size={14} />
                        Due: {formatDate(invoice.dueDate)}
                      </span>
                    )}
                  </div>

                  <div className="credit-invoice-amount">
                    <strong>
                      {formatCurrency(invoice.creditAmount)}
                    </strong>

                    <span
                      className={
                        overdue
                          ? "credit-status-overdue"
                          : "credit-status-pending"
                      }
                    >
                      {overdue ? "OVERDUE" : "PENDING"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* RECEIVE PAYMENT */}
      {unpaidInvoices.length > 0 && (
        <section className="credit-payment-section">
          <div className="credit-section-heading">
            <Wallet size={22} />
            <h2>Receive payment</h2>
          </div>

          <form
            className="credit-payment-form"
            onSubmit={handleReceivePayment}
          >
            <div className="credit-field">
              <label>Select invoice *</label>

              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  const invoice = unpaidInvoices.find(
                    (item) => item._id === e.target.value
                  );

                  setSelectedInvoiceId(e.target.value);
                  setAmount(
                    invoice
                      ? Number(invoice.creditAmount).toFixed(2)
                      : ""
                  );
                }}
              >
                <option value="">Choose invoice</option>

                {unpaidInvoices.map((invoice) => (
                  <option key={invoice._id} value={invoice._id}>
                    {invoice.invoiceNumber} —{" "}
                    {formatCurrency(invoice.creditAmount)}
                  </option>
                ))}
              </select>
            </div>

            {selectedInvoice && (
              <div className="credit-selected-balance">
                <span>Invoice outstanding</span>
                <strong>
                  {formatCurrency(selectedBalance)}
                </strong>
              </div>
            )}

            <div className="credit-field">
              <label>Amount received *</label>

              <div className="credit-money-input">
                <span>₹</span>

                <input
                  type="number"
                  min="0.01"
                  max={selectedBalance || undefined}
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="credit-field">
              <label>Payment method</label>

              <div className="credit-method-buttons">
                <button
                  type="button"
                  className={`credit-method-button ${
                    paymentMethod === "cash"
                      ? "credit-method-active"
                      : ""
                  }`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote size={20} />
                  Cash
                </button>

                <button
                  type="button"
                  className={`credit-method-button ${
                    paymentMethod === "upi"
                      ? "credit-method-active"
                      : ""
                  }`}
                  onClick={() => setPaymentMethod("upi")}
                >
                  <CreditCard size={20} />
                  UPI
                </button>
              </div>
            </div>

            {paymentMethod === "upi" && (
              <div className="credit-field">
                <label>UPI reference *</label>

                <input
                  type="text"
                  placeholder="Transaction reference number"
                  value={referenceNumber}
                  onChange={(e) =>
                    setReferenceNumber(e.target.value)
                  }
                />
              </div>
            )}

            <div className="credit-field">
              <label>Notes</label>

              <textarea
                rows={3}
                placeholder="Optional payment notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="credit-submit-button"
              disabled={saving || !selectedInvoice}
            >
              <CheckCircle2 size={21} />
              {saving ? "Recording..." : "Receive payment"}
            </button>
          </form>
        </section>
      )}

      {error && (
        <div className="credit-error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="credit-success-message">
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}

      {/* PAYMENT HISTORY */}
      <section className="credit-history-section">
        <div className="credit-section-heading">
          <History size={22} />
          <h2>Payment history</h2>
        </div>

        {sortedPayments.length === 0 ? (
          <div className="credit-empty-history">
            No credit repayments recorded yet.
          </div>
        ) : (
          <div className="credit-history-list">
            {sortedPayments.map((payment) => (
              <div
                className="credit-history-card"
                key={payment._id}
              >
                <div className="credit-history-icon">
                  {payment.paymentMethod === "upi" ? (
                    <CreditCard size={21} />
                  ) : (
                    <Banknote size={21} />
                  )}
                </div>

                <div className="credit-history-info">
                  <strong>
                    {payment.paymentMethod?.toUpperCase()}
                  </strong>

                  <span>
                    {formatDate(
                      payment.paymentDate || payment.createdAt
                    )}
                  </span>

                  {payment.invoice?.invoiceNumber && (
                    <span>
                      {payment.invoice.invoiceNumber}
                    </span>
                  )}

                  {payment.referenceNumber && (
                    <span>
                      Ref: {payment.referenceNumber}
                    </span>
                  )}
                </div>

                <strong className="credit-history-amount">
                  +{formatCurrency(payment.amount)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <OwnerBottomNav />
    </div>
  );
};

export default CustomerCredit;
