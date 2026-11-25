
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Settings as SettingsIcon,
  Store,
  FileText,
  Receipt,
  CreditCard,
  Bell,
  Save,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import OwnerBottomNav from "../components/OwnerBottomnav";
import "../styles/settings.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialSettings = {
  shopName: "",
  ownerName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  gstin: "",
  logo: "",
  upiId: "",
  upiName: "",
  upiQrImage: "",
  invoicePrefix: "INV",
  invoiceFooter: "Thank you for your business!",
  showGST: false,
  showLogo: true,
  printSize: "A4",
  autoPrint: false,
  lowStockNotification: true,
  currency: "INR",
};

function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/settings`,
        config()
      );

      const savedSettings =
        response.data.settings || response.data;

      setSettings({
        ...initialSettings,
        ...savedSettings,
      });
    } catch (err) {
      console.error("Settings fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Input handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSuccess("");
  };

  // Save settings
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await axios.put(
        `${API_URL}/api/settings`,
        settings,
        config()
      );

      const savedSettings =
        response.data.settings || response.data;

      setSettings((prev) => ({
        ...prev,
        ...savedSettings,
      }));

      setSuccess("Settings saved successfully!");
    } catch (err) {
      console.error("Settings save error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <Loader2 size={30} className="settings-spin" />
          <p>Loading settings...</p>
        </div>
        <OwnerBottomNav />
      </div>
    );
  }

  return (
    <div className="settings-page">

      {/* Header */}
      <div className="settings-header">
        <button
          type="button"
          className="settings-back-button"
          onClick={() => navigate("/more")}
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1>Settings</h1>
          <p>Manage your shop and application preferences</p>
        </div>

        <button
          type="button"
          className="settings-refresh-button"
          onClick={fetchSettings}
          disabled={saving}
          title="Reload settings"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <div className="settings-message settings-error">
          {error}
        </div>
      )}

      {success && (
        <div className="settings-message settings-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSave}>

        {/* Shop Information */}
        <section className="settings-section">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Store size={21} />
            </div>

            <div>
              <h2>Shop Information</h2>
              <p>Basic details about your business</p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label>Shop Name</label>
              <input
                type="text"
                name="shopName"
                value={settings.shopName}
                onChange={handleChange}
                placeholder="Enter shop name"
              />
            </div>

            <div className="settings-field">
              <label>Owner Name</label>
              <input
                type="text"
                name="ownerName"
                value={settings.ownerName}
                onChange={handleChange}
                placeholder="Enter owner name"
              />
            </div>

            <div className="settings-field">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="settings-field">
              <label>Alternate Phone</label>
              <input
                type="tel"
                name="alternatePhone"
                value={settings.alternatePhone}
                onChange={handleChange}
                placeholder="Optional phone number"
              />
            </div>

            <div className="settings-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                placeholder="Enter email"
              />
            </div>

            <div className="settings-field">
              <label>GSTIN</label>
              <input
                type="text"
                name="gstin"
                value={settings.gstin}
                onChange={handleChange}
                placeholder="Enter GSTIN if applicable"
              />
            </div>

            <div className="settings-field settings-full-width">
              <label>Shop Address</label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleChange}
                placeholder="Enter complete shop address"
                rows={3}
              />
            </div>

            <div className="settings-field settings-full-width">
              <label>Shop Logo URL</label>
              <input
                type="url"
                name="logo"
                value={settings.logo}
                onChange={handleChange}
                placeholder="Enter logo image URL"
              />
              <small>Provide a publicly accessible image URL.</small>
            </div>

          </div>
        </section>

        {/* Invoice Settings */}
        <section className="settings-section">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <FileText size={21} />
            </div>

            <div>
              <h2>Invoice Settings</h2>
              <p>Customize your printed bills</p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label>Invoice Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                value={settings.invoicePrefix}
                onChange={handleChange}
                placeholder="INV"
              />
            </div>

            <div className="settings-field">
              <label>Print Size</label>
              <select
                name="printSize"
                value={settings.printSize}
                onChange={handleChange}
              >
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="80mm">Thermal 80mm</option>
                <option value="58mm">Thermal 58mm</option>
              </select>
            </div>

            <div className="settings-field">
              <label>Currency</label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
              >
                <option value="INR">Indian Rupee (INR)</option>
              </select>
            </div>

            <div className="settings-field settings-full-width">
              <label>Invoice Footer Message</label>
              <textarea
                name="invoiceFooter"
                value={settings.invoiceFooter}
                onChange={handleChange}
                placeholder="Thank you for your business!"
                rows={3}
              />
            </div>

          </div>

          <div className="settings-toggle-list">

            <label className="settings-toggle-item">
              <div>
                <strong>Show Shop Logo</strong>
                <p>Display your shop logo on invoices</p>
              </div>

              <input
                type="checkbox"
                name="showLogo"
                checked={Boolean(settings.showLogo)}
                onChange={handleChange}
              />
            </label>

            <label className="settings-toggle-item">
              <div>
                <strong>Auto Print Invoice</strong>
                <p>Automatically print after bill generation</p>
              </div>

              <input
                type="checkbox"
                name="autoPrint"
                checked={Boolean(settings.autoPrint)}
                onChange={handleChange}
              />
            </label>

          </div>
        </section>

        {/* GST Settings */}
        <section className="settings-section">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Receipt size={21} />
            </div>

            <div>
              <h2>Tax Settings</h2>
              <p>Control GST calculation in billing</p>
            </div>
          </div>

          <label className="settings-toggle-item">
            <div>
              <strong>Enable GST</strong>
              <p>
                Apply the GST rates configured for products
                when generating bills.
              </p>
            </div>

            <input
              type="checkbox"
              name="showGST"
              checked={Boolean(settings.showGST)}
              onChange={handleChange}
            />
          </label>

          {!settings.showGST && (
            <div className="settings-info">
              GST calculation is currently disabled.
              Bills will not include GST.
            </div>
          )}
        </section>

        {/* UPI Settings */}
        <section className="settings-section">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <CreditCard size={21} />
            </div>

            <div>
              <h2>UPI Payment Settings</h2>
              <p>Configure your shop's UPI payment details</p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label>UPI ID</label>
              <input
                type="text"
                name="upiId"
                value={settings.upiId}
                onChange={handleChange}
                placeholder="example@upi"
              />
            </div>

            <div className="settings-field">
              <label>UPI Account Name</label>
              <input
                type="text"
                name="upiName"
                value={settings.upiName}
                onChange={handleChange}
                placeholder="Enter account name"
              />
            </div>

            <div className="settings-field settings-full-width">
              <label>UPI QR Image URL</label>
              <input
                type="url"
                name="upiQrImage"
                value={settings.upiQrImage}
                onChange={handleChange}
                placeholder="Enter UPI QR image URL"
              />
              <small>Optional. Provide a publicly accessible QR image URL.</small>
            </div>

          </div>
        </section>

        {/* Notifications */}
        <section className="settings-section">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Bell size={21} />
            </div>

            <div>
              <h2>Notifications</h2>
              <p>Manage inventory alerts</p>
            </div>
          </div>

          <label className="settings-toggle-item">
            <div>
              <strong>Low Stock Notifications</strong>
              <p>
                Enable alerts when product stock reaches
                its minimum level.
              </p>
            </div>

            <input
              type="checkbox"
              name="lowStockNotification"
              checked={Boolean(settings.lowStockNotification)}
              onChange={handleChange}
            />
          </label>
        </section>

        {/* Save Button */}
        <div className="settings-save-container">
          <button
            type="submit"
            className="settings-save-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={19} className="settings-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={19} />
                Save Settings
              </>
            )}
          </button>
        </div>

      </form>

      <OwnerBottomNav />
    </div>
  );
}

export default Settings;
