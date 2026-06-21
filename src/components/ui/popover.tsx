import * as React from "react";

export function Popover({ children, open }: { children: React.ReactNode; open: boolean; onOpenChange: (o: boolean) => void }) {
  return <div className="relative inline-block">{children}</div>;
}

export function PopoverTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function PopoverContent({ children, className, align }: { children: React.ReactNode; className?: string; align?: string }) {
  return <div className={`absolute right-0 mt-2 z-50 rounded-md border border-zinc-800 bg-zinc-950 p-2 shadow-md ${className}`}>{children}</div>;
}

// Uma caixa simples simulando a seleção de data por enquanto para não quebrar o compilador
export function Calendar({ selected, onSelect }: { selected: Date; onSelect: (d: Date | undefined) => void; mode: string; locale: any }) {
  return (
    <div className="p-2 text-center text-xs text-zinc-400">
      <p className="mb-2 font-medium">Selecionar Data (Mock)</p>
      <input 
        type="date" 
        className="bg-zinc-900 border border-zinc-700 rounded p-1 text-zinc-200"
        onChange={(e) => onSelect(e.target.value ? new Date(e.target.value) : undefined)}
      />
    </div>
  );
}