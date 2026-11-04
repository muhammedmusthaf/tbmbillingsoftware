import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/owner.css";
import {
  House,
  Calculator,
  Boxes,
  Users,
  MoreHorizontal,
} from "lucide-react";

const OwnerBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <nav className="owner-bottom-nav">

      <button
        type="button"
        className={`owner-nav-item ${
          isActive("/")
            ? "owner-nav-active"
            : ""
        }`}
        onClick={() => navigate("/")}
      >
        <House size={23} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`owner-nav-item ${
          isActive("/billing")
            ? "owner-nav-active"
            : ""
        }`}
        onClick={() => navigate("/billing")}
      >
        <Calculator size={23} />
        <span>Billing</span>
      </button>

      <button
        type="button"
        className={`owner-nav-item ${
          isActive("/inventory") ||
          isActive("/stock-in")
            ? "owner-nav-active"
            : ""
        }`}
        onClick={() => navigate("/inventory")}
      >
        <Boxes size={23} />
        <span>Stock</span>
      </button>
<button
  type="button"
  className={`owner-bottom-nav-item ${
    isActive("people")
      ? "owner-bottom-nav-active"
      : ""
  }`}
  onClick={() => navigate("/customers")}
>
  <Users size={23} />
  <span className="owner-bottom-nav-label">
    People
  </span>
</button>

      <button
        type="button"
        className={`owner-nav-item ${
          isActive("/more")
            ? "owner-nav-active"
            : ""
        }`}
        onClick={() => navigate("/more")}
      >
        <MoreHorizontal size={23} />
        <span>More</span>
      </button>

    </nav>
  );
};

export default OwnerBottomNav;