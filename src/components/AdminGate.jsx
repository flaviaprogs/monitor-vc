import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminGate({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}
