import { Clock, MapPin, Scissors, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Produtos {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
}

interface HomeProps {
  produtos: Produtos[];
  loadingProdutos: boolean;

  onBooking: () => void;
  onAppointments: () => void;
}

export default function Home({
  produtos,
  loadingProdutos,
  onBooking,
  onAppointments,
}: HomeProps) {
  return (
    <div className="flex-1 flex flex-col">

      {/* HERO */}
      <div className="p-6 text-center space-y-4 border-b border-zinc-900 bg-zinc-900/20">
        <h2 className="text-3xl font-black text-white">
          TK BARBEARIA
        </h2>

        <p className="text-sm text-zinc-400">
          Qualidade e estilo em um só lugar.
        </p>

        <div className="grid grid-cols-1 gap-3 pt-2">
          <Button
            className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-6 text-base rounded-xl flex items-center justify-center gap-2"
            onClick={onBooking}
          >
            <Scissors className="w-5 h-5" />
            Agendar Serviço
          </Button>

          <Button
            variant="outline"
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 py-6 text-sm font-medium rounded-xl flex items-center justify-center gap-2"
            onClick={onAppointments}
          >
            <Clock className="w-4 h-4" />
            Ver Meus Agendamentos
          </Button>
        </div>
      </div>

      {/* PRODUTOS */}
      <div className="p-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Produtos em Estoque
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {loadingProdutos ? (
            <p className="text-xs text-zinc-500 col-span-2 py-4 text-center">
              Carregando...
            </p>
          ) : (
            produtos.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between"
              >
                <p className="text-xs font-bold text-zinc-200">
                  {p.nome}
                </p>

                <div className="mt-2 flex justify-between items-end">
                  <span className="text-amber-500 font-bold text-xs">
                    R$ {Number(p.preco).toFixed(2)}
                  </span>

                  <span className="text-[10px] text-zinc-500">
                    Qtd: {p.estoque}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QUEM SOMOS */}
      <div className="p-6 bg-zinc-900/30 border-y border-zinc-900 my-4">
        <h2 className="text-sm font-bold text-zinc-100 mb-2">
          Quem Somos
        </h2>

        <p className="text-xs text-zinc-400 leading-relaxed">
          A TK Barbearia é um espaço dedicado ao cuidado masculino,
          oferecendo cortes, barba e serviços de qualidade com
          profissionalismo e atenção aos detalhes.

          Nosso objetivo é elevar a autoestima dos clientes,
          proporcionando uma experiência confortável e um visual
          sempre alinhado.
        </p>
      </div>

      {/* CONTATO */}
      <div className="p-4 space-y-4 mb-8">
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Localização & Contatos
          </h2>

          <p className="text-sm text-zinc-300">
            Rua rio Xingu, 44 - Ibura de baixo, Recife - PE
          </p>

          <p className="text-sm text-amber-500 font-medium">
            WhatsApp: (81) 98895-3062
          </p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-400 mb-2">
            Horário de Funcionamento
          </h3>

          <div className="text-xs text-zinc-300 space-y-1">
            <p className="flex justify-between">
              <span>Segunda a Sexta</span>
              <span>08:00 - 19:00</span>
            </p>

            <p className="flex justify-between">
              <span>Sábado</span>
              <span>08:00 - 15:00</span>
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center pb-6">
        <p className="text-[10px] text-zinc-600">
          © 2026 TK Barbearia
        </p>

        <p className="text-[9px] text-zinc-700 mt-1 uppercase tracking-widest">
          Desenvolvido por Rafazxk
        </p>
      </div>

    </div>
  );
}