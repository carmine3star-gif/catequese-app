import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Users, BookOpen, BarChart2, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const quickLinks = [
  { path: "/chamada", label: "Chamada",  icon: ClipboardList, color: "bg-blue-500",   desc: "Registrar presença" },
  { path: "/alunos",  label: "Alunos",   icon: Users,         color: "bg-violet-500", desc: "Gerenciar alunos" },
  { path: "/aulas",   label: "Aulas",    icon: BookOpen,      color: "bg-emerald-500",desc: "Conteúdo e áudio" },
  { path: "/resumo",  label: "Resumo",   icon: BarChart2,     color: "bg-amber-500",  desc: "Frequência geral" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: resumo } = trpc.resumo.frequencia.useQuery();

  const totalAlunos = resumo?.filter((a) => a.nome).length ?? 0;
  const mediaFreq = resumo
    ? Math.round(
        resumo
          .filter((a) => a.nome && a.pct !== null)
          .reduce((acc, a) => acc + (a.pct ?? 0), 0) /
          Math.max(resumo.filter((a) => a.nome && a.pct !== null).length, 1)
      )
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Boas-vindas */}
      <div className="text-center space-y-1">
        <div className="text-4xl mb-2">✝</div>
        <h1 className="text-2xl font-bold text-primary">Lista de Chamada</h1>
        <p className="text-muted-foreground text-sm">Catequese 2026 / 2027</p>
        {isAuthenticated && (
          <p className="text-xs text-muted-foreground mt-1">
            Olá, <span className="font-semibold text-foreground">{user?.name ?? "catequista"}</span>!
          </p>
        )}
      </div>

      {/* Cards de estatísticas */}
      {totalAlunos > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{totalAlunos}</p>
              <p className="text-xs text-blue-600 mt-1">Alunos cadastrados</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">
                {mediaFreq !== null ? `${mediaFreq}%` : "–"}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Frequência média</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Acesso rápido */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ path, label, icon: Icon, color, desc }) => (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md active:scale-95 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Login CTA se não autenticado */}
      {!isAuthenticated && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
              <LogIn className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">Modo somente leitura</p>
              <p className="text-xs text-amber-700">Entre para registrar presenças e editar dados</p>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="text-center text-xs text-muted-foreground pb-2">
        <p>22 aulas · 25 alunos · 4 sacramentos</p>
      </div>
    </div>
  );
}
