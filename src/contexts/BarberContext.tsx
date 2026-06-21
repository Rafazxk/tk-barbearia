import { createContext, useContext, useState, ReactNode } from "react";

interface BarberContextType {
  user: any | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

export function BarberProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const isAuthenticated = !!user;

  const login = async () => {};
  const logout = () => setUser(null);

  return (
    <BarberContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </BarberContext.Provider>
  );
}

export function useBarberContext() {
  const context = useContext(BarberContext);
  if (!context) throw new Error("useBarberContext deve ser usado com BarberProvider");
  return context;
}