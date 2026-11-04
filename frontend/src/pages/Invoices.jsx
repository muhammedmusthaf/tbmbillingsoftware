import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  Printer,
  Share2,
  Plus,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { QRCodeSVG } from "qrcode.react";

import "../styles/invoice.css";

import OwnerBottomNav from "../components/OwnerBottomnav";


const Invoices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const API_URL =
    import.meta.env.VITE_API_URL;

  const token =
    localStorage.getItem("token");


  // ==========================================
  // STATE
  // ==========================================

  const [invoice, setInvoice] =
    useState(
      location.state?.invoice || null
    );

  const [settings, setSettings] =
    useState({
      shopName: "",
      logo: "",
      phone: "",
      address: "",
      gstin: "",
      upiId: "",
      upiName: "",
      invoiceFooter: "",
    });

  const [loading, setLoading] =
    useState(
      !location.state?.invoice
    );

  const [error, setError] =
    useState("");


  // ==========================================
  // AUTH
  // ==========================================

  const authConfig = {
    headers: {
      Authorization:
        `Bearer ${token}`,
    },
  };


  // ==========================================
  // FETCH INVOICE
  // ==========================================

  const fetchInvoice = async () => {
    const response =
      await axios.get(
        `${API_URL}/api/invoices/${id}`,
        authConfig
      );

    const data =
      response.data.invoice ||
      response.data;

    setInvoice(data);
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

      phone:
        data.phone || "",

      address:
        data.address || "",

      gstin:
        data.gstin || "",

      upiId:
        data.upiId || "",

      upiName:
        data.upiName || "",

      invoiceFooter:
        data.invoiceFooter || "",
    });
  };


  // ==========================================
  // LOAD PAGE
  // ==========================================

  useEffect(() => {
    const loadInvoicePage = async () => {
      try {
        setLoading(true);
        setError("");

        const requests = [
          fetchSettings(),
        ];

        if (!invoice) {
          requests.push(
            fetchInvoice()
          );
        }

        await Promise.all(requests);

      } catch (err) {
        console.error(
          "INVOICE PAGE ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load invoice."
        );

      } finally {
        setLoading(false);
      }
    };

    loadInvoicePage();
  }, [id]);


  // ==========================================
  // FORMAT CURRENCY
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
  // FORMAT DATE
  // ==========================================

  const formatInvoiceDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(dateValue)
    );
  };


  // ==========================================
  // GST
  // ==========================================

  const hasGST =
    Number(invoice?.gstAmount || 0) > 0;


  const gstLabel =
    useMemo(() => {
      if (!invoice?.items?.length) {
        return "GST";
      }

      const rates = [
        ...new Set(
          invoice.items
            .map((item) =>
              Number(item.gst || 0)
            )
            .filter(
              (rate) => rate > 0
            )
        ),
      ];

      if (rates.length === 1) {
        return `GST (${rates[0]}%)`;
      }

      return "GST";
    }, [invoice]);


  // ==========================================
  // UPI QR
  // ==========================================

  const upiPaymentUrl =
    useMemo(() => {
      if (
        !settings.upiId ||
        !invoice
      ) {
        return "";
      }

      const params =
        new URLSearchParams({
          pa: settings.upiId,
          pn:
            settings.upiName ||
            settings.shopName ||
            "Merchant",
          am: Number(
            invoice.grandTotal || 0
          ).toFixed(2),
          cu: "INR",
          tn:
            invoice.invoiceNumber ||
            "Invoice Payment",
        });

      return `upi://pay?${params.toString()}`;
    }, [
      settings.upiId,
      settings.upiName,
      settings.shopName,
      invoice,
    ]);


  // ==========================================
  // PRINT
  // ==========================================

  const handlePrint = () => {
    window.print();
  };


  // ==========================================
  // SHARE
  // ==========================================

  const handleShare = async () => {
    if (!invoice) {
      return;
    }

    const shareText =
      `${settings.shopName || "Invoice"}\n` +
      `Invoice: ${invoice.invoiceNumber}\n` +
      `Total: ${formatCurrency(
        invoice.grandTotal
      )}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            `Invoice ${invoice.invoiceNumber}`,
          text: shareText,
        });

        return;
      }

      await navigator.clipboard.writeText(
        shareText
      );

      alert(
        "Invoice details copied."
      );

    } catch (err) {
      console.error(
        "SHARE ERROR:",
        err
      );
    }
  };


  // ==========================================
  // NEW BILL
  // ==========================================

  const startNewBill = () => {
    navigate(
      "/billing",
      {
        replace: true,
      }
    );
  };


  // ==========================================
  // SHOP INITIAL
  // ==========================================

  const shopInitial =
    settings.shopName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "";

  // ==========================================
  // auto print
  // ==========================================
     useEffect(() => {
  if (
    !loading &&
    !error &&
    invoice &&
    location.state?.printRequested
  ) {
    // Clear the print request before opening the dialog
    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        printRequested: false,
      },
    });

    const timer = setTimeout(() => {
      window.print();
    }, 300);

    return () => clearTimeout(timer);
  }
}, [
  loading,
  error,
  invoice,
  location.state?.printRequested,
  location.pathname,
  navigate,
]);  

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="invoice-loading-page">
        Loading invoice...
      </div>
    );
  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error || !invoice) {
    return (
      <div className="invoice-error-page">

        <p>
          {error ||
            "Invoice not found."}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/billing")
          }
        >
          Back to billing
        </button>

      </div>
    );
  }


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="invoice-page">


      {/* =====================================
          TITLE
      ===================================== */}

      <header className="invoice-top-header">

        <h1 className="invoice-page-title">
          Invoice ready
        </h1>

      </header>


      {/* =====================================
          STATUS / ACTIONS
      ===================================== */}

      <section className="invoice-action-section">

        <span
          className={`invoice-status-badge invoice-status-${invoice.paymentStatus}`}
        >
          {invoice.paymentStatus
            ?.toUpperCase()}
        </span>


        <div className="invoice-action-buttons">

          <button
            type="button"
            className="invoice-action-button"
            onClick={handlePrint}
          >
            <Printer size={22} />

            <span>
              Print
            </span>
          </button>


          <button
            type="button"
            className="invoice-action-button"
            onClick={handleShare}
          >
            <Share2 size={22} />

            <span>
              Share
            </span>
          </button>

        </div>

      </section>


      {/* =====================================
          INVOICE PAPER
      ===================================== */}

      <main className="invoice-paper">


        {/* SHOP */}

        <section className="invoice-shop-section">

          <div className="invoice-shop-brand">

            <div className="invoice-shop-logo">

              {settings.logo ? (

                <img
                  src={settings.logo}
                  alt={settings.shopName}
                  className="invoice-shop-logo-image"
                />

              ) : (

                <span className="invoice-shop-logo-letter">
                  {shopInitial}
                </span>

              )}

            </div>


            <div className="invoice-shop-info">

              <h2 className="invoice-shop-name">
                {settings.shopName}
              </h2>

              {settings.address && (
                <p className="invoice-shop-address">
                  {settings.address}
                </p>
              )}

              {settings.phone && (
                <p className="invoice-shop-phone">
                  {settings.phone}
                </p>
              )}

              {settings.gstin && (
                <p className="invoice-shop-gstin">
                  GSTIN: {settings.gstin}
                </p>
              )}

            </div>

          </div>

        </section>


        {/* INVOICE META */}

        <section className="invoice-meta-section">

          <div className="invoice-meta-block">

            <span className="invoice-meta-label">
              INVOICE
            </span>

            <strong className="invoice-meta-value">
              {invoice.invoiceNumber}
            </strong>

          </div>


          <div className="invoice-meta-block invoice-meta-date">

            <span className="invoice-meta-label">
              DATE
            </span>

            <strong className="invoice-meta-value">
              {formatInvoiceDate(
                invoice.invoiceDate ||
                  invoice.createdAt
              )}
            </strong>

          </div>

        </section>


        {/* CUSTOMER */}

        <section className="invoice-customer-section">

          <p className="invoice-customer-text">

            Billed to{" "}

            <strong>
              {invoice.customerName ||
                "Walk-in Customer"}
            </strong>

          </p>


          {invoice.customerPhone && (

            <p className="invoice-customer-phone">
              {invoice.customerPhone}
            </p>

          )}

        </section>


        {/* =====================================
            ITEMS
        ===================================== */}

        <section className="invoice-items-section">

          <div className="invoice-items-header">

            <span>
              ITEM
            </span>

            <span>
              QTY
            </span>

            <span>
              RATE
            </span>

            <span>
              AMT
            </span>

          </div>


          <div className="invoice-items-list">

            {invoice.items?.map(
              (item, index) => (

                <div
                  className="invoice-item-row"
                  key={
                    item._id ||
                    `${item.product}-${index}`
                  }
                >

                  <div className="invoice-item-name">

                    <span>
                      {item.productName}
                    </span>

                    {hasGST &&
                      Number(item.gst) > 0 && (

                        <small className="invoice-item-gst">
                          GST {item.gst}%
                        </small>

                      )}

                  </div>


                  <span className="invoice-item-quantity">
                    {item.quantity}
                  </span>


                  <span className="invoice-item-rate">
                    {formatCurrency(
                      item.rate
                    )}
                  </span>


                  <span className="invoice-item-amount">
                    {formatCurrency(
                      item.total
                    )}
                  </span>

                </div>

              )
            )}

          </div>

        </section>


        {/* =====================================
            TOTALS
        ===================================== */}

        <section className="invoice-total-section">

          <div className="invoice-total-row">

            <span>
              Subtotal
            </span>

            <strong>
              {formatCurrency(
                invoice.subtotal
              )}
            </strong>

          </div>


          {Number(
            invoice.discountAmount || 0
          ) > 0 && (

            <div className="invoice-total-row">

              <span>
                Discount
              </span>

              <strong>
                -
                {formatCurrency(
                  invoice.discountAmount
                )}
              </strong>

            </div>

          )}


          {/* GST ONLY IF ACTUALLY APPLIED */}

          {hasGST && (

            <div className="invoice-total-row">

              <span>
                {gstLabel}
              </span>

              <strong>
                {formatCurrency(
                  invoice.gstAmount
                )}
              </strong>

            </div>

          )}


          {Number(
            invoice.roundOff || 0
          ) !== 0 && (

            <div className="invoice-total-row">

              <span>
                Round off
              </span>

              <strong>
                {formatCurrency(
                  invoice.roundOff
                )}
              </strong>

            </div>

          )}


          <div className="invoice-grand-total-row">

            <strong>
              TOTAL
            </strong>

            <strong className="invoice-grand-total-value">
              {formatCurrency(
                invoice.grandTotal
              )}
            </strong>

          </div>

        </section>


        {/* =====================================
            UPI QR
        ===================================== */}

        {upiPaymentUrl && (

          <section className="invoice-upi-section">

            <div className="invoice-upi-qr">

              <QRCodeSVG
                value={upiPaymentUrl}
                size={62}
              />

            </div>


            <div className="invoice-upi-info">

              <p>
                Scan to pay via UPI
              </p>

              <span>
                Thank you for shopping with us.
              </span>

            </div>

          </section>

        )}


        {/* =====================================
            FOOTER
        ===================================== */}

        <footer className="invoice-paper-footer">

          {settings.invoiceFooter ? (

            <p>
              {settings.invoiceFooter}
            </p>

          ) : (

            <p>
              Thank you for your purchase.
            </p>

          )}

        </footer>

      </main>


      {/* =====================================
          NEW BILL
      ===================================== */}

      <button
        type="button"
        className="invoice-new-bill-button"
        onClick={startNewBill}
      >

        <Plus size={23} />

        <span>
          Start a new bill
        </span>

      </button>


      {/* =====================================
          OWNER NAVIGATION
      ===================================== */}

      <OwnerBottomNav />

    </div>
  );
};

export default Invoices;