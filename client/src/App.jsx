import { useState, createContext, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ModelPreview from "./pages/ModelPreview";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) return { token, user: JSON.parse(user) };
    return null;
  });

  function login(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuth({ token, user });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <Routes>
        <Route path="/model/:id" element={<ModelPreview />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={auth ? <Dashboard /> : <Navigate to="/signup" />}
        />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    </AuthContext.Provider>
  );
}
