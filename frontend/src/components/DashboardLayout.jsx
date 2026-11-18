import { NavLink, Link, useNavigate } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, UploadCloud, Building2, SearchCheck, BarChart3, LogOut, CheckCircle2, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout({ children, user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "university_admin", "employer"] },
    { to: "/certificates/upload", label: "Upload certificate", icon: UploadCloud, roles: ["student"] },
    { to: "/university/records", label: "Authorized records", icon: Building2, roles: ["university_admin"] },
    { to: "/verify", label: "Verify certificate", icon: SearchCheck, roles: ["student", "university_admin", "employer"] },
    { to: "/reports", label: "Reports & analytics", icon: BarChart3, roles: ["student", "university_admin", "employer"] },
    { to: "/profile", label: "My Profile", icon: User, roles: ["student", "university_admin", "employer"] },
  ];

  const roleLabel =
    role === "university_admin"
      ? "University Administrator"
      : role === "employer"
      ? "Employer Verifier"
      : "Student";

  const orgName = user?.university_name || user?.company_name || "";

  function signOut() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <strong>TrustID AI</strong>
            <span>CREDENTIAL NETWORK</span>
          </div>
        </div>

        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="sidebar-nav">
          {links
            .filter((link) => link.roles.includes(role))
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/dashboard"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <Icon size={17} /> {label}
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-note">
            <CheckCircle2 size={16} color="#4ade80" />
            <div>
              <strong>Live Verification Engine</strong>
              <span>Local SHA-256 Demo Active</span>
            </div>
          </div>
          <button className="logout-button" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-title">
            <span>TRUSTID SECURE ENVIRONMENT</span>
            <strong>{orgName ? `${orgName} · ${roleLabel}` : roleLabel}</strong>
          </div>
          <Link
            to="/profile"
            className="profile-area"
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
            title="Click to view and edit your profile details"
          >
            <div className="profile-avatar">
              {(user?.full_name || user?.username || user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{user?.full_name || user?.username || user?.email}</strong>
              <span>{user?.email}</span>
            </div>
          </Link>
        </header>

        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
