
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import "../styles/workerinvoice.css";
import WorkerBottomnav from "../components/WorkerBottomnav";
const API = import.meta.env.VITE_API_URL;

function WorkerInvoices() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(location.state?.invoice || null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(!location.state?.invoice);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const requests = [
          axios.get(`${API}/api/settings`, config),
        ];

        if (!invoice) {
          requests.push(
            axios.get(`${API}/api/invoices/${id}`, config)
          );
        }

        const responses = await Promise.all(requests);

        setSettings(
          responses[0].data.settings || responses[0].data
        );

        if (!invoice) {
          const invoiceData =
            responses[1].data.invoice || responses[1].data;

          setInvoice(invoiceData);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load invoice"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (invoice && location.state?.printRequested) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [invoice, location.state]);

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString("en-IN") : "-";

  const handlePrint = () => window.print();

  if (loading) {
    return <div className="worker-invoice-loading">Loading invoice...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="worker-invoice-error">
        <p>{error || "Invoice not found"}</p>
        <button onClick={() => navigate("/worker/bills")}>
          Back to Bills
        </button>
      </div>
    );
  }

  const items = invoice.items || [];
  const customerName = invoice.customerName || "Walk-in Customer";
  const showGST = Number(invoice.gstAmount || 0) > 0;

  return (
    <div className="worker-invoice-page">
      <div className="worker-invoice-actions">
        <button onClick={() => navigate("/worker/billing")}>
          + New Bill
        </button>

        <button onClick={() => navigate("/worker/bills")}>
          Bill History
        </button>

        <button onClick={handlePrint}>
          Print Invoice
        </button>
      </div>

      <div className="worker-invoice-paper">
        <div className="worker-invoice-header">
          {settings.showLogo && settings.logo && (
            <img
              src={settings.logo}
              alt="Shop logo"
              className="worker-invoice-logo"
            />
          )}

          <h2>{settings.shopName || "Shop Name"}</h2>

          {settings.address && <p>{settings.address}</p>}
          {settings.phone && <p>Phone: {settings.phone}</p>}
          {settings.email && <p>{settings.email}</p>}
          {settings.gstin && <p>GSTIN: {settings.gstin}</p>}
        </div>

        <div className="worker-invoice-title">
          <h3>INVOICE</h3>
          <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> {formatDate(invoice.invoiceDate || invoice.createdAt)}</p>
        </div>

        <div className="worker-invoice-customer">
          <h4>Customer Details</h4>
          <p><strong>Name:</strong> {customerName}</p>
          {invoice.customerPhone && (
            <p><strong>Phone:</strong> {invoice.customerPhone}</p>
          )}
        </div>

        <div className="worker-invoice-table-wrapper">
          <table className="worker-invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Rate</th>
                {showGST && <th>GST</th>}
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={item._id || index}>
                  <td>{index + 1}</td>
                  <td>
                    {item.productName}
                    {item.productCode && (
                      <small>{item.productCode}</small>
                    )}
                  </td>
                  <td>
                    {item.quantity} {item.unit || ""}
                  </td>
                  <td>{formatMoney(item.rate)}</td>
                  {showGST && (
                    <td>{Number(item.gst || 0)}%</td>
                  )}
                  <td>{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="worker-invoice-totals">
          <div>
            <span>Subtotal</span>
            <strong>{formatMoney(invoice.subtotal)}</strong>
          </div>

          {Number(invoice.discountAmount || 0) > 0 && (
            <div>
              <span>Discount</span>
              <strong>- {formatMoney(invoice.discountAmount)}</strong>
            </div>
          )}

          {showGST && (
            <div>
              <span>GST</span>
              <strong>{formatMoney(invoice.gstAmount)}</strong>
            </div>
          )}

          {Number(invoice.roundOff || 0) !== 0 && (
            <div>
              <span>Round Off</span>
              <strong>{formatMoney(invoice.roundOff)}</strong>
            </div>
          )}

          <div className="worker-invoice-grand-total">
            <span>Grand Total</span>
            <strong>{formatMoney(invoice.grandTotal)}</strong>
          </div>

          <div>
            <span>Paid Amount</span>
            <strong>{formatMoney(invoice.paidAmount)}</strong>
          </div>

          {Number(invoice.creditAmount || 0) > 0 && (
            <div>
              <span>Pending Credit</span>
              <strong>{formatMoney(invoice.creditAmount)}</strong>
            </div>
          )}
        </div>

        <div className="worker-invoice-payment">
          <p>
            <strong>Payment Method:</strong>{" "}
            {invoice.paymentMethod?.toUpperCase()}
          </p>

          <p>
            <strong>Payment Status:</strong>{" "}
            {invoice.paymentStatus?.toUpperCase()}
          </p>

          {invoice.dueDate && (
            <p>
              <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
            </p>
          )}
        </div>

        {invoice.notes && (
          <div className="worker-invoice-notes">
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}

        <div className="worker-invoice-footer">
          <p>{settings.invoiceFooter || "Thank you for your business!"}</p>
          <small>Generated by Smart Billing System</small>
        </div>
      </div>

      <WorkerBottomnav />
    </div>
  );
}

export default WorkerInvoices;
