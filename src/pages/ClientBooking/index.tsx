import { useState } from "react";
import Header from "./Header";
import Home from "./Home";
import { useProducts } from "./hooks/useProducts";

export default function ClientBooking() {
  const [view, setView] = useState<"home" | "booking" | "appointments">("home");

  // Dados temporários
  const { produtos, loadingProdutos } = useProducts();


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 max-w-md mx-auto border-x border-zinc-900 shadow-2xl flex flex-col pb-20">
      <Header total={0} />

      {view === "home" && (
        <Home
          produtos={produtos}
          loadingProdutos={loadingProdutos}
          onBooking={() => setView("booking")}
          onAppointments={() => setView("appointments")}
        />
      )}
    </div>
  );
}