import { useBooking } from "@/pages/ClientBooking/Booking/context/BookingContext";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function BarberStep() {

  const { updateData, setStep } = useBooking();

  const { data: barbeiros = [] } = useQuery({
    queryKey: ["barbeiros"],
    queryFn: async () => {
      const response = await api.get("/barbers");
      return response.data;
    },
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-zinc-300">Escolha o Profissional</h3>
      {barbeiros.map((b: any) => (
        <Card onClick={() => {
          updateData("barber", b);
          setStep(2);
        }}>
          {b.nome}
        </Card>
      ))}
    </div>
  );
}