import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, tokens } from "../api/client";

// Кто вошёл, решает backend (/api/me/): is_staff → сотрудник, привязан к участнику → гость.
// Фронт больше не спрашивает «кто вы» — так нельзя выдать себя за сотрудника.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const loadMe = useCallback(async () => {
    if (!tokens.access) {
      setUser(null);
      return null;
    }
    try {
      const me = await api("me/");
      setUser(me);
      return me;
    } catch {
      tokens.clear();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    loadMe().finally(() => setReady(true));
    const onLogout = () => setUser(null);
    // Вход/выход в другой вкладке этого же браузера меняет общий токен —
    // подхватываем нового пользователя, чтобы вкладка не показывала чужие данные
    const onStorage = (e) => {
      if (e.key !== "eventops_access") return;
      queryClient.clear();
      loadMe();
    };
    window.addEventListener("eventops:logout", onLogout);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("eventops:logout", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadMe, queryClient]);

  const loginStaff = async (username, password) => {
    const data = await api("token/", { method: "POST", body: { username, password }, auth: false });
    tokens.set(data);
    return loadMe();
  };

  const loginGuest = async (phone, code) => {
    const data = await api("guest/login/", { method: "POST", body: { phone, code }, auth: false });
    tokens.set(data);
    return loadMe();
  };

  const logout = () => {
    tokens.clear();
    queryClient.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, loginStaff, loginGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const homeFor = (user) =>
  user?.kind === "staff" ? "/staff" : user?.kind === "guest" ? "/guest" : "/login";
