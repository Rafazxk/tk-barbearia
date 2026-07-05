import { useBooking } from "@/pages/ClientBooking/Booking/context/BookingContext"; // hook customizado
import { useQuery } from "node_modules/@tanstack/react-query/build/modern/_tsup-dts-rollup";

export default function BarberStep() {
  const { setSelectedBarber, setStep } = useBooking();
  const { data: barbeiros } = useQuery(...); // Consulta específica do passo

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-zinc-300">Escolha o Profissional</h3>
      {barbeiros.map((b) => (
        <Card onClick={() => { setSelectedBarber(b); setStep(2); }}>
          {b.nome}
        </Card>
      ))}
    </div>
  );
}