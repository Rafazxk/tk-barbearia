import React, { createContext, useContext, useState, useEffect } from "react";



interface User {
  id: number;
  nome: string;
  role: string;
}

interface BarberContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginState: (userData: User, token?: string) => void;
  logout: () => void;
  loading: boolean;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

export function BarberProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  
  useEffect(() => {
    const savedUser = localStorage.getItem("@TKBarber:user");
    
    if (savedUser && savedUser !== "undefined") {
      try {
        const parsed = JSON.parse(savedUser);
        console.log("Contexto -> Usuário recuperado do localStorage:", parsed);
        setUser(parsed);
      } catch (error) {
        console.error("Contexto -> Erro ao ler localStorage:", error);
        localStorage.removeItem("@TKBarber:user");
      }
    }
    setLoading(false);
  }, []);

  const loginState = (userData: User, token?: string) => {
  setUser(userData);
  localStorage.setItem("@TKBarber:user", JSON.stringify(userData));
  
  if (token) {
    localStorage.setItem("@TKBarber:token", token);
  }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem("@TKBarber:user");
  };

  // Força a reavaliação booleana exata baseada no estado real de 'user'
  const isAuthenticated = !!user;

  return (
    <BarberContext.Provider value={{ user, isAuthenticated, loginState, logout, loading }}>
      {children}
    </BarberContext.Provider>
  );
}

export function useBarber() {
  const context = useContext(BarberContext);
  
  if (!context) {
    throw new Error("useBarber deve ser usado dentro de um BarberProvider");
  }
  return context;
}