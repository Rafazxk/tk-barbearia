import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

interface HeaderProps {
  total?: number;
}

export default function Header({ total = 0 }: HeaderProps) {
  return (
    <header className="p-4 bg-zinc-900/50 border-b border-zinc-900 sticky top-0 backdrop-blur-md z-40 flex justify-between items-center">
      <div>
        <h1 className="text-lg font-black text-white">
          TK BARBEARIA
        </h1>
        <p className="text-xs text-zinc-500">
          Agendamento Online
        </p>
      </div>

      {total > 0 && (
        <Badge className="bg-amber-500 text-zinc-950 flex gap-1 font-bold border-none">
          <ShoppingBag className="w-3 h-3" />
          R$ {total.toFixed(2)}
        </Badge>
      )}
    </header>
  );
}