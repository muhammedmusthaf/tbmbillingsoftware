
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    localStorage.removeItem("user");
  }

  if (!token || !user) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  const role = user.role;

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "owner") {
      return <Navigate to="/" replace />;
    }

    if (role === "worker") {
      return <Navigate to="/worker" replace />;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
