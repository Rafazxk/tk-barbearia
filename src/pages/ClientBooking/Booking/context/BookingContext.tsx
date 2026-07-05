import { createContext, useContext, useState } from "react";

const BookingContext = createContext({});

export const BookingProvider = ({ children }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    barber: null,
    date: "",
    time: "",
    services: [],
    products: [],
    customer: { name: "", phone: "" }
  });

  // Funções de manipulação centralizadas
  const updateData = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const resetBooking = () => { /* ... reset logic ... */ };

  return (
    <BookingContext.Provider value={{ step, setStep, data, updateData, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);