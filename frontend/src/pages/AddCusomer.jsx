
import React, { useState } from "react";
import axios from "axios";

import {
  ArrowLeft,
  UserRoundPlus,
  Save,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../styles/addCustomer.css";
import OwnerBottomNav from "../components/OwnerBottomnav";

const AddCustomer = () => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    gstin: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError("Enter a valid customer phone number.");
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        gstin: form.gstin.trim().toUpperCase(),
        notes: form.notes.trim(),
      };

      await axios.post(
        `${API_URL}/api/customers`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      navigate("/customers", {
        replace: true,
      });
    } catch (err) {
      console.error("ADD CUSTOMER ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to add customer."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="addcustomer-page">
      {/* HEADER */}
      <header className="addcustomer-header">
        <button
          type="button"
          className="addcustomer-back-button"
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft size={23} />
        </button>

        <div className="addcustomer-header-info">
          <h1 className="addcustomer-title">
            Add customer
          </h1>

          <p className="addcustomer-subtitle">
            Create a new customer account
          </p>
        </div>
      </header>

      <form
        className="addcustomer-form"
        onSubmit={handleSubmit}
      >
        {/* BASIC INFORMATION */}
        <section className="addcustomer-section">
          <div className="addcustomer-section-heading">
            <UserRoundPlus size={22} />
            <h2>Customer details</h2>
          </div>

          <div className="addcustomer-field">
            <label htmlFor="addcustomer-name">
              Customer name *
            </label>

            <input
              id="addcustomer-name"
              type="text"
              name="name"
              placeholder="Enter customer or business name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="addcustomer-field">
            <label htmlFor="addcustomer-phone">
              Phone number *
            </label>

            <input
              id="addcustomer-phone"
              type="tel"
              name="phone"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="addcustomer-field">
            <label htmlFor="addcustomer-address">
              Address / Area
            </label>

            <textarea
              id="addcustomer-address"
              name="address"
              rows={3}
              placeholder="Enter customer address or area"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="addcustomer-field">
            <label htmlFor="addcustomer-email">
              Email address
            </label>

            <input
              id="addcustomer-email"
              type="email"
              name="email"
              placeholder="Optional email address"
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* BUSINESS DETAILS */}
        <section className="addcustomer-section">
          <h2 className="addcustomer-section-title">
            Business details
          </h2>

          <div className="addcustomer-field">
            <label htmlFor="addcustomer-gstin">
              GSTIN
            </label>

            <input
              id="addcustomer-gstin"
              type="text"
              name="gstin"
              placeholder="Optional GST number"
              value={form.gstin}
              onChange={handleChange}
            />
          </div>

          <div className="addcustomer-field">
            <label htmlFor="addcustomer-notes">
              Notes
            </label>

            <textarea
              id="addcustomer-notes"
              name="notes"
              rows={3}
              placeholder="Additional customer information"
              value={form.notes}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* CREDIT INFO */}
        <section className="addcustomer-credit-info">
          <h3>Credit account</h3>

          <p>
            New customers start with ₹0 outstanding.
            Their credit balance will update automatically
            when a credit bill is generated.
          </p>
        </section>

        {error && (
          <div className="addcustomer-error-message">
            {error}
          </div>
        )}

        <section className="addcustomer-save-section">
          <button
            type="submit"
            className="addcustomer-save-button"
            disabled={saving}
          >
            <Save size={21} />
            <span>
              {saving ? "Saving..." : "Save customer"}
            </span>
          </button>
        </section>
      </form>

      <OwnerBottomNav />
    </div>
  );
};

export default AddCustomer;
