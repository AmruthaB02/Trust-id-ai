import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("trustid_user") || "null"); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("trustid_access");
    if (!token) { setLoading(false); return; }
    api.get("/auth/profile/")
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem("trustid_user", JSON.stringify(data));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem("trustid_user");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier, password) {
    const { data } = await api.post("/auth/token/", { username: identifier, password });
    localStorage.setItem("trustid_access", data.access);
    localStorage.setItem("trustid_refresh", data.refresh);
    const profile = await api.get("/auth/profile/");
    setUser(profile.data);
    localStorage.setItem("trustid_user", JSON.stringify(profile.data));
    return profile.data;
  }

  async function register(payload) {
    await api.post("/auth/register/", payload);
    const identifier = payload.username || payload.email;
    return login(identifier, payload.password);
  }

  function logout() {
    localStorage.removeItem("trustid_access");
    localStorage.removeItem("trustid_refresh");
    localStorage.removeItem("trustid_user");
    setUser(null);
  }

  function updateUser(updatedData) {
    setUser(updatedData);
    localStorage.setItem("trustid_user", JSON.stringify(updatedData));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
