import React, { useState } from "react";
import { Lock, Mail, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useBarber } from "@/contexts/BarberContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { loginState } = useBarber();

  const handleIdentityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });

      // 1. Log para verificar o que o servidor realmente mandou
      console.log("Resposta do Login:", response.data);

      // 2. Extração segura
      const { barbeiro, token } = response.data;

      // 3. SALVAMENTO OBRIGATÓRIO (É aqui que a mágica acontece)
      if (token) {
        localStorage.setItem("@TKBarber:token", token);
        console.log("Token salvo com sucesso no localStorage!");
      } else {
        console.error("ERRO: O servidor não retornou o token!");
      }

      // 4. Continua o fluxo normal
      loginState(barbeiro, token);
    } catch (error: any) {
      console.error("Login.tsx -> Erro na requisição:", error);
      const mensagemErro = error.response?.data?.erro || "Erro ao conectar com o servidor.";
      toast.error(mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redireciona direto para o fluxo de OAuth do seu back-end
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

    const serverRoot = apiBaseUrl.replace(/\/api$/, '');

    window.location.href = `${serverRoot}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-amber-500">TK Barbearia</h1>
          <p className="text-sm text-zinc-400 mt-2">Acesse seu dashboard administrativo</p>
        </div>

        <form onSubmit={handleIdentityLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@barber.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800 text-zinc-950 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? "Autenticando..." : "Entrar no Painel"}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <span className="relative bg-zinc-900 px-3 text-xs uppercase tracking-widest text-zinc-500">
            Ou continue com
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3 text-sm text-zinc-200 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.934 11.934 0 0 0 12 0C7.305 0 3.24 2.536 1.057 6.273l4.209 3.492Z" />
            <path fill="#4285F4" d="M23.727 12.273c0-.836-.073-1.645-.209-2.427H12v4.609h6.582a5.63 5.63 0 0 1-2.441 3.691l3.85 2.982c2.25-2.073 3.736-5.118 3.736-8.855Z" />
            <path fill="#FBBC05" d="M5.266 14.235 1.057 17.73A11.936 11.936 0 0 0 12 24c2.818 0 5.436-.8 7.509-2.182l-3.85-2.982A7.073 7.073 0 0 1 12 19.091a7.077 7.077 0 0 1-6.734-4.856Z" />
            <path fill="#34A853" d="M5.266 9.765A7.038 7.038 0 0 1 5.182 12c0 .782.127 1.536.355 2.235l-4.21 3.495A11.918 11.918 0 0 1 0 12c0-2.082.532-4.045 1.473-5.773l3.793 3.538Z" />
          </svg>
          Entrar com o Google
        </button>

      </div>
    </div>
  );
}