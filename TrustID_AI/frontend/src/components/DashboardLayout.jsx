import { NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, UploadCloud, Building2, SearchCheck, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout({ children, user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "university_admin", "employer"] },
    { to: "/certificates/upload", label: "Upload certificate", icon: UploadCloud, roles: ["student"] },
    { to: "/university/records", label: "Authorized records", icon: Building2, roles: ["university_admin"] },
    { to: "/verify", label: "Verify certificate", icon: SearchCheck, roles: ["employer"] },
    { to: "/reports", label: "Reports", icon: BarChart3, roles: ["student", "university_admin"] },
  ];
  const roleLabel = role === "university_admin" ? "University Administrator" : role;

  function signOut() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={25} /></div>
          <div><strong>TrustID AI</strong><span>DECENTRALIZED CREDENTIALS</span></div>
        </div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="sidebar-nav">
          {links.filter((link) => link.roles.includes(role)).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/dashboard"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="security-note"><ShieldCheck size={18} /><div><strong>Secure workspace</strong><span>Credential review and verification</span></div></div>
          <button className="logout-button" onClick={signOut}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-title"><span>TRUSTID AI PORTAL</span><strong>{roleLabel || "Account"}</strong></div>
          <div className="profile-area"><div className="profile-avatar">{(user?.full_name || user?.email || "U").slice(0, 1).toUpperCase()}</div><div className="profile-info"><strong>{user?.full_name || user?.email}</strong><span>{roleLabel}</span></div></div>
        </header>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
