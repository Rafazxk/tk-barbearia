import { createContext, useContext, useState, ReactNode } from "react";

// 1. Defina a estrutura dos dados
interface BookingData {
  barber: any;
  date: string;
  time: string;
  services: any[];
  products: any[];
  customer: { name: string; phone: string };
}

// 2. Defina o tipo do seu Contexto
interface BookingContextType {
  step: number;
  setStep: (step: number) => void;
  data: BookingData;
  updateData: (key: keyof BookingData, value: any) => void;
  resetBooking: () => void;
}

// 3. Inicialize com 'as' para indicar que o Provider suprirá esses dados
const BookingContext = createContext<BookingContextType>({} as BookingContextType);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>({
    barber: null,
    date: "",
    time: "",
    services: [],
    products: [],
    customer: { name: "", phone: "" }
  });

  const updateData = (key: keyof BookingData, value: any) => 
    setData(prev => ({ ...prev, [key]: value }));
    
  const resetBooking = () => { /* sua lógica aqui */ };

  return (
    <BookingContext.Provider value={{ step, setStep, data, updateData, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);