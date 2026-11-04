import React, { useState } from "react";
import axios from "axios";

import {
  ArrowLeft,
  PackagePlus,
  Save,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../styles/addproduct.css";

import OwnerBottomNav from "../components/OwnerBottomnav";


const AddProduct = () => {
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL;

  const token =
    localStorage.getItem("token");


  // ==========================================
  // FORM
  // ==========================================

  const [form, setForm] = useState({
    name: "",
    productCode: "",
    barcode: "",
    category: "",
    brand: "",
    description: "",
    purchasePrice: "",
    sellingPrice: "",
    gst: "0",
    unit: "piece",
    minimumStock: "",
    supplier: "",
    image: "",
  });


  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================
  // UNITS
  // ==========================================

  const units = [
    {
      value: "piece",
      label: "Piece",
    },
    {
      value: "box",
      label: "Box",
    },
    {
      value: "bag",
      label: "Bag",
    },
    {
      value: "kg",
      label: "Kg",
    },
    {
      value: "gram",
      label: "Gram",
    },
    {
      value: "litre",
      label: "Litre",
    },
    {
      value: "metre",
      label: "Metre",
    },
    {
      value: "feet",
      label: "Feet",
    },
    {
      value: "bundle",
      label: "Bundle",
    },
    {
      value: "packet",
      label: "Packet",
    },
  ];


  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };


  // ==========================================
  // SAVE PRODUCT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (!form.productCode.trim()) {
      setError(
        "Product code is required."
      );
      return;
    }

    if (
      form.purchasePrice === "" ||
      Number(form.purchasePrice) < 0
    ) {
      setError(
        "Enter a valid purchase price."
      );
      return;
    }

    if (
      form.sellingPrice === "" ||
      Number(form.sellingPrice) < 0
    ) {
      setError(
        "Enter a valid selling price."
      );
      return;
    }

    if (
      form.minimumStock !== "" &&
      Number(form.minimumStock) < 0
    ) {
      setError(
        "Minimum stock cannot be negative."
      );
      return;
    }


    try {
      setSaving(true);
      setError("");
      setSuccess("");


      const payload = {
        name:
          form.name.trim(),

        productCode:
          form.productCode
            .trim()
            .toUpperCase(),

        category:
          form.category.trim(),

        brand:
          form.brand.trim(),

        description:
          form.description.trim(),

        purchasePrice:
          Number(
            form.purchasePrice
          ),

        sellingPrice:
          Number(
            form.sellingPrice
          ),

        gst:
          Number(
            form.gst || 0
          ),

        unit:
          form.unit,

        minimumStock:
          Number(
            form.minimumStock || 0
          ),

        supplier:
          form.supplier.trim(),

        image:
          form.image.trim(),

        stock: 0,
      };


      // Add optional barcode only when entered
      if (form.barcode.trim()) {
        payload.barcode =
          form.barcode.trim();
      }


      await axios.post(
        `${API_URL}/api/products`,
        payload,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );


      setSuccess(
        "Product added successfully."
      );


      setTimeout(() => {
        navigate(
          "/inventory",
          {
            replace: true,
          }
        );
      }, 700);


    } catch (err) {
      console.error(
        "ADD PRODUCT ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to add product."
      );

    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="addproduct-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="addproduct-header">

        <button
          type="button"
          className="addproduct-back-button"
          onClick={() =>
            navigate("/inventory")
          }
        >
          <ArrowLeft size={23} />
        </button>


        <div className="addproduct-header-info">

          <h1 className="addproduct-title">
            Add product
          </h1>

          <p className="addproduct-subtitle">
            Create a new inventory item
          </p>

        </div>

      </header>


      {/* =====================================
          FORM
      ===================================== */}

      <form
        className="addproduct-form"
        onSubmit={handleSubmit}
      >


        {/* BASIC DETAILS */}

        <section className="addproduct-section">

          <div className="addproduct-section-heading">

            <PackagePlus size={21} />

            <h2>
              Product details
            </h2>

          </div>


          <div className="addproduct-field">

            <label>
              Product name *
            </label>

            <input
              type="text"
              name="name"
              placeholder="Example: UltraTech Cement 50kg"
              value={form.name}
              onChange={handleChange}
            />

          </div>


          <div className="addproduct-row">

            <div className="addproduct-field">

              <label>
                Product code *
              </label>

              <input
                type="text"
                name="productCode"
                placeholder="CEM-050"
                value={
                  form.productCode
                }
                onChange={
                  handleChange
                }
              />

            </div>


            <div className="addproduct-field">

              <label>
                Barcode
              </label>

              <input
                type="text"
                name="barcode"
                placeholder="Optional"
                value={
                  form.barcode
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </div>


          <div className="addproduct-row">

            <div className="addproduct-field">

              <label>
                Category
              </label>

              <input
                type="text"
                name="category"
                placeholder="Cement"
                value={
                  form.category
                }
                onChange={
                  handleChange
                }
              />

            </div>


            <div className="addproduct-field">

              <label>
                Brand
              </label>

              <input
                type="text"
                name="brand"
                placeholder="UltraTech"
                value={
                  form.brand
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </div>


          <div className="addproduct-field">

            <label>
              Description
            </label>

            <textarea
              name="description"
              rows="3"
              placeholder="Optional product description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
            />

          </div>

        </section>


        {/* =====================================
            PRICE
        ===================================== */}

        <section className="addproduct-section">

          <h2 className="addproduct-section-title">
            Pricing
          </h2>


          <div className="addproduct-row">


            <div className="addproduct-field">

              <label>
                Purchase price *
              </label>

              <div className="addproduct-money-input">

                <span>
                  ₹
                </span>

                <input
                  type="number"
                  name="purchasePrice"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={
                    form.purchasePrice
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>


            <div className="addproduct-field">

              <label>
                Selling price *
              </label>

              <div className="addproduct-money-input">

                <span>
                  ₹
                </span>

                <input
                  type="number"
                  name="sellingPrice"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={
                    form.sellingPrice
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

          </div>


          <div className="addproduct-field">

            <label>
              GST rate
            </label>

            <select
              name="gst"
              value={form.gst}
              onChange={handleChange}
            >
              <option value="0">
                0% / No GST
              </option>

              <option value="5">
                5%
              </option>

              <option value="12">
                12%
              </option>

              <option value="18">
                18%
              </option>

              <option value="28">
                28%
              </option>
            </select>

          </div>

        </section>


        {/* =====================================
            INVENTORY SETTINGS
        ===================================== */}

        <section className="addproduct-section">

          <h2 className="addproduct-section-title">
            Inventory
          </h2>


          <div className="addproduct-row">


            <div className="addproduct-field">

              <label>
                Unit *
              </label>

              <select
                name="unit"
                value={form.unit}
                onChange={
                  handleChange
                }
              >

                {units.map(
                  (unit) => (

                    <option
                      key={
                        unit.value
                      }
                      value={
                        unit.value
                      }
                    >
                      {unit.label}
                    </option>

                  )
                )}

              </select>

            </div>


            <div className="addproduct-field">

              <label>
                Minimum stock
              </label>

              <input
                type="number"
                name="minimumStock"
                min="0"
                placeholder="10"
                value={
                  form.minimumStock
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </div>


          <div className="addproduct-field">

            <label>
              Supplier
            </label>

            <input
              type="text"
              name="supplier"
              placeholder="Supplier name"
              value={
                form.supplier
              }
              onChange={
                handleChange
              }
            />

          </div>


          <div className="addproduct-opening-stock">

            <span>
              Opening stock
            </span>

            <strong>
              0
            </strong>

            <p>
              Add quantity using Stock In after creating the product.
            </p>

          </div>

        </section>


        {/* =====================================
            IMAGE
        ===================================== */}

        <section className="addproduct-section">

          <h2 className="addproduct-section-title">
            Product image
          </h2>


          <div className="addproduct-field">

            <label>
              Image URL
            </label>

            <input
              type="text"
              name="image"
              placeholder="Optional image URL"
              value={form.image}
              onChange={handleChange}
            />

          </div>


          {form.image && (

            <div className="addproduct-image-preview">

              <img
                src={form.image}
                alt="Product preview"
                onError={(e) => {
                  e.currentTarget.style.display =
                    "none";
                }}
              />

            </div>

          )}

        </section>


        {/* =====================================
            MESSAGES
        ===================================== */}

        {error && (

          <div className="addproduct-error">
            {error}
          </div>

        )}


        {success && (

          <div className="addproduct-success">
            {success}
          </div>

        )}


        {/* =====================================
            SAVE
        ===================================== */}

        <section className="addproduct-save-section">

          <button
            type="submit"
            className="addproduct-save-button"
            disabled={saving}
          >

            <Save size={21} />

            <span>
              {saving
                ? "Saving..."
                : "Add product"}
            </span>

          </button>

        </section>

      </form>


      <OwnerBottomNav />

    </div>
  );
};

export default AddProduct;