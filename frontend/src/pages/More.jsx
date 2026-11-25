
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Bell,
  BarChart3,
  RotateCcw,
  Users,
  UserCircle,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  ShieldCheck,
} from "lucide-react";

import OwnerBottomNav from "../components/OwnerBottomnav";
import "../styles/more.css";

function More() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const menuSections = [
    {
      title: "Business Management",
      items: [
        {
          label: "Reports & Analytics",
          description: "View sales and business performance",
          icon: BarChart3,
          path: "/reports",
        },
        {
          label: "Returns",
          description: "Manage returned products and bills",
          icon: RotateCcw,
          path: "/returns",
        },
        {
          label: "Workers",
          description: "Manage worker accounts and access",
          icon: Users,
          path: "/workers",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          label: "Notifications",
          description: "View important business updates",
          icon: Bell,
          path: "/notifications",
        },
        {
          label: "Settings",
          description: "Manage shop and invoice settings",
          icon: Settings,
          path: "/settings",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          label: "My Profile",
          description: "View your account information",
          icon: UserCircle,
          path: "/profile",
        },
        {
          label: "Help & Support",
          description: "Get help with the application",
          icon: HelpCircle,
          path: "/help",
        },
      ],
    },
  ];

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <div className="more-page">

      {/* Header */}
      <div className="more-header">
        <div>
          <h1>More</h1>
          <p>Manage your business and account</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="more-profile-card">
        <div className="more-profile-avatar">
          <UserCircle size={30} />
        </div>

        <div className="more-profile-info">
          <h2>{user.name || "Owner"}</h2>
          <p>
            <ShieldCheck size={14} />
            Owner Account
          </p>
        </div>

        <button
          type="button"
          className="more-profile-arrow"
          onClick={() => navigate("/profile")}
          aria-label="View profile"
        >
          <ChevronRight size={21} />
        </button>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <section className="more-section" key={section.title}>
          <h3>{section.title}</h3>

          <div className="more-menu-card">
            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  className="more-menu-item"
                  key={item.label}
                  onClick={() => navigate(item.path)}
                >
                  <div className="more-menu-icon">
                    <Icon size={21} />
                  </div>

                  <div className="more-menu-content">
                    <h4>{item.label}</h4>
                    <p>{item.description}</p>
                  </div>

                  <ChevronRight
                    size={19}
                    className="more-menu-arrow"
                  />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Logout */}
      <button
        type="button"
        className="more-logout-button"
        onClick={handleLogout}
      >
        <LogOut size={19} />
        Logout
      </button>

      <div className="more-footer">
        <FileText size={14} />
        <span>Smart Billing & Inventory Management</span>
      </div>

      <OwnerBottomNav />
    </div>
  );
}

export default More;
