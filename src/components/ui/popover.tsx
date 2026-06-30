import React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={`z-50 w-72 rounded-md border border-zinc-800 bg-zinc-950 p-4 text-zinc-50 shadow-md outline-none ${className}`}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// O SEU COMPONENTE CALENDAR REAL E INTERATIVO DENTRO DO POPOVER.TSX
export function Calendar({ selected, onSelect }: { selected: Date | undefined; onSelect: (d: Date | undefined) => void }) {
  return (
    <div className="p-3 bg-zinc-950 rounded-md">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        locale={ptBR}
        showOutsideDays
        classNames={{
          caption: "flex justify-between items-center pt-1 mb-2 font-medium text-sm text-zinc-100",
          nav: "flex items-center gap-1",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-zinc-100 transition-opacity",
          table: "w-full border-collapse space-y-1",
          head_row: "flex justify-between",
          head_cell: "text-zinc-500 rounded-md w-9 font-normal text-[0.8rem] uppercase",
          row: "flex w-full mt-2 justify-between",
          cell: "text-center text-sm p-0 relative",
          day: "h-9 w-9 p-0 font-normal hover:bg-zinc-800 rounded-md transition-colors text-zinc-300",
          day_selected: "bg-amber-500 text-zinc-950 font-medium hover:bg-amber-400",
          day_today: "bg-zinc-900 text-amber-500 font-semibold",
          day_outside: "text-zinc-600 opacity-50",
        }}
      />
    </div>
  );
}