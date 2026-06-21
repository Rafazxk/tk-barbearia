import { Button } from "@/components/ui/button";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
}

export function AppointmentDialog({ open, onOpenChange, appointment }: AppointmentDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-md w-full shadow-2xl">
        <h2 className="text-lg font-bold text-zinc-100 mb-2">
          {appointment ? "Editar Agendamento" : "Novo Agendamento"}
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Fluxo de formulário integrado com o backend será adicionado a seguir.
        </p>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}