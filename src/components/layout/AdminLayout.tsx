import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Menu Lateral Fixo */}
      <aside className="w-64 border-r border-border bg-card hidden md:block">
        <Sidebar />
      </aside>

      {/* Conteúdo Principal da Página (onde entram as telas que criamos) */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}