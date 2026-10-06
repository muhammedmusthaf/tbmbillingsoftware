import React, { useState } from "react";
import axios from "axios";
import "../styles/login.css";
import {
  User,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  // ==========================================
  // STATE
  // ==========================================

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };


  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (
      !formData.username.trim() ||
      !formData.password
    ) {
      setError(
        "Please enter username and password."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          username:
            formData.username
              .trim()
              .toLowerCase(),

          password: formData.password,
        }
      );

      const data = response.data;

      // ======================================
      // GET TOKEN
      // ======================================

      const token = data.token;

      if (!token) {
        throw new Error(
          "Token was not returned by server."
        );
      }


      // ======================================
      // GET USER DATA
      // Supports both:
      // { token, user: {...} }
      // and
      // { _id, name, role, token }
      // ======================================

      const user = data.user || {
        _id: data._id,
        name: data.name,
        phone: data.phone,
        username: data.username,
        role: data.role,
      };


      // ======================================
      // SAVE LOGIN
      // ======================================

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );


      // ======================================
      // GO TO HOME
      // ======================================

      navigate("/", {
        replace: true,
      });

    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      // Remove any old invalid login
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Invalid username or password."
        );
      } else {
        setError(
          err.message ||
            "Unable to connect to server."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="login-page">

      <div className="login-container">


        {/* ===================================
            BRAND
        =================================== */}

        <div className="login-brand-section">

          <div className="login-brand-logo">
            Tabassam
          </div>

          <div className="login-brand-content">

            <h1 className="login-brand-title">
              Buildmart
            </h1>

            <p className="login-brand-subtitle">
              Billing & Inventory Management
            </p>

          </div>

        </div>


        {/* ===================================
            LOGIN CARD
        =================================== */}

        <div className="login-card">

          <div className="login-card-header">

            <h2 className="login-title">
              Welcome back
            </h2>

            <p className="login-description">
              Sign in to continue to your account
            </p>

          </div>


          {/* =================================
              ERROR
          ================================= */}

          {error && (
            <div className="login-error-message">
              {error}
            </div>
          )}


          {/* =================================
              FORM
          ================================= */}

          <form
            className="login-form"
            onSubmit={handleLogin}
          >


            {/* USERNAME */}

            <div className="login-field">

              <label
                className="login-field-label"
                htmlFor="username"
              >
                Username
              </label>


              <div className="login-input-wrapper">

                <User
                  size={20}
                  className="login-input-icon"
                />

                <input
                  id="username"
                  type="text"
                  name="username"
                  className="login-input"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  disabled={loading}
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="login-field">

              <label
                className="login-field-label"
                htmlFor="password"
              >
                Password
              </label>


              <div className="login-input-wrapper">

                <LockKeyhole
                  size={20}
                  className="login-input-icon"
                />


                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  className="login-input login-password-input"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                />


                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}

                </button>

              </div>

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >

              {loading ? (
                <span className="login-button-loading">
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn size={20} />

                  <span>
                    Sign in
                  </span>
                </>
              )}

            </button>

          </form>

        </div>


        {/* ===================================
            FOOTER
        =================================== */}

        <p className="login-footer-text">
          Smart Billing & Inventory Management
        </p>

      </div>

    </div>
  );
};

export default Login;