
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import WorkerBottomnav from "../components/WorkerBottomnav";
import "../styles/workerbillhistory.css";


const API = import.meta.env.VITE_API_URL;

function WorkerBillhistory() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${API}/api/invoices`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;
        const allInvoices = Array.isArray(data)
          ? data
          : data.invoices || data.data || [];

        // Show only invoices created by this worker
      

        setInvoices(allInvoices);
      } catch (err) {
        console.error("WORKER BILL HISTORY ERROR:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load bill history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return invoices;

    return invoices.filter((invoice) => {
      return (
        invoice.invoiceNumber?.toLowerCase().includes(value) ||
        invoice.customerName?.toLowerCase().includes(value) ||
        invoice.customerPhone?.includes(value)
      );
    });
  }, [invoices, search]);

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const today = new Date().toDateString();

  const todayInvoices = invoices.filter(
    (invoice) =>
      new Date(invoice.invoiceDate || invoice.createdAt).toDateString() === today
  );

  const todaySales = todayInvoices.reduce(
    (total, invoice) => total + Number(invoice.grandTotal || 0),
    0
  );

  return (
    <div className="worker-bill-history-page">

      <div className="worker-bill-history-header">
        <div>
          <h2>My Bill History</h2>
          <p>View the bills created by you</p>
        </div>
      </div>

      <div className="worker-bill-history-stats">

        <div className="worker-bill-history-stat">
          <span>Total Bills</span>
          <h3>{invoices.length}</h3>
        </div>

        <div className="worker-bill-history-stat">
          <span>Today's Bills</span>
          <h3>{todayInvoices.length}</h3>
        </div>

        <div className="worker-bill-history-stat">
          <span>Today's Sales</span>
          <h3>{formatMoney(todaySales)}</h3>
        </div>

      </div>

      <div className="worker-bill-history-search">
        <input
          type="text"
          placeholder="Search invoice number, customer or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="worker-bill-history-message">
          Loading bills...
        </div>
      ) : error ? (
        <div className="worker-bill-history-error">
          {error}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="worker-bill-history-empty">
          <h3>No bills found</h3>
          <p>
            {search
              ? "Try searching with another keyword."
              : "Your completed bills will appear here."}
          </p>

          {!search && (
            <button
              onClick={() => navigate("/worker/billing")}
            >
              Create New Bill
            </button>
          )}
        </div>
      ) : (
        <div className="worker-bill-history-list">

          {filteredInvoices.map((invoice) => (
            <div
              className="worker-bill-history-card"
              key={invoice._id}
            >

              <div className="worker-bill-history-card-top">

                <div>
                  <h3>{invoice.invoiceNumber}</h3>
                  <p>
                    {formatDate(
                      invoice.invoiceDate || invoice.createdAt
                    )}
                  </p>
                </div>

                <span
                  className={`worker-bill-history-status worker-status-${invoice.paymentStatus}`}
                >
                  {invoice.paymentStatus || "unknown"}
                </span>

              </div>

              <div className="worker-bill-history-customer">
                <strong>
                  {invoice.customerName || "Walk-in Customer"}
                </strong>

                {invoice.customerPhone && (
                  <span>{invoice.customerPhone}</span>
                )}
              </div>

              <div className="worker-bill-history-card-bottom">

                <div>
                  <span>Total Amount</span>
                  <h3>{formatMoney(invoice.grandTotal)}</h3>
                </div>

                <div>
                  <span>Paid</span>
                  <strong>{formatMoney(invoice.paidAmount)}</strong>
                </div>

                <div>
                  <span>Pending</span>
                  <strong>{formatMoney(invoice.creditAmount)}</strong>
                </div>

              </div>

              <button
                className="worker-bill-history-view"
                onClick={() =>
                  navigate(`/worker/invoice/${invoice._id}`)
                }
              >
                View Invoice
              </button>

            </div>
          ))}

        </div>
      )}

      <WorkerBottomnav />

    </div>
  );
}

export default WorkerBillhistory;
