import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentDashboard from "./StudentDashboard";
import UniversityDashboard from "./UniversityDashboard";
import EmployerDashboard from "./EmployerDashboard";

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-state">Loading dashboard...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "student") return <StudentDashboard user={user}/>;
  if (user.role === "university_admin") return <UniversityDashboard user={user}/>;
  if (user.role === "employer") return <EmployerDashboard user={user}/>;
  return <div className="center-state">This account role is not configured.</div>;
}
