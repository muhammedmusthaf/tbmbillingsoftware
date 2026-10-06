import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";
import "../styles/payment.css";

import {
  Bell,
  Banknote,
  QrCode,
  BookUser,
  Check,
  ChevronDown,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { QRCodeSVG } from "qrcode.react";
import OwnerBottomNav from "../components/OwnerBottomnav";




const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL =
    import.meta.env.VITE_API_URL;

  const token =
    localStorage.getItem("token");


  // ==========================================
  // USER
  // ==========================================

  let storedUser = {};

  try {
    storedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    storedUser = {};
  }


  // ==========================================
  // BILLING DATA
  // ==========================================

  const cart =
    location.state?.cart || [];

  const totals =
    location.state?.totals || {
      subtotal: 0,
      gstAmount: 0,
      grandTotal: 0,
    };


  // ==========================================
  // STATE
  // ==========================================

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [cashReceived, setCashReceived] =
    useState("");

  const [upiReference, setUpiReference] =
    useState("");

  const [customers, setCustomers] =
    useState([]);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [creditNote, setCreditNote] =
    useState("");

  const [settings, setSettings] =
    useState({
      shopName: "",
      logo: "",
      upiId: "",
      upiName: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================
  // AUTH CONFIG
  // ==========================================

  const authConfig = {
    headers: {
      Authorization:
        `Bearer ${token}`,
    },
  };


  // ==========================================
  // FETCH SETTINGS
  // ==========================================

  const fetchSettings = async () => {
    const response =
      await axios.get(
        `${API_URL}/api/settings`,
        authConfig
      );

    const data =
      response.data.settings ||
      response.data;

    setSettings({
      shopName:
        data.shopName || "",

      logo:
        data.logo || "",

      upiId:
        data.upiId || "",

      upiName:
        data.upiName ||
        data.shopName ||
        "",
    });
  };


  // ==========================================
  // FETCH CUSTOMERS
  // ==========================================

  const fetchCustomers = async () => {
    const response =
      await axios.get(
        `${API_URL}/api/customers`,
        authConfig
      );

    const data =
      response.data;

    const customerList =
      Array.isArray(data)
        ? data
        : data.customers || [];

    setCustomers(customerList);
  };


  // ==========================================
  // LOAD PAGE
  // ==========================================

  useEffect(() => {
    const loadPayment = async () => {
      try {
        setLoading(true);

        await Promise.all([
          fetchSettings(),
          fetchCustomers(),
        ]);

      } catch (err) {

        console.error(
          "PAYMENT LOAD ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load payment details."
        );

      } finally {
        setLoading(false);
      }
    };


    if (cart.length === 0) {
      navigate(
        "/billing",
        { replace: true }
      );

      return;
    }


    loadPayment();

  }, []);


  // ==========================================
  // SELECTED CUSTOMER
  // ==========================================

  const selectedCustomer =
    useMemo(() => {
      return customers.find(
        (customer) =>
          customer._id ===
          selectedCustomerId
      );
    }, [
      customers,
      selectedCustomerId,
    ]);


  // ==========================================
  // CURRENCY
  // ==========================================

  const formatCurrency = (
    amount = 0
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(
      Number(amount || 0)
    );
  };


  // ==========================================
  // CASH CHANGE
  // ==========================================

  const cashChange =
    Math.max(
      Number(cashReceived || 0) -
        Number(totals.grandTotal || 0),
      0
    );


  // ==========================================
  // UPI LINK
  // ==========================================

  const upiLink =
    useMemo(() => {
      if (!settings.upiId) {
        return "";
      }

      const params =
        new URLSearchParams({
          pa: settings.upiId,
          pn:
            settings.upiName ||
            settings.shopName,
          am: Number(
            totals.grandTotal || 0
          ).toFixed(2),
          cu: "INR",
          tn: "Bill Payment",
        });

      return `upi://pay?${params.toString()}`;

    }, [
      settings,
      totals.grandTotal,
    ]);


  // ==========================================
  // SHOP INITIAL
  // ==========================================

  const shopInitial =
    settings.shopName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "";


  // ==========================================
  // CHANGE PAYMENT METHOD
  // ==========================================

  const changePaymentMethod = (
    method
  ) => {
    setPaymentMethod(method);
    setError("");
  };


  // ==========================================
  // VALIDATE PAYMENT
  // ==========================================

  const validatePayment = () => {

    if (cart.length === 0) {
      setError(
        "No bill items found."
      );

      return false;
    }


    if (paymentMethod === "cash") {

      if (!cashReceived) {
        setError(
          "Enter the amount received."
        );

        return false;
      }


      if (
        Number(cashReceived) <
        Number(totals.grandTotal)
      ) {
        setError(
          "Received amount is less than the bill amount."
        );

        return false;
      }
    }


    if (paymentMethod === "upi") {

      if (!settings.upiId) {
        setError(
          "UPI ID is not configured in shop settings."
        );

        return false;
      }
    }


    if (paymentMethod === "credit") {

      if (!selectedCustomerId) {
        setError(
          "Select a customer for credit billing."
        );

        return false;
      }
    }


    return true;
  };


  // ==========================================
  // CREATE INVOICE
  // ==========================================

  const createInvoice = async () => {

    if (!validatePayment()) {
      return;
    }


    try {
      setSubmitting(true);
      setError("");


      // ======================================
      // INVOICE ITEMS
      // ======================================

      const invoiceItems =
        cart.map((item) => ({
          productId:
            item.productId,

          quantity:
            Number(item.quantity),

          discount: 0,
        }));


      // ======================================
      // BASIC PAYLOAD
      // ======================================

      const payload = {
        items:
          invoiceItems,

        paymentMethod:
          paymentMethod,

        notes:
          paymentMethod === "credit"
            ? creditNote.trim()
            : "",
      };


      // ======================================
      // CUSTOMER
      // ======================================

      if (selectedCustomerId) {
        payload.customerId =
          selectedCustomerId;
      }


      // ======================================
      // CASH
      // ======================================

      if (paymentMethod === "cash") {

        payload.paidAmount =
          Number(
            totals.grandTotal
          );

        payload.cashAmount =
          Number(
            totals.grandTotal
          );
      }


      // ======================================
      // UPI
      // ======================================

      if (paymentMethod === "upi") {

        payload.paidAmount =
          Number(
            totals.grandTotal
          );

        payload.upiAmount =
          Number(
            totals.grandTotal
          );

        payload.upiReference =
          upiReference.trim();
      }


      // ======================================
      // CREDIT
      // ======================================

      if (paymentMethod === "credit") {

        payload.paidAmount = 0;

        if (dueDate) {
          payload.dueDate =
            dueDate;
        }
      }


      // ======================================
      // CREATE REAL INVOICE
      // ======================================

      const response =
        await axios.post(
          `${API_URL}/api/invoices`,
          payload,
          authConfig
        );


      const createdInvoice =
        response.data.invoice ||
        response.data;


      // ======================================
      // SUCCESS
      // ======================================

      navigate(
        `/bills/${createdInvoice._id}`,
        {
          replace: true,

          state: {
            invoice:
              createdInvoice,

            newlyCreated:
              true,
          },
        }
      );

    } catch (err) {

      console.error(
        "CREATE INVOICE ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to generate invoice."
      );

    } finally {

      setSubmitting(false);

    }
  };


  // ==========================================
  // BACK TO BILL
  // ==========================================

  const backToBill = () => {
    navigate(-1);
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="payment-loading-page">

        <div className="payment-loading-text">
          Loading payment...
        </div>

      </div>
    );
  }


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="payment-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="payment-header">

        <div className="payment-brand">

          <div className="payment-brand-logo">

            {settings.logo ? (

              <img
                src={settings.logo}
                alt={settings.shopName}
                className="payment-brand-logo-image"
              />

            ) : (

              <span className="payment-brand-logo-letter">
                {shopInitial}
              </span>

            )}

          </div>


          <div className="payment-brand-info">

            <h2 className="payment-brand-name">
              {settings.shopName}
            </h2>

            <span className="payment-brand-type">
              POS
            </span>

          </div>

        </div>


        <div className="payment-header-actions">

          <button
            type="button"
            className="payment-notification-button"
            onClick={() =>
              navigate(
                "/notifications"
              )
            }
          >
            <Bell size={22} />
          </button>


          <div className="payment-user-role">

            {storedUser?.role ===
            "owner"
              ? "Owner"
              : "Worker"}

          </div>

        </div>

      </header>


      {/* =====================================
          TITLE
      ===================================== */}

      <section className="payment-title-section">

        <h1 className="payment-page-title">
          Payment
        </h1>

      </section>


      {/* =====================================
          AMOUNT DUE
      ===================================== */}

      <section className="payment-amount-card">

        <span className="payment-amount-label">
          AMOUNT DUE
        </span>


        <h2 className="payment-amount-value">

          {formatCurrency(
            totals.grandTotal
          )}

        </h2>


        <p className="payment-amount-description">

          {selectedCustomer
            ? selectedCustomer.name
            : "Walk-in Customer"}

        </p>

      </section>


      {/* =====================================
          PAYMENT METHOD
      ===================================== */}

      <section className="payment-method-section">

        <h2 className="payment-section-title">
          Select payment method
        </h2>


        <div className="payment-method-tabs">


          {/* CASH */}

          <button
            type="button"
            className={`payment-method-button ${
              paymentMethod === "cash"
                ? "payment-method-active"
                : ""
            }`}
            onClick={() =>
              changePaymentMethod(
                "cash"
              )
            }
          >

            <Banknote size={20} />

            <span>
              Cash
            </span>

          </button>


          {/* UPI */}

          <button
            type="button"
            className={`payment-method-button ${
              paymentMethod === "upi"
                ? "payment-method-active"
                : ""
            }`}
            onClick={() =>
              changePaymentMethod(
                "upi"
              )
            }
          >

            <QrCode size={20} />

            <span>
              UPI
            </span>

          </button>


          {/* CREDIT */}

          <button
            type="button"
            className={`payment-method-button ${
              paymentMethod === "credit"
                ? "payment-method-active"
                : ""
            }`}
            onClick={() =>
              changePaymentMethod(
                "credit"
              )
            }
          >

            <BookUser size={20} />

            <span>
              Credit
            </span>

          </button>

        </div>

      </section>


      {/* =====================================
          CASH PAYMENT
      ===================================== */}

      {paymentMethod === "cash" && (

        <section className="payment-cash-card">

          <h2 className="payment-card-title">
            Cash tender
          </h2>


          <label
            className="payment-field-label"
            htmlFor="cashReceived"
          >
            Amount received
          </label>


          <div className="payment-cash-input-wrapper">

            <span className="payment-currency-symbol">
              ₹
            </span>

            <input
              id="cashReceived"
              type="number"
              min="0"
              step="0.01"
              className="payment-cash-input"
              placeholder="0"
              value={cashReceived}
              onChange={(e) =>
                setCashReceived(
                  e.target.value
                )
              }
            />

          </div>


          <div className="payment-change-row">

            <span className="payment-change-label">
              Change to return
            </span>


            <strong className="payment-change-value">

              {formatCurrency(
                cashChange
              )}

            </strong>

          </div>

        </section>

      )}


      {/* =====================================
          UPI PAYMENT
      ===================================== */}

      {paymentMethod === "upi" && (

        <section className="payment-upi-card">

          <h2 className="payment-card-title">
            Scan to pay
          </h2>


          {upiLink ? (

            <>

              <div className="payment-qr-wrapper">

                <QRCodeSVG
                  value={upiLink}
                  size={210}
                  level="M"
                  className="payment-qr-code"
                />

              </div>


              <strong className="payment-upi-id">
                {settings.upiId}
              </strong>


              <span className="payment-upi-status">
                WAITING FOR PAYMENT
              </span>


              <input
                type="text"
                className="payment-upi-reference-input"
                placeholder="Reference number (optional)"
                value={upiReference}
                onChange={(e) =>
                  setUpiReference(
                    e.target.value
                  )
                }
              />

            </>

          ) : (

            <div className="payment-upi-not-configured">

              UPI payment is not configured.
              Add the UPI ID in Settings.

            </div>

          )}

        </section>

      )}


      {/* =====================================
          CREDIT PAYMENT
      ===================================== */}

      {paymentMethod === "credit" && (

        <section className="payment-credit-card">

          <h2 className="payment-card-title">
            Credit ledger
          </h2>


          {/* CUSTOMER */}

          <div className="payment-credit-field">

            <label
              className="payment-field-label"
              htmlFor="creditCustomer"
            >
              Customer
            </label>


            <div className="payment-customer-select-wrapper">

              <select
                id="creditCustomer"
                className="payment-customer-select"
                value={
                  selectedCustomerId
                }
                onChange={(e) =>
                  setSelectedCustomerId(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select customer
                </option>


                {customers.map(
                  (customer) => (

                    <option
                      key={
                        customer._id
                      }
                      value={
                        customer._id
                      }
                    >

                      {customer.name}

                      {customer.phone
                        ? ` - ${customer.phone}`
                        : ""}

                    </option>

                  )
                )}

              </select>


              <ChevronDown
                size={19}
                className="payment-customer-select-icon"
              />

            </div>

          </div>


          {/* DUE DATE */}

          <div className="payment-credit-field">

            <label
              className="payment-field-label"
              htmlFor="creditDueDate"
            >
              Due date
            </label>


            <input
              id="creditDueDate"
              type="date"
              className="payment-credit-date-input"
              value={dueDate}
              onChange={(e) =>
                setDueDate(
                  e.target.value
                )
              }
            />

          </div>


          {/* NOTE */}

          <div className="payment-credit-field">

            <label
              className="payment-field-label"
              htmlFor="creditNote"
            >
              Note
            </label>


            <textarea
              id="creditNote"
              className="payment-credit-note"
              placeholder="Optional note"
              value={creditNote}
              onChange={(e) =>
                setCreditNote(
                  e.target.value
                )
              }
            />

          </div>

        </section>

      )}


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="payment-error-message">
          {error}
        </div>

      )}


      {/* =====================================
          ACTIONS
      ===================================== */}

      <section className="payment-actions">


        <button
          type="button"
          className="payment-confirm-button"
          disabled={
            submitting ||
            (
              paymentMethod === "upi" &&
              !upiLink
            )
          }
          onClick={
            createInvoice
          }
        >

          <Check size={22} />


          <span>

            {submitting
              ? "Generating invoice..."
              : paymentMethod === "upi"
                ? "Payment received"
                : "Confirm & generate invoice"}

          </span>

        </button>


        <button
          type="button"
          className="payment-back-button"
          disabled={submitting}
          onClick={
            backToBill
          }
        >

          Back to bill

        </button>

      </section>


      {/* =====================================
          OWNER BOTTOM NAV
      ===================================== */}

      <OwnerBottomNav />


    </div>
  );
};


export default Payment;