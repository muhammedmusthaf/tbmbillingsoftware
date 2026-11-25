
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  UserCircle,
  ReceiptText,
  IndianRupee,
  PlusCircle,
  History,
  Package,
  LogOut,
  Loader2,
  RefreshCw,
  Clock3,
  CalendarDays,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../styles/workerdashboard.css";
import WorkerBottomnav from "../components/WorkerBottomnav";

const API_URL = import.meta.env.VITE_API_URL 

function WorkerDashboard() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Get ID from populated or unpopulated reference
  const getRefId = (value) => {
    if (!value) return "";
    return typeof value === "object" ? value._id : value;
  };

  // Fetch invoices
  const fetchDashboardData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(
        `${API_URL}/api/invoices`,
        config()
      );

      const data = response.data;

      const invoiceList = Array.isArray(data)
        ? data
        : data.invoices || data.data || [];

      // Only show bills created by this worker
  

      setInvoices(invoiceList);
    } catch (err) {
      console.error("Worker dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your billing information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Today's invoices
  const todayInvoices = invoices.filter((invoice) => {
    const invoiceDate = new Date(
      invoice.invoiceDate || invoice.createdAt
    );

    const today = new Date();

    return (
      invoiceDate.getDate() === today.getDate() &&
      invoiceDate.getMonth() === today.getMonth() &&
      invoiceDate.getFullYear() === today.getFullYear() &&
      invoice.status !== "cancelled"
    );
  });

  // Today's sales
  const todaySales = todayInvoices.reduce(
    (total, invoice) =>
      total + Number(invoice.grandTotal || 0),
    0
  );

  // Total bills
  const totalBills = invoices.filter(
    (invoice) => invoice.status !== "cancelled"
  ).length;

  // Currency
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Logout
  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="worker-dashboard-page">

      {/* Header */}
      <header className="worker-dashboard-header">
        <div>
          <p className="worker-dashboard-greeting">
            Welcome back,
          </p>
          <h1>{user.name || "Worker"}</h1>
          <span className="worker-dashboard-role">
            Worker Account
          </span>
        </div>

        <button
          type="button"
          className="worker-dashboard-logout"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Date */}
      <div className="worker-dashboard-date">
        <CalendarDays size={18} />
        <span>{currentDate}</span>
      </div>

      {/* Quick Billing Action */}
      <div className="worker-dashboard-welcome-card">
        <div>
          <span>Ready to serve customers?</span>
          <h2>Create a new bill</h2>
          <p>Search products and generate customer invoices.</p>

          <button
            type="button"
            onClick={() => navigate("/worker/billing")}
          >
            <PlusCircle size={18} />
            New Bill
          </button>
        </div>

        <div className="worker-dashboard-welcome-icon">
          <ReceiptText size={48} />
        </div>
      </div>

      {/* Statistics */}
      <div className="worker-dashboard-section-heading">
        <div>
          <h2>Today's Overview</h2>
          <p>Your billing activity</p>
        </div>

        <button
          type="button"
          className="worker-dashboard-refresh"
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw
            size={18}
            className={
              refreshing ? "worker-dashboard-spinning" : ""
            }
          />
        </button>
      </div>

      {loading ? (
        <div className="worker-dashboard-loading">
          <Loader2
            size={28}
            className="worker-dashboard-spinning"
          />
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="worker-dashboard-stats">

            <div className="worker-dashboard-stat-card">
              <div className="worker-dashboard-stat-icon">
                <IndianRupee size={22} />
              </div>

              <div>
                <p>Today's Sales</p>
                <h2>{formatCurrency(todaySales)}</h2>
              </div>
            </div>

            <div className="worker-dashboard-stat-card">
              <div className="worker-dashboard-stat-icon worker-dashboard-bills-icon">
                <ReceiptText size={22} />
              </div>

              <div>
                <p>Today's Bills</p>
                <h2>{todayInvoices.length}</h2>
              </div>
            </div>

            <div className="worker-dashboard-stat-card">
              <div className="worker-dashboard-stat-icon worker-dashboard-total-icon">
                <History size={22} />
              </div>

              <div>
                <p>Total Bills</p>
                <h2>{totalBills}</h2>
              </div>
            </div>

          </div>

          {error && (
            <div className="worker-dashboard-error">
              {error}
              <button
                type="button"
                onClick={() => fetchDashboardData()}
              >
                Retry
              </button>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="worker-dashboard-section-heading">
        <div>
          <h2>Quick Actions</h2>
          <p>Access your daily work</p>
        </div>
      </div>

      <div className="worker-dashboard-actions">

        <button
          type="button"
          className="worker-dashboard-action-card"
          onClick={() => navigate("/worker/billing")}
        >
          <div className="worker-dashboard-action-icon">
            <PlusCircle size={23} />
          </div>

          <div>
            <h3>New Billing</h3>
            <p>Create a customer bill</p>
          </div>
        </button>

        <button
          type="button"
          className="worker-dashboard-action-card"
          onClick={() => navigate("/worker/bills")}
        >
          <div className="worker-dashboard-action-icon">
            <ReceiptText size={23} />
          </div>

          <div>
            <h3>Bill History</h3>
            <p>View your generated bills</p>
          </div>
        </button>

        <button
          type="button"
          className="worker-dashboard-action-card"
          onClick={() => navigate("/worker/billing")}
        >
          <div className="worker-dashboard-action-icon">
            <Package size={23} />
          </div>

          <div>
            <h3>Find Products</h3>
            <p>Search available products</p>
          </div>
        </button>

      </div>

      {/* Recent Bills */}
      <div className="worker-dashboard-section-heading">
        <div>
          <h2>Recent Bills</h2>
          <p>Your latest billing activity</p>
        </div>

        <button
          type="button"
          className="worker-dashboard-view-all"
          onClick={() => navigate("/worker/bills")}
        >
          View All
        </button>
      </div>

      {!loading && (
        <div className="worker-dashboard-recent-list">

          {invoices.length === 0 ? (
            <div className="worker-dashboard-empty">
              <ReceiptText size={35} />
              <h3>No bills yet</h3>
              <p>Your generated invoices will appear here.</p>
            </div>
          ) : (
            [...invoices]
              .sort(
                (a, b) =>
                  new Date(b.invoiceDate || b.createdAt) -
                  new Date(a.invoiceDate || a.createdAt)
              )
              .slice(0, 5)
              .map((invoice) => (
                <div
                  className="worker-dashboard-recent-card"
                  key={invoice._id}
                >
                  <div className="worker-dashboard-recent-icon">
                    <ReceiptText size={20} />
                  </div>

                  <div className="worker-dashboard-recent-info">
                    <h3>{invoice.invoiceNumber}</h3>
                    <p>
                      {invoice.customerName || "Walk-in Customer"}
                    </p>
                    <span>
                      <Clock3 size={13} />
                      {new Date(
                        invoice.invoiceDate || invoice.createdAt
                      ).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <strong>
                    {formatCurrency(invoice.grandTotal)}
                  </strong>
                </div>
              ))
          )}

        </div>
      )}

      <WorkerBottomnav />
    </div>
  );
}

export default WorkerDashboard;
