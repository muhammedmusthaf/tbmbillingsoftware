import React, {
  useEffect,
  useState,
} from "react";

import "../styles/home.css";

import axios from "axios";

import {
  Bell,
  TrendingUp,
  ReceiptText,
  WalletCards,
  TriangleAlert,
  Plus,
  PackagePlus,
  UserRoundPlus,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import OwnerBottomNav from "../components/OwnerBottomnav";



// ==========================================
// HOME PAGE
// ==========================================

const Home = () => {
  const navigate = useNavigate();

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
      localStorage.getItem("user") ||
        "{}"
    );
  } catch {
    storedUser = {};
  }


  const role =
    storedUser?.role || "";

  const isOwner =
    role === "owner";


  // ==========================================
  // DASHBOARD STATE
  // ==========================================

  const [dashboard, setDashboard] =
    useState({
      todaySales: 0,
      billsToday: 0,
      outstandingCredit: 0,
      lowStockCount: 0,
      recentInvoices: [],
      lowStockProducts: [],
    });


  // ==========================================
  // SHOP SETTINGS
  // ==========================================

  const [settings, setSettings] =
    useState({
      shopName: "",
      logo: "",
      address: "",
    });


  // ==========================================
  // PAGE STATE
  // ==========================================

  const [loading, setLoading] =
    useState(true);

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
  // FETCH DASHBOARD
  // ==========================================

  const fetchDashboard = async () => {
    const response =
      await axios.get(
        `${API_URL}/api/dashboard`,
        authConfig
      );

    const data =
      response.data;


    setDashboard({
      todaySales:
        Number(
          data.todaySales ?? 0
        ),

      billsToday:
        Number(
          data.billsToday ?? 0
        ),

      outstandingCredit:
        Number(
          data.outstandingCredit ??
            data.totalOutstandingCredit ??
            0
        ),

      lowStockCount:
        Number(
          data.lowStockCount ?? 0
        ),

      recentInvoices:
        data.recentInvoices || [],

      lowStockProducts:
        data.lowStockProducts || [],
    });
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

      address:
        data.address || "",
    });
  };


  // ==========================================
  // LOAD HOME
  // ==========================================

  const loadHome = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchDashboard(),
        fetchSettings(),
      ]);

    } catch (err) {

      console.error(
        "HOME PAGE ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load home page"
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadHome();
  }, []);


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
        maximumFractionDigits: 0,
      }
    ).format(
      Number(amount || 0)
    );
  };


  // ==========================================
  // CURRENT DATE
  // ==========================================

  const currentDate =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(new Date());


  // ==========================================
  // GREETING
  // ==========================================

  const getGreeting = () => {
    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 17) {
      return "Good afternoon";
    }

    return "Good evening";
  };


  // ==========================================
  // FORMAT BILL TIME
  // ==========================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // ==========================================
  // PAYMENT METHOD
  // ==========================================

  const formatPaymentMethod = (
    method
  ) => {
    if (!method) {
      return "";
    }

    return (
      method.charAt(0).toUpperCase() +
      method.slice(1)
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
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="home-loading-page">

        <div className="home-loading-content">
          Loading dashboard...
        </div>

      </div>
    );
  }


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="home-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="home-header">

        <div className="home-header-brand">


          {/* LOGO */}

          <div className="home-header-logo">

            {settings.logo ? (

              <img
                src={settings.logo}
                alt={settings.shopName}
                className="home-header-logo-image"
              />

            ) : (

              <span className="home-header-logo-letter">
                {shopInitial}
              </span>

            )}

          </div>


          {/* SHOP INFO */}

          <div className="home-header-shop-info">

            <h2 className="home-header-shop-name">
              {settings.shopName}
            </h2>

            <span className="home-header-shop-type">
              POS
            </span>

          </div>

        </div>


        {/* HEADER ACTIONS */}

        <div className="home-header-actions">


          {/* NOTIFICATIONS */}

          <button
            type="button"
            className="home-header-notification-button"
            onClick={() =>
              navigate(
                "/notifications"
              )
            }
          >

            <Bell size={22} />


            {dashboard.lowStockCount >
              0 && (

              <span className="home-header-notification-badge">

                {
                  dashboard.lowStockCount
                }

              </span>

            )}

          </button>


          {/* ROLE */}

          {role && (

            <div
              className={`home-header-role ${
                isOwner
                  ? "home-header-role-owner"
                  : "home-header-role-worker"
              }`}
            >

              {isOwner
                ? "Owner"
                : "Worker"}

            </div>

          )}

        </div>

      </header>


      {/* =====================================
          GREETING
      ===================================== */}

      <section className="home-greeting-section">

        <h1 className="home-greeting-title">

          {getGreeting()}

          {storedUser?.name && (
            <>
              , {storedUser.name}
            </>
          )}

        </h1>


        <p className="home-greeting-date">
          {currentDate}
        </p>

      </section>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="home-error-box">
          {error}
        </div>

      )}


      {/* =====================================
          COUNTER OVERVIEW
      ===================================== */}

      <section className="home-counter-section">

        <div className="home-counter-header">

          <span className="home-counter-label">
            COUNTER OVERVIEW
          </span>

        </div>


        <h2 className="home-counter-value">

          {formatCurrency(
            dashboard.todaySales
          )}

        </h2>


        <p className="home-counter-description">
          Total collected today
        </p>

      </section>


      {/* =====================================
          SUMMARY
      ===================================== */}

      <section className="home-summary-grid">


        {/* TODAY SALES */}

        <div className="home-summary-sales-card">

          <div className="home-summary-sales-icon">
            <TrendingUp size={22} />
          </div>


          <h3 className="home-summary-sales-value">

            {formatCurrency(
              dashboard.todaySales
            )}

          </h3>


          <p className="home-summary-sales-label">
            Today's sales
          </p>

        </div>


        {/* BILLS TODAY */}

        <div className="home-summary-bills-card">

          <div className="home-summary-bills-icon">
            <ReceiptText size={22} />
          </div>


          <h3 className="home-summary-bills-value">
            {dashboard.billsToday}
          </h3>


          <p className="home-summary-bills-label">
            Bills today
          </p>

        </div>


        {/* OUTSTANDING */}

        <div
          className="home-summary-credit-card"
          onClick={() =>
            navigate(
              "/customers"
            )
          }
        >

          <div className="home-summary-credit-icon">
            <WalletCards size={22} />
          </div>


          <h3 className="home-summary-credit-value">

            {formatCurrency(
              dashboard.outstandingCredit
            )}

          </h3>


          <p className="home-summary-credit-label">
            Outstanding
          </p>

        </div>


        {/* LOW STOCK */}

        <div
          className="home-summary-stock-card"
          onClick={() =>
            navigate(
              "/inventory"
            )
          }
        >

          <div className="home-summary-stock-icon">
            <TriangleAlert size={22} />
          </div>


          <h3 className="home-summary-stock-value">
            {dashboard.lowStockCount}
          </h3>


          <p className="home-summary-stock-label">
            Low stock
          </p>

        </div>

      </section>


      {/* =====================================
          QUICK ACTIONS
      ===================================== */}

      <section className="home-quick-actions-section">

        <h2 className="home-section-heading">
          Quick actions
        </h2>


        <div className="home-quick-actions-grid">


          {/* NEW BILL */}

          <button
            type="button"
            className="home-action-new-bill"
            onClick={() =>
              navigate(
                "/billing"
              )
            }
          >

            <div className="home-action-new-bill-icon">
              <Plus size={25} />
            </div>


            <span className="home-action-new-bill-text">
              New bill
            </span>

          </button>


          {/* STOCK IN */}

          <button
            type="button"
            className="home-action-stock-in"
            onClick={() =>
              navigate(
                "/stock-in"
              )
            }
          >

            <div className="home-action-stock-in-icon">
              <PackagePlus size={25} />
            </div>


            <span className="home-action-stock-in-text">
              Stock in
            </span>

          </button>


          {/* CUSTOMER */}

          <button
            type="button"
            className="home-action-customer"
            onClick={() =>
              navigate(
                "/customers"
              )
            }
          >

            <div className="home-action-customer-icon">
              <UserRoundPlus
                size={25}
              />
            </div>


            <span className="home-action-customer-text">
              Customer
            </span>

          </button>

        </div>


        {/* REPORTS */}

        <button
          type="button"
          className="home-action-reports"
          onClick={() =>
            navigate(
              "/reports"
            )
          }
        >

          <div className="home-action-reports-icon">

            <ChartNoAxesColumnIncreasing
              size={25}
            />

          </div>


          <span className="home-action-reports-text">
            Reports
          </span>

        </button>

      </section>


      {/* =====================================
          STOCK WARNING
      ===================================== */}

      {dashboard.lowStockCount >
        0 && (

        <section
          className="home-stock-warning-section"
          onClick={() =>
            navigate(
              "/inventory"
            )
          }
        >

          <div className="home-stock-warning-icon">

            <TriangleAlert
              size={23}
            />

          </div>


          <div className="home-stock-warning-content">

            <h3 className="home-stock-warning-title">

              {
                dashboard.lowStockCount
              }{" "}

              {dashboard.lowStockCount ===
              1
                ? "product needs"
                : "products need"}{" "}

              attention

            </h3>


            <p className="home-stock-warning-description">
              Stock is below minimum level.
            </p>

          </div>


          <ChevronRight
            className="home-stock-warning-arrow"
            size={22}
          />

        </section>

      )}


      {/* =====================================
          LOW STOCK PRODUCTS
      ===================================== */}

      {dashboard.lowStockProducts
        .length > 0 && (

        <section className="home-low-products-section">

          <div className="home-section-header">

            <h2 className="home-section-heading">
              Stock attention
            </h2>


            <button
              type="button"
              className="home-section-link"
              onClick={() =>
                navigate(
                  "/inventory"
                )
              }
            >

              View all

              <ChevronRight
                size={17}
              />

            </button>

          </div>


          <div className="home-low-products-list">

            {dashboard.lowStockProducts
              .slice(0, 4)
              .map(
                (product) => (

                  <div
                    className="home-low-product-row"
                    key={
                      product._id
                    }
                  >

                    <div className="home-low-product-info">

                      <h3 className="home-low-product-name">
                        {
                          product.name
                        }
                      </h3>


                      <p className="home-low-product-code">
                        {
                          product.productCode
                        }
                      </p>

                    </div>


                    <div className="home-low-product-stock">

                      {
                        product.stock
                      }{" "}

                      {
                        product.unit
                      }

                    </div>

                  </div>

                )
              )}

          </div>

        </section>

      )}


      {/* =====================================
          RECENT BILLS
      ===================================== */}

      <section className="home-recent-bills-section">

        <div className="home-section-header">

          <h2 className="home-section-heading">
            Recent bills
          </h2>


          <button
            type="button"
            className="home-section-link"
            onClick={() =>
              navigate(
                "/bills"
              )
            }
          >

            View history

            <ChevronRight
              size={17}
            />

          </button>

        </div>


        <div className="home-recent-bills-list">

          {dashboard.recentInvoices
            .length === 0 ? (

            <div className="home-recent-bills-empty">

              <ReceiptText
                size={30}
              />

              <p>
                No bills yet
              </p>

            </div>

          ) : (

            dashboard.recentInvoices.map(
              (invoice) => (

                <button
                  type="button"
                  className="home-recent-bill-row"
                  key={
                    invoice._id
                  }
                  onClick={() =>
                    navigate(
                      `/bills/${invoice._id}`
                    )
                  }
                >

                  <div className="home-recent-bill-icon">

                    <ReceiptText
                      size={21}
                    />

                  </div>


                  <div className="home-recent-bill-content">

                    <h3 className="home-recent-bill-title">

                      {
                        invoice.invoiceNumber
                      }

                      {" · "}

                      {invoice.customerName ||
                        "Walk-in Customer"}

                    </h3>


                    <p className="home-recent-bill-details">

                      {formatTime(
                        invoice.invoiceDate
                      )}


                      {invoice.paymentMethod && (
                        <>

                          {" · "}

                          {formatPaymentMethod(
                            invoice.paymentMethod
                          )}

                        </>
                      )}

                    </p>

                  </div>


                  <strong className="home-recent-bill-total">

                    {formatCurrency(
                      invoice.grandTotal
                    )}

                  </strong>

                </button>

              )
            )

          )}

        </div>

      </section>


      {/* =====================================
          OWNER BOTTOM NAVIGATION
      ===================================== */}

      <OwnerBottomNav />


    </div>
  );
};


export default Home;